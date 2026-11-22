/**
 * Formatter and parser for multi-currency display (IDR, USD, SGD, EUR, JPY)
 */

export function getActiveCurrency(): { symbol: string; code: string } {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('sg_currency') || '';
    if (raw.includes('USD') || raw.includes('$')) return { symbol: '$', code: 'USD' };
    if (raw.includes('SGD') || raw.includes('S$')) return { symbol: 'S$', code: 'SGD' };
    if (raw.includes('EUR') || raw.includes('€')) return { symbol: '€', code: 'EUR' };
    if (raw.includes('JPY') || raw.includes('¥')) return { symbol: '¥', code: 'JPY' };
  }
  return { symbol: 'Rp', code: 'IDR' };
}

export function formatRupiah(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    const { symbol } = getActiveCurrency();
    return `${symbol}0`;
  }
  
  const { symbol } = getActiveCurrency();
  const isNegative = value < 0;
  const absValue = Math.round(Math.abs(value));
  const formatted = absValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return isNegative ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function parseRupiah(input: string): number {
  if (!input) return 0;
  // Clean all non-digit characters except minus sign
  const cleaned = input.replace(/[^\d-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}
