import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/database';
import { groceryService } from '../services/groceryService';

describe('F-01 & F-06: Grocery Cart, Transactions & IndexedDB Integration', () => {
  beforeEach(async () => {
    await db.cartItems.clear();
    await db.transactions.clear();
    await db.products.clear();
    await db.budgets.clear();
  });

  it('F-01: Menambah barang ke keranjang berhasil dan tersimpan di database lokal', async () => {
    const item = await groceryService.addItemToCart({
      name: 'Beras Ramos 5kg',
      category: 'Beras dan bahan pokok',
      unit: 'pack',
      quantity: 2,
      unitPrice: 65000,
      discounts: [10],
    });

    expect(item).toBeDefined();
    expect(item.nameSnapshot).toBe('Beras Ramos 5kg');
    expect(item.quantity).toBe(2);
    expect(item.unitPrice).toBe(65000);

    const savedInDb = await db.cartItems.get(item.id);
    expect(savedInDb).toBeDefined();
    expect(savedInDb?.nameSnapshot).toBe('Beras Ramos 5kg');
  });

  it('F-06: Checkout menyelesaikan belanja, menyimpan snapshot transaksi permanen, dan membersihkan keranjang', async () => {
    // 1. Tambah 2 item belanja
    await groceryService.addItemToCart({
      name: 'Susu Segar 1L',
      category: 'Susu dan produk dingin',
      unit: 'botol',
      quantity: 2,
      unitPrice: 20000,
      discounts: [],
    });

    await groceryService.addItemToCart({
      name: 'Roti Gandum',
      category: 'Makanan instan',
      unit: 'bungkus',
      quantity: 1,
      unitPrice: 18000,
      discounts: [10], // Diskon 10% = Rp1.800, final = Rp16.200
    });

    const activeBefore = await db.cartItems.toArray();
    expect(activeBefore).toHaveLength(2);

    // 2. Checkout
    const completedTx = await groceryService.completeCheckout(1000000);

    expect(completedTx).toBeDefined();
    expect(completedTx.items).toHaveLength(2);
    // Gross: 40.000 + 18.000 = 58.000
    // Final: 40.000 + 16.200 = 56.200
    expect(completedTx.grossTotal).toBe(58000);
    expect(completedTx.finalTotal).toBe(56200);
    expect(completedTx.discountTotal).toBe(1800);
    expect(completedTx.budgetLimitSnapshot).toBe(1000000);

    // 3. Verifikasi keranjang sekarang bersih
    const activeAfter = await db.cartItems.toArray();
    expect(activeAfter).toHaveLength(0);

    // 4. Verifikasi transaksi tersimpan di riwayat
    const savedTx = await db.transactions.get(completedTx.id);
    expect(savedTx).toBeDefined();
    expect(savedTx?.finalTotal).toBe(56200);
  });

  it('F-06: Histori transaksi bersifat immutable (data lama tidak berubah saat katalog berubah)', async () => {
    // Tambah & checkout beras dengan harga Rp70.000
    await groceryService.addItemToCart({
      name: 'Beras Pulen',
      category: 'Beras dan bahan pokok',
      unit: 'pack',
      quantity: 1,
      unitPrice: 70000,
      discounts: [],
    });

    const tx = await groceryService.completeCheckout(500000);
    expect(tx.items[0].unitPrice).toBe(70000);

    // Pengguna belanja lagi bulan berikutnya dengan beras sama tapi harga naik Rp80.000
    await groceryService.addItemToCart({
      name: 'Beras Pulen',
      category: 'Beras dan bahan pokok',
      unit: 'pack',
      quantity: 1,
      unitPrice: 80000,
      discounts: [],
    });

    // Transaksi lama tetap memiliki harga Rp70.000
    const historicalTx = await db.transactions.get(tx.id);
    expect(historicalTx?.items[0].unitPrice).toBe(70000);
  });

  it('F-06: Ekspor dan Impor JSON berfungsi dan tervalidasi', async () => {
    await groceryService.addItemToCart({
      name: 'Kopi Bubuk 200g',
      category: 'Minuman',
      unit: 'pack',
      quantity: 1,
      unitPrice: 25000,
      discounts: [],
    });

    const backupJson = await groceryService.exportBackup();
    expect(backupJson).toContain('Kopi Bubuk 200g');
    expect(backupJson).toContain('Smart Grocery & Budget Safety Tracker');

    // Kosongkan database
    await db.cartItems.clear();
    const countEmpty = await db.cartItems.count();
    expect(countEmpty).toBe(0);

    // Pulihkan dari backup
    await groceryService.importBackup(backupJson);
    const restoredItems = await db.cartItems.toArray();
    expect(restoredItems).toHaveLength(1);
    expect(restoredItems[0].nameSnapshot).toBe('Kopi Bubuk 200g');
  });

  it('F-06: Menolak impor file JSON yang rusak / invalid', async () => {
    await expect(groceryService.importBackup('{"invalid": true}')).rejects.toThrow();
  });
});
