import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import type { PurchaseTransaction } from '../types';
import { formatRupiah } from '../utils/currency';

interface HistoryTransactionCardProps {
  transaction: PurchaseTransaction;
}

export const HistoryTransactionCard: React.FC<HistoryTransactionCardProps> = ({ transaction }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = new Date(transaction.purchasedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-card dark:bg-slate-800/90 rounded-card p-4 border border-border dark:border-slate-700 shadow-soft transition-all duration-200">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-success dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-text-secondary dark:text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
            <span className="text-xs font-semibold text-text-main dark:text-slate-100">
              {transaction.items.length} jenis barang dibeli
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-base font-extrabold text-primary dark:text-blue-400 block">
            {formatRupiah(transaction.finalTotal)}
          </span>
          {transaction.discountTotal > 0 && (
            <span className="text-[10px] font-bold text-success dark:text-emerald-400 block">
              Hemat {formatRupiah(transaction.discountTotal)}
            </span>
          )}
        </div>
      </div>

      {/* Snapshot budget usage & Payment Method indicator */}
      <div className="mt-2.5 text-[11px] text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-750 px-2.5 py-1.5 rounded-lg flex flex-wrap items-center justify-between gap-1">
        {transaction.budgetLimitSnapshot > 0 && (
          <div>
            <span>Snapshot Batas: </span>
            <span className="font-semibold text-text-main dark:text-slate-200">
              {formatRupiah(transaction.budgetLimitSnapshot)} (
              {((transaction.finalTotal / transaction.budgetLimitSnapshot) * 100).toFixed(1)}%)
            </span>
          </div>
        )}
        <div className="flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900">
          <span>💳 {transaction.paymentMethod || 'Bank BCA'}</span>
        </div>
      </div>

      {/* Toggle Expand Details Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full mt-3 pt-2 border-t border-gray-100 dark:border-slate-700 flex items-center justify-center gap-1 text-xs font-semibold text-text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors min-h-[40px]"
      >
        <span>{isExpanded ? 'Sembunyikan Rincian' : 'Lihat Rincian Item'}</span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Expanded Items Breakdown */}
      {isExpanded && (
        <div className="mt-2.5 space-y-2 pt-2 border-t border-dashed border-gray-200 dark:border-slate-700 animate-fade-in">
          {transaction.items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-gray-50/70 dark:bg-slate-700/60 p-2.5 rounded-xl border border-gray-200/80 dark:border-slate-650 flex items-center justify-between text-xs"
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] font-semibold text-gray-500 dark:text-slate-300 bg-gray-200/60 dark:bg-slate-600 px-1.5 py-0.2 rounded">
                    {item.categorySnapshot}
                  </span>
                  {item.discounts.length > 0 && (
                    <span className="text-[9px] font-bold text-danger dark:text-rose-300 bg-red-50 dark:bg-rose-950/70 px-1 rounded">
                      Diskon -{item.discounts.join('% -')}%
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-text-main dark:text-slate-100 truncate text-xs">
                  {item.nameSnapshot}
                </h4>
                <div className="text-[11px] text-text-secondary dark:text-slate-400">
                  {item.quantity} {item.unit} × {formatRupiah(item.unitPrice)}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="font-bold text-text-main dark:text-slate-100 block">
                  {formatRupiah(item.finalSubtotal)}
                </span>
                {item.discountAmount > 0 && (
                  <span className="text-[10px] text-success dark:text-emerald-400 block">
                    Hemat {formatRupiah(item.discountAmount)}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Totals Summary */}
          <div className="bg-blue-50/50 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/60 text-xs space-y-1">
            <div className="flex justify-between text-gray-600 dark:text-slate-400">
              <span>Total Kotor Sebelum Diskon:</span>
              <span className="text-gray-900 dark:text-slate-200">{formatRupiah(transaction.grossTotal)}</span>
            </div>
            <div className="flex justify-between text-success dark:text-emerald-400 font-medium">
              <span>Total Penghematan Diskon:</span>
              <span>-{formatRupiah(transaction.discountTotal)}</span>
            </div>
            <div className="flex justify-between text-primary dark:text-blue-400 font-bold text-sm pt-1 border-t border-blue-200/50 dark:border-blue-800/40">
              <span>Total Akhir Dibayar:</span>
              <span>{formatRupiah(transaction.finalTotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
