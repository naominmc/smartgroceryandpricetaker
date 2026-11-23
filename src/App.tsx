import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialDataIfNeeded } from './db/database';
import { useStore } from './store/useStore';
import { BottomNavigation } from './components/BottomNavigation';
import { ShoppingPage } from './pages/ShoppingPage';
import { HistoryPage } from './pages/HistoryPage';
import { BudgetPage } from './pages/BudgetPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { PaymentMethodSelectorModal } from './components/PaymentMethodSelectorModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { SyncModal } from './components/SyncModal';
import { syncService } from './services/syncService';
import { groceryService } from './services/groceryService';
import { soundService } from './utils/sound';
import { t } from './utils/i18n';
import type { ProductCategory } from './types';
import { CreditCard, Scan, Sun, Moon, Volume2, VolumeX } from 'lucide-react';

export const App: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    username,
    selectedPaymentMethod,
    isScannerOpen,
    closeScanner,
    openScanner,
    themeMode,
    toggleThemeMode,
    isSoundEnabled,
    toggleSound,
    isEditingProfile,
    language,
  } = useStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('smart_grocery_authenticated') === 'true';
    }
    return false;
  });
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getShortPaymentName = (method: string): string => {
    if (!method) return 'BCA';
    if (method.includes('Alipay')) return 'Alipay';
    if (method.includes('Visa')) return 'VISA';
    if (method.includes('Mastercard')) return 'MC';
    if (method.includes('GoPay') || method.includes('QRIS')) return 'GoPay';
    if (method.includes('Mandiri')) return 'Mandiri';
    if (method.includes('Blu')) return 'Blu BCA';
    if (method.includes('Tunai') || method.includes('Cash')) {
      return language === 'zh' ? '现金' : language === 'en' ? 'Cash' : 'Tunai';
    }
    if (method.includes('BCA')) return 'BCA';
    return method.replace('Bank ', '').split(' ')[0] || 'Bank';
  };

  const handleTriggerRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    soundService.pop();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  // Pull-to-refresh on mobile scroll container
  useEffect(() => {
    const container = document.getElementById('app-scroll-container');
    if (!container) return;

    let startY = 0;
    let isTracking = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop <= 2) {
        startY = e.touches[0].clientY;
        isTracking = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTracking || container.scrollTop > 2) return;
      const currentY = e.touches[0].clientY;
      if (currentY - startY > 65) {
        isTracking = false;
        handleTriggerRefresh();
      }
    };

    const handleTouchEnd = () => {
      isTracking = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing]);

  // Load cart items count for navigation badge
  const cartItems = useLiveQuery(() => db.cartItems.toArray()) || [];

  // Initialize theme mode on html root element
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  // Global click sound effect (pop sound on buttons & interactive elements)
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest(
        'button, a, input[type="button"], input[type="submit"], input[type="checkbox"], [role="button"], select'
      );
      if (interactive) {
        soundService.pop();
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);

  useEffect(() => {
    async function init() {
      try {
        await seedInitialDataIfNeeded();
        syncService.init();
      } catch (err) {
        console.error('Failed to initialize seed data:', err);
      } finally {
        setIsInitialized(true);
      }
    }
    init();
  }, []);

  const handleBarcodeAddToCart = async (item: {
    name: string;
    category: ProductCategory;
    unit: string;
    quantity: number;
    unitPrice: number;
    discounts: number[];
  }) => {
    await groceryService.addItemToCart(item);
    setActiveTab('shopping');
    soundService.playSuccess();
  };

  const handleLogout = () => {
    setActiveTab('shopping');
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('smart_grocery_authenticated');
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-amber-50 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-bold text-primary dark:text-blue-400">
            {language === 'zh'
              ? `正在准备 ${username} 的购物车...`
              : language === 'en'
              ? `Preparing ${username}'s Shopping Cart...`
              : `Menyiapkan Troli Belanja ${username}...`}
          </p>
        </div>
      </div>
    );
  }

  // Tampilkan Halaman Login / Welcome saat pertama kali membuka web atau saat logout
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={() => {
          setActiveTab('shopping');
          setIsAuthenticated(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem('smart_grocery_authenticated', 'true');
          }
        }}
      />
    );
  }

  const isDark = themeMode === 'dark';

  return (
    <div
      className={`min-h-[100dvh] h-[100dvh] w-full overflow-hidden relative flex justify-center items-center sm:py-6 bg-cover bg-center bg-no-repeat transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-100 text-gray-900'
      }`}
      style={{
        backgroundImage: isDark
          ? `linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.94) 100%), url('/supermarket_bg.jpg')`
          : `linear-gradient(135deg, rgba(238, 242, 255, 0.92) 0%, rgba(240, 253, 250, 0.88) 100%), url('/supermarket_bg.jpg')`,
      }}
    >
      {/* Mobile Smartphone Viewport Frame (Fixed full screen on mobile, 430px frame on laptop/desktop) */}
      <main className="w-full h-full sm:max-w-[430px] sm:h-[calc(100vh-3rem)] sm:max-h-[920px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-text-main dark:text-dark-text flex flex-col fixed inset-0 sm:relative sm:inset-auto shadow-none sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] dark:sm:shadow-dark-float rounded-none sm:rounded-[36px] overflow-hidden border-0 sm:border border-white/60 dark:border-slate-800 transition-colors duration-200">
        
        {/* Top Header with App Logo & Name, Theme Mode Toggle, Sound Toggle, Scan, & Bank BCA */}
        <header className="flex-shrink-0 px-4 pt-3.5 pb-2.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 text-white shadow-md relative overflow-hidden border-b dark:border-slate-800">
          {/* Subtle Background Pattern/Glow */}
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 dark:bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-4 w-20 h-20 bg-amber-400/15 rounded-full blur-lg pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between gap-1.5 sm:gap-2">
            {/* App Logo Maskot Capybara (Kotak outline muter saat refresh / load) & App Name */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                onClick={handleTriggerRefresh}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl p-0.5 shadow-md flex-shrink-0 relative group cursor-pointer overflow-hidden transition-all duration-300 ${
                  isRefreshing
                    ? 'bg-gradient-to-tr from-amber-400 via-rose-500 via-indigo-500 to-emerald-400 animate-spin-outline'
                    : 'bg-gradient-to-br from-amber-300 via-orange-400 to-indigo-500'
                }`}
                title={language === 'zh' ? '下拉或点击标志以刷新' : language === 'en' ? 'Pull down or click logo to refresh' : 'Tarik ke bawah atau klik logo untuk refresh'}
              >
                <div className="w-full h-full bg-white/95 dark:bg-slate-900 rounded-[14px] overflow-hidden flex items-center justify-center">
                  <img
                    src="/capybara_logo.png"
                    alt="Capybara Smart Grocery"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/capybara_mascot.svg';
                    }}
                  />
                </div>
              </div>

              <div className="min-w-0">
                <h1 className="font-black text-sm sm:text-base tracking-tight text-white leading-none flex items-center gap-1 whitespace-nowrap">
                  <span>Smart Grocery</span>
                </h1>
              </div>
            </div>

            {/* Quick Action Buttons: Theme Toggle, Sound Toggle, Scan, & Bank Selector */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              {/* Theme Mode Toggle Button (Light / Dark) */}
              <button
                type="button"
                onClick={toggleThemeMode}
                className="bg-white/20 hover:bg-white/30 dark:bg-slate-800/80 dark:hover:bg-slate-800 active:scale-95 text-white font-bold p-1.5 sm:p-2 rounded-xl backdrop-blur-sm transition-all shadow-sm min-h-[34px] min-w-[34px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center cursor-pointer"
                title={isDark ? t('themeLight', language) : t('themeDark', language)}
                aria-label={isDark ? t('themeLight', language) : t('themeDark', language)}
              >
                {isDark ? (
                  <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                ) : (
                  <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-100" />
                )}
              </button>

              {/* Sound Effect Toggle Button (Next to Light/Dark Mode Toggle) */}
              <button
                type="button"
                onClick={toggleSound}
                className="bg-white/20 hover:bg-white/30 dark:bg-slate-800/80 dark:hover:bg-slate-800 active:scale-95 text-white font-bold p-1.5 sm:p-2 rounded-xl backdrop-blur-sm transition-all shadow-sm min-h-[34px] min-w-[34px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center cursor-pointer"
                title={isSoundEnabled ? t('soundMute', language) : t('soundOn', language)}
                aria-label={isSoundEnabled ? t('soundOn', language) : t('soundMute', language)}
              >
                {isSoundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 opacity-60" />
                )}
              </button>

              {/* Scan Barcode Button (Hanya Logo/Icon Saja) */}
              <button
                type="button"
                onClick={openScanner}
                className="bg-white/20 hover:bg-white/30 dark:bg-slate-800/80 dark:hover:bg-slate-800 active:scale-95 text-white font-bold p-1.5 sm:p-2 rounded-xl backdrop-blur-sm transition-all shadow-sm min-h-[34px] min-w-[34px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center cursor-pointer"
                title={t('scanBarcode', language)}
                aria-label={t('scanBarcode', language)}
              >
                <Scan className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
              </button>

              {/* Bank Selector Button (Dinamis Sesuai Akun Bank Terpilih) */}
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="bg-white text-blue-800 dark:bg-blue-600 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-700 active:scale-95 font-extrabold text-[10.5px] sm:text-[11px] px-2 sm:px-2.5 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1 min-h-[34px] sm:min-h-[36px] cursor-pointer whitespace-nowrap"
                title={`${t('paymentSource', language)} (${selectedPaymentMethod})`}
              >
                <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-200 flex-shrink-0" />
                <span className="truncate max-w-[65px] sm:max-w-[85px]">{getShortPaymentName(selectedPaymentMethod)}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area with Safe-Area Padding */}
        <div id="app-scroll-container" className="flex-1 px-4 pt-3 pb-safe overflow-y-auto overscroll-contain">
          {activeTab === 'shopping' && <ShoppingPage />}
          {activeTab === 'history' && <HistoryPage />}
          {activeTab === 'budget' && <BudgetPage />}
          {activeTab === 'profile' && <ProfilePage onLogout={handleLogout} />}
        </div>

        {/* Floating Bottom Navigation */}
        <BottomNavigation
          cartItemCount={cartItems.length}
        />

        {/* Modals: Barcode Scanner, Payment Method Selector, & Sync */}
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={closeScanner}
          onAddToCart={handleBarcodeAddToCart}
        />

        <PaymentMethodSelectorModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
        />

        <SyncModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
        />
      </main>
    </div>
  );
};

export default App;
