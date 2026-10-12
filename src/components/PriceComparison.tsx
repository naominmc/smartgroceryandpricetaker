import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, HelpCircle } from 'lucide-react';
import { comparePrices } from '../utils/priceComparison';
import { formatRupiah } from '../utils/currency';

interface PriceComparisonProps {
  currentPrice: number;
  previousPrice?: number | null;
  unit?: string;
}

export const PriceComparison: React.FC<PriceComparisonProps> = ({
  currentPrice,
  previousPrice,
  unit = 'pcs',
}) => {
  const result = comparePrices(currentPrice, previousPrice, unit, unit);

  if (!result.hasPreviousData) {
    return (
      <div className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-full">
        <HelpCircle className="w-3 h-3 text-gray-400 dark:text-slate-500" />
        <span>Bulan lalu: Belum ada data</span>
      </div>
    );
  }

  if (result.status === 'up') {
    return (
      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-danger dark:text-rose-300 bg-red-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-red-100 dark:border-rose-900">
        <ArrowUpRight className="w-3.5 h-3.5 text-danger dark:text-rose-400 stroke-[2.5]" />
        <span>
          Naik {result.percentageChange}% (Bulan lalu {formatRupiah(result.previousPrice || 0)})
        </span>
      </div>
    );
  }

  if (result.status === 'down') {
    return (
      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-success dark:text-emerald-300 bg-green-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-green-100 dark:border-emerald-900">
        <ArrowDownRight className="w-3.5 h-3.5 text-success dark:text-emerald-400 stroke-[2.5]" />
        <span>
          Turun {result.percentageChange}% (Bulan lalu {formatRupiah(result.previousPrice || 0)})
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
      <Minus className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400 stroke-[2.5]" />
      <span>Harga stabil ({formatRupiah(result.previousPrice || 0)})</span>
    </div>
  );
};
