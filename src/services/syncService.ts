import { firestore, doc, setDoc, onSnapshot, getDoc, getDocFromServer } from './firebase';
import { db } from '../db/database';
import { useStore } from '../store/useStore';
import type { CartItem, Budget, PurchaseTransaction, Product } from '../types';

export interface GrocerySnapshotData {
  cartItems: CartItem[];
  budgets: Budget[];
  transactions: PurchaseTransaction[];
  products?: Product[];
  sessionLocation: string;
  sessionDate: string;
  selectedPaymentMethod?: string;
  userProfile?: any;
  themeMode?: 'light' | 'dark';
  language?: 'id' | 'en' | 'zh';
}

export interface GrocerySnapshot {
  version: number;
  revision: number;
  user: 'naomiiracle';
  deviceId: string;
  timestamp: number;
  data: GrocerySnapshotData;
}

export interface SyncState {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  deviceId: string;
  lastOrigin: 'local' | 'remote' | 'url' | 'initial' | null;
  pendingCount: number;
}

const SINGLE_USER = 'naomiiracle';
const CLOUD_OBJECT_ID = 'ff808181a09d98f701a1973493867f53';
const CLOUD_DIRECT_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;
const BROADCAST_CHANNEL_NAME = 'smartgrocery_singleuser_naomiiracle_channel';

class SyncService {
  private deviceId: string = '';
  private broadcastChannel: BroadcastChannel | null = null;
  public isApplyingRemote: boolean = false;
  private currentRevision: number = 0;
  private lastAppliedDataSignature: string = '';
  private unsubscribeSnapshot: (() => void) | null = null;
  private debounceTimer: any = null;
  private pollInterval: any = null;
  private listeners: Set<(state: SyncState) => void> = new Set();

