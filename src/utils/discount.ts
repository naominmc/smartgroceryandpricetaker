export interface DiscountTierDetail {
  tierIndex: number;
  discountPercent: number;
  beforeTierPrice: number;
  afterTierPrice: number;
  savedAmount: number;
}

export interface TieredDiscountResult {
  initialPrice: number;
  finalPrice: number;
  totalSavings: number;
  effectiveDiscountPercent: number;
  tiers: DiscountTierDetail[];
}

/**
 * Validates and sanitizes discount percentages (0 - 100)
 */
export function sanitizeDiscounts(discounts: number[]): number[] {
  if (!Array.isArray(discounts)) return [];
  return discounts
    .map(d => (typeof d === 'number' && !isNaN(d) ? Math.min(100, Math.max(0, d)) : 0))
    .filter(d => d > 0);
}

/**
 * Calculates tiered discount:
 * hargaAkhir = hargaAwal * (1 - d1/100) * (1 - d2/100) * ...
 */
export function calculateTieredDiscount(
  initialPrice: number,
  discounts: number[]
): TieredDiscountResult {
  const safeInitialPrice = Math.max(0, Math.round(initialPrice));
  const validDiscounts = sanitizeDiscounts(discounts);

  if (safeInitialPrice === 0 || validDiscounts.length === 0) {
    return {
      initialPrice: safeInitialPrice,
      finalPrice: safeInitialPrice,
      totalSavings: 0,
      effectiveDiscountPercent: 0,
      tiers: [],
    };
  }

  let currentPrice = safeInitialPrice;
  const tiers: DiscountTierDetail[] = [];

  for (let i = 0; i < validDiscounts.length; i++) {
    const discount = validDiscounts[i];
    const beforeTier = currentPrice;
    // Calculate new price after this discount stage
    const afterTier = Math.round(beforeTier * (1 - discount / 100));
    const savedAmount = beforeTier - afterTier;

    tiers.push({
      tierIndex: i + 1,
      discountPercent: discount,
      beforeTierPrice: beforeTier,
      afterTierPrice: afterTier,
      savedAmount,
    });

    currentPrice = afterTier;
  }

  const finalPrice = currentPrice;
  const totalSavings = safeInitialPrice - finalPrice;
  const effectiveDiscountPercent =
    safeInitialPrice > 0
      ? Number(((totalSavings / safeInitialPrice) * 100).toFixed(2))
      : 0;

  return {
    initialPrice: safeInitialPrice,
    finalPrice,
    totalSavings,
    effectiveDiscountPercent,
    tiers,
  };
}
