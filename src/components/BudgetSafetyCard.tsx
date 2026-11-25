import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, TrendingDown, Edit3, CreditCard, Info } from 'lucide-react';
import { formatRupiah } from '../utils/currency';
import type { BudgetStatus } from '../types';
import { useStore } from '../store/useStore';
import { getShortPaymentName } from '../data/paymentMethods';
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
  const { language, currency, selectedPaymentMethod, openPaymentModal } = useStore();
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

      {/* Panduan Batas Anggaran Box with 3-Zone Indicator Bar */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-700/60">
        <div className="bg-slate-50/90 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3 sm:p-3.5 space-y-2.5">
          {/* Header dengan Ikon Info (i) Berwarna Biru */}
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <Info className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <h4 className="text-xs font-bold text-text-main dark:text-slate-100 tracking-tight">
              {language === 'zh'
                ? '预算上限指南：'
                : language === 'en'
                ? 'Budget Limit Guide:'
                : 'Panduan Batas Anggaran:'}
            </h4>
          </div>

          {/* 3 Poin Keterangan Warna dengan Teks Berwarna Senada */}
          <div className="space-y-1.5 text-[11px] leading-relaxed pl-0.5">
            <div className="flex items-start gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
              <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                <strong className="font-bold">
                  {language === 'zh' ? '绿色 (< 70%):' : language === 'en' ? 'Green (< 70%):' : 'Hijau (< 70%):'}
                </strong>{' '}
                {language === 'zh'
                  ? '安全，适合额外需求。'
                  : language === 'en'
                  ? 'Safe for additional essentials.'
                  : 'Aman untuk kebutuhan tambahan.'}
              </p>
            </div>

            <div className="flex items-start gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
              <p className="text-amber-700 dark:text-amber-400 font-medium">
                <strong className="font-bold">
                  {language === 'zh' ? '黄色 (70% - 89%):' : language === 'en' ? 'Yellow (70% - 89%):' : 'Kuning (70% - 89%):'}
                </strong>{' '}
                {language === 'zh'
                  ? '警戒，限制非必需品或零食。'
                  : language === 'en'
                  ? 'Caution, limit tertiary goods/snacks.'
                  : 'Waspada, batasi barang tersier/camilan.'}
              </p>
            </div>

            <div className="flex items-start gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
              <p className="text-rose-700 dark:text-rose-400 font-medium">
                <strong className="font-bold">
                  {language === 'zh' ? '红色 (≥ 90%):' : language === 'en' ? 'Red (≥ 90%):' : 'Merah (≥ 90%):'}
                </strong>{' '}
                {language === 'zh'
                  ? '危急，立即重新核对购物车商品。'
                  : language === 'en'
                  ? 'Critical, review items in cart immediately.'
                  : 'Kritis, segera cek ulang barang di troli.'}
              </p>
            </div>
          </div>

          {/* Visual Bar Indikator 3 Zona (Safe - Warn - Danger) */}
          <div className="pt-1 space-y-1">
            {/* Horizontal Multi-segment Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-200 dark:bg-slate-700 shadow-inner p-0.5 gap-0.5">
              <div
                style={{ width: '70%' }}
                className="bg-emerald-500 h-full rounded-l-full transition-all"
                title="Safe (< 70%)"
              />
              <div
                style={{ width: '20%' }}
                className="bg-amber-400 h-full transition-all"
                title="Warn (70% - 89%)"
              />
              <div
                style={{ width: '10%' }}
                className="bg-rose-500 h-full rounded-r-full transition-all"
                title="Danger (≥ 90%)"
              />
            </div>

            {/* Labels Sejajar dengan Segmen Warna */}
            <div className="w-full flex text-[10px] font-extrabold tracking-wider uppercase pt-0.5 select-none">
              <div style={{ width: '70%' }} className="text-emerald-600 dark:text-emerald-400 pl-1 text-left">
                Safe
              </div>
              <div style={{ width: '20%' }} className="text-amber-600 dark:text-amber-400 text-center">
                Warn
              </div>
              <div style={{ width: '10%' }} className="text-rose-600 dark:text-rose-400 pr-1 text-right">
                Danger
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
