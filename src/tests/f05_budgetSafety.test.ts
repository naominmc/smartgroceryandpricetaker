import { describe, it, expect } from 'vitest';
import { evaluateBudgetSafety } from '../utils/calculations';

describe('F-05: Budget Safety Cap Evaluation', () => {
  const limit = 1000000;

  it('Belanja Rp500.000 (50%) menunjukkan status aman', () => {
    const status = evaluateBudgetSafety(limit, 500000);
    expect(status.level).toBe('safe');
    expect(status.percentage).toBe(50);
    expect(status.remaining).toBe(500000);
    expect(status.excessAmount).toBe(0);
    expect(status.message).toBe('Anggaran masih aman');
  });

  it('Anggaran Rp1.000.000 dengan belanja Rp700.000 menunjukkan status waspada (kuning)', () => {
    const status = evaluateBudgetSafety(limit, 700000);
    expect(status.level).toBe('warning');
    expect(status.percentage).toBe(70);
    expect(status.remaining).toBe(300000);
    expect(status.excessAmount).toBe(0);
    expect(status.message).toBe('Hati-hati, anggaran mulai menipis.');
  });

  it('Belanja Rp900.000 (90%) menunjukkan status waspada / mendekati batas maksimum', () => {
    const status = evaluateBudgetSafety(limit, 900000);
    expect(status.level).toBe('danger');
    expect(status.percentage).toBe(90);
    expect(status.remaining).toBe(100000);
    expect(status.excessAmount).toBe(0);
    expect(status.message).toBe('Peringatan Waspada: Belanja mendekati batas saldo dompet.');
  });

  it('Belanja Rp1.050.000 menunjukkan kelebihan Rp50.000 (exceeded)', () => {
    const status = evaluateBudgetSafety(limit, 1050000);
    expect(status.level).toBe('exceeded');
    expect(status.percentage).toBe(105);
    expect(status.remaining).toBe(-50000);
    expect(status.excessAmount).toBe(50000);
    expect(status.message).toBe('Total belanja melebihi batas saldo dompet! Kurangi kuantitas atau batalkan barang sekunder.');
  });

  it('Anggaran nol ditangani dengan aman tanpa pembagian dengan nol', () => {
    const status = evaluateBudgetSafety(0, 50000);
    expect(status.limit).toBe(0);
    expect(status.percentage).toBe(0);
    expect(status.message).toBe('Batas anggaran belum ditentukan.');
  });
});
