import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, TrendingDown, Edit3 } from 'lucide-react';
import { formatRupiah } from '../utils/currency';
import type { BudgetStatus } from '../types';
import { useStore } from '../store/useStore';
import { t } from '../utils/i18n';

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
  const { language, currency } = useStore();
  const { limit, activeTotal, remaining, percentage, level, excessAmount } = budgetStatus;
  const isRedLevel = limit > 0 && (level === 'danger' || level === 'exceeded' || remaining <= 10000);
  const isYellowLevel = limit > 0 && !isRedLevel && level === 'warning';

  const localizedMessage =
    limit === 0
      ? (language === 'zh'
          ? '尚未设置预算上限'
          : language === 'en'
          ? 'Budget limit not set yet'
          : 'Batas anggaran belum ditentukan')
      : level === 'safe'
      ? t('statusSafeMsg', language)
      : isYellowLevel
        ? t('statusWarningMsg', language)
        : isRedLevel && level !== 'exceeded'
          ? t('statusDangerMsg', language)
          : t('statusExceededMsg', language, { amount: formatRupiah(excessAmount) });

  // Determine color scheme based on level
  let theme = {
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    barBg: 'bg-success',
    icon: ShieldCheck,
    cardBorder: 'border-emerald-100 dark:border-slate-700/80',
    accentText: 'text-success dark:text-emerald-400',
  };

  if (isYellowLevel) {
    theme = {
      badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      barBg: 'bg-warning',
      icon: AlertTriangle,
      cardBorder: 'border-amber-200 dark:border-amber-800/80',
      accentText: 'text-warning dark:text-amber-400',
    };
  } else if (isRedLevel) {
    theme = {
      badgeBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      barBg: 'bg-danger',
      icon: level === 'exceeded' ? AlertOctagon : AlertTriangle,
      cardBorder: 'border-rose-200 dark:border-rose-800/80',
      accentText: 'text-danger dark:text-rose-400',
    };
  }

  const StatusIcon = theme.icon;
  const clampedProgress = Math.min(100, Math.max(0, percentage));

  return (
    <div
      className={`bg-card dark:bg-slate-800/90 rounded-card p-4 shadow-soft border ${theme.cardBorder} transition-all duration-200 relative overflow-hidden w-full max-w-full min-w-0 box-border`}
    >
      {/* Top Banner Alert & Edit Budget Button */}
      <div className="flex items-center justify-between gap-1.5 mb-2.5 min-w-0 max-w-full">
        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold border whitespace-nowrap min-w-0 max-w-[calc(100%-80px)] tracking-tight leading-tight ${theme.badgeBg}`}
        >
          <StatusIcon className="w-3 h-3 flex-shrink-0" />
          <span className="whitespace-nowrap truncate">{localizedMessage}</span>
        </div>

        {onEditBudget && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditBudget();
            }}
            className="flex items-center gap-1 text-[11px] font-medium text-text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors min-h-[36px] flex-shrink-0"
            title={t('setLimit', language)}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t('setLimit', language)}</span>
          </button>
        )}
      </div>

      {/* Main Budget Numbers Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <span className="text-[11px] font-medium text-text-secondary dark:text-slate-400 block">
            {t('activeCartSpending', language)}
          </span>
          <span className="text-xl font-extrabold text-text-main dark:text-slate-100 tracking-tight">
            {formatRupiah(activeTotal)}
          </span>
          <span className="text-[11px] text-text-secondary dark:text-slate-400 block mt-0.5">
            {t('activeCartItems', language, { count: itemCount })}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-medium text-text-secondary dark:text-slate-400 block">
            {level === 'exceeded' ? t('overBudgetCap', language) : t('safeBalance', language)}
          </span>
          <span
            className={`text-xl font-extrabold tracking-tight ${isRedLevel
                ? 'text-danger dark:text-rose-400'
                : 'text-success dark:text-emerald-400'
              }`}
          >
            {level === 'exceeded' ? `+${formatRupiah(excessAmount)}` : formatRupiah(remaining)}
          </span>
          <span className="text-[11px] text-text-secondary dark:text-slate-400 block mt-0.5">
            {t('fromLimit', language, { limit: formatRupiah(limit) })}
          </span>
        </div>
      </div>

      {/* Dynamic Animated Progress Bar */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between items-center text-[11px] font-semibold text-text-secondary dark:text-slate-400">
          <span>{t('budgetUsage', language)}</span>
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
            {t('discountSavings', language)}
          </span>
          <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatRupiah(totalSavings)}</span>
        </div>
      )}
    </div>
  );
};
