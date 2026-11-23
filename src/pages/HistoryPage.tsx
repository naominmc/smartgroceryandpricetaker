import React, { useState, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Search,
  Filter,
  Download,
  Upload,
  History,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { db } from '../db/database';
import { groceryService } from '../services/groceryService';
import { HistoryTransactionCard } from '../components/HistoryTransactionCard';
import { EmptyState } from '../components/EmptyState';
import { formatRupiah } from '../utils/currency';
import { formatPeriodLabel, getPreviousMonthPeriod } from '../utils/priceComparison';
import { useStore } from '../store/useStore';
import { t } from '../utils/i18n';

const getMonthOptions = (lang: string) => [
  { value: '01', label: lang === 'zh' ? '1月' : lang === 'en' ? 'January' : 'Januari' },
  { value: '02', label: lang === 'zh' ? '2月' : lang === 'en' ? 'February' : 'Februari' },
  { value: '03', label: lang === 'zh' ? '3月' : lang === 'en' ? 'March' : 'Maret' },
  { value: '04', label: lang === 'zh' ? '4月' : lang === 'en' ? 'April' : 'April' },
  { value: '05', label: lang === 'zh' ? '5月' : lang === 'en' ? 'May' : 'Mei' },
  { value: '06', label: lang === 'zh' ? '6月' : lang === 'en' ? 'June' : 'Juni' },
  { value: '07', label: lang === 'zh' ? '7月' : lang === 'en' ? 'July' : 'Juli' },
  { value: '08', label: lang === 'zh' ? '8月' : lang === 'en' ? 'August' : 'Agustus' },
  { value: '09', label: lang === 'zh' ? '9月' : lang === 'en' ? 'September' : 'September' },
  { value: '10', label: lang === 'zh' ? '10月' : lang === 'en' ? 'October' : 'Oktober' },
  { value: '11', label: lang === 'zh' ? '11月' : lang === 'en' ? 'November' : 'November' },
  { value: '12', label: lang === 'zh' ? '12月' : lang === 'en' ? 'December' : 'Desember' },
];

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1));

