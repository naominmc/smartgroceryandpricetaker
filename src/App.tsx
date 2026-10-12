import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialDataIfNeeded } from './db/database';
import { useStore } from './store/useStore';
import { BottomNavigation } from './components/BottomNavigation';
import { ShoppingPage } from './pages/ShoppingPage';
import { HistoryPage } from './pages/HistoryPage';
import { BudgetPage } from './pages/BudgetPage';
import { PaymentMethodSelectorModal } from './components/PaymentMethodSelectorModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { groceryService } from './services/groceryService';
import type { ProductCategory } from './types';
import { CreditCard, Sparkles, Scan, Sun, Moon } from 'lucide-react';

export const App: React.FC = () => {
  const {
    activeTab,
    username,
    selectedPaymentMethod,
    isScannerOpen,
    closeScanner,
    openScanner,
    themeMode,
    toggleThemeMode,
  } = useStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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

  useEffect(() => {
    async function init() {
      try {
        await seedInitialDataIfNeeded();
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
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-amber-50 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-bold text-primary dark:text-blue-400">
            Menyiapkan Troli Belanja {username}...
          </p>
        </div>
      </div>
    );
  }

  const isDark = themeMode === 'dark';

  return (
    <div
      className={`min-h-screen relative flex justify-center items-start sm:py-6 bg-cover bg-center bg-no-repeat transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-100 text-gray-900'
      }`}
      style={{
        backgroundImage: isDark
          ? `linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.94) 100%), url('/supermarket_bg.jpg')`
          : `linear-gradient(135deg, rgba(238, 242, 255, 0.92) 0%, rgba(240, 253, 250, 0.88) 100%), url('/supermarket_bg.jpg')`,
      }}
    >
      {/* Mobile Smartphone Viewport Frame (Max width 430px) */}
      <main className="w-full max-w-[430px] min-h-[100dvh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-text-main dark:text-dark-text flex flex-col relative shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] dark:shadow-dark-float sm:rounded-[36px] sm:overflow-hidden border border-white/60 dark:border-slate-800 transition-colors duration-200">
        
        {/* Top Header with User Profile: naomiiracle, Theme Mode Toggle, Scan, & Bank BCA */}
        <header className="px-4 pt-3.5 pb-2.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 text-white shadow-md relative overflow-hidden border-b dark:border-slate-800">
          {/* Subtle Background Pattern/Glow */}
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 dark:bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-4 w-20 h-20 bg-amber-400/15 rounded-full blur-lg pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between gap-2">
            {/* User Profile Info */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-300 to-pink-400 p-0.5 shadow-md flex-shrink-0">
                <div className="w-full h-full bg-white/90 dark:bg-slate-900 rounded-[14px] flex items-center justify-center font-extrabold text-blue-700 dark:text-blue-400 text-base">
                  N
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-extrabold text-sm tracking-tight text-white leading-none">
                    {username}
                  </h2>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                </div>
                <p className="text-[10px] text-blue-100 dark:text-blue-200 font-medium mt-0.5">
                  Mahasiswa Rantau • Troli Belanja
                </p>
              </div>
            </div>

            {/* Quick Action Buttons: Theme Toggle, Scan, & Bank Selector */}
            <div className="flex items-center gap-1.5">
              {/* Theme Mode Toggle Button (Light / Dark) */}
              <button
                type="button"
                onClick={toggleThemeMode}
                className="bg-white/20 hover:bg-white/30 dark:bg-slate-800/80 dark:hover:bg-slate-800 active:scale-95 text-white font-bold p-2 rounded-xl backdrop-blur-sm transition-all shadow-sm min-h-[36px] min-w-[36px] flex items-center justify-center"
                title={isDark ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
                aria-label={isDark ? 'Mode Terang' : 'Mode Gelap'}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-300" />
                ) : (
                  <Moon className="w-4 h-4 text-blue-100" />
                )}
              </button>

              {/* Scan Barcode Button */}
              <button
                type="button"
                onClick={openScanner}
                className="bg-white/20 hover:bg-white/30 dark:bg-slate-800/80 dark:hover:bg-slate-800 active:scale-95 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-xl backdrop-blur-sm transition-all flex items-center gap-1 shadow-sm min-h-[36px]"
                title="Scan Barcode Barang"
              >
                <Scan className="w-3.5 h-3.5 text-amber-300" />
                <span>Scan</span>
              </button>

              {/* Bank Selector Button (Bank BCA) */}
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="bg-white text-blue-800 dark:bg-blue-600 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-700 active:scale-95 font-extrabold text-[11px] px-2.5 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1 min-h-[36px]"
                title="Pilih Bank / Sumber Dana"
              >
                <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-200" />
                <span className="truncate max-w-[80px]">
                  {selectedPaymentMethod === 'Bank BCA' ? 'BCA' : selectedPaymentMethod}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area with Safe-Area Padding */}
        <div className="flex-1 px-4 pt-3 pb-safe overflow-y-auto">
          {activeTab === 'shopping' && <ShoppingPage />}
          {activeTab === 'history' && <HistoryPage />}
          {activeTab === 'budget' && <BudgetPage />}
        </div>

        {/* Floating Bottom Navigation */}
        <BottomNavigation cartItemCount={cartItems.length} />

        {/* Modals: Barcode Scanner & Payment Method Selector */}
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={closeScanner}
          onAddToCart={handleBarcodeAddToCart}
        />

        <PaymentMethodSelectorModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      </main>
    </div>
  );
};

export default App;
