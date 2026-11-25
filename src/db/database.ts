import Dexie, { type Table } from 'dexie';
import type { Product, CartItem, Budget, PurchaseTransaction } from '../types';
import { getCurrentMonthPeriod, getPreviousMonthPeriod } from '../utils/priceComparison';

export class GroceryDatabase extends Dexie {
  products!: Table<Product, string>;
  cartItems!: Table<CartItem, string>;
  budgets!: Table<Budget, string>;
  transactions!: Table<PurchaseTransaction, string>;

  constructor() {
    super('SmartGroceryDB');

    this.version(1).stores({
      products: 'id, normalizedName, category, createdAt',
      cartItems: 'id, productId, status, createdAt',
      budgets: 'id, period, createdAt',
      transactions: 'id, period, purchasedAt',
    });
  }
}

export const db = new GroceryDatabase();

let areSyncHooksSetup = false;

/**
 * Setup Realtime Database Sync Hooks
 * Automatically broadcasts snapshot when cartItems, budgets, or transactions mutate
 */
export function setupDatabaseSyncHooks(notifyFn: () => void) {
  if (areSyncHooksSetup) return;
  areSyncHooksSetup = true;

  const tables = [db.cartItems, db.budgets, db.transactions];
  tables.forEach((table) => {
    table.hook('creating', () => {
      notifyFn();
    });
    table.hook('updating', () => {
      notifyFn();
    });
    table.hook('deleting', () => {
      notifyFn();
    });
  });
}

/**
 * Automatically cleans up deleted transactions that have exceeded the 30-day retention period.
 * Transactions deleted less than 30 days ago are preserved.
 */
export async function cleanupExpiredDeletedTransactions(): Promise<number> {
  try {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const allDeleted = await db.transactions.filter((t) => Boolean(t.isDeleted)).toArray();
    const expiredTransactions = allDeleted.filter((t) => {
      if (!t.deletedAt) return false;
      const deletedTime = new Date(t.deletedAt).getTime();
      return !isNaN(deletedTime) && (now - deletedTime >= thirtyDaysMs);
    });

    if (expiredTransactions.length > 0) {
      await Promise.all(expiredTransactions.map((t) => db.transactions.delete(t.id)));
      if (typeof window !== 'undefined' && (window as any).__smart_grocery_notify_sync) {
        (window as any).__smart_grocery_notify_sync();
      }
    }
    return expiredTransactions.length;
  } catch (err) {
    console.warn('Error cleaning up expired deleted transactions:', err);
    return 0;
  }
}

/**
 * Seeds initial demo data if database is fresh, providing instant delight
 * including a budget and previous month transactions so F-04 comparator has rich real data!
 */
