import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Wallet,
  ShieldCheck,
  AlertTriangle,
  PieChart,
  Calendar,
  Save,
  CheckCircle,
  Info,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import { db } from '../db/database';
import { groceryService } from '../services/groceryService';
import { useStore } from '../store/useStore';
import { PaymentMethodSelectorModal } from '../components/PaymentMethodSelectorModal';
import type { BudgetStatus } from '../types';
import { PRODUCT_CATEGORIES } from '../types';
import { calculateCartTotals, evaluateBudgetSafety } from '../utils/calculations';
import { formatRupiah, getActiveCurrency, formatNumberWithDots } from '../utils/currency';
import { formatPeriodLabel, getCurrentMonthPeriod } from '../utils/priceComparison';
import { t, translateCategory } from '../utils/i18n';

export const BudgetPage: React.FC = () => {
  const { username, selectedPaymentMethod, language, currency } = useStore();
  const [currentPeriod] = useState(getCurrentMonthPeriod());
  const [budgetLimitInput, setBudgetLimitInput] = useState('1200000');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Load active cart and budget record
  const cartItems = useLiveQuery(() => db.cartItems.toArray()) || [];
  const budgetRecord = useLiveQuery(() => db.budgets.where('period').equals(currentPeriod).first());
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];

  useEffect(() => {
    if (budgetRecord) {
      setBudgetLimitInput(budgetRecord.limit.toString());
    }
  }, [budgetRecord]);

  const activeTotals = calculateCartTotals(cartItems);
  const currentLimit = budgetRecord ? budgetRecord.limit : 1200000;
  const budgetStatus: BudgetStatus = evaluateBudgetSafety(
    currentLimit,
    activeTotals.finalTotal,
    activeTotals.discountTotal
  );

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (budgetLimitInput.includes('-')) {
      setErrorMessage(
        language === 'zh'
          ? '预算上限不能为负数！'
          : language === 'en'
          ? 'Budget limit cannot be negative!'
          : 'Batas anggaran tidak boleh bernilai negatif!'
      );
      return;
    }
    const parsed = parseInt(budgetLimitInput.replace(/\D/g, ''), 10) || 0;
    if (parsed < 0) {
      setErrorMessage(
        language === 'zh'
          ? '预算上限不能为负数！'
          : language === 'en'
          ? 'Budget limit cannot be negative!'
          : 'Batas anggaran tidak boleh bernilai negatif!'
      );
      return;
    }
    await groceryService.setBudget(currentPeriod, parsed);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Category breakdown calculation for active items
  const categorySpending: Record<string, number> = {};
  for (const cat of PRODUCT_CATEGORIES) {
    categorySpending[cat] = 0;
  }
  for (const item of cartItems) {
    const subtotal = item.quantity * item.unitPrice; // approximate gross
    categorySpending[item.categorySnapshot] =
      (categorySpending[item.categorySnapshot] || 0) + subtotal;
  }

  const activeCategoriesWithSpending = Object.entries(categorySpending)
    .filter(([_, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  // Group historical spending by period
  const historyByPeriod: Record<string, number> = {};
  for (const tx of transactions) {
    historyByPeriod[tx.period] = (historyByPeriod[tx.period] || 0) + tx.finalTotal;
  }
  const historicalPeriods = Object.entries(historyByPeriod).sort().reverse();

  return (
    <div className="space-y-4 pb-3">
      {/* Header */}
      <div className="pt-1">
        <span className="text-xs text-text-secondary dark:text-slate-400 font-medium block">
          {formatPeriodLabel(currentPeriod, language)} • {username}
        </span>
        <h1 className="text-xl font-extrabold text-text-main dark:text-slate-100 tracking-tight">
          {t('budgetLimitTitle', language)}
        </h1>
      </div>

      {/* Payment Storage / Bank BCA Selector Card */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 dark:from-slate-800 dark:to-blue-950 text-white rounded-card p-4 shadow-soft space-y-2.5 border dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-blue-500/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white dark:text-blue-300" />
            </div>
            <div>
              <span className="text-[10px] text-blue-200 dark:text-blue-300 block">{t('paymentSourceLabel', language)}</span>
              <h3 className="font-extrabold text-sm text-white">{selectedPaymentMethod}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="text-xs font-bold bg-white dark:bg-blue-600 text-blue-800 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-700 px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1 min-h-[36px] cursor-pointer"
          >
            <span>{t('changeBtn', language)}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Budget Limit Config Form */}
      <div className="bg-card dark:bg-slate-800/90 rounded-card p-4 border border-border dark:border-slate-700 shadow-soft space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/80 text-primary dark:text-blue-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-text-main dark:text-slate-100">{t('budgetLimitTitle', language)}</h2>
            <p className="text-[11px] text-text-secondary dark:text-slate-400">
              {t('budgetDesc', language)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveBudget} className="space-y-3">
          <div className="space-y-1.5">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-gray-400 dark:text-slate-500">
                {getActiveCurrency().symbol}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={formatNumberWithDots(budgetLimitInput)}
                onChange={(e) => {
                  const rawDigits = e.target.value.replace(/\D/g, '');
                  setBudgetLimitInput(rawDigits);
                }}
                placeholder="1.200.000"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 font-bold text-base outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </div>
            {errorMessage && (
              <p className="text-xs text-danger font-semibold px-0.5 animate-fade-in">
                {errorMessage}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-soft transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{t('saveBudgetBtn', language)}</span>
          </button>
        </form>

        {isSaved && (
          <div className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 text-xs font-semibold p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{t('budgetSavedToast', language)}</span>
          </div>
        )}
      </div>

      {/* Safety Status Analysis Card */}
      <div className="bg-card dark:bg-slate-800/90 rounded-card p-4 border border-border dark:border-slate-700 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-text-main dark:text-slate-100">
            {t('budgetAnalysisTitle', language)}
          </h3>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              budgetStatus.level === 'safe'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : budgetStatus.level === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                : 'bg-red-50 dark:bg-rose-950 text-danger dark:text-rose-300'
            }`}
          >
            {t('percentUsed', language, { percentage: budgetStatus.percentage })}
          </span>
        </div>

        {/* Status Message Alert */}
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            budgetStatus.level === 'safe'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : budgetStatus.level === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              : 'bg-red-50 dark:bg-rose-950/60 text-danger dark:text-rose-300 border-red-200 dark:border-rose-800'
          }`}
        >
          {budgetStatus.level === 'safe' ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-warning dark:text-amber-400 flex-shrink-0" />
          )}
          <span>
            {budgetStatus.level === 'safe'
              ? t('statusSafeMsg', language)
              : budgetStatus.level === 'warning'
              ? t('statusWarningMsg', language)
              : budgetStatus.level === 'danger'
              ? t('statusDangerMsg', language)
              : t('statusExceededMsg', language, { amount: formatRupiah(budgetStatus.excessAmount) })}
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-gray-50 dark:bg-slate-750 p-2.5 rounded-xl border dark:border-slate-700/60">
            <span className="text-[11px] text-text-secondary dark:text-slate-400 block">
              {t('activeCartSpending', language)}
            </span>
            <span className="text-base font-extrabold text-text-main dark:text-slate-100">
              {formatRupiah(budgetStatus.activeTotal)}
            </span>
          </div>
          <div className="bg-gray-50 dark:bg-slate-750 p-2.5 rounded-xl border dark:border-slate-700/60">
            <span className="text-[11px] text-text-secondary dark:text-slate-400 block">
              {budgetStatus.level === 'exceeded' ? t('overBudgetAmount', language) : t('safeLimitRemaining', language)}
            </span>
            <span
              className={`text-base font-extrabold ${
                budgetStatus.level === 'exceeded' ? 'text-danger dark:text-rose-400' : 'text-success dark:text-emerald-400'
              }`}
            >
              {budgetStatus.level === 'exceeded'
                ? `+${formatRupiah(budgetStatus.excessAmount)}`
                : formatRupiah(budgetStatus.remaining)}
            </span>
          </div>
        </div>

        {/* Safety Level Rules Info (Panduan Warna) */}
        <div className="text-[11px] text-gray-500 dark:text-slate-400 bg-blue-50/60 dark:bg-slate-750 p-2.5 rounded-xl space-y-1 border dark:border-slate-700/60">
          <div className="flex items-center gap-1 font-semibold text-primary dark:text-blue-400">
            <Info className="w-3.5 h-3.5" />
            <span>{t('budgetGuideTitle', language)}</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-gray-600 dark:text-slate-300 pl-1">
            <li>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{t('budgetGuideGreen', language)}</span>
            </li>
            <li>
              <span className="text-amber-700 dark:text-amber-400 font-semibold">{t('budgetGuideYellow', language)}</span>
            </li>
            <li>
              <span className="text-red-700 dark:text-rose-400 font-semibold">{t('budgetGuideRed', language)}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Historical Monthly Spending Comparison */}
      <div className="bg-card dark:bg-slate-800/90 rounded-card p-4 border border-border dark:border-slate-700 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-xs text-text-main dark:text-slate-100">
            <Calendar className="w-4 h-4 text-primary dark:text-blue-400" />
            <span>{t('monthlySpendingHistory', language)}</span>
          </div>
        </div>

        {historicalPeriods.length === 0 ? (
          <p className="text-xs text-text-secondary dark:text-slate-400 italic text-center py-2">
            {language === 'zh' ? '暂无上个月的历史存档。' : language === 'en' ? 'No history archive from previous months yet.' : 'Belum ada arsip riwayat bulan sebelumnya.'}
          </p>
        ) : (
          <div className="space-y-2">
            {historicalPeriods.map(([period, total]) => (
              <div
                key={period}
                className="bg-gray-50 dark:bg-slate-750 p-2.5 rounded-xl border dark:border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-text-main dark:text-slate-100 block">
                    {formatPeriodLabel(period, language)}
                  </span>
                  <span className="text-[10px] text-text-secondary dark:text-slate-400">
                    {t('completedTransactionsArchive', language)}
                  </span>
                </div>
                <span className="font-extrabold text-primary dark:text-blue-400 text-sm">
                  {formatRupiah(total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Method Selector Modal */}
      <PaymentMethodSelectorModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </div>
  );
};
