import React, { useState } from 'react';
import { Languages, Check, X, AlertCircle } from 'lucide-react';
import { t, type AppLanguage, getLanguageDisplayName } from '../utils/i18n';
import { soundService } from '../utils/sound';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: AppLanguage;
  onConfirmLanguage: (newLang: AppLanguage) => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onConfirmLanguage,
}) => {
  const [pendingLanguage, setPendingLanguage] = useState<AppLanguage | null>(null);

  if (!isOpen) return null;

  const languages: { id: AppLanguage; name: string }[] = [
    { id: 'id', name: 'Indonesia' },
    { id: 'en', name: 'English' },
    { id: 'zh', name: '中文' },
  ];

  const handleLanguageClick = (lang: AppLanguage) => {
    soundService.pop();
    if (lang === currentLanguage) {
      onClose();
      return;
    }
    // Show confirmation warning so it cannot be selected by accident
    setPendingLanguage(lang);
  };

  const handleConfirm = () => {
    if (!pendingLanguage) return;
    soundService.pop();
    onConfirmLanguage(pendingLanguage);
    setPendingLanguage(null);
    onClose();
  };

  const handleCancelPending = () => {
    soundService.pop();
    setPendingLanguage(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm border border-gray-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-scale-up text-text-main dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-primary dark:text-blue-400 flex items-center justify-center">
              <Languages className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-slate-100">
              {t('selectLangTitle', currentLanguage)}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pending Confirmation Warning State */}
        {pendingLanguage ? (
          <div className="space-y-4 py-1">
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-xs text-amber-900 dark:text-amber-200">
                {t('confirmLangTitle', currentLanguage)}
              </h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed font-medium">
                {t('confirmLangDesc', currentLanguage, {
                  lang: getLanguageDisplayName(pendingLanguage),
                })}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelPending}
                className="flex-1 py-2.5 px-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-750 transition-all cursor-pointer min-h-[40px]"
              >
                {t('cancelBtn', currentLanguage)}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-extrabold shadow-soft transition-all active:scale-98 cursor-pointer min-h-[40px]"
              >
                {t('confirmLangBtn', currentLanguage)}
              </button>
            </div>
          </div>
        ) : (
          /* List Pilihan Bahasa (Langsung Nama Tanpa Logo / Bendera) */
          <div className="space-y-2 py-1">
            {languages.map((item) => {
              const isSelected = currentLanguage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleLanguageClick(item.id)}
                  className={`w-full py-3 px-4 rounded-2xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer min-h-[46px] ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-primary text-primary dark:text-blue-400 ring-1 ring-primary shadow-xs font-black'
                      : 'bg-white dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-800 dark:text-slate-100'
                  }`}
                >
                  <span className="text-xs sm:text-sm">{item.name}</span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

