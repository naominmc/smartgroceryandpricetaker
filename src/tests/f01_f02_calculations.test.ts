import { describe, it, expect } from 'vitest';
import { calculateItemSubtotals, calculateCartTotals } from '../utils/calculations';
import type { CartItem } from '../types';

describe('F-01 & F-02: Realtime Quantity & Subtotal Calculations', () => {
  it('F-02 scenario 1: 2 x Rp15.000 = Rp30.000', () => {
    const calc = calculateItemSubtotals(2, 15000, []);
    expect(calc.grossSubtotal).toBe(30000);
    expect(calc.finalSubtotal).toBe(30000);
    expect(calc.discountAmount).toBe(0);
  });

  it('F-02 scenario 2: quantity updated to 3 x Rp15.000 = Rp45.000', () => {
    const calc = calculateItemSubtotals(3, 15000, []);
    expect(calc.grossSubtotal).toBe(45000);
    expect(calc.finalSubtotal).toBe(45000);
    expect(calc.discountAmount).toBe(0);
  });

  it('F-02 scenario 3: cart totals update in realtime across multiple items', () => {
    const items: CartItem[] = [
      {
        id: 'item-1',
        productId: 'prod-1',
        nameSnapshot: 'Beras Ramos 5kg',
        categorySnapshot: 'Beras dan bahan pokok',
        unit: 'pack',
        quantity: 2,
        unitPrice: 15000,
        discounts: [],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'item-2',
        productId: 'prod-2',
        nameSnapshot: 'Minyak Goreng 1L',
        categorySnapshot: 'Beras dan bahan pokok',
        unit: 'botol',
        quantity: 1,
        unitPrice: 20000,
        discounts: [10], // 10% discount on Rp20.000 = Rp2.000 discount, final = Rp18.000
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const totals = calculateCartTotals(items);
    // Gross: 30.000 + 20.000 = 50.000
    // Discount: 0 + 2.000 = 2.000
    // Final: 30.000 + 18.000 = 48.000
    expect(totals.grossTotal).toBe(50000);
    expect(totals.discountTotal).toBe(2000);
    expect(totals.finalTotal).toBe(48000);
    expect(totals.activeCount).toBe(2);
    expect(totals.totalQuantity).toBe(3);
  });

  it('Handles zero and decimal quantities gracefully with integer rounding', () => {
    const calcZero = calculateItemSubtotals(0, 15000, []);
    expect(calcZero.grossSubtotal).toBe(0);
    expect(calcZero.finalSubtotal).toBe(0);

    const calcDecimal = calculateItemSubtotals(1.5, 20000, []);
    expect(calcDecimal.grossSubtotal).toBe(30000);
    expect(calcDecimal.finalSubtotal).toBe(30000);
  });
});
