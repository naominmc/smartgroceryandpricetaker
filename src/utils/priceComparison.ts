import type { PriceComparisonResult } from '../types';

/**
 * Compare current unit price with previous completed month price
 * F-04
 */
export function comparePrices(
  currentPrice: number,
  previousPrice?: number | null,
  currentUnit?: string,
  previousUnit?: string
): PriceComparisonResult {
  const safeCurrent = Math.max(0, Math.round(Number(currentPrice) || 0));

  // If previous price is not recorded or unit mismatch without conversion
  if (
    previousPrice === null ||
    previousPrice === undefined ||
    isNaN(previousPrice) ||
    previousPrice <= 0
  ) {
    return {
      hasPreviousData: false,
      currentPrice: safeCurrent,
      difference: 0,
      percentageChange: 0,
      status: 'no_data',
    };
  }

  // If units are specified and do not match (e.g. kg vs pack)
  if (
    currentUnit &&
    previousUnit &&
    currentUnit.toLowerCase().trim() !== previousUnit.toLowerCase().trim()
  ) {
    return {
      hasPreviousData: false,
      currentPrice: safeCurrent,
      difference: 0,
      percentageChange: 0,
      status: 'no_data',
    };
  }

  const safePrevious = Math.round(previousPrice);
  const difference = safeCurrent - safePrevious;

  if (safePrevious === 0) {
    return {
      hasPreviousData: false,
      currentPrice: safeCurrent,
      difference: 0,
      percentageChange: 0,
      status: 'no_data',
    };
  }

  const rawPercent = ((difference / safePrevious) * 100);
  const percentageChange = Number(Math.abs(rawPercent).toFixed(1));

  let status: 'up' | 'down' | 'equal' = 'equal';
  if (difference > 0) {
    status = 'up';
  } else if (difference < 0) {
    status = 'down';
  } else {
    status = 'equal';
  }

  return {
    hasPreviousData: true,
    previousPrice: safePrevious,
    currentPrice: safeCurrent,
    difference,
    percentageChange,
    status,
  };
}

/**
 * Helper to compute previous calendar month string (YYYY-MM)
 */
export function getPreviousMonthPeriod(currentPeriod?: string): string {
  let date: Date;
  if (currentPeriod) {
    const [year, month] = currentPeriod.split('-').map(Number);
    date = new Date(year, month - 1, 1);
  } else {
    date = new Date();
  }
  // Subtract one month
  date.setMonth(date.getMonth() - 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getCurrentMonthPeriod(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatPeriodLabel(period: string): string {
  if (!period) return '';
  const [year, month] = period.split('-').map(Number);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  if (month >= 1 && month <= 12) {
    return `${months[month - 1]} ${year}`;
  }
  return period;
}
