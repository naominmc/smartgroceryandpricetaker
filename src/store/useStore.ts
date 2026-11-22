import { create } from 'zustand';
import type { CartItem, SupermarketCatalogItem } from '../types';
import { PAYMENT_ACCOUNTS } from '../data/paymentMethods';
import { soundService } from '../utils/sound';

export type NavigationTab = 'shopping' | 'history' | 'budget' | 'profile';
export type ThemeMode = 'light' | 'dark';

export interface UserProfile {
  fullName: string;
  username: string;
  email: string;
  bio: string;
  avatarUrl: string;
  currency: string;
  loginTime: string;
  isGoogleLinked: boolean;
  passwordMasked: string;
}

interface AppState {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // Dark / Light Theme Mode
  themeMode: ThemeMode;
  toggleThemeMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;

  // Sound Effects (Pop on click, Cha-ching on checkout)
  isSoundEnabled: boolean;
  toggleSound: () => void;

  // User Profile
  username: string;
  setUsername: (name: string) => void;
  userProfile: UserProfile;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  isEditingProfile: boolean;
  setIsEditingProfile: (val: boolean) => void;

  // Payment method
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;

  // Session Location & Date
  sessionLocation: string;
  setSessionLocation: (location: string) => void;
  sessionDate: string;
  setSessionDate: (date: string) => void;

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

const getInitialProfile = (): UserProfile => {
  if (typeof window !== 'undefined') {
    const savedPw = localStorage.getItem('sg_password');
    const validPw = savedPw && savedPw !== '••••••••••••••' ? savedPw : 'naomi12345';
    if (!savedPw || savedPw === '••••••••••••••') {
      localStorage.setItem('sg_password', validPw);
    }
    return {
      fullName: localStorage.getItem('sg_fullName') || 'naomi miracle',
      username: localStorage.getItem('sg_username') || 'naomiiracle',
      email: localStorage.getItem('sg_email') || 'naomi@mutiarabangsa.sch.id',
      bio: localStorage.getItem('sg_bio') || 'Mahasiswa Rantau Hemat & Cerdas',
      avatarUrl: localStorage.getItem('sg_avatarUrl') || '',
      currency: localStorage.getItem('sg_currency') || 'ID Rupiah Indonesia (Rp - IDR)',
      loginTime: localStorage.getItem('sg_loginTime') || '22 Nov 2026, 11.12 WIB',
      isGoogleLinked: true,
      passwordMasked: validPw,
    };
  }
  return {
    fullName: 'naomi miracle',
    username: 'naomiiracle',
    email: 'naomi@mutiarabangsa.sch.id',
    bio: 'Mahasiswa Rantau Hemat & Cerdas',
    avatarUrl: '',
    currency: 'ID Rupiah Indonesia (Rp - IDR)',
    loginTime: '22 Nov 2026, 11.12 WIB',
    isGoogleLinked: true,
    passwordMasked: 'naomi12345',
  };
};

export const useStore = create<AppState>((set, get) => {
  const initialProfile = getInitialProfile();

  return {
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

    // Sound effects toggle
    isSoundEnabled: soundService.isEnabled(),
    toggleSound: () => {
      const next = !get().isSoundEnabled;
      soundService.setEnabled(next);
      set({ isSoundEnabled: next });
      if (next) soundService.pop();
    },

    // User profile "naomiiracle" requested by user
    username: initialProfile.username,
    setUsername: (name) => {
      if (typeof window !== 'undefined') localStorage.setItem('sg_username', name);
      set((state) => ({
        username: name,
        userProfile: { ...state.userProfile, username: name },
      }));
    },

    userProfile: initialProfile,
    isEditingProfile: false,
    setIsEditingProfile: (val) => set({ isEditingProfile: val }),
    updateUserProfile: (data) => {
      set((state) => {
        const nextProfile = { ...state.userProfile, ...data };
        if (typeof window !== 'undefined') {
          if (data.fullName !== undefined) localStorage.setItem('sg_fullName', data.fullName);
          if (data.username !== undefined) localStorage.setItem('sg_username', data.username);
          if (data.email !== undefined) localStorage.setItem('sg_email', data.email);
          if (data.bio !== undefined) localStorage.setItem('sg_bio', data.bio);
          if (data.avatarUrl !== undefined) localStorage.setItem('sg_avatarUrl', data.avatarUrl);
          if (data.currency !== undefined) localStorage.setItem('sg_currency', data.currency);
          if (data.passwordMasked !== undefined) localStorage.setItem('sg_password', data.passwordMasked);
        }
        return {
          userProfile: nextProfile,
          username: nextProfile.username,
        };
      });
    },

    // Default payment storage / bank: Bank BCA requested by user
    selectedPaymentMethod: PAYMENT_ACCOUNTS[0].name, // 'Bank BCA'
    setSelectedPaymentMethod: (method) => set({ selectedPaymentMethod: method }),

    sessionLocation: typeof window !== 'undefined' ? (localStorage.getItem('smart_grocery_location') || 'LOTTE MART GROCERY - PURI INDAH').toUpperCase() : 'LOTTE MART GROCERY - PURI INDAH',
    setSessionLocation: (loc) => {
      const upperLoc = (loc || '').toUpperCase();
      if (typeof window !== 'undefined') localStorage.setItem('smart_grocery_location', upperLoc);
      set({ sessionLocation: upperLoc });
      if (typeof window !== 'undefined' && (window as any).__smart_grocery_notify_sync) {
        (window as any).__smart_grocery_notify_sync();
      }
    },
    sessionDate: new Date().toISOString().split('T')[0],
    setSessionDate: (d) => {
      set({ sessionDate: d });
      if (typeof window !== 'undefined' && (window as any).__smart_grocery_notify_sync) {
        (window as any).__smart_grocery_notify_sync();
      }
    },

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
  };
});
