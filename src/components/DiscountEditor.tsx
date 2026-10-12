import React from 'react';
import { Plus, Trash2, Tag, Percent } from 'lucide-react';
import { calculateTieredDiscount } from '../utils/discount';
import { formatRupiah } from '../utils/currency';

interface DiscountEditorProps {
  basePrice: number;
  discounts: number[];
  onChange: (discounts: number[]) => void;
}

export const DiscountEditor: React.FC<DiscountEditorProps> = ({
  basePrice,
  discounts,
  onChange,
}) => {
  const result = calculateTieredDiscount(basePrice, discounts);

  const handleAddTier = () => {
    onChange([...discounts, 10]);
  };

  const handleUpdateTier = (index: number, value: number) => {
    const clamped = Math.min(100, Math.max(0, isNaN(value) ? 0 : value));
    const next = [...discounts];
    next[index] = clamped;
    onChange(next);
  };

  const handleRemoveTier = (index: number) => {
    const next = discounts.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleAddPreset = (percent: number) => {
    if (discounts.length === 0) {
      onChange([percent]);
    } else {
      onChange([...discounts, percent]);
    }
  };

  return (
    <div className="bg-gray-50/80 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-border dark:border-slate-700 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-main dark:text-slate-200">
          <Tag className="w-3.5 h-3.5 text-primary dark:text-blue-400" />
          <span>Diskon Promosi (Bisa Bertingkat)</span>
        </div>
        <button
          type="button"
          onClick={handleAddTier}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary dark:text-blue-400 hover:text-primary-hover px-2.5 py-1 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 rounded-lg transition-colors min-h-[36px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Tahap Diskon</span>
        </button>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-1.5">
        {[5, 10, 15, 20, 25, 30, 50].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handleAddPreset(preset)}
            className="text-[11px] font-medium px-2 py-1 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-600 rounded-md hover:border-primary hover:text-primary dark:hover:text-blue-400 transition-colors active:scale-95 min-h-[32px]"
          >
            +{preset}%
          </button>
        ))}
        {discounts.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] font-medium px-2 py-1 bg-red-50 dark:bg-rose-950/70 text-danger dark:text-rose-300 border border-red-200 dark:border-rose-900 rounded-md hover:bg-red-100 transition-colors active:scale-95 min-h-[32px]"
          >
            Hapus Semua
          </button>
        )}
      </div>

      {/* Discount Tiers List */}
      {discounts.length === 0 ? (
        <p className="text-xs text-text-secondary dark:text-slate-400 italic">
          Belum ada diskon diterapkan untuk barang ini.
        </p>
      ) : (
        <div className="space-y-2">
          {discounts.map((discount, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-white dark:bg-slate-750 p-2 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold">
                {idx + 1}
              </div>

              <div className="relative flex-1">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="100"
                  value={discount === 0 ? '' : discount}
                  placeholder="0"
                  onChange={(e) => handleUpdateTier(idx, parseFloat(e.target.value) || 0)}
                  className="w-full text-right font-bold text-sm pr-7 pl-2 py-1.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none min-h-[40px]"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 font-semibold text-xs pointer-events-none">
                  %
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveTier(idx)}
                className="p-2 text-gray-400 dark:text-slate-400 hover:text-danger dark:hover:text-rose-400 rounded-lg hover:bg-red-50 dark:hover:bg-rose-950 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label={`Hapus tahap ${idx + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tiered Calculation Breakdown Card */}
      {discounts.length > 0 && basePrice > 0 && (
        <div className="bg-blue-50/70 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 text-xs space-y-1.5">
          <div className="flex justify-between items-center text-gray-600 dark:text-slate-300">
            <span>Harga Awal Kotor:</span>
            <span className="font-semibold">{formatRupiah(basePrice)}</span>
          </div>

          {result.tiers.length > 1 && (
            <div className="border-t border-blue-200/50 dark:border-blue-800/40 pt-1 space-y-1">
              {result.tiers.map((t) => (
                <div key={t.tierIndex} className="flex justify-between text-[11px] text-gray-500 dark:text-slate-400">
                  <span>
                    Tahap {t.tierIndex} (-{t.discountPercent}%):
                  </span>
                  <span>
                    {formatRupiah(t.beforeTierPrice)} → {formatRupiah(t.afterTierPrice)} (hemat{' '}
                    {formatRupiah(t.savedAmount)})
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center text-success dark:text-emerald-400 font-semibold border-t border-blue-200/60 dark:border-blue-800/40 pt-1">
            <span className="flex items-center gap-1">
              <Percent className="w-3.5 h-3.5" />
              Diskon Efektif ({result.effectiveDiscountPercent}%):
            </span>
            <span>Hemat {formatRupiah(result.totalSavings)}</span>
          </div>

          <div className="flex justify-between items-center text-text-main dark:text-slate-100 font-bold text-sm pt-0.5">
            <span>Harga Akhir:</span>
            <span className="text-primary dark:text-blue-400">{formatRupiah(result.finalPrice)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
