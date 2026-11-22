import React, { useState, useEffect } from 'react';
import { X, Smartphone, AlertCircle, EyeOff, Clock } from 'lucide-react';
import { pwaService } from '../utils/pwa';

export const PWAInstallBanner: React.FC = () => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);

  useEffect(() => {
    setIsStandalone(pwaService.isStandalone());

    const updateVisibility = () => {
      if (pwaService.isStandalone() || pwaService.isDismissed()) {
        setIsOpen(false);
      } else if (pwaService.getPrompt() || pwaService.isIOS()) {
        setIsOpen(true);
      }
    };

    updateVisibility();

    const handlePrompt = () => updateVisibility();
    const handleDismissChange = () => updateVisibility();

    window.addEventListener('pwa-prompt-available', handlePrompt);
    window.addEventListener('pwa-dismiss-changed', handleDismissChange);

    return () => {
      window.removeEventListener('pwa-prompt-available', handlePrompt);
      window.removeEventListener('pwa-dismiss-changed', handleDismissChange);
    };
  }, []);

  const handleInstallClick = async () => {
    const outcome = await pwaService.install();
    if (outcome === 'accepted') {
      setIsOpen(false);
    } else if (outcome === 'ios') {
      setShowIOSModal(true);
    }
  };

  const handleDismissForever = () => {
    pwaService.setDismissed(true);
    setShowDismissConfirm(false);
    setIsOpen(false);
  };

  const handleDismissTemporary = () => {
    setShowDismissConfirm(false);
    setIsOpen(false);
  };

  if (isStandalone || pwaService.isDismissed()) return null;

  return (
    <>
      {isOpen && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-2xl shadow-float mb-3 flex items-center justify-between gap-2.5 animate-slide-up">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs leading-tight truncate">
                Pasang di Layar Utama (PWA)
              </h4>
              <p className="text-[10px] text-blue-100 truncate">
                Bisa dibuka cepat saat dorong troli tanpa internet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="bg-white text-primary hover:bg-blue-50 active:scale-95 font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all min-h-[36px] cursor-pointer"
            >
              Pasang
            </button>
            <button
              type="button"
              onClick={() => setShowDismissConfirm(true)}
              className="p-1.5 text-white/80 hover:text-white rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Tutup Banner"
              title="Tutup Notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal Saat Pencet Tombol X (Opsi Jangan Munculkan Lagi) */}
      {showDismissConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 w-full max-w-[320px] shadow-2xl space-y-3 animate-slide-up">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-text-main dark:text-slate-100 leading-tight">
                  Sembunyikan Notifikasi PWA?
                </h3>
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleDismissForever}
                className="w-full py-2.5 px-3 rounded-xl bg-red-50 dark:bg-rose-950/40 text-danger dark:text-rose-400 hover:bg-red-100 dark:hover:bg-rose-900/50 font-bold text-xs border border-red-200 dark:border-rose-900/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Jangan Munculkan Lagi</span>
              </button>

              <button
                type="button"
                onClick={handleDismissTemporary}
                className="w-full py-2 px-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-text-secondary dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 font-semibold text-xs border border-gray-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Tutup Sementara Saja</span>
              </button>
            </div>

            <p className="text-[9.5px] text-center text-text-secondary dark:text-slate-500">
              *Aplikasi tetap bisa dipasang kapan saja lewat menu <strong>Profil</strong>.
            </p>
          </div>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-[360px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-modal animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-text-main dark:text-slate-100">
                Pasang di iPhone / iPad
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="space-y-2 text-xs text-text-secondary dark:text-slate-300 mb-4 list-decimal list-inside">
              <li>
                Ketuk tombol <strong className="text-primary dark:text-blue-400">Share</strong> (ikon kotak panah atas) di bilah Safari.
              </li>
              <li>
                Gulir ke bawah dan pilih{' '}
                <strong className="text-text-main dark:text-slate-100">Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
              </li>
              <li>
                Ketuk <strong className="text-primary dark:text-blue-400">Tambah (Add)</strong> di pojok kanan atas.
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-primary hover:bg-primary-hover active:scale-98 text-white font-bold py-2.5 rounded-xl text-xs min-h-[42px] cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
