import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  isDangerous = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-[360px] bg-white dark:bg-slate-900 rounded-card-lg p-5 shadow-modal animate-slide-up border dark:border-slate-800"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isDangerous
                ? 'bg-red-50 dark:bg-rose-950/80 text-danger dark:text-rose-400'
                : 'bg-blue-50 dark:bg-blue-950/80 text-primary dark:text-blue-400'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-text-main dark:text-slate-100 leading-tight">{title}</h3>
          </div>
        </div>

        <p className="text-xs text-text-secondary dark:text-slate-300 leading-relaxed mb-5">{message}</p>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-3 rounded-xl border border-gray-300 dark:border-slate-700 font-semibold text-xs text-text-main dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-95 transition-all min-h-[44px]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs text-white active:scale-95 transition-all min-h-[44px] shadow-soft ${
              isDangerous
                ? 'bg-danger hover:bg-red-700'
                : 'bg-primary hover:bg-primary-hover'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
