import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { db } from '../db/database';
import { groceryService } from '../services/groceryService';
import { HistoryTransactionCard } from '../components/HistoryTransactionCard';
import { EmptyState } from '../components/EmptyState';
import { formatRupiah } from '../utils/currency';
import { formatPeriodLabel, getPreviousMonthPeriod } from '../utils/priceComparison';

export const HistoryPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch transactions from Dexie
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];

  // Sort descending by purchasedAt
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
  );

  // Extract all distinct periods
  const distinctPeriods = Array.from(new Set(transactions.map((tx) => tx.period))).sort().reverse();

  // Filter transactions based on period and search query
  const filteredTransactions = sortedTransactions.filter((tx) => {
    const matchesPeriod = selectedPeriod === 'all' || tx.period === selectedPeriod;
    if (!matchesPeriod) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    return tx.items.some(
      (item) =>
        item.nameSnapshot.toLowerCase().includes(query) ||
        item.categorySnapshot.toLowerCase().includes(query)
    );
  });

  // Calculate monthly metrics for selected period or overall
  const activeMetricsPeriod = selectedPeriod === 'all' ? distinctPeriods[0] : selectedPeriod;
  const periodTransactions = transactions.filter((tx) => tx.period === activeMetricsPeriod);
  const periodTotalSpending = periodTransactions.reduce((acc, tx) => acc + tx.finalTotal, 0);
  const periodTotalSavings = periodTransactions.reduce((acc, tx) => acc + tx.discountTotal, 0);

  // Previous month comparison
  const prevPeriod = getPreviousMonthPeriod(activeMetricsPeriod);
  const prevTransactions = transactions.filter((tx) => tx.period === prevPeriod);
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
      setBackupStatus({ type: 'success', message: 'Data cadangan berhasil diunduh!' });
      setTimeout(() => setBackupStatus(null), 4000);
    } catch (err: any) {
      setBackupStatus({ type: 'error', message: 'Gagal mengekspor data: ' + err.message });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await groceryService.importBackup(text);
      setBackupStatus({ type: 'success', message: 'Data cadangan berhasil dipulihkan!' });
      setTimeout(() => setBackupStatus(null), 4000);
    } catch (err: any) {
      setBackupStatus({ type: 'error', message: 'File tidak valid: ' + err.message });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-xs text-text-secondary dark:text-slate-400 font-medium block">
            Arsip Transaksi Selesai
          </span>
          <h1 className="text-xl font-extrabold text-text-main dark:text-slate-100 tracking-tight">
            Riwayat Belanja
          </h1>
        </div>

        {/* Backup & Restore Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExportBackup}
            className="p-2 text-primary dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors min-h-[40px]"
            title="Ekspor Backup JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cadangkan</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-text-secondary dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors min-h-[40px]"
            title="Impor Backup JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pulihkan</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
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

      {/* Monthly Summary & Comparison Card */}
      {activeMetricsPeriod && periodTransactions.length > 0 && (
        <div className="bg-card dark:bg-slate-800/90 rounded-card p-4 border border-border dark:border-slate-700 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary dark:text-slate-400">
              Ringkasan {formatPeriodLabel(activeMetricsPeriod)}
            </span>
            <span className="text-[11px] bg-blue-50 dark:bg-blue-950/80 text-primary dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">
              {periodTransactions.length} transaksi selesai
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-text-secondary dark:text-slate-400 block">Total Pengeluaran</span>
              <span className="text-lg font-extrabold text-primary dark:text-blue-400">
                {formatRupiah(periodTotalSpending)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-text-secondary dark:text-slate-400 block">Hemat dari Promo</span>
              <span className="text-lg font-extrabold text-success dark:text-emerald-400">
                {formatRupiah(periodTotalSavings)}
              </span>
            </div>
          </div>

          {/* Month-over-month comparison */}
          {prevTotalSpending > 0 && spendingPctChange !== null && (
            <div className="border-t border-gray-100 dark:border-slate-700 pt-2 flex items-center justify-between text-xs">
              <span className="text-text-secondary dark:text-slate-400">
                Vs {formatPeriodLabel(prevPeriod)} ({formatRupiah(prevTotalSpending)}):
              </span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  spendingDiff > 0 ? 'text-danger dark:text-rose-400' : 'text-success dark:text-emerald-400'
                }`}
              >
                {spendingDiff > 0 ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Naik {spendingPctChange}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Turun {Math.abs(Number(spendingPctChange))}%</span>
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {/* Month Filter Selector */}
          <div className="relative flex-1">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-text-main dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            >
              <option value="all">Semua Periode Bulan</option>
              {distinctPeriods.map((period) => (
                <option key={period} value={period}>
                  {formatPeriodLabel(period)}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Product Search Box */}
          <div className="relative flex-[1.4]">
            <input
              type="text"
              placeholder="Cari nama barang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-text-main dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon={History}
          title="Tidak Ada Riwayat"
          description={
            searchQuery
              ? `Barang "${searchQuery}" tidak ditemukan pada periode riwayat yang dipilih.`
              : 'Belum ada transaksi belanja yang diselesaikan.'
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
