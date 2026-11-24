import { useStore } from '../store/useStore';

/**
 * Formatter, converter, and parser for multi-currency display & calculations
 * Base anchor: IDR with 1 USD = Rp18.000
 */

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  rateFromIdr: number; // 1 Unit of this Currency = rateFromIdr IDR
  decimals: number;
  placeholder: string;
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  IDR: {
    code: 'IDR',
    name: 'ID Rupiah Indonesia (Rp - IDR)',
    symbol: 'Rp',
    rateFromIdr: 1,
    decimals: 0,
    placeholder: 'Contoh: 15.000',
  },
  USD: {
    code: 'USD',
    name: 'US Dollar ($ - USD)',
    symbol: '$',
    rateFromIdr: 18000,
    decimals: 2,
    placeholder: 'Contoh: 1.50',
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar (S$ - SGD)',
    symbol: 'S$',
    rateFromIdr: 13500,
    decimals: 2,
    placeholder: 'Contoh: 2.00',
  },
  EUR: {
    code: 'EUR',
    name: 'Euro (€ - EUR)',
    symbol: '€',
    rateFromIdr: 19500,
    decimals: 2,
    placeholder: 'Contoh: 1.25',
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen (¥ - JPY)',
    symbol: '¥',
    rateFromIdr: 116,
    decimals: 0,
    placeholder: 'Contoh: 150',
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan / Yen Cina (¥ - CNY)',
    symbol: '¥',
    rateFromIdr: 2500,
    decimals: 2,
    placeholder: 'Contoh: 6.00',
  },
  SAR: {
    code: 'SAR',
    name: 'Saudi Riyal / Riyadh (SR - SAR)',
    symbol: 'SR',
    rateFromIdr: 4800,
    decimals: 2,
    placeholder: 'Contoh: 3.50',
  },
  AED: {
    code: 'AED',
    name: 'Dirham UEA / Arab (AED - AED)',
    symbol: 'AED',
    rateFromIdr: 4900,
    decimals: 2,
    placeholder: 'Contoh: 3.50',
  },
};

export function getActiveCurrency(): CurrencyConfig {
  let raw = '';
  try {
    raw = useStore.getState().currency;
  } catch (e) {}
  if (!raw && typeof window !== 'undefined') {
    raw = localStorage.getItem('sg_currency') || '';
  }
  if (raw.includes('USD') || (raw.includes('$') && !raw.includes('S$'))) return CURRENCIES.USD;
  if (raw.includes('SGD') || raw.includes('S$')) return CURRENCIES.SGD;
  if (raw.includes('EUR') || raw.includes('€')) return CURRENCIES.EUR;
  if (raw.includes('CNY') || raw.includes('Cina') || raw.includes('Yuan')) return CURRENCIES.CNY;
  if (raw.includes('JPY') || raw.includes('Japanese') || raw.includes('Yen')) return CURRENCIES.JPY;
  if (raw.includes('SAR') || raw.includes('Riyadh') || raw.includes('Riyal')) return CURRENCIES.SAR;
  if (raw.includes('AED') || raw.includes('Dirham')) return CURRENCIES.AED;
  return CURRENCIES.IDR;
}

export function convertIdrToCurrency(valueInIdr: number, currencyCode?: string): number {
  if (isNaN(valueInIdr) || valueInIdr === null || valueInIdr === undefined) return 0;
  const curr = currencyCode && CURRENCIES[currencyCode] ? CURRENCIES[currencyCode] : getActiveCurrency();
  const converted = valueInIdr / curr.rateFromIdr;
  return curr.decimals > 0 ? Number(converted.toFixed(curr.decimals)) : Math.round(converted);
}

export function convertCurrencyToIdr(valueInCurrency: number, currencyCode?: string): number {
  if (isNaN(valueInCurrency) || valueInCurrency === null || valueInCurrency === undefined) return 0;
  const curr = currencyCode && CURRENCIES[currencyCode] ? CURRENCIES[currencyCode] : getActiveCurrency();
  return Math.round(valueInCurrency * curr.rateFromIdr);
}

export function formatRupiah(valueInIdr: number): string {
  const curr = getActiveCurrency();
  const spacer = curr.symbol.length > 2 || curr.symbol === 'SR' ? ' ' : '';

  if (isNaN(valueInIdr) || valueInIdr === null || valueInIdr === undefined) {
    return `${curr.symbol}${spacer}0${curr.decimals > 0 ? '.00' : ''}`;
  }

  const isNegative = valueInIdr < 0;
  const absValueInIdr = Math.abs(valueInIdr);
  const converted = absValueInIdr / curr.rateFromIdr;

  let formatted = '';
  if (curr.decimals === 0) {
    const rounded = Math.round(converted);
    formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  } else {
    const fixed = converted.toFixed(curr.decimals);
    const [intPart, decPart] = fixed.split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    formatted = `${formattedInt}.${decPart}`;
  }

  return isNegative ? `-${curr.symbol}${spacer}${formatted}` : `${curr.symbol}${spacer}${formatted}`;
}

export function parseRupiah(input: string): number {
  if (!input) return 0;
  const cleaned = input.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : convertCurrencyToIdr(parsed);
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
