import { db } from '../db/database';
import type {
  Product,
  CartItem,
  Budget,
  PurchaseTransaction,
  TransactionItemSnapshot,
  ProductCategory,
} from '../types';
import { calculateItemSubtotals, calculateCartTotals } from '../utils/calculations';
import { getCurrentMonthPeriod, getPreviousMonthPeriod } from '../utils/priceComparison';

export const groceryService = {
  /**
   * Finds or creates a product in catalog and gets previous month unit price
   */
  async findOrCreateProduct(
    name: string,
    category: ProductCategory,
    unit: string
  ): Promise<{ product: Product; previousPrice: number | null }> {
    const trimmedName = name.trim();
    const normalized = trimmedName.toLowerCase();

    // Check if product exists in catalog
    let product = await db.products.where('normalizedName').equals(normalized).first();

    if (!product) {
      product = {
        id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: trimmedName,
        normalizedName: normalized,
        category,
        unit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.products.put(product);
    }

    // Lookup previous month price for this product
    const previousPrice = await this.getPreviousMonthPrice(product.id, normalized, unit);

    return { product, previousPrice };
  },

  /**
   * Looks up the unit price of a product in the previous calendar month's transactions
   * F-04
   */
  async getPreviousMonthPrice(
    productId: string,
    normalizedName?: string,
    unit?: string
  ): Promise<number | null> {
    const prevPeriod = getPreviousMonthPeriod(getCurrentMonthPeriod());
    const pastTransactions = await db.transactions.where('period').equals(prevPeriod).toArray();

    if (!pastTransactions || pastTransactions.length === 0) {
      return null;
    }

    // Search from newest to oldest within that month
    pastTransactions.sort(
      (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
    );

    for (const tx of pastTransactions) {
      for (const item of tx.items) {
        const matchesProduct =
          item.productId === productId ||
          (normalizedName && item.nameSnapshot.trim().toLowerCase() === normalizedName);

        const matchesUnit =
          !unit || !item.unit || item.unit.toLowerCase().trim() === unit.toLowerCase().trim();

        if (matchesProduct && matchesUnit && item.unitPrice > 0) {
          return item.unitPrice;
        }
      }
    }

    return null;
  },

  /**
   * Adds an item to the active cart
   * F-01
   */
  async addItemToCart(data: {
    name: string;
    category: ProductCategory;
    unit: string;
    quantity: number;
    unitPrice: number;
    discounts: number[];
  }): Promise<CartItem> {
    const { product, previousPrice } = await this.findOrCreateProduct(
      data.name,
      data.category,
      data.unit
    );

    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      productId: product.id,
      nameSnapshot: data.name.trim(),
      categorySnapshot: data.category,
      unit: data.unit,
      quantity: Math.max(1, Number(data.quantity) || 1),
      unitPrice: Math.max(0, Math.round(Number(data.unitPrice) || 0)),
      discounts: data.discounts || [],
      previousUnitPrice: previousPrice,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.cartItems.put(newItem);
    return newItem;
  },

  /**
   * Updates an existing cart item
   */
  async updateCartItem(
    id: string,
    updates: Partial<Omit<CartItem, 'id' | 'createdAt'>>
  ): Promise<void> {
    const item = await db.cartItems.get(id);
    if (!item) throw new Error('Item tidak ditemukan');

    const updated: CartItem = {
      ...item,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // If unit or name changed, re-evaluate previous price
    if (updates.nameSnapshot && updates.nameSnapshot !== item.nameSnapshot) {
      const prevPrice = await this.getPreviousMonthPrice(
        item.productId,
        updates.nameSnapshot.trim().toLowerCase(),
        updated.unit
      );
      updated.previousUnitPrice = prevPrice;
    }

    await db.cartItems.put(updated);
  },

  /**
   * Removes an item from the cart
   */
  async deleteCartItem(id: string): Promise<void> {
    await db.cartItems.delete(id);
  },

  /**
   * Toggle item completed / active state in cart
   */
  async toggleCartItemStatus(id: string): Promise<void> {
    const item = await db.cartItems.get(id);
    if (!item) return;

    await db.cartItems.update(id, {
      status: item.status === 'completed' ? 'active' : 'completed',
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Adjust item quantity quickly (+ / - buttons for thumb ergonomics)
   */
  async adjustQuantity(id: string, delta: number): Promise<void> {
    const item = await db.cartItems.get(id);
    if (!item) return;

    const newQty = Math.max(1, item.quantity + delta);
    await db.cartItems.update(id, {
      quantity: newQty,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Clears all items in the active cart
   */
  async clearCart(): Promise<void> {
    await db.cartItems.clear();
  },

  /**
   * Gets or sets current month budget
   * F-05
   */
  async getBudget(period: string = getCurrentMonthPeriod()): Promise<Budget> {
    let budget = await db.budgets.where('period').equals(period).first();
    if (!budget) {
      budget = {
        id: `budget-${period}`,
        period,
        limit: 1200000, // default Rp1.200.000
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.budgets.put(budget);
    }
    return budget;
  },

  async setBudget(period: string, limit: number): Promise<Budget> {
    const safeLimit = Math.max(0, Math.round(Number(limit) || 0));
    let budget = await db.budgets.where('period').equals(period).first();

    if (budget) {
      budget.limit = safeLimit;
      budget.updatedAt = new Date().toISOString();
      await db.budgets.put(budget);
    } else {
      budget = {
        id: `budget-${period}`,
        period,
        limit: safeLimit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.budgets.put(budget);
    }

    return budget;
  },

  /**
   * Completes shopping session, saves immutable snapshot to transactions, then clears cart
   * F-06
   */
  async completeCheckout(currentBudgetLimit: number, paymentMethod: string = 'Bank BCA'): Promise<PurchaseTransaction> {
    const cartItems = await db.cartItems.toArray();
    if (cartItems.length === 0) {
      throw new Error('Keranjang belanja kosong');
    }

    const currentPeriod = getCurrentMonthPeriod();

    // Map items to immutable snapshot with all calculated numbers
    const itemSnapshots: TransactionItemSnapshot[] = cartItems.map(item => {
      const calc = calculateItemSubtotals(item.quantity, item.unitPrice, item.discounts);
      return {
        id: item.id,
        productId: item.productId,
        nameSnapshot: item.nameSnapshot,
        categorySnapshot: item.categorySnapshot,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discounts: [...item.discounts],
        grossSubtotal: calc.grossSubtotal,
        discountAmount: calc.discountAmount,
        finalSubtotal: calc.finalSubtotal,
      };
    });

    const totals = calculateCartTotals(cartItems);

    const transaction: PurchaseTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      period: currentPeriod,
      purchasedAt: new Date().toISOString(),
      items: itemSnapshots,
      grossTotal: totals.grossTotal,
      discountTotal: totals.discountTotal,
      finalTotal: totals.finalTotal,
      budgetLimitSnapshot: currentBudgetLimit,
      paymentMethod,
    };

    // Use Dexie transaction to ensure atomic persist-then-clear
    await db.transaction('rw', db.transactions, db.cartItems, async () => {
      await db.transactions.put(transaction);
      await db.cartItems.clear();
    });

    return transaction;
  },

  /**
   * Export all database records to JSON for backup
   */
  async exportBackup(): Promise<string> {
    const [products, cartItems, budgets, transactions] = await Promise.all([
      db.products.toArray(),
      db.cartItems.toArray(),
      db.budgets.toArray(),
      db.transactions.toArray(),
    ]);

    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      appName: 'Smart Grocery & Budget Safety Tracker',
      data: {
        products,
        cartItems,
        budgets,
        transactions,
      },
    };

    return JSON.stringify(backupData, null, 2);
  },

  /**
   * Validates and imports JSON backup data
   */
  async importBackup(jsonString: string): Promise<boolean> {
    const parsed = JSON.parse(jsonString);

    if (!parsed || !parsed.data || typeof parsed.data !== 'object') {
      throw new Error('Format file cadangan tidak valid.');
    }

    const { products, budgets, transactions, cartItems } = parsed.data;

    if (!Array.isArray(budgets) || !Array.isArray(transactions)) {
      throw new Error('Data anggaran atau riwayat transaksi tidak sesuai spesifikasi.');
    }

    await db.transaction('rw', db.products, db.cartItems, db.budgets, db.transactions, async () => {
      if (Array.isArray(products) && products.length > 0) {
        await db.products.bulkPut(products);
      }
      if (Array.isArray(budgets) && budgets.length > 0) {
        await db.budgets.bulkPut(budgets);
      }
      if (Array.isArray(transactions) && transactions.length > 0) {
        await db.transactions.bulkPut(transactions);
      }
      if (Array.isArray(cartItems)) {
        await db.cartItems.clear();
        if (cartItems.length > 0) {
          await db.cartItems.bulkPut(cartItems);
        }
      }
    });

    return true;
  },
};