  private state: SyncState = {
    isConnected: true,
    isSyncing: false,
    lastSyncTime: null,
    deviceId: '',
    lastOrigin: null,
    pendingCount: 0,
  };

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.state.deviceId = this.deviceId;
    if (typeof window !== 'undefined') {
      const savedRev = localStorage.getItem('smart_grocery_revision');
      if (savedRev) {
        this.currentRevision = parseInt(savedRev, 10) || 0;
      }
    }
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  private getOrCreateDeviceId(): string {
    if (typeof window === 'undefined') return 'server_side';
    let id = localStorage.getItem('smart_grocery_device_id');
    if (!id) {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const prefix = isMobile ? 'hp' : 'pc';
      id = `${prefix}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('smart_grocery_device_id', id);
    }
    return id;
  }

  public subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<SyncState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((cb) => cb(this.state));
  }

  /**
   * Initializes Realtime cross-device listening & local multi-tab broadcast
   */
  public init(): void {
    if (typeof window === 'undefined') return;

    (window as any).__smart_grocery_notify_sync = () => this.notifyChange();

    // 1. Initialize Local BroadcastChannel for instant multi-tab sync
    if ('BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.user === SINGLE_USER) {
            this.applySnapshot(event.data, 'local');
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

        // 1b. Firebase Firestore Realtime WebSocket Listener (instant sync)
    try {
      const syncDocRef = doc(firestore, 'sync', SINGLE_USER);
      if (this.unsubscribeSnapshot) {
        this.unsubscribeSnapshot();
        this.unsubscribeSnapshot = null;
      }
      this.unsubscribeSnapshot = onSnapshot(
        syncDocRef,
        { includeMetadataChanges: true },
        (docSnap) => {
          if (docSnap.exists()) {
            const remoteData = docSnap.data();
            if (remoteData && remoteData.snapshot && remoteData.snapshot.user === SINGLE_USER) {
              this.applySnapshot(remoteData.snapshot, 'remote');
            }
          }
        },
        (err) => {
          console.warn('Firestore snapshot listener note:', err);
        }
      );
    } catch (e) {
      console.warn('Could not initialize Firestore listener:', e);
    }

    // 2. Check for snapshot in URL query string (for 1-tap QR scan or link pairing)
    this.checkUrlSnapshot();

    // 3. Immediate initial pull from cloud on startup
    setTimeout(() => {
      this.pullLatestSnapshot(false);
    }, 200);

    // 4. Foreground lifecycle listeners (crucial for mobile when waking from sleep or switching apps)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.pullLatestSnapshot(true);
        }
      });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.pullLatestSnapshot(true);
      });
    }

    // 5. Fast 1.5-second cloud polling so mobile-to-laptop updates sync immediately
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      if (typeof window !== 'undefined' && navigator.onLine && !this.isApplyingRemote) {
        this.pullLatestSnapshot(false);
      }
    }, 1500);
  }

  /**
   * Check if URL has ?sync_snapshot=... or ?snapshot=...
   */
  private checkUrlSnapshot(): void {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const rawSnapshot = params.get('sync_snapshot') || params.get('snapshot');
      if (rawSnapshot) {
        const decoded = decodeURIComponent(rawSnapshot);
        const snapshot = JSON.parse(decoded) as GrocerySnapshot;
        if (snapshot && snapshot.user === SINGLE_USER) {
          this.applySnapshot(snapshot, 'url', true);
          // Clean URL without refresh
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      }
    } catch (err) {
      console.warn('Could not parse snapshot from URL:', err);
    }
  }

  /**
   * Pulls latest snapshot from Firestore cloud store
   */
  public async pullLatestSnapshot(force: boolean = false): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.onLine) return false;
    try {
      const syncDocRef = doc(firestore, 'sync', SINGLE_USER);
      let docSnap;
      try {
        docSnap = await getDocFromServer(syncDocRef);
      } catch (e) {
        docSnap = await getDoc(syncDocRef);
      }
      if (docSnap.exists()) {
        const remoteData = docSnap.data();
        if (remoteData && remoteData.snapshot && remoteData.snapshot.user === SINGLE_USER) {
          const applied = await this.applySnapshot(remoteData.snapshot, 'remote', force);
          return applied;
        }
      }

      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * Generates a full snapshot of the single-user application state
   */
  public async takeSnapshot(): Promise<GrocerySnapshot> {
    const [cartItems, budgets, transactions, products] = await Promise.all([
      db.cartItems.toArray(),
      db.budgets.toArray(),
      db.transactions.toArray(),
      db.products.toArray(),
    ]);

    const {
      sessionLocation,
      sessionDate,
      selectedPaymentMethod,
      userProfile,
      themeMode,
      language,
    } = useStore.getState();

    this.currentRevision += 1;
    if (typeof window !== 'undefined') {
      localStorage.setItem('smart_grocery_revision', this.currentRevision.toString());
    }

    return {
      version: 1,
      revision: this.currentRevision,
      user: SINGLE_USER,
      deviceId: this.deviceId,
      timestamp: Date.now(),
      data: {
        cartItems,
        budgets,
        transactions,
        products: products.slice(0, 50),
        sessionLocation: sessionLocation || 'LOTTE MART GROCERY - PURI INDAH',
        sessionDate: sessionDate || new Date().toISOString().split('T')[0],
        selectedPaymentMethod: selectedPaymentMethod || 'Bank BCA',
        userProfile: userProfile || undefined,
        themeMode: themeMode || 'light',
        language: language || 'id',
      },
    };
  }

  /**
   * Applies an incoming snapshot from another device or tab
   */
  public async applySnapshot(
    snapshot: GrocerySnapshot,
    origin: 'local' | 'remote' | 'url' | 'initial',
    force: boolean = false
  ): Promise<boolean> {
    if (!snapshot || snapshot.user !== SINGLE_USER || !snapshot.data) return false;

    // Fast check: compare full data JSON to avoid redundant identical DB writes
    const incomingDataSignature = JSON.stringify(snapshot.data);
    if (!force && incomingDataSignature === this.lastAppliedDataSignature) {
      return false;
    }

    // Only skip if the local user has an active pending debounce broadcast scheduled right now
    if (!force && this.debounceTimer !== null) {
      return false;
    }

    this.isApplyingRemote = true;
    this.lastAppliedDataSignature = incomingDataSignature;
    if (snapshot.revision && snapshot.revision > this.currentRevision) {
      this.currentRevision = snapshot.revision;
      if (typeof window !== 'undefined') {
        localStorage.setItem('smart_grocery_revision', this.currentRevision.toString());
      }
    }

    this.updateState({ isSyncing: true });

    try {
      const {
        cartItems,
        budgets,
        transactions,
        products,
        sessionLocation,
        sessionDate,
        selectedPaymentMethod,
        userProfile,
        themeMode,
        language,
      } = snapshot.data;

      // 1. Atomically sync all tables in a single Dexie transaction
      await db.transaction('rw', [db.cartItems, db.budgets, db.transactions, db.products], async () => {
        if (Array.isArray(cartItems)) {
          await db.cartItems.clear();
          if (cartItems.length > 0) {
            await db.cartItems.bulkPut(cartItems);
          }
        }
        if (Array.isArray(budgets)) {
          await db.budgets.clear();
          if (budgets.length > 0) {
            await db.budgets.bulkPut(budgets);
          }
        }
        if (Array.isArray(transactions)) {
          await db.transactions.clear();
          if (transactions.length > 0) {
            await db.transactions.bulkPut(transactions);
          }
        }
        if (Array.isArray(products) && products.length > 0) {
          await db.products.bulkPut(products);
        }
      });

      // 2. Sync Location, Date, Bank, Profile, Theme, and Language in Zustand Store
      const store = useStore.getState();
      if (sessionLocation && sessionLocation !== store.sessionLocation) {
        store.setSessionLocation(sessionLocation);
      }
      if (sessionDate && sessionDate !== store.sessionDate) {
        store.setSessionDate(sessionDate);
      }
      if (selectedPaymentMethod && selectedPaymentMethod !== store.selectedPaymentMethod) {
        store.setSelectedPaymentMethod(selectedPaymentMethod);
      }
      if (userProfile && JSON.stringify(userProfile) !== JSON.stringify(store.userProfile)) {
        store.updateUserProfile(userProfile);
      }
      if (themeMode && themeMode !== store.themeMode) {
        store.setThemeMode(themeMode);
      }
      if (language && language !== store.language) {
        store.setLanguage(language);
      }

      const timeStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      this.updateState({
        isSyncing: false,
        lastSyncTime: timeStr,
        lastOrigin: origin,
      });

      // Notify window event so any custom listeners can trigger on snapshot
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('smart_grocery_remote_sync', { detail: snapshot }));
      }

      return true;
    } catch (err) {
      console.error('Failed to apply snapshot:', err);
      this.updateState({ isSyncing: false });
      return false;
    } finally {
      setTimeout(() => {
        this.isApplyingRemote = false;
      }, 50);
    }
  }

  /**
   * Triggers a debounced broadcast of current local state to all other devices & tabs
   */
  public notifyChange(): void {
    if (this.isApplyingRemote) return; // Do not broadcast mutations caused by receiving a remote snapshot

    this.currentRevision += 1;
    if (typeof window !== 'undefined') {
      localStorage.setItem('smart_grocery_revision', this.currentRevision.toString());
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.debounceTimer = setTimeout(async () => {
      this.debounceTimer = null;
      await this.broadcastSnapshot();
    }, 150);
  }

  /**
   * Broadcasts snapshot immediately to Local BroadcastChannel & Cloud
   */
  public async broadcastSnapshot(): Promise<GrocerySnapshot | null> {
    if (this.isApplyingRemote) return null;

    try {
      this.updateState({ isSyncing: true });
      const snapshot = await this.takeSnapshot();

      // Sanitize: strip undefined values so Firestore setDoc never throws Unsupported field value: undefined
      const cleanSnapshot: GrocerySnapshot = JSON.parse(JSON.stringify(snapshot));
      this.lastAppliedDataSignature = JSON.stringify(cleanSnapshot.data);

      // 1. Post to Local BroadcastChannel (instant multi-tab)
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage(cleanSnapshot);
        } catch (e) {
          // ignore
        }
      }

      // 1b. Post to Firebase Cloud Firestore for instant millisecond push
      try {
        const syncDocRef = doc(firestore, 'sync', SINGLE_USER);
        await setDoc(syncDocRef, {
          snapshot: cleanSnapshot,
          updatedAt: Date.now(),
        });
      } catch (e) {
        console.warn('Firestore setDoc error:', e);
      }

      const timeStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      this.updateState({
        isSyncing: false,
        lastSyncTime: timeStr,
        lastOrigin: 'local',
      });

      return cleanSnapshot;
    } catch (err) {
      console.error('Broadcast failed:', err);
      this.updateState({ isSyncing: false });
      return null;
    }
  }

  /**
   * Generates a 1-tap share URL with current snapshot embedded
   */
  public async generateShareUrl(): Promise<string> {
    const snapshot = await this.takeSnapshot();
    const cleanSnapshot = JSON.parse(JSON.stringify(snapshot));
    const encoded = encodeURIComponent(JSON.stringify(cleanSnapshot));
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://smartgroceryandpricetaker.vercel.app';
    return `${baseUrl}/?sync_snapshot=${encoded}`;
  }
}

export const syncService = new SyncService();
