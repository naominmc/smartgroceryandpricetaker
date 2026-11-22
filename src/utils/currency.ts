/**
 * Formatter and parser for multi-currency display (IDR, USD, SGD, EUR, JPY, CNY, SAR, AED)
 */

export function getActiveCurrency(): { symbol: string; code: string } {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('sg_currency') || '';
    if (raw.includes('USD') || (raw.includes('$') && !raw.includes('S$'))) return { symbol: '$', code: 'USD' };
    if (raw.includes('SGD') || raw.includes('S$')) return { symbol: 'S$', code: 'SGD' };
    if (raw.includes('EUR') || raw.includes('€')) return { symbol: '€', code: 'EUR' };
    if (raw.includes('CNY') || raw.includes('Cina') || raw.includes('Yuan')) return { symbol: '¥', code: 'CNY' };
    if (raw.includes('JPY') || raw.includes('Japanese') || raw.includes('Yen')) return { symbol: '¥', code: 'JPY' };
    if (raw.includes('SAR') || raw.includes('Riyadh') || raw.includes('Riyal')) return { symbol: 'SR', code: 'SAR' };
    if (raw.includes('AED') || raw.includes('Dirham')) return { symbol: 'AED', code: 'AED' };
  }
  return { symbol: 'Rp', code: 'IDR' };
}

export function formatRupiah(value: number): string {
  const { symbol } = getActiveCurrency();
  const spacer = symbol.length > 2 || symbol === 'SR' ? ' ' : '';

  if (isNaN(value) || value === null || value === undefined) {
    return `${symbol}${spacer}0`;
  }
  
  const isNegative = value < 0;
  const absValue = Math.round(Math.abs(value));
  const formatted = absValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return isNegative ? `-${symbol}${spacer}${formatted}` : `${symbol}${spacer}${formatted}`;
}

export function parseRupiah(input: string): number {
  if (!input) return 0;
  // Clean all non-digit characters except minus sign
  const cleaned = input.replace(/[^\d-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a raw number or numeric string into dots separated thousands (Indonesian standard)
 * Example: 1000 -> 1.000, 100000 -> 100.000, 1235678 -> 1.235.678
 */
export function formatNumberWithDots(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  const clean = value.toString().replace(/\D/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
