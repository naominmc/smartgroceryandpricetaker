import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, CheckCircle2, Trash2 } from 'lucide-react';
import type { PurchaseTransaction } from '../types';
import { formatRupiah } from '../utils/currency';
import { db } from '../db/database';
import { useStore } from '../store/useStore';
import { t, translateCategory } from '../utils/i18n';

interface HistoryTransactionCardProps {
  transaction: PurchaseTransaction;
}

export const HistoryTransactionCard: React.FC<HistoryTransactionCardProps> = ({ transaction }) => {
  const { language } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const txDate = new Date(transaction.purchasedAt);
  const dateFormatted = txDate.toLocaleDateString(
    language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'id-ID',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );
  const timeFormatted = `${t('atTime', language)} ${txDate.toLocaleTimeString(
    language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'id-ID',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  )}`;

  return (
    <div className="bg-card dark:bg-slate-800/90 rounded-card p-4 border border-border dark:border-slate-700 shadow-soft transition-all duration-200">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-success dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1.5 text-[11px] text-text-secondary dark:text-slate-400 font-medium flex-wrap">
              <div className="flex items-start gap-1 flex-shrink-0">
                <Calendar className="w-3.5 h-3.5 mt-0.5 text-gray-400 dark:text-slate-500 flex-shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="font-semibold text-text-main dark:text-slate-200 whitespace-nowrap">{dateFormatted}</span>
                  <span className="text-[10.5px] text-text-secondary dark:text-slate-400 whitespace-nowrap">{timeFormatted}</span>
                </div>
              </div>

              <div className="flex items-start gap-1 min-w-0">
                <span className="text-gray-300 dark:text-slate-600 font-bold">•</span>
                <span className="text-primary dark:text-blue-400 font-bold uppercase tracking-tight text-[11px] leading-tight break-words">
                  {((transaction.location && transaction.location.trim()) ? transaction.location.trim() : 'LOTTE MART GROCERY - PURI INDAH').toUpperCase()}
                </span>
              </div>
            </div>
            <div className="text-xs font-semibold text-text-main dark:text-slate-100 mt-1">
              {t('itemsBought', language, { count: transaction.items.length })}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-1.5 flex-shrink-0">
          <div className="text-right">
            <span className="text-base font-extrabold text-primary dark:text-blue-400 block">
              {formatRupiah(transaction.finalTotal)}
            </span>
            {transaction.discountTotal > 0 && (
              <span className="text-[10px] font-bold text-success dark:text-emerald-400 block">
                {t('savedAmount', language, { amount: formatRupiah(transaction.discountTotal) })}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="p-1 rounded-lg text-gray-400 hover:text-danger hover:bg-red-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer mt-0.5"
            title={t('deleteReceiptTitle', language)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Snapshot budget usage & Payment Method indicator */}
      <div className="mt-2.5 text-[11px] text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg flex flex-wrap items-center justify-between gap-1">
        {transaction.budgetLimitSnapshot > 0 && (
          <div>
            <span>{language === 'zh' ? '预算上限快照: ' : language === 'en' ? 'Limit Snapshot: ' : 'Snapshot Batas: '}</span>
            <span className="font-extrabold text-gray-900 dark:text-slate-100">
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
        <span>{isExpanded ? t('closeDetails', language) : t('viewDetails', language, { count: transaction.items.length })}</span>
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
                    {translateCategory(item.categorySnapshot, language)}
                  </span>
                  {item.discounts.length > 0 && (
                    <span className="text-[9px] font-bold text-danger dark:text-rose-300 bg-red-50 dark:bg-rose-950/70 px-1 rounded">
                      {language === 'zh' ? '折扣' : language === 'en' ? 'Discount' : 'Diskon'} -{item.discounts.join('% -')}%
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
                    {t('savedAmount', language, { amount: formatRupiah(item.discountAmount) })}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Totals Summary */}
          <div className="bg-blue-50/50 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/60 text-xs space-y-1">
            <div className="flex justify-between text-gray-600 dark:text-slate-400">
              <span>{t('grossSubtotalLabel', language)}</span>
              <span className="text-gray-900 dark:text-slate-200">{formatRupiah(transaction.grossTotal)}</span>
            </div>
            <div className="flex justify-between text-success dark:text-emerald-400 font-medium">
              <span>{t('discountSavingsLabel', language)}</span>
              <span>-{formatRupiah(transaction.discountTotal)}</span>
            </div>
            <div className="flex justify-between text-primary dark:text-blue-400 font-bold text-sm pt-1 border-t border-blue-200/50 dark:border-blue-800/40">
              <span>{t('finalPaidLabel', language)}</span>
              <span>{formatRupiah(transaction.finalTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Peringatan Hapus Struk ke Sampah (Recycle Bin 30 Hari) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-left">
          <div className="w-full max-w-[350px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-modal animate-slide-up space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-red-100 dark:bg-rose-950/80 text-danger dark:text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-sm sm:text-base text-text-main dark:text-slate-100">
                  {t('deleteReceiptTitle', language)}
                </h3>
                <p className="text-xs text-text-secondary dark:text-slate-400 mt-1 leading-relaxed">
                  {t('deleteReceiptDesc', language)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="py-2.5 px-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-750 font-bold text-xs flex items-center justify-center transition-all cursor-pointer min-h-[42px]"
              >
                {t('cancelBtn', language)}
              </button>

              <button
                type="button"
                onClick={async () => {
                  setShowDeleteModal(false);
                  await db.transactions.update(transaction.id, {
                    isDeleted: true,
                    deletedAt: new Date().toISOString(),
                  });
                }}
                className="py-2.5 px-3 rounded-xl bg-danger hover:bg-red-700 active:scale-98 text-white font-extrabold text-xs shadow-soft flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[42px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('moveToTrashBtn', language)}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