export async function seedInitialDataIfNeeded() {
  const budgetCount = await db.budgets.count();
  const txCount = await db.transactions.count();

  const currentPeriod = getCurrentMonthPeriod();
  const prevPeriod = getPreviousMonthPeriod(currentPeriod);

  if (budgetCount === 0) {
    // Default initial budget is 0 for new accounts (or persistent last limit if customized previously)
    const isCustomized = typeof window !== 'undefined' && localStorage.getItem('smart_grocery_budget_customized') === 'true';
    const lastLimit = isCustomized && typeof window !== 'undefined'
      ? (parseInt(localStorage.getItem('smart_grocery_budget_limit') || '0', 10) || 0)
      : 0;

    await db.budgets.put({
      id: `budget-${currentPeriod}`,
      period: currentPeriod,
      limit: lastLimit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Seed sample products and previous month transaction if empty
  if (txCount === 0) {
    const sampleProducts: Product[] = [
      {
        id: 'prod-beras-rojolele',
        name: 'Beras Rojolele',
        normalizedName: 'beras rojolele',
        category: 'Beras dan bahan pokok',
        unit: 'karung/5kg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-beras-5kg',
        name: 'Beras 5kg',
        normalizedName: 'beras 5kg',
        category: 'Beras dan bahan pokok',
        unit: 'karung/5kg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-minyak-2l',
        name: 'Minyak Goreng 2L',
        normalizedName: 'minyak goreng 2l',
        category: 'Beras dan bahan pokok',
        unit: 'pack',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-telur-1kg',
        name: 'Telur 1kg',
        normalizedName: 'telur 1kg',
        category: 'Daging dan protein',
        unit: 'kg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-garam-500g',
        name: 'Garam 500g',
        normalizedName: 'garam 500g',
        category: 'Beras dan bahan pokok',
        unit: 'pack',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-susu-uht',
        name: 'Susu UHT Full Cream 1L',
        normalizedName: 'susu uht full cream 1l',
        category: 'Susu dan produk dingin',
        unit: 'botol',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-sabun-mandi',
        name: 'Sabun Mandi',
        normalizedName: 'sabun mandi',
        category: 'Perlengkapan mandi',
        unit: 'pcs',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await db.products.bulkPut(sampleProducts);

    // Add a completed transaction from last month for accurate price comparison
    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    prevDate.setDate(15);

    const prevTx: PurchaseTransaction = {
      id: `tx-history-${prevPeriod}-01`,
      period: prevPeriod,
      purchasedAt: prevDate.toISOString(),
      location: 'LOTTE MART GROCERY - PURI INDAH',
      budgetLimitSnapshot: 1200000,
      grossTotal: 255000,
      discountTotal: 15000,
      finalTotal: 240000,
      items: [
        {
          id: 'item-hist-1',
          productId: 'prod-beras-rojolele',
          nameSnapshot: 'Beras Rojolele',
          categorySnapshot: 'Beras dan bahan pokok',
          unit: 'karung/5kg',
          quantity: 1,
          unitPrice: 68000,
          discounts: [],
          grossSubtotal: 68000,
          discountAmount: 0,
          finalSubtotal: 68000,
        },
        {
          id: 'item-hist-1b',
          productId: 'prod-beras-5kg',
          nameSnapshot: 'Beras 5kg',
          categorySnapshot: 'Beras dan bahan pokok',
          unit: 'karung/5kg',
          quantity: 1,
          unitPrice: 68000,
          discounts: [],
          grossSubtotal: 68000,
          discountAmount: 0,
          finalSubtotal: 68000,
        },
        {
          id: 'item-hist-2',
          productId: 'prod-minyak-2l',
          nameSnapshot: 'Minyak Goreng 2L',
          categorySnapshot: 'Beras dan bahan pokok',
          unit: 'pack',
          quantity: 1,
          unitPrice: 38000,
          discounts: [],
          grossSubtotal: 38000,
          discountAmount: 0,
          finalSubtotal: 38000,
        },
        {
          id: 'item-hist-3',
          productId: 'prod-telur-1kg',
          nameSnapshot: 'Telur 1kg',
          categorySnapshot: 'Daging dan protein',
          unit: 'kg',
          quantity: 2,
          unitPrice: 32000,
          discounts: [],
          grossSubtotal: 64000,
          discountAmount: 0,
          finalSubtotal: 64000,
        },
        {
          id: 'item-hist-4',
          productId: 'prod-garam-500g',
          nameSnapshot: 'Garam 500g',
          categorySnapshot: 'Beras dan bahan pokok',
          unit: 'pack',
          quantity: 1,
          unitPrice: 5000,
          discounts: [],
          grossSubtotal: 5000,
          discountAmount: 0,
          finalSubtotal: 5000,
        },
      ],
    };

    await db.transactions.put(prevTx);

    // Pre-populate active cart with 2 realistic starter items so trolley user immediately sees trolley experience
    const activeCartCount = await db.cartItems.count();
    if (activeCartCount === 0) {
      await db.cartItems.bulkPut([
        {
          id: 'cart-init-1',
          productId: 'prod-beras-5kg',
          nameSnapshot: 'Beras Pandan Wangi 5kg',
          categorySnapshot: 'Beras dan bahan pokok',
          unit: 'pack',
          quantity: 1,
          unitPrice: 75000, // rose from 72.000 to 75.000 (demonstrates +4.2% up)
          discounts: [5],
          previousUnitPrice: 72000,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cart-init-2',
          productId: 'prod-telur-1kg',
          nameSnapshot: 'Telur Ayam Negeri 1kg',
          categorySnapshot: 'Daging dan protein',
          unit: 'kg',
          quantity: 1,
          unitPrice: 26000, // dropped from 28.000 to 26.000 (demonstrates -7.1% down)
          discounts: [],
          previousUnitPrice: 28000,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    }
  }

  // Ensure all critical comparator items exist in past transactions even if DB was already seeded
  try {
    const allTx = await db.transactions.toArray();
    const hasBeras = allTx.some((t) => t.items.some((i) => i.nameSnapshot.toLowerCase().includes('beras') && i.unitPrice === 68000));
    const hasTelur = allTx.some((t) => t.items.some((i) => i.nameSnapshot.toLowerCase().includes('telur') && i.unitPrice === 32000));
    const hasGaram = allTx.some((t) => t.items.some((i) => i.nameSnapshot.toLowerCase().includes('garam') && i.unitPrice === 5000));

    if (!hasBeras || !hasTelur || !hasGaram) {
      const prevDate = new Date();
      prevDate.setMonth(prevDate.getMonth() - 1);
      prevDate.setDate(15);
      const ensureTx: PurchaseTransaction = {
        id: `tx-history-${prevPeriod}-lotte-01`,
        period: prevPeriod,
        purchasedAt: prevDate.toISOString(),
        location: 'LOTTE MART GROCERY - PURI INDAH',
        budgetLimitSnapshot: 1200000,
        grossTotal: 255000,
        discountTotal: 0,
        finalTotal: 255000,
        items: [
          {
            id: 'item-hist-beras-68k',
            productId: 'prod-beras-rojolele',
            nameSnapshot: 'Beras Rojolele',
            categorySnapshot: 'Beras dan bahan pokok',
            unit: 'karung/5kg',
            quantity: 1,
            unitPrice: 68000,
            discounts: [],
            grossSubtotal: 68000,
            discountAmount: 0,
            finalSubtotal: 68000,
          },
          {
            id: 'item-hist-telur-32k',
            productId: 'prod-telur-1kg',
            nameSnapshot: 'Telur 1kg',
            categorySnapshot: 'Daging dan protein',
            unit: 'kg',
            quantity: 1,
            unitPrice: 32000,
            discounts: [],
            grossSubtotal: 32000,
            discountAmount: 0,
            finalSubtotal: 32000,
          },
          {
            id: 'item-hist-garam-5k',
            productId: 'prod-garam-500g',
            nameSnapshot: 'Garam 500g',
            categorySnapshot: 'Beras dan bahan pokok',
            unit: 'pack',
            quantity: 1,
            unitPrice: 5000,
            discounts: [],
            grossSubtotal: 5000,
            discountAmount: 0,
            finalSubtotal: 5000,
          },
        ],
      };
      await db.transactions.put(ensureTx);
    }
  } catch (e) {
    console.warn('Could not ensure comparator seed data:', e);
  }
}