export const HistoryPage: React.FC = () => {
  const { language, currency } = useStore();
  const MONTH_OPTIONS = useMemo(() => getMonthOptions(language), [language]);
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Fetch transactions from Dexie (exclude deleted / recycle bin items)
  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const transactions = useMemo(() => {
    return allTransactions.filter((tx) => !tx.isDeleted);
  }, [allTransactions]);

  // Sort descending by purchasedAt
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort(
      (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
    );
  }, [transactions]);

  // Extract all distinct periods from transactions
  const distinctPeriods = useMemo(() => {
    return Array.from(new Set(transactions.map((tx) => tx.period))).sort().reverse();
  }, [transactions]);

  // Extract available years from transactions and current year
  const currentYearStr = new Date().getFullYear().toString();
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>([currentYearStr]);
    transactions.forEach((tx) => {
      if (tx.purchasedAt) {
        const y = new Date(tx.purchasedAt).getFullYear().toString();
        if (y && y !== 'NaN') yearsSet.add(y);
      }
      if (tx.period) {
        const y = tx.period.split('-')[0];
        if (y) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort().reverse();
  }, [transactions, currentYearStr]);

  // Date selection presets checks
  const now = new Date();
  const nowDay = String(now.getDate());
  const nowMonth = String(now.getMonth() + 1).padStart(2, '0');
  const nowYear = now.getFullYear().toString();

  const [isThisWeekFilter, setIsThisWeekFilter] = useState(false);

  // Start and end of current week (Senin s/d Minggu)
  const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Senin, 6 = Minggu
  const startOfWeek = useMemo(() => {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0);
  }, [now.getFullYear(), now.getMonth(), now.getDate(), dayOfWeek]);
  const endOfWeek = useMemo(() => {
    return new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  }, [startOfWeek]);

  const isTodaySelected =
    !isThisWeekFilter && selectedDay === nowDay && selectedMonth === nowMonth && selectedYear === nowYear;
  const isThisMonthSelected =
    !isThisWeekFilter && selectedDay === 'all' && selectedMonth === nowMonth && selectedYear === nowYear;

  const handleResetDateFilter = () => {
    setIsThisWeekFilter(false);
    setSelectedDay('all');
    setSelectedMonth('all');
    setSelectedYear('all');
    if (dateInputRef.current) {
      dateInputRef.current.value = '';
    }
  };

  const handleCalendarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    setIsThisWeekFilter(false);
    const [y, m, d] = val.split('-');
    if (y && m && d) {
      setSelectedYear(y);
      setSelectedMonth(m);
      setSelectedDay(String(parseInt(d, 10)));
    }
  };

  // Filter transactions based on date selectors and search query
  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter((tx) => {
      const txDate = new Date(tx.purchasedAt);
      const hasValidDate = !isNaN(txDate.getTime());

      if (isThisWeekFilter) {
        if (!hasValidDate) return false;
        if (txDate < startOfWeek || txDate > endOfWeek) return false;
      } else {
        const txYear = hasValidDate
          ? txDate.getFullYear().toString()
          : tx.period
          ? tx.period.split('-')[0]
          : '';
        const txMonth = hasValidDate
          ? String(txDate.getMonth() + 1).padStart(2, '0')
          : tx.period
          ? tx.period.split('-')[1]
          : '';
        const txDay = hasValidDate ? String(txDate.getDate()) : '';

        if (selectedYear !== 'all' && txYear !== selectedYear) return false;
        if (selectedMonth !== 'all' && txMonth !== selectedMonth) return false;
        if (selectedDay !== 'all' && txDay !== selectedDay) return false;
      }

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      return (
        tx.id.toLowerCase().includes(query) ||
        (tx.location && tx.location.toLowerCase().includes(query)) ||
        (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(query)) ||
        tx.items.some(
          (item) =>
            item.nameSnapshot.toLowerCase().includes(query) ||
            item.categorySnapshot.toLowerCase().includes(query)
        )
      );
    });
  }, [sortedTransactions, selectedYear, selectedMonth, selectedDay, searchQuery, isThisWeekFilter, startOfWeek, endOfWeek]);

  // Calculate summary metrics for current selection
  const periodTotalSpending = filteredTransactions.reduce((acc, tx) => acc + tx.finalTotal, 0);
  const periodTotalSavings = filteredTransactions.reduce((acc, tx) => acc + tx.discountTotal, 0);

  // Period label for summary
  const summaryLabel = useMemo(() => {
    if (isThisWeekFilter) {
      const monthObj = MONTH_OPTIONS[now.getMonth()];
      return language === 'zh'
        ? `本周 (${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${monthObj?.label || ''})`
        : language === 'en'
        ? `This Week (${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${monthObj?.label || ''})`
        : `Minggu Ini (${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${monthObj?.label || ''})`;
    }
    if (selectedDay !== 'all' && selectedMonth !== 'all' && selectedYear !== 'all') {
      const monthObj = MONTH_OPTIONS.find((m) => m.value === selectedMonth);
      return language === 'zh'
        ? `${selectedYear}年${monthObj?.label || selectedMonth}${selectedDay}日`
        : language === 'en'
        ? `${monthObj?.label || selectedMonth} ${selectedDay}, ${selectedYear}`
        : `${parseInt(selectedDay, 10)} ${monthObj?.label || selectedMonth} ${selectedYear}`;
    }
    if (selectedMonth !== 'all' && selectedYear !== 'all') {
      const monthObj = MONTH_OPTIONS.find((m) => m.value === selectedMonth);
      return language === 'zh'
        ? `${selectedYear}年${monthObj?.label || selectedMonth}`
        : language === 'en'
        ? `${monthObj?.label || selectedMonth} ${selectedYear}`
        : `${monthObj?.label || selectedMonth} ${selectedYear}`;
    }
    if (selectedMonth !== 'all') {
      const monthObj = MONTH_OPTIONS.find((m) => m.value === selectedMonth);
      return language === 'zh'
        ? `${monthObj?.label || selectedMonth}`
        : language === 'en'
        ? `Month of ${monthObj?.label || selectedMonth}`
        : `Bulan ${monthObj?.label || selectedMonth}`;
    }
    if (selectedYear !== 'all') {
      return language === 'zh'
        ? `${selectedYear}年`
        : language === 'en'
        ? `Year ${selectedYear}`
        : `Tahun ${selectedYear}`;
    }
    if (distinctPeriods.length > 0) {
      return formatPeriodLabel(distinctPeriods[0], language);
    }
    return language === 'zh' ? '所有历史时期' : language === 'en' ? 'All Periods' : 'Seluruh Periode';
  }, [isThisWeekFilter, startOfWeek, endOfWeek, selectedDay, selectedMonth, selectedYear, distinctPeriods, MONTH_OPTIONS, now, language]);

  // Month-over-month comparison when month and year are selected
  const hasMonthYearSelected = selectedMonth !== 'all' && selectedYear !== 'all';
  const prevPeriod = hasMonthYearSelected ? getPreviousMonthPeriod(`${selectedYear}-${selectedMonth}`) : '';
  const prevTransactions = hasMonthYearSelected && prevPeriod
    ? transactions.filter((tx) => tx.period === prevPeriod)
    : [];
  const prevTotalSpending = prevTransactions.reduce((acc, tx) => acc + tx.finalTotal, 0);
  const spendingDiff = periodTotalSpending - prevTotalSpending;
  const spendingPctChange =
    prevTotalSpending > 0 ? ((spendingDiff / prevTotalSpending) * 100).toFixed(1) : null;

  // Backup handlers
  const handleExportBackup = async () => {
    try {
      const json = await groceryService.exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart-grocery-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatus({
        type: 'success',
        message: language === 'zh' ? '备份数据下载成功！' : language === 'en' ? 'Backup data successfully downloaded!' : 'Data cadangan berhasil diunduh!',
      });
      setTimeout(() => setBackupStatus(null), 4000);
    } catch (err: any) {
      setBackupStatus({
        type: 'error',
        message: (language === 'zh' ? '导出数据失败: ' : language === 'en' ? 'Failed to export data: ' : 'Gagal mengekspor data: ') + err.message,
      });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await groceryService.importBackup(text);
      setBackupStatus({
        type: 'success',
        message: language === 'zh' ? '备份数据恢复成功！' : language === 'en' ? 'Backup data restored successfully!' : 'Data cadangan berhasil dipulihkan!',
      });
      setTimeout(() => setBackupStatus(null), 4000);
    } catch (err: any) {
      setBackupStatus({
        type: 'error',
        message: (language === 'zh' ? '文件无效: ' : language === 'en' ? 'Invalid file: ' : 'File tidak valid: ') + err.message,
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 pb-3">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-xs text-text-secondary dark:text-slate-400 font-medium block">
            {t('archiveCompleted', language)}
          </span>
          <h1 className="text-xl font-extrabold text-text-main dark:text-slate-100 tracking-tight">
            {t('historyTitle', language)}
          </h1>
        </div>

        {/* Backup Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExportBackup}
            className="p-2 text-primary dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors min-h-[40px]"
            title={language === 'zh' ? '导出 JSON 备份' : language === 'en' ? 'Export JSON Backup' : 'Ekspor Backup JSON'}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('backupBtn', language)}</span>
          </button>
        </div>
      </div>

      {/* Backup Status Toast */}
      {backupStatus && (
        <div
          className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-fade-in ${
            backupStatus.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-rose-950/80 text-danger dark:text-rose-300 border border-red-200 dark:border-rose-800'
          }`}
        >
          {backupStatus.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-danger dark:text-rose-400 flex-shrink-0" />
          )}
          <span>{backupStatus.message}</span>
        </div>
      )}

      {/* Monthly / Filtered Summary Card */}
      {filteredTransactions.length > 0 && (
        <div className="bg-card dark:bg-slate-800/90 rounded-card p-4 border border-border dark:border-slate-700 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary dark:text-slate-400">
              {t('summaryOf', language, { label: summaryLabel })}
            </span>
            <span className="text-[11px] bg-blue-50 dark:bg-blue-950/80 text-primary dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">
              {t('transactionsCompleted', language, { count: filteredTransactions.length })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-text-secondary dark:text-slate-400 block">{t('totalSpending', language)}</span>
              <span className="text-lg font-extrabold text-primary dark:text-blue-400">
                {formatRupiah(periodTotalSpending)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-text-secondary dark:text-slate-400 block">{t('promoSavings', language)}</span>
              <span className="text-lg font-extrabold text-success dark:text-emerald-400">
                {formatRupiah(periodTotalSavings)}
              </span>
            </div>
          </div>

          {/* Month-over-month comparison */}
          {hasMonthYearSelected && prevTotalSpending > 0 && spendingPctChange !== null && (
            <div className="border-t border-gray-100 dark:border-slate-700 pt-2 flex items-center justify-between text-xs">
              <span className="text-text-secondary dark:text-slate-400">
                {t('monthVs', language, {
                  period: formatPeriodLabel(prevPeriod, language),
                  amount: formatRupiah(prevTotalSpending),
                })}
              </span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  spendingDiff > 0 ? 'text-danger dark:text-rose-400' : 'text-success dark:text-emerald-400'
                }`}
              >
                {spendingDiff > 0 ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{t('spendingUp', language, { pct: spendingPctChange })}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{t('spendingDown', language, { pct: Math.abs(Number(spendingPctChange)) })}</span>
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Section */}
      <div className="bg-card dark:bg-slate-800 rounded-card p-3 border border-border dark:border-slate-700 shadow-soft space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder={t('searchReceiptPlaceholder', language)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/60 text-xs font-medium text-text-main dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary min-h-[40px]"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Date Filter Header & Action Buttons */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <span className="text-[11px] font-bold text-text-secondary dark:text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-primary dark:text-blue-400" />
            <span>{t('filterDateLabel', language)}</span>
          </span>

          <div className="flex items-center gap-1.5">
            {/* Native Calendar Picker Trigger */}
            <button
              type="button"
              onClick={() => {
                if (dateInputRef.current) {
                  try {
                    dateInputRef.current.showPicker();
                  } catch {
                    dateInputRef.current.focus();
                  }
                }
              }}
              className="text-[10.5px] font-bold text-primary dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2.5 py-1 rounded-lg border border-blue-200/80 dark:border-blue-800/80 flex items-center gap-1 transition-colors cursor-pointer"
              title={t('calendarBtn', language)}
            >
              <Calendar className="w-3 h-3" />
              <span>{t('calendarBtn', language)}</span>
            </button>

            {/* Hidden native date input for showPicker */}
            <input
              ref={dateInputRef}
              type="date"
              className="sr-only"
              onChange={handleCalendarPick}
            />

            {/* Reset button if any filter is active */}
            {(isThisWeekFilter || selectedDay !== 'all' || selectedMonth !== 'all' || selectedYear !== 'all') && (
              <button
                type="button"
                onClick={handleResetDateFilter}
                className="text-[10.5px] font-bold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900/50 px-2 py-1 rounded-lg border border-rose-200/80 dark:border-rose-800/80 flex items-center gap-1 transition-colors cursor-pointer"
                title={t('resetBtn', language)}
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>{t('resetBtn', language)}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Selectors: Tanggal, Bulan, Tahun */}
        <div className="grid grid-cols-3 gap-1.5">
          {/* Tanggal Selector */}
          <div className="relative">
            <select
              value={selectedDay}
              onChange={(e) => {
                setIsThisWeekFilter(false);
                setSelectedDay(e.target.value);
              }}
              className={`w-full appearance-none pl-2.5 pr-6 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] sm:text-xs outline-none focus:ring-2 focus:ring-primary min-h-[38px] cursor-pointer truncate transition-all ${
                selectedDay === 'all'
                  ? 'text-gray-400/80 dark:text-slate-500 font-normal'
                  : 'text-primary dark:text-blue-400 font-extrabold bg-blue-50/60 dark:bg-blue-950/50 border-primary/40'
              }`}
            >
              <option value="all" disabled hidden>
                {t('dayLabel', language)}
              </option>
              {DAY_OPTIONS.map((day) => (
                <option key={day} value={day} className="text-gray-900 dark:text-slate-100 font-medium">
                  {day}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Bulan Selector */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setIsThisWeekFilter(false);
                setSelectedMonth(e.target.value);
              }}
              className={`w-full appearance-none pl-2.5 pr-6 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] sm:text-xs outline-none focus:ring-2 focus:ring-primary min-h-[38px] cursor-pointer truncate transition-all ${
                selectedMonth === 'all'
                  ? 'text-gray-400/80 dark:text-slate-500 font-normal'
                  : 'text-primary dark:text-blue-400 font-extrabold bg-blue-50/60 dark:bg-blue-950/50 border-primary/40'
              }`}
            >
              <option value="all" disabled hidden>
                {t('monthLabel', language)}
              </option>
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value} className="text-gray-900 dark:text-slate-100 font-medium">
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Tahun Selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => {
                setIsThisWeekFilter(false);
                setSelectedYear(e.target.value);
              }}
              className={`w-full appearance-none pl-2.5 pr-6 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] sm:text-xs outline-none focus:ring-2 focus:ring-primary min-h-[38px] cursor-pointer truncate transition-all ${
                selectedYear === 'all'
                  ? 'text-gray-400/80 dark:text-slate-500 font-normal'
                  : 'text-primary dark:text-blue-400 font-extrabold bg-blue-50/60 dark:bg-blue-950/50 border-primary/40'
              }`}
            >
              <option value="all" disabled hidden>
                {t('yearLabel', language)}
              </option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="text-gray-900 dark:text-slate-100 font-medium">
                  {yr}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setIsThisWeekFilter(false);
              const now = new Date();
              setSelectedYear(now.getFullYear().toString());
              setSelectedMonth(String(now.getMonth() + 1).padStart(2, '0'));
              setSelectedDay(String(now.getDate()));
            }}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-colors whitespace-nowrap cursor-pointer ${
              isTodaySelected
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-gray-100 dark:bg-slate-700/80 text-text-secondary dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-gray-200'
            }`}
          >
            {t('today', language)}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsThisWeekFilter(true);
              setSelectedDay('all');
              setSelectedMonth('all');
              setSelectedYear('all');
            }}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-colors whitespace-nowrap cursor-pointer ${
              isThisWeekFilter
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-gray-100 dark:bg-slate-700/80 text-text-secondary dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-gray-200'
            }`}
          >
            {t('thisWeek', language)}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsThisWeekFilter(false);
              const now = new Date();
              setSelectedYear(now.getFullYear().toString());
              setSelectedMonth(String(now.getMonth() + 1).padStart(2, '0'));
              setSelectedDay('all');
            }}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-colors whitespace-nowrap cursor-pointer ${
              isThisMonthSelected
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-gray-100 dark:bg-slate-700/80 text-text-secondary dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-gray-200'
            }`}
          >
            {t('thisMonth', language)}
          </button>
          <button
            type="button"
            onClick={handleResetDateFilter}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-colors whitespace-nowrap cursor-pointer ${
              !isThisWeekFilter && selectedDay === 'all' && selectedMonth === 'all' && selectedYear === 'all'
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-gray-100 dark:bg-slate-700/80 text-text-secondary dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-gray-200'
            }`}
          >
            {t('allPeriodsBtn', language)}
          </button>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon={History}
          title={t('emptyHistoryTitle', language)}
          description={
            searchQuery
              ? (language === 'zh'
                  ? `未在所选历史记录中找到商品 "${searchQuery}"。`
                  : language === 'en'
                  ? `Item "${searchQuery}" was not found in the selected history period.`
                  : `Barang "${searchQuery}" tidak ditemukan pada periode riwayat yang dipilih.`)
              : (language === 'zh'
                  ? '暂无符合所选日期筛选条件的购物交易。'
                  : language === 'en'
                  ? 'No transactions match the selected date filter.'
                  : 'Belum ada transaksi belanja yang cocok dengan filter tanggal yang dipilih.')
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => (
            <HistoryTransactionCard key={tx.id} transaction={tx} />
          ))}
        </div>
      )}
    </div>
  );
};