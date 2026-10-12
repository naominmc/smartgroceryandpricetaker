import React, { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isInStandaloneMode);

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsOpen(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  if (isStandalone) return null;

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
              className="bg-white text-primary hover:bg-blue-50 active:scale-95 font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all min-h-[36px]"
            >
              Pasang
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-white/80 hover:text-white rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Tutup Banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-[360px] bg-white rounded-card-lg p-5 shadow-modal animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base text-text-main">Pasang di iPhone / iPad</h3>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="space-y-3 text-xs text-text-secondary mb-4 list-decimal list-inside">
              <li>
                Ketuk tombol <strong className="text-primary">Share</strong> (ikon kotak dengan panah ke atas) di bilah bawah Safari.
              </li>
              <li>
                Gulir ke bawah dan pilih{' '}
                <strong className="text-text-main">Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
              </li>
              <li>
                Ketuk <strong className="text-primary">Tambah (Add)</strong> di pojok kanan atas.
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-primary text-white font-bold py-2.5 rounded-xl text-xs min-h-[44px]"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
