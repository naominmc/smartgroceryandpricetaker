import type { CartItem, BudgetStatus, BudgetStatusLevel } from '../types';
import { calculateTieredDiscount } from './discount';
import { formatRupiah } from './currency';

export interface CalculatedItemSubtotals {
  grossSubtotal: number;
  discountAmount: number;
  finalSubtotal: number;
  effectiveDiscountPercent: number;
}

/**
 * Calculates item subtotals reliably in Rupiah
 * F-02 & F-03
 */
export function calculateItemSubtotals(
  quantity: number,
  unitPrice: number,
  discounts: number[] = []
): CalculatedItemSubtotals {
  const safeQty = Math.max(0, Number(quantity) || 0);
  const safeUnitPrice = Math.max(0, Math.round(Number(unitPrice) || 0));

  // Subtotal kotor = kuantitas x hargaSatuan
  const grossSubtotal = Math.round(safeQty * safeUnitPrice);

  // Apply tiered discounts
  const discountResult = calculateTieredDiscount(grossSubtotal, discounts);

  return {
    grossSubtotal,
    discountAmount: discountResult.totalSavings,
    finalSubtotal: discountResult.finalPrice,
    effectiveDiscountPercent: discountResult.effectiveDiscountPercent,
  };
}

export interface CartSummary {
  grossTotal: number;
  discountTotal: number;
  finalTotal: number;
  activeCount: number;
  totalQuantity: number;
  completedCount: number;
}

/**
 * Calculates aggregate totals for cart items
 */
export function calculateCartTotals(items: CartItem[]): CartSummary {
  let grossTotal = 0;
  let discountTotal = 0;
  let finalTotal = 0;
  let activeCount = 0;
  let totalQuantity = 0;
  let completedCount = 0;

  for (const item of items) {
    const calc = calculateItemSubtotals(item.quantity, item.unitPrice, item.discounts);
    grossTotal += calc.grossSubtotal;
    discountTotal += calc.discountAmount;
    finalTotal += calc.finalSubtotal;
    totalQuantity += item.quantity;

    if (item.status === 'completed') {
      completedCount++;
    } else {
      activeCount++;
    }
  }

  return {
    grossTotal,
    discountTotal,
    finalTotal,
    activeCount,
    totalQuantity,
    completedCount,
  };
}

/**
 * Evaluates budget safety status cap
 * F-05
 */
export function evaluateBudgetSafety(
  budgetLimit: number,
  activeTotal: number,
  totalSavings: number = 0
): BudgetStatus {
  const safeLimit = Math.max(0, Math.round(Number(budgetLimit) || 0));
  const safeActiveTotal = Math.max(0, Math.round(Number(activeTotal) || 0));

  if (safeLimit === 0) {
    return {
      limit: 0,
      activeTotal: safeActiveTotal,
      remaining: 0,
      percentage: 0,
      level: 'safe',
      message: 'Batas anggaran belum ditentukan.',
      excessAmount: 0,
      totalSavings,
    };
  }

  const remaining = safeLimit - safeActiveTotal;
  const percentage = Number(((safeActiveTotal / safeLimit) * 100).toFixed(1));
  const excessAmount = Math.max(0, safeActiveTotal - safeLimit);

  let level: BudgetStatusLevel = 'safe';
  let message = 'Anggaran masih aman.';

  if (percentage > 100) {
    level = 'exceeded';
    message = `Anggaran terlampaui ${formatRupiah(excessAmount)}.`;
  } else if (percentage >= 90) {
    level = 'danger';
    message = 'Peringatan! Belanja mendekati batas maksimum.';
  } else if (percentage >= 70) {
    level = 'warning';
    message = 'Hati-hati, anggaran mulai menipis.';
  } else {
    level = 'safe';
    message = 'Anggaran masih aman.';
  }

  return {
    limit: safeLimit,
    activeTotal: safeActiveTotal,
    remaining,
    percentage,
    level,
    message,
    excessAmount,
    totalSavings,
  };
}
