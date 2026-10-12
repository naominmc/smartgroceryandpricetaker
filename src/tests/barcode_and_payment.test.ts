import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/database';
import { groceryService } from '../services/groceryService';
import { findProductByBarcode } from '../data/supermarketCatalog';
import { PAYMENT_ACCOUNTS, DEFAULT_PAYMENT_ACCOUNT } from '../data/paymentMethods';

describe('Barcode Scanner & Bank BCA Payment Features', () => {
  beforeEach(async () => {
    await db.cartItems.clear();
    await db.transactions.clear();
  });

  it('Deteksi barcode otomatis mengidentifikasi produk dan harga supermarket', () => {
    // Test Indomie
    const indomie = findProductByBarcode('8998866200213');
    expect(indomie).toBeDefined();
    expect(indomie?.name).toBe('Indomie Goreng Spesial');
    expect(indomie?.unitPrice).toBe(3100);
    expect(indomie?.unit).toBe('bungkus');

    // Test Susu Ultra Milk
    const susu = findProductByBarcode('8992753112104');
    expect(susu).toBeDefined();
    expect(susu?.name).toContain('Ultra Milk');
    expect(susu?.unitPrice).toBe(20500);

    // Test Aqua
    const aqua = findProductByBarcode('8992772000010');
    expect(aqua).toBeDefined();
    expect(aqua?.name).toContain('Aqua Air Mineral 600ml');
    expect(aqua?.unitPrice).toBe(3500);
  });

  it('Default payment account adalah Bank BCA', () => {
    expect(DEFAULT_PAYMENT_ACCOUNT.name).toBe('Bank BCA');
    expect(DEFAULT_PAYMENT_ACCOUNT.id).toBe('bca');
    expect(PAYMENT_ACCOUNTS[0].name).toBe('Bank BCA');
  });

  it('Selesaikan belanja mencatat paymentMethod Bank BCA secara permanen', async () => {
    await groceryService.addItemToCart({
      name: 'Indomie Goreng Spesial',
      category: 'Makanan instan',
      unit: 'bungkus',
      quantity: 5,
      unitPrice: 3100,
      discounts: [],
    });

    // Checkout dengan Bank BCA
    const tx = await groceryService.completeCheckout(500000, 'Bank BCA');
    expect(tx.paymentMethod).toBe('Bank BCA');
    expect(tx.finalTotal).toBe(15500);

    // Verifikasi tersimpan di IndexedDB
    const saved = await db.transactions.get(tx.id);
    expect(saved?.paymentMethod).toBe('Bank BCA');
  });

  it('Dapat memilih sumber dana lain seperti Tunai atau Blu BCA', async () => {
    await groceryService.addItemToCart({
      name: 'Aqua 600ml',
      category: 'Minuman',
      unit: 'botol',
      quantity: 2,
      unitPrice: 3500,
      discounts: [],
    });

    const tx = await groceryService.completeCheckout(500000, 'Dompet Tunai / Cash');
    expect(tx.paymentMethod).toBe('Dompet Tunai / Cash');
    expect(tx.finalTotal).toBe(7000);
  });
});
