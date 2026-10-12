import { describe, it, expect } from 'vitest';
import { comparePrices } from '../utils/priceComparison';

describe('F-04: Last Month Price Comparator', () => {
  it('Rp12.000 menjadi Rp15.000 menunjukkan kenaikan 25% (status up)', () => {
    // Current: 15.000, Previous: 12.000
    // Selisih: 15.000 - 12.000 = +3.000
    // Persentase: 3.000 / 12.000 * 100 = 25%
    const res = comparePrices(15000, 12000, 'kg', 'kg');
    expect(res.hasPreviousData).toBe(true);
    expect(res.status).toBe('up');
    expect(res.difference).toBe(3000);
    expect(res.percentageChange).toBe(25);
    expect(res.previousPrice).toBe(12000);
  });

  it('Rp12.000 menjadi Rp9.000 menunjukkan penurunan 25% (status down)', () => {
    // Current: 9.000, Previous: 12.000
    // Selisih: 9.000 - 12.000 = -3.000
    // Persentase: -3.000 / 12.000 * 100 = -25% (absolute 25%)
    const res = comparePrices(9000, 12000, 'kg', 'kg');
    expect(res.hasPreviousData).toBe(true);
    expect(res.status).toBe('down');
    expect(res.difference).toBe(-3000);
    expect(res.percentageChange).toBe(25);
    expect(res.previousPrice).toBe(12000);
  });

  it('Harga sama menunjukkan status stabil (status equal)', () => {
    const res = comparePrices(12000, 12000, 'kg', 'kg');
    expect(res.hasPreviousData).toBe(true);
    expect(res.status).toBe('equal');
    expect(res.difference).toBe(0);
    expect(res.percentageChange).toBe(0);
  });

  it('Tidak ada data sebelumnya menunjukkan status netral (status no_data)', () => {
    const resNull = comparePrices(15000, null, 'kg', 'kg');
    expect(resNull.hasPreviousData).toBe(false);
    expect(resNull.status).toBe('no_data');

    const resUndefined = comparePrices(15000, undefined, 'kg', 'kg');
    expect(resUndefined.hasPreviousData).toBe(false);
    expect(resUndefined.status).toBe('no_data');

    const resZero = comparePrices(15000, 0, 'kg', 'kg');
    expect(resZero.hasPreviousData).toBe(false);
    expect(resZero.status).toBe('no_data');
  });

  it('Menolak komparasi unit yang tidak sebanding (misal kg vs pack)', () => {
    const res = comparePrices(15000, 12000, 'kg', 'pack');
    expect(res.hasPreviousData).toBe(false);
    expect(res.status).toBe('no_data');
  });
});
