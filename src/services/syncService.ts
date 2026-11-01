import { db, setupDatabaseSyncHooks } from '../db/database';
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
const RELAY_TOPIC = 'smartgrocery_singleuser_naomiiracle_v2';
const RELAY_BASE_URL = 'https://ntfy.sh';
const RELAY_TOPIC_URL = `https://ntfy.sh/${RELAY_TOPIC}`;
const RELAY_SSE_URL = `https://ntfy.sh/${RELAY_TOPIC}/sse`;
const BROADCAST_CHANNEL_NAME = 'smartgrocery_singleuser_naomiiracle_channel';

class SyncService {
  private deviceId: string = '';
  private broadcastChannel: BroadcastChannel | null = null;
  private eventSource: EventSource | null = null;
  private isApplyingRemote: boolean = false;
  private lastAppliedTimestamp: number = 0;
  private debounceTimer: any = null;
  private listeners: Set<(state: SyncState) => void> = new Set();

  private state: SyncState = {
    isConnected: false,
    isSyncing: false,
    lastSyncTime: null,
    deviceId: '',
    lastOrigin: null,
    pendingCount: 0,
  };

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.state.deviceId = this.deviceId;
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

    // Hook Dexie mutations to notify changes
    try {
      setupDatabaseSyncHooks(() => {
        this.notifyChange();
      });
    } catch (e) {
      console.warn('Failed to attach Dexie hooks:', e);
    }

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
        console.warn('BroadcastChannel not supported or error:', e);
      }
    }

    // 2. Initialize Cross-Device Realtime SSE (Server-Sent Events)
    this.connectRealtimeRelay();

    // 3. Check for snapshot in URL query string (for 1-tap QR scan or link pairing)
    this.checkUrlSnapshot();

    // 4. Pull latest snapshot from cloud on startup
    setTimeout(() => {
      this.pullLatestSnapshot();
    }, 500);

    // 5. Periodic ping / catch-up pull every 15 seconds to ensure devices never fall behind
    setInterval(() => {
      if (navigator.onLine && !this.isApplyingRemote) {
        this.pullLatestSnapshot(false);
      }
    }, 15000);
  }

  private connectRealtimeRelay(): void {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.eventSource = new EventSource(RELAY_SSE_URL);

      this.eventSource.onopen = () => {
        this.updateState({ isConnected: true });
      };

      this.eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.event === 'message' && parsed.message) {
            const snapshot = JSON.parse(parsed.message) as GrocerySnapshot;
            if (snapshot && snapshot.user === SINGLE_USER) {
              this.applySnapshot(snapshot, 'remote');
            }
          }
        } catch (err) {
          // Non-JSON or keepalive heartbeat, ignore
        }
      };

      this.eventSource.onerror = () => {
        this.updateState({ isConnected: false });
        // Auto-reconnect managed natively by EventSource
      };
    } catch (err) {
      console.warn('EventSource failed to connect:', err);
      this.updateState({ isConnected: false });
    }
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
   * Pulls latest snapshot from the cloud relay
   */
  public async pullLatestSnapshot(forceApply: boolean = false): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.onLine) return false;
    try {
      this.updateState({ isSyncing: true });
      const res = await fetch(`${RELAY_TOPIC_URL}/json?poll=1`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Poll failed');
      const text = await res.text();
      const lines = text.trim().split('\n');

      // Find the last valid snapshot message
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) continue;
        try {
          const msgObj = JSON.parse(line);
          if (msgObj.message) {
            const snapshot = JSON.parse(msgObj.message) as GrocerySnapshot;
            if (snapshot && snapshot.user === SINGLE_USER) {
              if (snapshot.deviceId !== this.deviceId) {
                if (forceApply || snapshot.timestamp > this.lastAppliedTimestamp) {
                  await this.applySnapshot(snapshot, 'initial', forceApply);
                  this.updateState({ isSyncing: false });
                  return true;
                }
              }
            }
          }
        } catch (e) {
          // ignore individual line parse error
        }
      }
      this.updateState({ isSyncing: false });
      return false;
    } catch (err) {
      this.updateState({ isSyncing: false });
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

    // Compact transactions to latest 5 for lightweight cross-device sync (< 2KB)
    const sortedTx = [...transactions].sort(
      (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
    );
    const compactTransactions = sortedTx.slice(0, 5);

    return {
      version: 1,
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

    // Ignore older snapshots unless forced
    if (!force && snapshot.timestamp <= this.lastAppliedTimestamp) return false;

    this.isApplyingRemote = true;
    this.lastAppliedTimestamp = snapshot.timestamp;
    this.updateState({ isSyncing: true });

    try {
      const { cartItems, budgets, transactions, sessionLocation, sessionDate } = snapshot.data;

      // 1. Sync Cart Items (full replace to match exact cart on the other device)
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

      // 4. Sync Location & Date
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
      // Re-enable local mutations after Dexie finishes
      setTimeout(() => {
        this.isApplyingRemote = false;
      }, 80);
    }
  }

  /**
   * Triggers a debounced broadcast of current local state to all other devices & tabs
   */
  public notifyChange(): void {
    if (this.isApplyingRemote) return; // Ignore mutations caused by applying remote snapshot

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.broadcastSnapshot();
    }, 350);
  }

  /**
   * Broadcasts snapshot immediately to Local BroadcastChannel & Cloud Realtime Relay
   */
  public async broadcastSnapshot(): Promise<GrocerySnapshot | null> {
    if (this.isApplyingRemote) return null;

    try {
      this.updateState({ isSyncing: true });
      const snapshot = await this.takeSnapshot();
      this.lastAppliedTimestamp = snapshot.timestamp;

      // 1. Post to Local BroadcastChannel (instant multi-tab)
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage(snapshot);
        } catch (e) {
          // ignore
        }
      }

      // 2. Post to Cloud Realtime Relay (official ntfy.sh JSON publishing format)
      if (typeof window !== 'undefined' && navigator.onLine) {
        fetch(RELAY_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: RELAY_TOPIC,
            title: `Snapshot ${this.deviceId}`,
            message: JSON.stringify(snapshot),
          }),
        }).catch((e) => {
          console.warn('Realtime relay post failed:', e);
        });
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
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://smartgroceryandpricetaker.vercel.app';
    return `${baseUrl}/?sync_snapshot=${encoded}`;
  }
}

export const syncService = new SyncService();
