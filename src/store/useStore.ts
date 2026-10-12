import { create } from 'zustand';
import type { CartItem, SupermarketCatalogItem } from '../types';
import { PAYMENT_ACCOUNTS } from '../data/paymentMethods';

export type NavigationTab = 'shopping' | 'history' | 'budget';
export type ThemeMode = 'light' | 'dark';

interface AppState {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // Dark / Light Theme Mode
  themeMode: ThemeMode;
  toggleThemeMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;

  // User Profile
  username: string;
  setUsername: (name: string) => void;

  // Payment method
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;

  // Add/Edit sheet state
  isAddItemSheetOpen: boolean;
  editingItem: CartItem | null;
  openAddItemSheet: (itemToEdit?: CartItem | null) => void;
  closeAddItemSheet: () => void;

  // Barcode Scanner Modal state
  isScannerOpen: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  scannedItemPending: SupermarketCatalogItem | null;
  setScannedItemPending: (item: SupermarketCatalogItem | null) => void;

  // Checkout modal
  isCheckoutModalOpen: boolean;
  openCheckoutModal: () => void;
  closeCheckoutModal: () => void;

  // History filtering & search
  historyPeriodFilter: string;
  setHistoryPeriodFilter: (period: string) => void;
  historySearchQuery: string;
  setHistorySearchQuery: (query: string) => void;

  // Online / Offline state
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

const getInitialTheme = (): ThemeMode => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('smart_grocery_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  }
  return 'light';
};

export const useStore = create<AppState>((set, get) => ({
  activeTab: 'shopping',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Theme Mode
  themeMode: getInitialTheme(),
  toggleThemeMode: () => {
    const nextMode: ThemeMode = get().themeMode === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      localStorage.setItem('smart_grocery_theme', nextMode);
      if (nextMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ themeMode: nextMode });
  },
  setThemeMode: (mode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('smart_grocery_theme', mode);
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ themeMode: mode });
  },

  // User profile "naomiiracle" requested by user
  username: 'naomiiracle',
  setUsername: (name) => set({ username: name }),

  // Default payment storage / bank: Bank BCA requested by user
  selectedPaymentMethod: PAYMENT_ACCOUNTS[0].name, // 'Bank BCA'
  setSelectedPaymentMethod: (method) => set({ selectedPaymentMethod: method }),

  isAddItemSheetOpen: false,
  editingItem: null,
  openAddItemSheet: (itemToEdit = null) =>
    set({ isAddItemSheetOpen: true, editingItem: itemToEdit }),
  closeAddItemSheet: () =>
    set({ isAddItemSheetOpen: false, editingItem: null }),

  // Barcode scanner
  isScannerOpen: false,
  openScanner: () => set({ isScannerOpen: true }),
  closeScanner: () => set({ isScannerOpen: false, scannedItemPending: null }),
  scannedItemPending: null,
  setScannedItemPending: (item) => set({ scannedItemPending: item }),

  isCheckoutModalOpen: false,
  openCheckoutModal: () => set({ isCheckoutModalOpen: true }),
  closeCheckoutModal: () => set({ isCheckoutModalOpen: false }),

  historyPeriodFilter: 'all',
  setHistoryPeriodFilter: (period) => set({ historyPeriodFilter: period }),
  historySearchQuery: '',
  setHistorySearchQuery: (query) => set({ historySearchQuery: query }),

  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setIsOnline: (online) => set({ isOnline: online }),
}));
