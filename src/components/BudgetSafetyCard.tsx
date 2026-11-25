import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, TrendingDown, Edit3, CreditCard } from 'lucide-react';
import { formatRupiah } from '../utils/currency';
import type { BudgetStatus } from '../types';
import { useStore } from '../store/useStore';
import { getShortPaymentName } from '../data/paymentMethods';
import { t, getBudgetZoneLabels, getBudgetZoneTooltip } from '../utils/i18n';

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
  const { language, currency, selectedPaymentMethod, openPaymentModal } = useStore();
  const { limit, activeTotal, remaining, percentage, level, excessAmount } = budgetStatus;
  const isRedLevel = limit > 0 && (level === 'danger' || level === 'exceeded' || remaining <= 10000);
  const isYellowLevel = limit > 0 && !isRedLevel && level === 'warning';

  const [activeZoneTooltip, setActiveZoneTooltip] = useState<'safe' | 'warn' | 'danger' | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleZoneClick = (zone: 'safe' | 'warn' | 'danger') => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    if (activeZoneTooltip === zone) {
      setActiveZoneTooltip(null);
      return;
    }
    setActiveZoneTooltip(zone);
    tooltipTimeoutRef.current = setTimeout(() => {
      setActiveZoneTooltip(null);
    }, 2800);
  };

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, []);

  const zoneLabels = getBudgetZoneLabels(language);

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
      {/* Top Banner Alert, Payment Bank Badge, & Edit Budget Button */}
      <div className="flex items-center justify-between gap-1.5 mb-2.5 min-w-0 max-w-full">
        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold border whitespace-nowrap min-w-0 max-w-[45%] sm:max-w-[50%] tracking-tight leading-tight ${theme.badgeBg}`}
        >
          <StatusIcon className="w-3 h-3 flex-shrink-0" />
          <span className="whitespace-nowrap truncate">{localizedMessage}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Payment Bank Badge Button (Dipindahkan dari Header Kanan Atas) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openPaymentModal();
            }}
            className="bg-white dark:bg-slate-700 text-blue-800 dark:text-blue-100 border border-blue-200/90 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-650 active:scale-95 font-extrabold text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1 rounded-xl shadow-2xs transition-all flex items-center gap-1 min-h-[30px] sm:min-h-[32px] cursor-pointer whitespace-nowrap"
            title={`${t('paymentSource', language)} (${selectedPaymentMethod})`}
          >
            <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 dark:text-blue-300 flex-shrink-0" />
            <span className="truncate max-w-[55px] sm:max-w-[75px]">{getShortPaymentName(selectedPaymentMethod, language)}</span>
          </button>

          {onEditBudget && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditBudget();
              }}
              className="flex items-center gap-1 text-[10.5px] sm:text-[11px] font-semibold text-text-secondary dark:text-slate-300 hover:text-primary dark:hover:text-blue-400 px-1.5 sm:px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors min-h-[30px] sm:min-h-[32px] flex-shrink-0 cursor-pointer"
              title={t('setLimit', language)}
            >
              <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{t('setLimit', language)}</span>
            </button>
          )}
        </div>
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

      {/* 3-Zone Timeline Bar (Hijau, Kuning, Merah) */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-700/60 relative">
        {/* Temporary Percentage Range Badge / Tooltip on Click */}
        {activeZoneTooltip && (
          <div className="flex justify-center mb-1.5 animate-fade-in">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs transition-all border ${
                activeZoneTooltip === 'safe'
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  : activeZoneTooltip === 'warn'
                  ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeZoneTooltip === 'safe'
                    ? 'bg-emerald-500'
                    : activeZoneTooltip === 'warn'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              <span>{getBudgetZoneTooltip(activeZoneTooltip, language)}</span>
            </div>
          </div>
        )}

        {/* Horizontal Multi-segment Interactive Timeline Bar */}
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-200 dark:bg-slate-700 shadow-inner p-0.5 gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleZoneClick('safe');
            }}
            style={{ width: '70%' }}
            className={`bg-emerald-500 h-full rounded-l-full transition-all cursor-pointer hover:opacity-90 active:scale-y-95 ${
              activeZoneTooltip === 'safe' ? 'ring-2 ring-emerald-300 dark:ring-emerald-400' : ''
            }`}
            title={`${zoneLabels.safe}: < 70%`}
            aria-label={`${zoneLabels.safe}: < 70%`}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleZoneClick('warn');
            }}
            style={{ width: '20%' }}
            className={`bg-amber-400 h-full transition-all cursor-pointer hover:opacity-90 active:scale-y-95 ${
              activeZoneTooltip === 'warn' ? 'ring-2 ring-amber-300 dark:ring-amber-400' : ''
            }`}
            title={`${zoneLabels.warn}: 70% - 89%`}
            aria-label={`${zoneLabels.warn}: 70% - 89%`}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleZoneClick('danger');
            }}
            style={{ width: '10%' }}
            className={`bg-rose-500 h-full rounded-r-full transition-all cursor-pointer hover:opacity-90 active:scale-y-95 ${
              activeZoneTooltip === 'danger' ? 'ring-2 ring-rose-300 dark:ring-rose-400' : ''
            }`}
            title={`${zoneLabels.danger}: ≥ 90%`}
            aria-label={`${zoneLabels.danger}: ≥ 90%`}
          />
        </div>

        {/* Labels Sejajar dengan Segmen Warna (Anti-mepet tepi kanan di mobile) */}
        <div className="w-full flex text-[10px] font-extrabold tracking-wider uppercase pt-0.5 select-none px-1">
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleZoneClick('safe');
            }}
            style={{ width: '60%' }}
            className="text-emerald-600 dark:text-emerald-400 text-left pl-0.5 truncate cursor-pointer hover:underline"
          >
            {zoneLabels.safe}
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleZoneClick('warn');
            }}
            style={{ width: '24%' }}
            className="text-amber-600 dark:text-amber-400 text-center truncate cursor-pointer hover:underline"
          >
            {zoneLabels.warn}
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleZoneClick('danger');
            }}
            style={{ width: '16%' }}
            className="text-rose-600 dark:text-rose-400 text-right pr-0.5 sm:pr-1 whitespace-nowrap cursor-pointer hover:underline"
          >
            {zoneLabels.danger}
          </div>
        </div>
      </div>
    </div>
  );
};
