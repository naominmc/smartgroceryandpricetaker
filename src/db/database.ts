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
    // Seed default monthly budget for current month (Rp1.200.000 for student monthly grocery)
    await db.budgets.put({
      id: `budget-${currentPeriod}`,
      period: currentPeriod,
      limit: 1200000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Also seed previous month budget
    await db.budgets.put({
      id: `budget-${prevPeriod}`,
      period: prevPeriod,
      limit: 1200000,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    });
  }

  // Seed sample products and previous month transaction if empty
  if (txCount === 0) {
    const sampleProducts: Product[] = [
      {
        id: 'prod-beras-5kg',
        name: 'Beras Pandan Wangi 5kg',
        normalizedName: 'beras pandan wangi 5kg',
        category: 'Beras dan bahan pokok',
        unit: 'pack',
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
        id: 'prod-susu-uht',
        name: 'Susu UHT Full Cream 1L',
        normalizedName: 'susu uht full cream 1l',
        category: 'Susu dan produk dingin',
        unit: 'botol',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-telur-1kg',
        name: 'Telur Ayam Negeri 1kg',
        normalizedName: 'telur ayam negeri 1kg',
        category: 'Daging dan protein',
        unit: 'kg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-mie-instan',
        name: 'Mie Instan Kuah Soto (5 bungkus)',
        normalizedName: 'mie instan kuah soto (5 bungkus)',
        category: 'Makanan instan',
        unit: 'pack',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-sabun-mandi',
        name: 'Sabun Mandi Cair 450ml',
        normalizedName: 'sabun mandi cair 450ml',
        category: 'Perlengkapan mandi',
        unit: 'botol',
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
      budgetLimitSnapshot: 1200000,
      grossTotal: 255000,
      discountTotal: 15000,
      finalTotal: 240000,
      items: [
        {
          id: 'item-hist-1',
          productId: 'prod-beras-5kg',
          nameSnapshot: 'Beras Pandan Wangi 5kg',
          categorySnapshot: 'Beras dan bahan pokok',
          unit: 'pack',
          quantity: 1,
          unitPrice: 72000,
          discounts: [5],
          grossSubtotal: 72000,
          discountAmount: 3600,
          finalSubtotal: 68400,
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
          nameSnapshot: 'Telur Ayam Negeri 1kg',
          categorySnapshot: 'Daging dan protein',
          unit: 'kg',
          quantity: 2,
          unitPrice: 28000,
          discounts: [],
          grossSubtotal: 56000,
          discountAmount: 0,
          finalSubtotal: 56000,
        },
        {
          id: 'item-hist-4',
          productId: 'prod-susu-uht',
          nameSnapshot: 'Susu UHT Full Cream 1L',
          categorySnapshot: 'Susu dan produk dingin',
          unit: 'botol',
          quantity: 2,
          unitPrice: 20000,
          discounts: [10],
          grossSubtotal: 40000,
          discountAmount: 4000,
          finalSubtotal: 36000,
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
}
