import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard, ShieldCheck } from 'lucide-react';
import { PAYMENT_ACCOUNTS } from '../data/paymentMethods';
import { useStore } from '../store/useStore';
import { db } from '../db/database';
import { syncService } from '../services/syncService';
import { soundService } from '../utils/sound';

interface PaymentMethodSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentMethodSelectorModal: React.FC<PaymentMethodSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { selectedPaymentMethod, setSelectedPaymentMethod, username } = useStore();
  const [selectedMethod, setSelectedMethod] = useState(selectedPaymentMethod);

  useEffect(() => {
    if (isOpen) {
      setSelectedMethod(selectedPaymentMethod);
    }
  }, [isOpen, selectedPaymentMethod]);

  if (!isOpen) return null;

  const handleSelectAccount = async (name: string) => {
    setSelectedMethod(name);
    setSelectedPaymentMethod(name);
    soundService.pop();

    if (typeof window !== 'undefined') {
      localStorage.setItem('smart_grocery_payment_method', name);
    }

    // Sinkronisasi otomatis ke riwayat transaksi yang ada
    try {
      await db.transactions.toCollection().modify({ paymentMethod: name });
      syncService.notifyChange();
    } catch (err) {
      console.warn('Gagal sinkronisasi payment method ke riwayat:', err);
    }
  };

  const handleConfirm = async () => {
    await handleSelectAccount(selectedMethod);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-[410px] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-modal animate-slide-up border dark:border-slate-800 space-y-4"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-text-main dark:text-slate-100">
                Pilih Akun Bank / Pembayaran
              </h3>
              <p className="text-[11px] text-text-secondary dark:text-slate-400">
                Penyimpanan dana belanja {username}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Payment Accounts */}
        <div className="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1">
          {PAYMENT_ACCOUNTS.map((acc) => {
            const isSelected = selectedMethod === acc.name;
            const isBCA = acc.id === 'bca';
            const isVisa = acc.id === 'visa';
            const isMastercard = acc.id === 'mastercard';
            const isAlipay = acc.id === 'alipay';

            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleSelectAccount(acc.name)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all min-h-[54px] cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 shadow-sm ring-2 ring-blue-200 dark:ring-blue-900'
                    : 'border-gray-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/70 hover:bg-gray-50/90 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm flex-shrink-0 ${
                      isBCA
                        ? 'bg-[#005EAA]'
                        : isVisa
                        ? 'bg-[#1A1F71]'
                        : isMastercard
                        ? 'bg-[#EB001B]'
                        : isAlipay
                        ? 'bg-[#1677FF]'
                        : acc.type === 'cash'
                        ? 'bg-emerald-600'
                        : acc.type === 'ewallet'
                        ? 'bg-[#00AED6]'
                        : 'bg-indigo-600'
                    }`}
                  >
                    {isBCA
                      ? 'BCA'
                      : isVisa
                      ? 'VISA'
                      : isMastercard
                      ? 'MC'
                      : isAlipay
                      ? '支'
                      : acc.type === 'cash'
                      ? '💵'
                      : acc.type === 'ewallet'
                      ? 'QR'
                      : 'BANK'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-xs sm:text-[13px] text-text-main dark:text-slate-100 truncate">
                        {acc.name}
                      </h4>
                      {isBCA && (
                        <span className="text-[9px] font-extrabold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                          Utama
                        </span>
                      )}
                      {(isVisa || isMastercard) && (
                        <span className="text-[9px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded-full">
                          Debit/Kredit
                        </span>
                      )}
                      {isAlipay && (
                        <span className="text-[9px] font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-1.5 py-0.5 rounded-full">
                          Global Pay
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-secondary dark:text-slate-400 mt-0.5 truncate font-mono">
                      {acc.accountNumber}
                    </p>
                  </div>
                </div>

                <div className="pl-2 flex-shrink-0">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-slate-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Security & Sync Banner */}
        <div className="bg-blue-50/70 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/60 flex items-center gap-2.5 text-[11.5px] text-blue-800 dark:text-blue-300 leading-snug">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span>Pengeluaran belanja otomatis tersinkronisasi ke rekening &amp; riwayat belanja aktif.</span>
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full bg-primary hover:bg-primary-hover active:scale-98 text-white font-extrabold py-3 rounded-xl text-xs sm:text-sm min-h-[46px] cursor-pointer shadow-soft transition-all"
        >
          Konfirmasi Pilihan ({selectedMethod.split(' ')[0]})
        </button>
      </div>
    </div>
  );
};
