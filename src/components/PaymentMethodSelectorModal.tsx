import React from 'react';
import { X, Check, CreditCard, ShieldCheck } from 'lucide-react';
import { PAYMENT_ACCOUNTS } from '../data/paymentMethods';
import { useStore } from '../store/useStore';

interface PaymentMethodSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentMethodSelectorModal: React.FC<PaymentMethodSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { selectedPaymentMethod, setSelectedPaymentMethod, username } = useStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-[390px] bg-white dark:bg-slate-900 rounded-t-card-lg sm:rounded-card-lg p-5 shadow-modal animate-slide-up border dark:border-slate-800"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-main dark:text-slate-100">Pilih Sumber Rekening / Bank</h3>
              <p className="text-[11px] text-text-secondary dark:text-slate-400">Penyimpanan dana belanja {username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Payment Accounts */}
        <div className="space-y-2.5 py-4">
          {PAYMENT_ACCOUNTS.map((acc) => {
            const isSelected = selectedPaymentMethod === acc.name;
            const isBCA = acc.id === 'bca';

            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => {
                  setSelectedPaymentMethod(acc.name);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all min-h-[52px] ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 shadow-sm ring-2 ring-blue-100 dark:ring-blue-900'
                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm ${
                      isBCA
                        ? 'bg-[#005EAA]'
                        : acc.type === 'cash'
                        ? 'bg-emerald-600'
                        : acc.type === 'ewallet'
                        ? 'bg-[#00AED6]'
                        : 'bg-indigo-600'
                    }`}
                  >
                    {isBCA ? 'BCA' : acc.type === 'cash' ? '💵' : acc.type === 'ewallet' ? 'QR' : 'BANK'}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-text-main dark:text-slate-100">{acc.name}</h4>
                      {isBCA && (
                        <span className="text-[9px] font-extrabold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-1.5 py-0.2 rounded-full">
                          Utama
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-secondary dark:text-slate-400 mt-0.5">
                      {acc.accountNumber}
                    </p>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-gray-300 dark:border-slate-600" />
                )}
              </button>
            );
          })}
        </div>

        <div className="bg-gray-50 dark:bg-slate-800 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700 flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400 mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>Pengeluaran belanja akan otomatis dialokasikan ke rekening terpilih.</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold py-2.5 rounded-xl text-xs min-h-[44px]"
        >
          Konfirmasi Pilihan
        </button>
      </div>
    </div>
  );
};
