import { db } from '../db/database';
import { useStore } from '../store/useStore';
import type { CartItem, Budget, PurchaseTransaction } from '../types';

export interface GrocerySnapshotData {
  cartItems: CartItem[];
  budgets: Budget[];
  transactions: PurchaseTransaction[];
  sessionLocation: string;
  sessionDate: string;
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
  private lastAppliedSignature: string = '';
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
    const savedRev = localStorage.getItem('smart_grocery_revision');
    if (savedRev) {
      this.currentRevision = parseInt(savedRev, 10) || 0;
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

    // 2. Check for snapshot in URL query string (for 1-tap QR scan or link pairing)
    this.checkUrlSnapshot();

    // 3. Immediate initial pull from cloud on startup
    setTimeout(() => {
      this.pullLatestSnapshot(false);
    }, 200);

    // 4. Fast 2-second cloud polling so mobile-to-laptop updates sync immediately
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      if (typeof window !== 'undefined' && navigator.onLine && !this.isApplyingRemote) {
        this.pullLatestSnapshot(false);
      }
    }, 2000);
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
   * Pulls latest snapshot from Vercel /api/snapshot or fallback cloud store
   */
  public async pullLatestSnapshot(force: boolean = false): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.onLine) return false;
    try {
      let snapshot: GrocerySnapshot | null = null;

      // Try 1: Vercel /api/snapshot
      try {
        const res = await fetch('/api/snapshot', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.snapshot) {
            snapshot = json.snapshot;
          }
        }
      } catch (e) {
        // Fallback to direct cloud store
      }

      // Try 2: Direct cloud store if /api/snapshot was not available
      if (!snapshot) {
        try {
          const res = await fetch(CLOUD_DIRECT_URL, {
            cache: 'no-store',
          });
          if (res.ok) {
            const json = await res.json();
            if (json && json.data) {
              snapshot = json.data;
            }
          }
        } catch (e) {
          // Both failed
        }
      }

      if (snapshot && snapshot.user === SINGLE_USER) {
        if (force || snapshot.deviceId !== this.deviceId) {
          const applied = await this.applySnapshot(snapshot, 'remote', force);
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
    const [cartItems, budgets, transactions] = await Promise.all([
      db.cartItems.toArray(),
      db.budgets.toArray(),
      db.transactions.toArray(),
    ]);

    const { sessionLocation, sessionDate } = useStore.getState();

    // Compact transactions to latest 5 for ultra-fast sync
    const sortedTx = [...transactions].sort(
      (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
    );
    const compactTransactions = sortedTx.slice(0, 5);

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
        transactions: compactTransactions,
        sessionLocation: sessionLocation || 'Lotte Mart Grocery - Puri Indah',
        sessionDate: sessionDate || new Date().toISOString().split('T')[0],
      },
    };
  }

  /**
   * Generates a signature for snapshot comparison
   */
  private generateSignature(snapshot: GrocerySnapshot): string {
    const { cartItems, sessionLocation, sessionDate } = snapshot.data;
    const cartSummary = (cartItems || [])
      .map((c) => `${c.id}:${c.quantity}:${c.unitPrice}:${c.status}`)
      .join('|');
    return `${cartItems?.length || 0}_${cartSummary}_${sessionLocation}_${sessionDate}`;
  }

  /**
   * Applies an incoming snapshot from another device or tab
   */
  public async applySnapshot(
    snapshot: GrocerySnapshot,
    origin: 'local' | 'remote' | 'url' | 'initial',
    force: boolean = false
  ): Promise<boolean> {
    if (!snapshot || snapshot.user !== SINGLE_USER) return false;

    // Ignore echoes from self unless forced
    if (!force && snapshot.deviceId === this.deviceId) return false;

    // Check signature to avoid redundant re-renders
    const signature = this.generateSignature(snapshot);
    if (!force && signature === this.lastAppliedSignature) {
      return false;
    }

    this.isApplyingRemote = true;
    this.lastAppliedSignature = signature;
    if (snapshot.revision && snapshot.revision > this.currentRevision) {
      this.currentRevision = snapshot.revision;
      if (typeof window !== 'undefined') {
        localStorage.setItem('smart_grocery_revision', this.currentRevision.toString());
      }
    }

    this.updateState({ isSyncing: true });

    try {
      const { cartItems, budgets, transactions, sessionLocation, sessionDate } = snapshot.data;

      // 1. Sync Cart Items (Full replace to match the sender device 100%)
      if (Array.isArray(cartItems)) {
        await db.transaction('rw', db.cartItems, async () => {
          await db.cartItems.clear();
          if (cartItems.length > 0) {
            await db.cartItems.bulkPut(cartItems);
          }
        });
      }

      // 2. Sync Budgets
      if (Array.isArray(budgets) && budgets.length > 0) {
        await db.budgets.bulkPut(budgets);
      }

      // 3. Sync Transactions
      if (Array.isArray(transactions) && transactions.length > 0) {
        await db.transactions.bulkPut(transactions);
      }

      // 4. Sync Location & Date in Store
      if (sessionLocation) {
        useStore.getState().setSessionLocation(sessionLocation);
      }
      if (sessionDate) {
        useStore.getState().setSessionDate(sessionDate);
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

      return true;
    } catch (err) {
      console.error('Failed to apply snapshot:', err);
      this.updateState({ isSyncing: false });
      return false;
    } finally {
      setTimeout(() => {
        this.isApplyingRemote = false;
      }, 100);
    }
  }

  /**
   * Triggers a debounced broadcast of current local state to all other devices & tabs
   */
  public notifyChange(): void {
    if (this.isApplyingRemote) return; // Do not broadcast mutations caused by receiving a remote snapshot

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.broadcastSnapshot();
    }, 200);
  }

  /**
   * Broadcasts snapshot immediately to Local BroadcastChannel & Cloud
   */
  public async broadcastSnapshot(): Promise<GrocerySnapshot | null> {
    if (this.isApplyingRemote) return null;

    try {
      this.updateState({ isSyncing: true });
      const snapshot = await this.takeSnapshot();
      this.lastAppliedSignature = this.generateSignature(snapshot);

      // 1. Post to Local BroadcastChannel (instant multi-tab)
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage(snapshot);
        } catch (e) {
          // ignore
        }
      }

      // 2. Post to Vercel /api/snapshot AND cloud store in parallel
      if (typeof window !== 'undefined' && navigator.onLine) {
        // Endpoint 1: Vercel /api/snapshot
        fetch('/api/snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ snapshot }),
        }).catch(() => {});

        // Endpoint 2: Direct cloud store backup
        fetch(CLOUD_DIRECT_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'smartgrocery_singleuser_naomiiracle',
            data: snapshot,
          }),
        }).catch(() => {});
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

      return snapshot;
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
    const encoded = encodeURIComponent(JSON.stringify(snapshot));
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://smartgroceryandpricetaker.vercel.app';
    return `${baseUrl}/?sync_snapshot=${encoded}`;
  }
}

export const syncService = new SyncService();
