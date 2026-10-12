import { describe, it, expect } from 'vitest';
import { calculateTieredDiscount, sanitizeDiscounts } from '../utils/discount';

describe('F-03: Tiered Discount Calculator', () => {
  it('Rp100.000 dengan diskon 25% menghasilkan Rp75.000 dan hemat Rp25.000', () => {
    const result = calculateTieredDiscount(100000, [25]);
    expect(result.initialPrice).toBe(100000);
    expect(result.finalPrice).toBe(75000);
    expect(result.totalSavings).toBe(25000);
    expect(result.effectiveDiscountPercent).toBe(25);
    expect(result.tiers).toHaveLength(1);
    expect(result.tiers[0].discountPercent).toBe(25);
  });

  it('Rp100.000 dengan diskon 50% + 20% menghasilkan Rp40.000 dan penghematan Rp60.000', () => {
    // Formula: 100.000 * (1 - 0.5) * (1 - 0.2) = 100.000 * 0.5 * 0.8 = 40.000
    // Total savings: 60.000
    // Effective discount: 60%, NOT 70%
    const result = calculateTieredDiscount(100000, [50, 20]);
    expect(result.initialPrice).toBe(100000);
    expect(result.finalPrice).toBe(40000);
    expect(result.totalSavings).toBe(60000);
    expect(result.effectiveDiscountPercent).toBe(60);

    // Verify detailed tier steps
    expect(result.tiers).toHaveLength(2);
    expect(result.tiers[0].beforeTierPrice).toBe(100000);
    expect(result.tiers[0].afterTierPrice).toBe(50000);
    expect(result.tiers[0].savedAmount).toBe(50000);

    expect(result.tiers[1].beforeTierPrice).toBe(50000);
    expect(result.tiers[1].afterTierPrice).toBe(40000);
    expect(result.tiers[1].savedAmount).toBe(10000);
  });

  it('Handles multiple tiers correctly (e.g. 50% + 20% + 10%)', () => {
    // 100.000 * 0.5 * 0.8 * 0.9 = 36.000
    const result = calculateTieredDiscount(100000, [50, 20, 10]);
    expect(result.finalPrice).toBe(36000);
    expect(result.totalSavings).toBe(64000);
    expect(result.effectiveDiscountPercent).toBe(64);
  });

  it('Sanitizes invalid discounts (out of range or negative)', () => {
    const sanitized = sanitizeDiscounts([-10, 150, 50, 0]);
    expect(sanitized).toEqual([100, 50]);
  });

  it('Handles zero price and empty discounts safely', () => {
    const emptyResult = calculateTieredDiscount(100000, []);
    expect(emptyResult.finalPrice).toBe(100000);
    expect(emptyResult.totalSavings).toBe(0);

    const zeroPriceResult = calculateTieredDiscount(0, [20]);
    expect(zeroPriceResult.finalPrice).toBe(0);
    expect(zeroPriceResult.totalSavings).toBe(0);
  });
});
