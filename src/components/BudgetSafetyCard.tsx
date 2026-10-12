import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, TrendingDown, Edit3 } from 'lucide-react';
import { formatRupiah } from '../utils/currency';
import type { BudgetStatus } from '../types';

interface BudgetSafetyCardProps {
  budgetStatus: BudgetStatus;
  itemCount: number;
  totalSavings: number;
  onEditBudget?: () => void;
}

export const BudgetSafetyCard: React.FC<BudgetSafetyCardProps> = ({
  budgetStatus,
  itemCount,
  totalSavings,
  onEditBudget,
}) => {
  const { limit, activeTotal, remaining, percentage, level, message, excessAmount } = budgetStatus;

  // Determine color scheme based on level
  let theme = {
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    barBg: 'bg-success',
    icon: ShieldCheck,
    cardBorder: 'border-emerald-100 dark:border-slate-700/80',
    accentText: 'text-success dark:text-emerald-400',
  };

  if (level === 'warning') {
    theme = {
      badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      barBg: 'bg-warning',
      icon: AlertTriangle,
      cardBorder: 'border-amber-200 dark:border-amber-800/80',
      accentText: 'text-warning dark:text-amber-400',
    };
  } else if (level === 'danger') {
    theme = {
      badgeBg: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
      barBg: 'bg-danger',
      icon: AlertOctagon,
      cardBorder: 'border-red-200 dark:border-red-800/80',
      accentText: 'text-danger dark:text-rose-400',
    };
  } else if (level === 'exceeded') {
    theme = {
      badgeBg: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800 animate-pulse',
      barBg: 'bg-danger',
      icon: AlertOctagon,
      cardBorder: 'border-rose-300 dark:border-rose-800 ring-2 ring-rose-200 dark:ring-rose-900',
      accentText: 'text-danger dark:text-rose-400',
    };
  }

  const StatusIcon = theme.icon;
  const clampedProgress = Math.min(100, Math.max(0, percentage));

  return (
    <div
      className={`bg-card dark:bg-slate-800/90 rounded-card p-4 shadow-soft border ${theme.cardBorder} transition-all duration-200 relative overflow-hidden`}
    >
      {/* Top Banner Alert & Edit Budget Button */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${theme.badgeBg}`}
        >
          <StatusIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{message}</span>
        </div>

        {onEditBudget && (
          <button
            type="button"
            onClick={onEditBudget}
            className="flex items-center gap-1 text-[11px] font-medium text-text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors min-h-[36px]"
            title="Ubah Anggaran"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Atur Batas</span>
          </button>
        )}
      </div>

      {/* Main Budget Numbers Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <span className="text-[11px] font-medium text-text-secondary dark:text-slate-400 block">
            Total Belanja di Troli
          </span>
          <span className="text-xl font-extrabold text-text-main dark:text-slate-100 tracking-tight">
            {formatRupiah(activeTotal)}
          </span>
          <span className="text-[11px] text-text-secondary dark:text-slate-400 block mt-0.5">
            {itemCount} barang dalam troli
          </span>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-medium text-text-secondary dark:text-slate-400 block">
            {level === 'exceeded' ? 'Kelebihan Anggaran' : 'Sisa Saldo Aman'}
          </span>
          <span
            className={`text-xl font-extrabold tracking-tight ${
              level === 'exceeded'
                ? 'text-danger dark:text-rose-400'
                : 'text-success dark:text-emerald-400'
            }`}
          >
            {level === 'exceeded' ? `+${formatRupiah(excessAmount)}` : formatRupiah(remaining)}
          </span>
          <span className="text-[11px] text-text-secondary dark:text-slate-400 block mt-0.5">
            dari limit {formatRupiah(limit)}
          </span>
        </div>
      </div>

      {/* Dynamic Animated Progress Bar */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between items-center text-[11px] font-semibold text-text-secondary dark:text-slate-400">
          <span>Penggunaan Anggaran</span>
          <span className={theme.accentText}>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${theme.barBg}`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>

      {/* Savings & Safety Insight Footer */}
      {totalSavings > 0 && (
        <div className="flex items-center justify-between text-xs bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100/70 dark:border-emerald-800/60 rounded-xl px-2.5 py-1.5 mt-2">
          <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-300 font-medium">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Total Hemat Diskon:
          </span>
          <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatRupiah(totalSavings)}</span>
        </div>
      )}
    </div>
  );
};
