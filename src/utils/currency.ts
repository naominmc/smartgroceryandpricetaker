/**
 * Formatter and parser for Indonesian Rupiah (IDR)
 */

export function formatRupiah(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return 'Rp0';
  }
  
  const isNegative = value < 0;
  const absValue = Math.round(Math.abs(value));
  const formatted = absValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return isNegative ? `-Rp${formatted}` : `Rp${formatted}`;
}

export function parseRupiah(input: string): number {
  if (!input) return 0;
  // Clean all non-digit characters except minus sign
  const cleaned = input.replace(/[^\d-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}
