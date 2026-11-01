// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// src/App.tsx
import React17, { useEffect as useEffect6, useState as useState8 } from "react";
import { useLiveQuery as useLiveQuery4 } from "dexie-react-hooks";

// src/db/database.ts
import Dexie from "dexie";

// src/utils/priceComparison.ts
function comparePrices(currentPrice, previousPrice, currentUnit, previousUnit) {
  const safeCurrent = Math.max(0, Math.round(Number(currentPrice) || 0));
  if (previousPrice === null || previousPrice === void 0 || isNaN(previousPrice) || previousPrice <= 0) {
    return {
      hasPreviousData: false,
      currentPrice: safeCurrent,
      difference: 0,
      percentageChange: 0,
      status: "no_data"
    };
  }
  if (currentUnit && previousUnit && currentUnit.toLowerCase().trim() !== previousUnit.toLowerCase().trim()) {
    return {
      hasPreviousData: false,
      currentPrice: safeCurrent,
      difference: 0,
      percentageChange: 0,
      status: "no_data"
    };
  }
  const safePrevious = Math.round(previousPrice);
  const difference = safeCurrent - safePrevious;
  if (safePrevious === 0) {
    return {
      hasPreviousData: false,
      currentPrice: safeCurrent,
      difference: 0,
      percentageChange: 0,
      status: "no_data"
    };
  }
  const rawPercent = difference / safePrevious * 100;
  const percentageChange = Number(Math.abs(rawPercent).toFixed(1));
  let status = "equal";
  if (difference > 0) {
    status = "up";
  } else if (difference < 0) {
    status = "down";
  } else {
    status = "equal";
  }
  return {
    hasPreviousData: true,
    previousPrice: safePrevious,
    currentPrice: safeCurrent,
    difference,
    percentageChange,
    status
  };
}
function getPreviousMonthPeriod(currentPeriod) {
  let date;
  if (currentPeriod) {
    const [year, month] = currentPeriod.split("-").map(Number);
    date = new Date(year, month - 1, 1);
  } else {
    date = /* @__PURE__ */ new Date();
  }
  date.setMonth(date.getMonth() - 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
function getCurrentMonthPeriod() {
  const date = /* @__PURE__ */ new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
function formatPeriodLabel(period) {
  if (!period) return "";
  const [year, month] = period.split("-").map(Number);
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
  ];
  if (month >= 1 && month <= 12) {
    return `${months[month - 1]} ${year}`;
  }
  return period;
}

// src/db/database.ts
var GroceryDatabase = class extends Dexie {
  products;
  cartItems;
  budgets;
  transactions;
  constructor() {
    super("SmartGroceryDB");
    this.version(1).stores({
      products: "id, normalizedName, category, createdAt",
      cartItems: "id, productId, status, createdAt",
      budgets: "id, period, createdAt",
      transactions: "id, period, purchasedAt"
    });
  }
};
var db = new GroceryDatabase();
async function seedInitialDataIfNeeded() {
  const budgetCount = await db.budgets.count();
  const txCount = await db.transactions.count();
  const currentPeriod = getCurrentMonthPeriod();
  const prevPeriod = getPreviousMonthPeriod(currentPeriod);
  if (budgetCount === 0) {
    await db.budgets.put({
      id: `budget-${currentPeriod}`,
      period: currentPeriod,
      limit: 12e5,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    await db.budgets.put({
      id: `budget-${prevPeriod}`,
      period: prevPeriod,
      limit: 12e5,
      createdAt: new Date(Date.now() - 30 * 864e5).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 864e5).toISOString()
    });
  }
  if (txCount === 0) {
    const sampleProducts = [
      {
        id: "prod-beras-5kg",
        name: "Beras Pandan Wangi 5kg",
        normalizedName: "beras pandan wangi 5kg",
        category: "Beras dan bahan pokok",
        unit: "pack",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "prod-minyak-2l",
        name: "Minyak Goreng 2L",
        normalizedName: "minyak goreng 2l",
        category: "Beras dan bahan pokok",
        unit: "pack",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "prod-susu-uht",
        name: "Susu UHT Full Cream 1L",
        normalizedName: "susu uht full cream 1l",
        category: "Susu dan produk dingin",
        unit: "botol",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "prod-telur-1kg",
        name: "Telur Ayam Negeri 1kg",
        normalizedName: "telur ayam negeri 1kg",
        category: "Daging dan protein",
        unit: "kg",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "prod-mie-instan",
        name: "Mie Instan Kuah Soto (5 bungkus)",
        normalizedName: "mie instan kuah soto (5 bungkus)",
        category: "Makanan instan",
        unit: "pack",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "prod-sabun-mandi",
        name: "Sabun Mandi Cair 450ml",
        normalizedName: "sabun mandi cair 450ml",
        category: "Perlengkapan mandi",
        unit: "botol",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    await db.products.bulkPut(sampleProducts);
    const prevDate = /* @__PURE__ */ new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    prevDate.setDate(15);
    const prevTx = {
      id: `tx-history-${prevPeriod}-01`,
      period: prevPeriod,
      purchasedAt: prevDate.toISOString(),
      budgetLimitSnapshot: 12e5,
      grossTotal: 255e3,
      discountTotal: 15e3,
      finalTotal: 24e4,
      items: [
        {
          id: "item-hist-1",
          productId: "prod-beras-5kg",
          nameSnapshot: "Beras Pandan Wangi 5kg",
          categorySnapshot: "Beras dan bahan pokok",
          unit: "pack",
          quantity: 1,
          unitPrice: 72e3,
          discounts: [5],
          grossSubtotal: 72e3,
          discountAmount: 3600,
          finalSubtotal: 68400
        },
        {
          id: "item-hist-2",
          productId: "prod-minyak-2l",
          nameSnapshot: "Minyak Goreng 2L",
          categorySnapshot: "Beras dan bahan pokok",
          unit: "pack",
          quantity: 1,
          unitPrice: 38e3,
          discounts: [],
          grossSubtotal: 38e3,
          discountAmount: 0,
          finalSubtotal: 38e3
        },
        {
          id: "item-hist-3",
          productId: "prod-telur-1kg",
          nameSnapshot: "Telur Ayam Negeri 1kg",
          categorySnapshot: "Daging dan protein",
          unit: "kg",
          quantity: 2,
          unitPrice: 28e3,
          discounts: [],
          grossSubtotal: 56e3,
          discountAmount: 0,
          finalSubtotal: 56e3
        },
        {
          id: "item-hist-4",
          productId: "prod-susu-uht",
          nameSnapshot: "Susu UHT Full Cream 1L",
          categorySnapshot: "Susu dan produk dingin",
          unit: "botol",
          quantity: 2,
          unitPrice: 2e4,
          discounts: [10],
          grossSubtotal: 4e4,
          discountAmount: 4e3,
          finalSubtotal: 36e3
        }
      ]
    };
    await db.transactions.put(prevTx);
    const activeCartCount = await db.cartItems.count();
    if (activeCartCount === 0) {
      await db.cartItems.bulkPut([
        {
          id: "cart-init-1",
          productId: "prod-beras-5kg",
          nameSnapshot: "Beras Pandan Wangi 5kg",
          categorySnapshot: "Beras dan bahan pokok",
          unit: "pack",
          quantity: 1,
          unitPrice: 75e3,
          // rose from 72.000 to 75.000 (demonstrates +4.2% up)
          discounts: [5],
          previousUnitPrice: 72e3,
          status: "active",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          id: "cart-init-2",
          productId: "prod-telur-1kg",
          nameSnapshot: "Telur Ayam Negeri 1kg",
          categorySnapshot: "Daging dan protein",
          unit: "kg",
          quantity: 1,
          unitPrice: 26e3,
          // dropped from 28.000 to 26.000 (demonstrates -7.1% down)
          discounts: [],
          previousUnitPrice: 28e3,
          status: "active",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      ]);
    }
  }
}

// src/store/useStore.ts
import { create } from "zustand";

// src/data/paymentMethods.ts
var PAYMENT_ACCOUNTS = [
  {
    id: "bca",
    name: "Bank BCA",
    type: "bank",
    accountNumber: "5271-8892-01 (naomiiracle)",
    color: "#005EAA",
    badge: "\u{1F535} Bank BCA (Utama)"
  },
  {
    id: "blu_bca",
    name: "Blu by BCA Digital",
    type: "bank",
    accountNumber: "0812-9988-7766",
    color: "#00A3E0",
    badge: "\u{1F537} Blu BCA"
  },
  {
    id: "cash",
    name: "Dompet Tunai / Cash",
    type: "cash",
    accountNumber: "Uang Fisik di Dompet",
    color: "#16A34A",
    badge: "\u{1F4B5} Tunai"
  },
  {
    id: "gopay",
    name: "GoPay / QRIS",
    type: "ewallet",
    accountNumber: "0812-****-4512",
    color: "#00AED6",
    badge: "\u{1F4F1} QRIS / GoPay"
  },
  {
    id: "mandiri",
    name: "Bank Mandiri (Livin)",
    type: "bank",
    accountNumber: "1370-0199-2811",
    color: "#003D79",
    badge: "\u{1F7E1} Mandiri"
  }
];
var DEFAULT_PAYMENT_ACCOUNT = PAYMENT_ACCOUNTS[0];

// src/store/useStore.ts
var getInitialTheme = () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("smart_grocery_theme");
    if (saved === "dark" || saved === "light") return saved;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  }
  return "light";
};
var useStore = create((set, get) => ({
  activeTab: "shopping",
  setActiveTab: (tab) => set({ activeTab: tab }),
  // Theme Mode
  themeMode: getInitialTheme(),
  toggleThemeMode: () => {
    const nextMode = get().themeMode === "dark" ? "light" : "dark";
    if (typeof window !== "undefined") {
      localStorage.setItem("smart_grocery_theme", nextMode);
      if (nextMode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    set({ themeMode: nextMode });
  },
  setThemeMode: (mode) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("smart_grocery_theme", mode);
      if (mode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    set({ themeMode: mode });
  },
  // User profile "naomiiracle" requested by user
  username: "naomiiracle",
  setUsername: (name) => set({ username: name }),
  // Default payment storage / bank: Bank BCA requested by user
  selectedPaymentMethod: PAYMENT_ACCOUNTS[0].name,
  // 'Bank BCA'
  setSelectedPaymentMethod: (method) => set({ selectedPaymentMethod: method }),
  isAddItemSheetOpen: false,
  editingItem: null,
  openAddItemSheet: (itemToEdit = null) => set({ isAddItemSheetOpen: true, editingItem: itemToEdit }),
  closeAddItemSheet: () => set({ isAddItemSheetOpen: false, editingItem: null }),
  // Barcode scanner
  isScannerOpen: false,
  openScanner: () => set({ isScannerOpen: true }),
  closeScanner: () => set({ isScannerOpen: false, scannedItemPending: null }),
  scannedItemPending: null,
  setScannedItemPending: (item) => set({ scannedItemPending: item }),
  isCheckoutModalOpen: false,
  openCheckoutModal: () => set({ isCheckoutModalOpen: true }),
  closeCheckoutModal: () => set({ isCheckoutModalOpen: false }),
  historyPeriodFilter: "all",
  setHistoryPeriodFilter: (period) => set({ historyPeriodFilter: period }),
  historySearchQuery: "",
  setHistorySearchQuery: (query) => set({ historySearchQuery: query }),
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  setIsOnline: (online) => set({ isOnline: online })
}));

// src/components/BottomNavigation.tsx
import React2 from "react";
import { ShoppingCart, History, Wallet } from "lucide-react";
var BottomNavigation = ({ cartItemCount = 0 }) => {
  const { activeTab, setActiveTab } = useStore();
  const navItems = [
    { id: "shopping", label: "Belanja", icon: ShoppingCart },
    { id: "history", label: "Riwayat", icon: History },
    { id: "budget", label: "Anggaran", icon: Wallet }
  ];
  return /* @__PURE__ */ React2.createElement(
    "nav",
    {
      className: "fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none",
      style: { paddingBottom: "env(safe-area-inset-bottom, 12px)" },
      "aria-label": "Navigasi Utama"
    },
    /* @__PURE__ */ React2.createElement("div", { className: "w-full max-w-[430px] px-4 pb-2 pointer-events-auto" }, /* @__PURE__ */ React2.createElement("div", { className: "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-float dark:shadow-dark-float border border-border dark:border-slate-800 px-3 py-1.5 flex items-center justify-around transition-colors" }, navItems.map((item) => {
      const Icon = item.icon;
      const isActive = activeTab === item.id;
      return /* @__PURE__ */ React2.createElement(
        "button",
        {
          key: item.id,
          type: "button",
          onClick: () => setActiveTab(item.id),
          className: `relative flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all duration-200 min-h-[48px] active:scale-95 ${isActive ? "text-primary dark:text-blue-400 font-bold bg-blue-50/70 dark:bg-blue-950/70" : "text-text-secondary dark:text-slate-400 hover:text-text-main dark:hover:text-slate-200 font-medium"}`,
          "aria-current": isActive ? "page" : void 0
        },
        /* @__PURE__ */ React2.createElement("div", { className: "relative" }, /* @__PURE__ */ React2.createElement(Icon, { className: `w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}` }), item.id === "shopping" && cartItemCount > 0 && /* @__PURE__ */ React2.createElement("span", { className: "absolute -top-1.5 -right-2.5 bg-danger text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm" }, cartItemCount > 99 ? "99+" : cartItemCount)),
        /* @__PURE__ */ React2.createElement("span", { className: "text-[11px] mt-1 tracking-tight leading-none" }, item.label)
      );
    })))
  );
};

// src/pages/ShoppingPage.tsx
import React11, { useState as useState3, useEffect as useEffect3 } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import confetti from "canvas-confetti";
import {
  Plus as Plus3,
  ShoppingCart as ShoppingCart3,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Check,
  TrendingDown as TrendingDown2,
  Scan,
  CreditCard
} from "lucide-react";

// src/utils/discount.ts
function sanitizeDiscounts(discounts) {
  if (!Array.isArray(discounts)) return [];
  return discounts.map((d) => typeof d === "number" && !isNaN(d) ? Math.min(100, Math.max(0, d)) : 0).filter((d) => d > 0);
}
function calculateTieredDiscount(initialPrice, discounts) {
  const safeInitialPrice = Math.max(0, Math.round(initialPrice));
  const validDiscounts = sanitizeDiscounts(discounts);
  if (safeInitialPrice === 0 || validDiscounts.length === 0) {
    return {
      initialPrice: safeInitialPrice,
      finalPrice: safeInitialPrice,
      totalSavings: 0,
      effectiveDiscountPercent: 0,
      tiers: []
    };
  }
  let currentPrice = safeInitialPrice;
  const tiers = [];
  for (let i = 0; i < validDiscounts.length; i++) {
    const discount = validDiscounts[i];
    const beforeTier = currentPrice;
    const afterTier = Math.round(beforeTier * (1 - discount / 100));
    const savedAmount = beforeTier - afterTier;
    tiers.push({
      tierIndex: i + 1,
      discountPercent: discount,
      beforeTierPrice: beforeTier,
      afterTierPrice: afterTier,
      savedAmount
    });
    currentPrice = afterTier;
  }
  const finalPrice = currentPrice;
  const totalSavings = safeInitialPrice - finalPrice;
  const effectiveDiscountPercent = safeInitialPrice > 0 ? Number((totalSavings / safeInitialPrice * 100).toFixed(2)) : 0;
  return {
    initialPrice: safeInitialPrice,
    finalPrice,
    totalSavings,
    effectiveDiscountPercent,
    tiers
  };
}

// src/utils/currency.ts
function formatRupiah(value) {
  if (isNaN(value) || value === null || value === void 0) {
    return "Rp0";
  }
  const isNegative = value < 0;
  const absValue = Math.round(Math.abs(value));
  const formatted = absValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return isNegative ? `-Rp${formatted}` : `Rp${formatted}`;
}

// src/utils/calculations.ts
function calculateItemSubtotals(quantity, unitPrice, discounts = []) {
  const safeQty = Math.max(0, Number(quantity) || 0);
  const safeUnitPrice = Math.max(0, Math.round(Number(unitPrice) || 0));
  const grossSubtotal = Math.round(safeQty * safeUnitPrice);
  const discountResult = calculateTieredDiscount(grossSubtotal, discounts);
  return {
    grossSubtotal,
    discountAmount: discountResult.totalSavings,
    finalSubtotal: discountResult.finalPrice,
    effectiveDiscountPercent: discountResult.effectiveDiscountPercent
  };
}
function calculateCartTotals(items) {
  let grossTotal = 0;
  let discountTotal = 0;
  let finalTotal = 0;
  let activeCount = 0;
  let totalQuantity = 0;
  let completedCount = 0;
  for (const item of items) {
    const calc = calculateItemSubtotals(item.quantity, item.unitPrice, item.discounts);
    grossTotal += calc.grossSubtotal;
    discountTotal += calc.discountAmount;
    finalTotal += calc.finalSubtotal;
    totalQuantity += item.quantity;
    if (item.status === "completed") {
      completedCount++;
    } else {
      activeCount++;
    }
  }
  return {
    grossTotal,
    discountTotal,
    finalTotal,
    activeCount,
    totalQuantity,
    completedCount
  };
}
function evaluateBudgetSafety(budgetLimit, activeTotal, totalSavings = 0) {
  const safeLimit = Math.max(0, Math.round(Number(budgetLimit) || 0));
  const safeActiveTotal = Math.max(0, Math.round(Number(activeTotal) || 0));
  if (safeLimit === 0) {
    return {
      limit: 0,
      activeTotal: safeActiveTotal,
      remaining: 0,
      percentage: 0,
      level: "safe",
      message: "Batas anggaran belum ditentukan.",
      excessAmount: 0,
      totalSavings
    };
  }
  const remaining = safeLimit - safeActiveTotal;
  const percentage = Number((safeActiveTotal / safeLimit * 100).toFixed(1));
  const excessAmount = Math.max(0, safeActiveTotal - safeLimit);
  let level = "safe";
  let message = "Anggaran masih aman.";
  if (percentage > 100) {
    level = "exceeded";
    message = `Anggaran terlampaui ${formatRupiah(excessAmount)}.`;
  } else if (percentage >= 90) {
    level = "danger";
    message = "Peringatan! Belanja mendekati batas maksimum.";
  } else if (percentage >= 70) {
    level = "warning";
    message = "Hati-hati, anggaran mulai menipis.";
  } else {
    level = "safe";
    message = "Anggaran masih aman.";
  }
  return {
    limit: safeLimit,
    activeTotal: safeActiveTotal,
    remaining,
    percentage,
    level,
    message,
    excessAmount,
    totalSavings
  };
}

// src/services/groceryService.ts
var groceryService = {
  /**
   * Finds or creates a product in catalog and gets previous month unit price
   */
  async findOrCreateProduct(name, category, unit) {
    const trimmedName = name.trim();
    const normalized = trimmedName.toLowerCase();
    let product = await db.products.where("normalizedName").equals(normalized).first();
    if (!product) {
      product = {
        id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: trimmedName,
        normalizedName: normalized,
        category,
        unit,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await db.products.put(product);
    }
    const previousPrice = await this.getPreviousMonthPrice(product.id, normalized, unit);
    return { product, previousPrice };
  },
  /**
   * Looks up the unit price of a product in the previous calendar month's transactions
   * F-04
   */
  async getPreviousMonthPrice(productId, normalizedName, unit) {
    const prevPeriod = getPreviousMonthPeriod(getCurrentMonthPeriod());
    const pastTransactions = await db.transactions.where("period").equals(prevPeriod).toArray();
    if (!pastTransactions || pastTransactions.length === 0) {
      return null;
    }
    pastTransactions.sort(
      (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
    );
    for (const tx of pastTransactions) {
      for (const item of tx.items) {
        const matchesProduct = item.productId === productId || normalizedName && item.nameSnapshot.trim().toLowerCase() === normalizedName;
        const matchesUnit = !unit || !item.unit || item.unit.toLowerCase().trim() === unit.toLowerCase().trim();
        if (matchesProduct && matchesUnit && item.unitPrice > 0) {
          return item.unitPrice;
        }
      }
    }
    return null;
  },
  /**
   * Adds an item to the active cart
   * F-01
   */
  async addItemToCart(data) {
    const { product, previousPrice } = await this.findOrCreateProduct(
      data.name,
      data.category,
      data.unit
    );
    const newItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      productId: product.id,
      nameSnapshot: data.name.trim(),
      categorySnapshot: data.category,
      unit: data.unit,
      quantity: Math.max(1, Number(data.quantity) || 1),
      unitPrice: Math.max(0, Math.round(Number(data.unitPrice) || 0)),
      discounts: data.discounts || [],
      previousUnitPrice: previousPrice,
      status: "active",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await db.cartItems.put(newItem);
    return newItem;
  },
  /**
   * Updates an existing cart item
   */
  async updateCartItem(id, updates) {
    const item = await db.cartItems.get(id);
    if (!item) throw new Error("Item tidak ditemukan");
    const updated = {
      ...item,
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (updates.nameSnapshot && updates.nameSnapshot !== item.nameSnapshot) {
      const prevPrice = await this.getPreviousMonthPrice(
        item.productId,
        updates.nameSnapshot.trim().toLowerCase(),
        updated.unit
      );
      updated.previousUnitPrice = prevPrice;
    }
    await db.cartItems.put(updated);
  },
  /**
   * Removes an item from the cart
   */
  async deleteCartItem(id) {
    await db.cartItems.delete(id);
  },
  /**
   * Toggle item completed / active state in cart
   */
  async toggleCartItemStatus(id) {
    const item = await db.cartItems.get(id);
    if (!item) return;
    await db.cartItems.update(id, {
      status: item.status === "completed" ? "active" : "completed",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  },
  /**
   * Adjust item quantity quickly (+ / - buttons for thumb ergonomics)
   */
  async adjustQuantity(id, delta) {
    const item = await db.cartItems.get(id);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + delta);
    await db.cartItems.update(id, {
      quantity: newQty,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  },
  /**
   * Clears all items in the active cart
   */
  async clearCart() {
    await db.cartItems.clear();
  },
  /**
   * Gets or sets current month budget
   * F-05
   */
  async getBudget(period = getCurrentMonthPeriod()) {
    let budget = await db.budgets.where("period").equals(period).first();
    if (!budget) {
      budget = {
        id: `budget-${period}`,
        period,
        limit: 12e5,
        // default Rp1.200.000
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await db.budgets.put(budget);
    }
    return budget;
  },
  async setBudget(period, limit) {
    const safeLimit = Math.max(0, Math.round(Number(limit) || 0));
    let budget = await db.budgets.where("period").equals(period).first();
    if (budget) {
      budget.limit = safeLimit;
      budget.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      await db.budgets.put(budget);
    } else {
      budget = {
        id: `budget-${period}`,
        period,
        limit: safeLimit,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await db.budgets.put(budget);
    }
    return budget;
  },
  /**
   * Completes shopping session, saves immutable snapshot to transactions, then clears cart
   * F-06
   */
  async completeCheckout(currentBudgetLimit, paymentMethod = "Bank BCA") {
    const cartItems = await db.cartItems.toArray();
    if (cartItems.length === 0) {
      throw new Error("Keranjang belanja kosong");
    }
    const currentPeriod = getCurrentMonthPeriod();
    const itemSnapshots = cartItems.map((item) => {
      const calc = calculateItemSubtotals(item.quantity, item.unitPrice, item.discounts);
      return {
        id: item.id,
        productId: item.productId,
        nameSnapshot: item.nameSnapshot,
        categorySnapshot: item.categorySnapshot,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discounts: [...item.discounts],
        grossSubtotal: calc.grossSubtotal,
        discountAmount: calc.discountAmount,
        finalSubtotal: calc.finalSubtotal
      };
    });
    const totals = calculateCartTotals(cartItems);
    const transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      period: currentPeriod,
      purchasedAt: (/* @__PURE__ */ new Date()).toISOString(),
      items: itemSnapshots,
      grossTotal: totals.grossTotal,
      discountTotal: totals.discountTotal,
      finalTotal: totals.finalTotal,
      budgetLimitSnapshot: currentBudgetLimit,
      paymentMethod
    };
    await db.transaction("rw", db.transactions, db.cartItems, async () => {
      await db.transactions.put(transaction);
      await db.cartItems.clear();
    });
    return transaction;
  },
  /**
   * Export all database records to JSON for backup
   */
  async exportBackup() {
    const [products, cartItems, budgets, transactions] = await Promise.all([
      db.products.toArray(),
      db.cartItems.toArray(),
      db.budgets.toArray(),
      db.transactions.toArray()
    ]);
    const backupData = {
      version: 1,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      appName: "Smart Grocery & Budget Safety Tracker",
      data: {
        products,
        cartItems,
        budgets,
        transactions
      }
    };
    return JSON.stringify(backupData, null, 2);
  },
  /**
   * Validates and imports JSON backup data
   */
  async importBackup(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !parsed.data || typeof parsed.data !== "object") {
      throw new Error("Format file cadangan tidak valid.");
    }
    const { products, budgets, transactions, cartItems } = parsed.data;
    if (!Array.isArray(budgets) || !Array.isArray(transactions)) {
      throw new Error("Data anggaran atau riwayat transaksi tidak sesuai spesifikasi.");
    }
    await db.transaction("rw", db.products, db.cartItems, db.budgets, db.transactions, async () => {
      if (Array.isArray(products) && products.length > 0) {
        await db.products.bulkPut(products);
      }
      if (Array.isArray(budgets) && budgets.length > 0) {
        await db.budgets.bulkPut(budgets);
      }
      if (Array.isArray(transactions) && transactions.length > 0) {
        await db.transactions.bulkPut(transactions);
      }
      if (Array.isArray(cartItems)) {
        await db.cartItems.clear();
        if (cartItems.length > 0) {
          await db.cartItems.bulkPut(cartItems);
        }
      }
    });
    return true;
  }
};

// src/components/BudgetSafetyCard.tsx
import React3 from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon, TrendingDown, Edit3 } from "lucide-react";
var BudgetSafetyCard = ({
  budgetStatus,
  itemCount,
  totalSavings,
  onEditBudget
}) => {
  const { limit, activeTotal, remaining, percentage, level, message, excessAmount } = budgetStatus;
  let theme = {
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    barBg: "bg-success",
    icon: ShieldCheck,
    cardBorder: "border-emerald-100 dark:border-slate-700/80",
    accentText: "text-success dark:text-emerald-400"
  };
  if (level === "warning") {
    theme = {
      badgeBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      barBg: "bg-warning",
      icon: AlertTriangle,
      cardBorder: "border-amber-200 dark:border-amber-800/80",
      accentText: "text-warning dark:text-amber-400"
    };
  } else if (level === "danger") {
    theme = {
      badgeBg: "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
      barBg: "bg-danger",
      icon: AlertOctagon,
      cardBorder: "border-red-200 dark:border-red-800/80",
      accentText: "text-danger dark:text-rose-400"
    };
  } else if (level === "exceeded") {
    theme = {
      badgeBg: "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800 animate-pulse",
      barBg: "bg-danger",
      icon: AlertOctagon,
      cardBorder: "border-rose-300 dark:border-rose-800 ring-2 ring-rose-200 dark:ring-rose-900",
      accentText: "text-danger dark:text-rose-400"
    };
  }
  const StatusIcon = theme.icon;
  const clampedProgress = Math.min(100, Math.max(0, percentage));
  return /* @__PURE__ */ React3.createElement(
    "div",
    {
      className: `bg-card dark:bg-slate-800/90 rounded-card p-4 shadow-soft border ${theme.cardBorder} transition-all duration-200 relative overflow-hidden`
    },
    /* @__PURE__ */ React3.createElement("div", { className: "flex items-center justify-between gap-2 mb-3" }, /* @__PURE__ */ React3.createElement(
      "div",
      {
        className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${theme.badgeBg}`
      },
      /* @__PURE__ */ React3.createElement(StatusIcon, { className: "w-3.5 h-3.5 flex-shrink-0" }),
      /* @__PURE__ */ React3.createElement("span", { className: "truncate" }, message)
    ), onEditBudget && /* @__PURE__ */ React3.createElement(
      "button",
      {
        type: "button",
        onClick: onEditBudget,
        className: "flex items-center gap-1 text-[11px] font-medium text-text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors min-h-[36px]",
        title: "Ubah Anggaran"
      },
      /* @__PURE__ */ React3.createElement(Edit3, { className: "w-3.5 h-3.5" }),
      /* @__PURE__ */ React3.createElement("span", null, "Atur Batas")
    )),
    /* @__PURE__ */ React3.createElement("div", { className: "grid grid-cols-2 gap-3 mb-3" }, /* @__PURE__ */ React3.createElement("div", null, /* @__PURE__ */ React3.createElement("span", { className: "text-[11px] font-medium text-text-secondary dark:text-slate-400 block" }, "Total Belanja di Troli"), /* @__PURE__ */ React3.createElement("span", { className: "text-xl font-extrabold text-text-main dark:text-slate-100 tracking-tight" }, formatRupiah(activeTotal)), /* @__PURE__ */ React3.createElement("span", { className: "text-[11px] text-text-secondary dark:text-slate-400 block mt-0.5" }, itemCount, " barang dalam troli")), /* @__PURE__ */ React3.createElement("div", { className: "text-right" }, /* @__PURE__ */ React3.createElement("span", { className: "text-[11px] font-medium text-text-secondary dark:text-slate-400 block" }, level === "exceeded" ? "Kelebihan Anggaran" : "Sisa Saldo Aman"), /* @__PURE__ */ React3.createElement(
      "span",
      {
        className: `text-xl font-extrabold tracking-tight ${level === "exceeded" ? "text-danger dark:text-rose-400" : "text-success dark:text-emerald-400"}`
      },
      level === "exceeded" ? `+${formatRupiah(excessAmount)}` : formatRupiah(remaining)
    ), /* @__PURE__ */ React3.createElement("span", { className: "text-[11px] text-text-secondary dark:text-slate-400 block mt-0.5" }, "dari limit ", formatRupiah(limit)))),
    /* @__PURE__ */ React3.createElement("div", { className: "space-y-1 mb-3" }, /* @__PURE__ */ React3.createElement("div", { className: "flex justify-between items-center text-[11px] font-semibold text-text-secondary dark:text-slate-400" }, /* @__PURE__ */ React3.createElement("span", null, "Penggunaan Anggaran"), /* @__PURE__ */ React3.createElement("span", { className: theme.accentText }, percentage, "%")), /* @__PURE__ */ React3.createElement("div", { className: "w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden" }, /* @__PURE__ */ React3.createElement(
      "div",
      {
        className: `h-full transition-all duration-300 rounded-full ${theme.barBg}`,
        style: { width: `${clampedProgress}%` }
      }
    ))),
    totalSavings > 0 && /* @__PURE__ */ React3.createElement("div", { className: "flex items-center justify-between text-xs bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100/70 dark:border-emerald-800/60 rounded-xl px-2.5 py-1.5 mt-2" }, /* @__PURE__ */ React3.createElement("span", { className: "flex items-center gap-1 text-emerald-800 dark:text-emerald-300 font-medium" }, /* @__PURE__ */ React3.createElement(TrendingDown, { className: "w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" }), "Total Hemat Diskon:"), /* @__PURE__ */ React3.createElement("span", { className: "font-bold text-emerald-700 dark:text-emerald-300" }, formatRupiah(totalSavings)))
  );
};

// src/components/GroceryItemCard.tsx
import React5 from "react";
import { Plus, Minus as Minus2, Edit2, Trash2, CheckCircle2, Circle } from "lucide-react";

// src/components/PriceComparison.tsx
import React4 from "react";
import { ArrowUpRight, ArrowDownRight, Minus, HelpCircle } from "lucide-react";
var PriceComparison = ({
  currentPrice,
  previousPrice,
  unit = "pcs"
}) => {
  const result = comparePrices(currentPrice, previousPrice, unit, unit);
  if (!result.hasPreviousData) {
    return /* @__PURE__ */ React4.createElement("div", { className: "inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-full" }, /* @__PURE__ */ React4.createElement(HelpCircle, { className: "w-3 h-3 text-gray-400 dark:text-slate-500" }), /* @__PURE__ */ React4.createElement("span", null, "Bulan lalu: Belum ada data"));
  }
  if (result.status === "up") {
    return /* @__PURE__ */ React4.createElement("div", { className: "inline-flex items-center gap-1 text-[11px] font-semibold text-danger dark:text-rose-300 bg-red-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-red-100 dark:border-rose-900" }, /* @__PURE__ */ React4.createElement(ArrowUpRight, { className: "w-3.5 h-3.5 text-danger dark:text-rose-400 stroke-[2.5]" }), /* @__PURE__ */ React4.createElement("span", null, "Naik ", result.percentageChange, "% (Bulan lalu ", formatRupiah(result.previousPrice || 0), ")"));
  }
  if (result.status === "down") {
    return /* @__PURE__ */ React4.createElement("div", { className: "inline-flex items-center gap-1 text-[11px] font-semibold text-success dark:text-emerald-300 bg-green-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-green-100 dark:border-emerald-900" }, /* @__PURE__ */ React4.createElement(ArrowDownRight, { className: "w-3.5 h-3.5 text-success dark:text-emerald-400 stroke-[2.5]" }), /* @__PURE__ */ React4.createElement("span", null, "Turun ", result.percentageChange, "% (Bulan lalu ", formatRupiah(result.previousPrice || 0), ")"));
  }
  return /* @__PURE__ */ React4.createElement("div", { className: "inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full" }, /* @__PURE__ */ React4.createElement(Minus, { className: "w-3.5 h-3.5 text-gray-400 dark:text-slate-400 stroke-[2.5]" }), /* @__PURE__ */ React4.createElement("span", null, "Harga stabil (", formatRupiah(result.previousPrice || 0), ")"));
};

// src/components/GroceryItemCard.tsx
var GroceryItemCard = ({
  item,
  onIncrease,
  onDecrease,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const calc = calculateItemSubtotals(item.quantity, item.unitPrice, item.discounts);
  const isCompleted = item.status === "completed";
  return /* @__PURE__ */ React5.createElement(
    "div",
    {
      className: `bg-card dark:bg-slate-800/90 rounded-card p-3.5 border transition-all duration-200 shadow-soft ${isCompleted ? "bg-gray-50/70 dark:bg-slate-900/60 border-gray-200 dark:border-slate-800 opacity-75" : "border-border dark:border-slate-700/80 hover:border-blue-200 dark:hover:border-blue-800"}`
    },
    /* @__PURE__ */ React5.createElement("div", { className: "flex items-start justify-between gap-2.5" }, /* @__PURE__ */ React5.createElement(
      "button",
      {
        type: "button",
        onClick: () => onToggleStatus(item.id),
        className: "mt-0.5 text-gray-300 dark:text-slate-600 hover:text-primary active:scale-95 transition-transform flex-shrink-0 min-h-[44px] min-w-[36px] flex items-center justify-center",
        "aria-label": isCompleted ? "Tandai belum dibeli" : "Tandai sudah masuk troli"
      },
      isCompleted ? /* @__PURE__ */ React5.createElement(CheckCircle2, { className: "w-5 h-5 text-success dark:text-emerald-400 fill-green-50 dark:fill-emerald-950" }) : /* @__PURE__ */ React5.createElement(Circle, { className: "w-5 h-5 text-gray-300 dark:text-slate-600 hover:text-primary dark:hover:text-blue-400" })
    ), /* @__PURE__ */ React5.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React5.createElement("div", { className: "flex items-center gap-1.5 flex-wrap mb-0.5" }, /* @__PURE__ */ React5.createElement("span", { className: "text-[10px] font-semibold text-primary dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded-md" }, item.categorySnapshot), item.discounts.length > 0 && /* @__PURE__ */ React5.createElement("span", { className: "text-[10px] font-bold text-danger dark:text-rose-300 bg-red-50 dark:bg-rose-950/70 border border-red-100 dark:border-rose-900 px-1.5 py-0.5 rounded-md" }, "Diskon ", item.discounts.join("% + "), "% (Hemat ", formatRupiah(calc.discountAmount), ")")), /* @__PURE__ */ React5.createElement(
      "h3",
      {
        className: `font-semibold text-sm leading-snug truncate ${isCompleted ? "line-through text-text-secondary dark:text-slate-500" : "text-text-main dark:text-slate-100"}`
      },
      item.nameSnapshot
    ), /* @__PURE__ */ React5.createElement("div", { className: "flex items-baseline gap-1.5 text-xs text-text-secondary dark:text-slate-400 mt-1" }, /* @__PURE__ */ React5.createElement("span", null, formatRupiah(item.unitPrice), " / ", item.unit), calc.discountAmount > 0 && /* @__PURE__ */ React5.createElement("span", { className: "line-through text-[11px] text-gray-400 dark:text-slate-500" }, formatRupiah(calc.grossSubtotal))), /* @__PURE__ */ React5.createElement("div", { className: "mt-1.5" }, /* @__PURE__ */ React5.createElement(
      PriceComparison,
      {
        currentPrice: item.unitPrice,
        previousPrice: item.previousUnitPrice,
        unit: item.unit
      }
    ))), /* @__PURE__ */ React5.createElement("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ React5.createElement(
      "button",
      {
        type: "button",
        onClick: () => onEdit(item),
        className: "p-2 text-gray-400 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 active:scale-95 transition-colors min-h-[44px] min-w-[40px] flex items-center justify-center",
        title: "Edit barang",
        "aria-label": "Edit barang"
      },
      /* @__PURE__ */ React5.createElement(Edit2, { className: "w-4 h-4" })
    ), /* @__PURE__ */ React5.createElement(
      "button",
      {
        type: "button",
        onClick: () => onDelete(item.id),
        className: "p-2 text-gray-400 dark:text-slate-400 hover:text-danger dark:hover:text-rose-400 rounded-lg hover:bg-red-50 dark:hover:bg-rose-950 active:scale-95 transition-colors min-h-[44px] min-w-[40px] flex items-center justify-center",
        title: "Hapus barang",
        "aria-label": "Hapus barang"
      },
      /* @__PURE__ */ React5.createElement(Trash2, { className: "w-4 h-4" })
    ))),
    /* @__PURE__ */ React5.createElement("div", { className: "flex items-center justify-between border-t border-gray-100 dark:border-slate-700/60 mt-3 pt-2.5" }, /* @__PURE__ */ React5.createElement("div", { className: "flex items-center bg-gray-100/80 dark:bg-slate-700/90 rounded-xl p-0.5 border border-gray-200 dark:border-slate-600" }, /* @__PURE__ */ React5.createElement(
      "button",
      {
        type: "button",
        onClick: () => onDecrease(item.id),
        disabled: item.quantity <= 1,
        className: "w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 shadow-sm text-text-main dark:text-slate-100 disabled:opacity-30 disabled:shadow-none hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 transition-transform",
        "aria-label": "Kurangi kuantitas"
      },
      /* @__PURE__ */ React5.createElement(Minus2, { className: "w-4 h-4" })
    ), /* @__PURE__ */ React5.createElement("span", { className: "w-12 text-center font-bold text-sm text-text-main dark:text-slate-100" }, item.quantity, " ", /* @__PURE__ */ React5.createElement("span", { className: "text-[10px] font-normal text-text-secondary dark:text-slate-400" }, item.unit)), /* @__PURE__ */ React5.createElement(
      "button",
      {
        type: "button",
        onClick: () => onIncrease(item.id),
        className: "w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 shadow-sm text-text-main dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 transition-transform",
        "aria-label": "Tambah kuantitas"
      },
      /* @__PURE__ */ React5.createElement(Plus, { className: "w-4 h-4" })
    )), /* @__PURE__ */ React5.createElement("div", { className: "text-right" }, /* @__PURE__ */ React5.createElement("span", { className: "text-[10px] text-text-secondary dark:text-slate-400 block" }, "Total Item:"), /* @__PURE__ */ React5.createElement("span", { className: "text-base font-extrabold text-primary dark:text-blue-400" }, formatRupiah(calc.finalSubtotal))))
  );
};

// src/components/AddItemSheet.tsx
import React7, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, ShoppingBag, Sparkles } from "lucide-react";

// src/types/index.ts
var PRODUCT_CATEGORIES = [
  "Beras dan bahan pokok",
  "Sayur dan buah",
  "Daging dan protein",
  "Susu dan produk dingin",
  "Makanan instan",
  "Minuman",
  "Perlengkapan mandi",
  "Kebersihan rumah",
  "Kebutuhan kuliah",
  "Lainnya"
];
var STANDARD_UNITS = [
  "pcs",
  "kg",
  "gram",
  "liter",
  "ml",
  "pack",
  "botol",
  "bungkus",
  "custom"
];

// src/components/DiscountEditor.tsx
import React6 from "react";
import { Plus as Plus2, Trash2 as Trash22, Tag, Percent } from "lucide-react";
var DiscountEditor = ({
  basePrice,
  discounts,
  onChange
}) => {
  const result = calculateTieredDiscount(basePrice, discounts);
  const handleAddTier = () => {
    onChange([...discounts, 10]);
  };
  const handleUpdateTier = (index, value) => {
    const clamped = Math.min(100, Math.max(0, isNaN(value) ? 0 : value));
    const next = [...discounts];
    next[index] = clamped;
    onChange(next);
  };
  const handleRemoveTier = (index) => {
    const next = discounts.filter((_, i) => i !== index);
    onChange(next);
  };
  const handleAddPreset = (percent) => {
    if (discounts.length === 0) {
      onChange([percent]);
    } else {
      onChange([...discounts, percent]);
    }
  };
  return /* @__PURE__ */ React6.createElement("div", { className: "bg-gray-50/80 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-border dark:border-slate-700 space-y-3" }, /* @__PURE__ */ React6.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React6.createElement("div", { className: "flex items-center gap-1.5 text-xs font-semibold text-text-main dark:text-slate-200" }, /* @__PURE__ */ React6.createElement(Tag, { className: "w-3.5 h-3.5 text-primary dark:text-blue-400" }), /* @__PURE__ */ React6.createElement("span", null, "Diskon Promosi (Bisa Bertingkat)")), /* @__PURE__ */ React6.createElement(
    "button",
    {
      type: "button",
      onClick: handleAddTier,
      className: "inline-flex items-center gap-1 text-xs font-semibold text-primary dark:text-blue-400 hover:text-primary-hover px-2.5 py-1 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 rounded-lg transition-colors min-h-[36px]"
    },
    /* @__PURE__ */ React6.createElement(Plus2, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ React6.createElement("span", null, "+ Tahap Diskon")
  )), /* @__PURE__ */ React6.createElement("div", { className: "flex flex-wrap gap-1.5" }, [5, 10, 15, 20, 25, 30, 50].map((preset) => /* @__PURE__ */ React6.createElement(
    "button",
    {
      key: preset,
      type: "button",
      onClick: () => handleAddPreset(preset),
      className: "text-[11px] font-medium px-2 py-1 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-600 rounded-md hover:border-primary hover:text-primary dark:hover:text-blue-400 transition-colors active:scale-95 min-h-[32px]"
    },
    "+",
    preset,
    "%"
  )), discounts.length > 0 && /* @__PURE__ */ React6.createElement(
    "button",
    {
      type: "button",
      onClick: () => onChange([]),
      className: "text-[11px] font-medium px-2 py-1 bg-red-50 dark:bg-rose-950/70 text-danger dark:text-rose-300 border border-red-200 dark:border-rose-900 rounded-md hover:bg-red-100 transition-colors active:scale-95 min-h-[32px]"
    },
    "Hapus Semua"
  )), discounts.length === 0 ? /* @__PURE__ */ React6.createElement("p", { className: "text-xs text-text-secondary dark:text-slate-400 italic" }, "Belum ada diskon diterapkan untuk barang ini.") : /* @__PURE__ */ React6.createElement("div", { className: "space-y-2" }, discounts.map((discount, idx) => /* @__PURE__ */ React6.createElement(
    "div",
    {
      key: idx,
      className: "flex items-center gap-2 bg-white dark:bg-slate-750 p-2 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm"
    },
    /* @__PURE__ */ React6.createElement("div", { className: "flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold" }, idx + 1),
    /* @__PURE__ */ React6.createElement("div", { className: "relative flex-1" }, /* @__PURE__ */ React6.createElement(
      "input",
      {
        type: "number",
        inputMode: "numeric",
        min: "0",
        max: "100",
        value: discount === 0 ? "" : discount,
        placeholder: "0",
        onChange: (e) => handleUpdateTier(idx, parseFloat(e.target.value) || 0),
        className: "w-full text-right font-bold text-sm pr-7 pl-2 py-1.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none min-h-[40px]"
      }
    ), /* @__PURE__ */ React6.createElement("span", { className: "absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 font-semibold text-xs pointer-events-none" }, "%")),
    /* @__PURE__ */ React6.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleRemoveTier(idx),
        className: "p-2 text-gray-400 dark:text-slate-400 hover:text-danger dark:hover:text-rose-400 rounded-lg hover:bg-red-50 dark:hover:bg-rose-950 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center",
        "aria-label": `Hapus tahap ${idx + 1}`
      },
      /* @__PURE__ */ React6.createElement(Trash22, { className: "w-4 h-4" })
    )
  ))), discounts.length > 0 && basePrice > 0 && /* @__PURE__ */ React6.createElement("div", { className: "bg-blue-50/70 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 text-xs space-y-1.5" }, /* @__PURE__ */ React6.createElement("div", { className: "flex justify-between items-center text-gray-600 dark:text-slate-300" }, /* @__PURE__ */ React6.createElement("span", null, "Harga Awal Kotor:"), /* @__PURE__ */ React6.createElement("span", { className: "font-semibold" }, formatRupiah(basePrice))), result.tiers.length > 1 && /* @__PURE__ */ React6.createElement("div", { className: "border-t border-blue-200/50 dark:border-blue-800/40 pt-1 space-y-1" }, result.tiers.map((t) => /* @__PURE__ */ React6.createElement("div", { key: t.tierIndex, className: "flex justify-between text-[11px] text-gray-500 dark:text-slate-400" }, /* @__PURE__ */ React6.createElement("span", null, "Tahap ", t.tierIndex, " (-", t.discountPercent, "%):"), /* @__PURE__ */ React6.createElement("span", null, formatRupiah(t.beforeTierPrice), " \u2192 ", formatRupiah(t.afterTierPrice), " (hemat", " ", formatRupiah(t.savedAmount), ")")))), /* @__PURE__ */ React6.createElement("div", { className: "flex justify-between items-center text-success dark:text-emerald-400 font-semibold border-t border-blue-200/60 dark:border-blue-800/40 pt-1" }, /* @__PURE__ */ React6.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React6.createElement(Percent, { className: "w-3.5 h-3.5" }), "Diskon Efektif (", result.effectiveDiscountPercent, "%):"), /* @__PURE__ */ React6.createElement("span", null, "Hemat ", formatRupiah(result.totalSavings))), /* @__PURE__ */ React6.createElement("div", { className: "flex justify-between items-center text-text-main dark:text-slate-100 font-bold text-sm pt-0.5" }, /* @__PURE__ */ React6.createElement("span", null, "Harga Akhir:"), /* @__PURE__ */ React6.createElement("span", { className: "text-primary dark:text-blue-400" }, formatRupiah(result.finalPrice)))));
};

// src/components/AddItemSheet.tsx
var itemSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  category: z.string().min(1, "Pilih kategori produk"),
  unit: z.string().min(1, "Pilih satuan produk"),
  quantity: z.number().min(0.01, "Kuantitas harus lebih dari 0"),
  unitPrice: z.number().min(0, "Harga satuan tidak boleh negatif"),
  discounts: z.array(z.number())
});
var AddItemSheet = ({
  isOpen,
  onClose,
  onSave,
  editingItem
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customUnit, setCustomUnit] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      category: "Beras dan bahan pokok",
      unit: "pcs",
      quantity: 1,
      unitPrice: 0,
      discounts: []
    }
  });
  const watchedQty = watch("quantity") || 0;
  const watchedPrice = watch("unitPrice") || 0;
  const watchedDiscounts = watch("discounts") || [];
  const liveCalc = calculateItemSubtotals(watchedQty, watchedPrice, watchedDiscounts);
  useEffect(() => {
    if (editingItem) {
      const isStdUnit = STANDARD_UNITS.includes(editingItem.unit);
      setCustomUnit(!isStdUnit);
      reset({
        name: editingItem.nameSnapshot,
        category: editingItem.categorySnapshot,
        unit: editingItem.unit,
        quantity: editingItem.quantity,
        unitPrice: editingItem.unitPrice,
        discounts: editingItem.discounts || []
      });
    } else {
      setCustomUnit(false);
      reset({
        name: "",
        category: "Beras dan bahan pokok",
        unit: "pcs",
        quantity: 1,
        unitPrice: 0,
        discounts: []
      });
    }
  }, [editingItem, isOpen, reset]);
  if (!isOpen) return null;
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      await onSave({
        name: data.name,
        category: data.category,
        unit: data.unit,
        quantity: Number(data.quantity),
        unitPrice: Math.round(Number(data.unitPrice)),
        discounts: data.discounts
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ React7.createElement("div", { className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in" }, /* @__PURE__ */ React7.createElement(
    "div",
    {
      className: "w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-card-lg sm:rounded-card-lg max-h-[90dvh] flex flex-col shadow-modal animate-slide-up border dark:border-slate-800",
      role: "dialog",
      "aria-modal": "true"
    },
    /* @__PURE__ */ React7.createElement("div", { className: "w-12 h-1.5 bg-gray-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1" }),
    /* @__PURE__ */ React7.createElement("div", { className: "flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-slate-800" }, /* @__PURE__ */ React7.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React7.createElement("div", { className: "w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/80 text-primary dark:text-blue-400 flex items-center justify-center" }, /* @__PURE__ */ React7.createElement(ShoppingBag, { className: "w-4 h-4" })), /* @__PURE__ */ React7.createElement("div", null, /* @__PURE__ */ React7.createElement("h2", { className: "font-bold text-base text-text-main dark:text-slate-100" }, editingItem ? "Edit Barang Belanja" : "Tambah Barang ke Troli"), /* @__PURE__ */ React7.createElement("p", { className: "text-[11px] text-text-secondary dark:text-slate-400" }, "Pencatatan langsung saat belanja di supermarket"))), /* @__PURE__ */ React7.createElement(
      "button",
      {
        type: "button",
        onClick: onClose,
        className: "p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center",
        "aria-label": "Tutup"
      },
      /* @__PURE__ */ React7.createElement(X, { className: "w-5 h-5" })
    )),
    /* @__PURE__ */ React7.createElement("form", { onSubmit: handleSubmit(onSubmit), className: "overflow-y-auto px-5 py-4 space-y-4 flex-1" }, !editingItem && /* @__PURE__ */ React7.createElement("div", { className: "bg-gradient-to-r from-blue-50 to-amber-50 dark:from-slate-800 dark:to-slate-800/80 p-3 rounded-2xl border border-blue-200/70 dark:border-slate-700 flex items-center justify-between gap-2" }, /* @__PURE__ */ React7.createElement("div", null, /* @__PURE__ */ React7.createElement("span", { className: "text-xs font-bold text-gray-800 dark:text-slate-200 block" }, "Malas Ketik Harga Manual?"), /* @__PURE__ */ React7.createElement("span", { className: "text-[10px] text-gray-500 dark:text-slate-400" }, "Scan barcode kemasan untuk isi otomatis")), /* @__PURE__ */ React7.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          onClose();
          useStore.getState().openScanner();
        },
        className: "bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm transition-all whitespace-nowrap min-h-[36px]"
      },
      "Scan Barcode \u{1F4F7}"
    )), /* @__PURE__ */ React7.createElement("div", null, /* @__PURE__ */ React7.createElement("label", { className: "block text-xs font-bold text-text-main dark:text-slate-200 mb-1" }, "Nama Produk ", /* @__PURE__ */ React7.createElement("span", { className: "text-danger" }, "*")), /* @__PURE__ */ React7.createElement(
      "input",
      {
        type: "text",
        placeholder: "Contoh: Beras Ramos 5kg, Telur Ayam",
        ...register("name"),
        className: "w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm min-h-[44px]"
      }
    ), errors.name && /* @__PURE__ */ React7.createElement("p", { className: "text-xs text-danger mt-1 font-medium" }, errors.name.message)), /* @__PURE__ */ React7.createElement("div", null, /* @__PURE__ */ React7.createElement("label", { className: "block text-xs font-bold text-text-main dark:text-slate-200 mb-1" }, "Kategori"), /* @__PURE__ */ React7.createElement(
      "select",
      {
        ...register("category"),
        className: "w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm min-h-[44px] bg-white dark:bg-slate-800 text-text-main dark:text-slate-100"
      },
      PRODUCT_CATEGORIES.map((cat) => /* @__PURE__ */ React7.createElement("option", { key: cat, value: cat }, cat))
    )), /* @__PURE__ */ React7.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React7.createElement("div", null, /* @__PURE__ */ React7.createElement("label", { className: "block text-xs font-bold text-text-main dark:text-slate-200 mb-1" }, "Kuantitas ", /* @__PURE__ */ React7.createElement("span", { className: "text-danger" }, "*")), /* @__PURE__ */ React7.createElement(
      "input",
      {
        type: "number",
        step: "any",
        inputMode: "decimal",
        placeholder: "1",
        ...register("quantity", { valueAsNumber: true }),
        className: "w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm font-semibold min-h-[44px]"
      }
    ), errors.quantity && /* @__PURE__ */ React7.createElement("p", { className: "text-xs text-danger mt-1" }, errors.quantity.message)), /* @__PURE__ */ React7.createElement("div", null, /* @__PURE__ */ React7.createElement("label", { className: "block text-xs font-bold text-text-main dark:text-slate-200 mb-1" }, "Satuan"), customUnit ? /* @__PURE__ */ React7.createElement("div", { className: "flex gap-1" }, /* @__PURE__ */ React7.createElement(
      "input",
      {
        type: "text",
        placeholder: "Satuan khusus...",
        ...register("unit"),
        className: "w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 text-sm min-h-[44px]"
      }
    ), /* @__PURE__ */ React7.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setCustomUnit(false);
          setValue("unit", "pcs");
        },
        className: "px-2 text-xs text-primary dark:text-blue-400 underline whitespace-nowrap min-h-[44px]"
      },
      "Batal"
    )) : /* @__PURE__ */ React7.createElement(
      "select",
      {
        value: watch("unit"),
        onChange: (e) => {
          if (e.target.value === "custom") {
            setCustomUnit(true);
            setValue("unit", "");
          } else {
            setValue("unit", e.target.value);
          }
        },
        className: "w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm min-h-[44px] bg-white dark:bg-slate-800 text-text-main dark:text-slate-100"
      },
      STANDARD_UNITS.filter((u) => u !== "custom").map((unit) => /* @__PURE__ */ React7.createElement("option", { key: unit, value: unit }, unit)),
      /* @__PURE__ */ React7.createElement("option", { value: "custom" }, "+ Satuan Lainnya...")
    ))), /* @__PURE__ */ React7.createElement("div", null, /* @__PURE__ */ React7.createElement("label", { className: "block text-xs font-bold text-text-main dark:text-slate-200 mb-1" }, "Harga Satuan (Rp) ", /* @__PURE__ */ React7.createElement("span", { className: "text-danger" }, "*")), /* @__PURE__ */ React7.createElement("div", { className: "relative" }, /* @__PURE__ */ React7.createElement("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-gray-400" }, "Rp"), /* @__PURE__ */ React7.createElement(
      "input",
      {
        type: "number",
        inputMode: "numeric",
        placeholder: "15000",
        ...register("unitPrice", { valueAsNumber: true }),
        className: "w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm font-bold min-h-[44px]"
      }
    )), errors.unitPrice && /* @__PURE__ */ React7.createElement("p", { className: "text-xs text-danger mt-1" }, errors.unitPrice.message)), /* @__PURE__ */ React7.createElement(
      Controller,
      {
        name: "discounts",
        control,
        render: ({ field }) => /* @__PURE__ */ React7.createElement(
          DiscountEditor,
          {
            basePrice: liveCalc.grossSubtotal,
            discounts: field.value,
            onChange: field.onChange
          }
        )
      }
    ), /* @__PURE__ */ React7.createElement("div", { className: "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-slate-800/80 p-3.5 rounded-2xl border border-blue-100 dark:border-blue-900/60 flex items-center justify-between" }, /* @__PURE__ */ React7.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React7.createElement(Sparkles, { className: "w-4 h-4 text-primary dark:text-blue-400" }), /* @__PURE__ */ React7.createElement("div", null, /* @__PURE__ */ React7.createElement("span", { className: "text-[11px] font-semibold text-text-secondary dark:text-slate-400 block" }, "Estimasi Total Item:"), /* @__PURE__ */ React7.createElement("span", { className: "text-xs text-gray-500 dark:text-slate-300" }, watchedQty, " ", watch("unit"), " \xD7 ", formatRupiah(watchedPrice)))), /* @__PURE__ */ React7.createElement("div", { className: "text-right" }, /* @__PURE__ */ React7.createElement("span", { className: "text-lg font-extrabold text-primary dark:text-blue-400 block" }, formatRupiah(liveCalc.finalSubtotal)), liveCalc.discountAmount > 0 && /* @__PURE__ */ React7.createElement("span", { className: "text-[10px] font-semibold text-success dark:text-emerald-400 block" }, "Hemat ", formatRupiah(liveCalc.discountAmount)))), /* @__PURE__ */ React7.createElement("div", { className: "pt-2" }, /* @__PURE__ */ React7.createElement(
      "button",
      {
        type: "submit",
        disabled: isSubmitting,
        className: "w-full bg-primary hover:bg-primary-hover active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-float transition-all disabled:opacity-50 min-h-[48px] flex items-center justify-center text-sm"
      },
      isSubmitting ? "Menyimpan..." : editingItem ? "Simpan Perubahan" : "Tambahkan ke Troli Belanja"
    )))
  ));
};

// src/components/ConfirmDialog.tsx
import React8 from "react";
import { AlertTriangle as AlertTriangle2 } from "lucide-react";
var ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = "Lanjutkan",
  cancelLabel = "Batal",
  isDangerous = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;
  return /* @__PURE__ */ React8.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" }, /* @__PURE__ */ React8.createElement(
    "div",
    {
      className: "w-full max-w-[360px] bg-white dark:bg-slate-900 rounded-card-lg p-5 shadow-modal animate-slide-up border dark:border-slate-800",
      role: "dialog",
      "aria-modal": "true"
    },
    /* @__PURE__ */ React8.createElement("div", { className: "flex items-center gap-3 mb-3" }, /* @__PURE__ */ React8.createElement(
      "div",
      {
        className: `w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDangerous ? "bg-red-50 dark:bg-rose-950/80 text-danger dark:text-rose-400" : "bg-blue-50 dark:bg-blue-950/80 text-primary dark:text-blue-400"}`
      },
      /* @__PURE__ */ React8.createElement(AlertTriangle2, { className: "w-5 h-5" })
    ), /* @__PURE__ */ React8.createElement("div", null, /* @__PURE__ */ React8.createElement("h3", { className: "font-bold text-base text-text-main dark:text-slate-100 leading-tight" }, title))),
    /* @__PURE__ */ React8.createElement("p", { className: "text-xs text-text-secondary dark:text-slate-300 leading-relaxed mb-5" }, message),
    /* @__PURE__ */ React8.createElement("div", { className: "flex gap-2.5" }, /* @__PURE__ */ React8.createElement(
      "button",
      {
        type: "button",
        onClick: onCancel,
        className: "flex-1 py-2.5 px-3 rounded-xl border border-gray-300 dark:border-slate-700 font-semibold text-xs text-text-main dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-95 transition-all min-h-[44px]"
      },
      cancelLabel
    ), /* @__PURE__ */ React8.createElement(
      "button",
      {
        type: "button",
        onClick: onConfirm,
        className: `flex-1 py-2.5 px-3 rounded-xl font-bold text-xs text-white active:scale-95 transition-all min-h-[44px] shadow-soft ${isDangerous ? "bg-danger hover:bg-red-700" : "bg-primary hover:bg-primary-hover"}`
      },
      confirmLabel
    ))
  ));
};

// src/components/EmptyState.tsx
import React9 from "react";
import { ShoppingCart as ShoppingCart2 } from "lucide-react";
var EmptyState = ({
  icon: Icon = ShoppingCart2,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return /* @__PURE__ */ React9.createElement("div", { className: "flex flex-col items-center justify-center text-center p-8 bg-card dark:bg-slate-800/80 rounded-card border border-dashed border-gray-300 dark:border-slate-700 my-4" }, /* @__PURE__ */ React9.createElement("div", { className: "w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/80 text-primary dark:text-blue-400 flex items-center justify-center mb-3" }, /* @__PURE__ */ React9.createElement(Icon, { className: "w-7 h-7" })), /* @__PURE__ */ React9.createElement("h3", { className: "font-bold text-base text-text-main dark:text-slate-100 mb-1" }, title), /* @__PURE__ */ React9.createElement("p", { className: "text-xs text-text-secondary dark:text-slate-400 max-w-[260px] mb-4 leading-relaxed" }, description), actionLabel && onAction && /* @__PURE__ */ React9.createElement(
    "button",
    {
      type: "button",
      onClick: onAction,
      className: "bg-primary hover:bg-primary-hover active:scale-95 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-soft transition-all min-h-[44px]"
    },
    actionLabel
  ));
};

// src/components/PWAInstallBanner.tsx
import React10, { useState as useState2, useEffect as useEffect2 } from "react";
import { X as X2, Smartphone } from "lucide-react";
var PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState2(null);
  const [isIOS, setIsIOS] = useState2(false);
  const [isStandalone, setIsStandalone] = useState2(false);
  const [isOpen, setIsOpen] = useState2(false);
  const [showIOSModal, setShowIOSModal] = useState2(false);
  useEffect2(() => {
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setIsStandalone(isInStandaloneMode);
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsOpen(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsOpen(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };
  if (isStandalone) return null;
  return /* @__PURE__ */ React10.createElement(React10.Fragment, null, isOpen && /* @__PURE__ */ React10.createElement("div", { className: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-2xl shadow-float mb-3 flex items-center justify-between gap-2.5 animate-slide-up" }, /* @__PURE__ */ React10.createElement("div", { className: "flex items-center gap-2.5 min-w-0" }, /* @__PURE__ */ React10.createElement("div", { className: "w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0" }, /* @__PURE__ */ React10.createElement(Smartphone, { className: "w-5 h-5 text-white" })), /* @__PURE__ */ React10.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React10.createElement("h4", { className: "font-bold text-xs leading-tight truncate" }, "Pasang di Layar Utama (PWA)"), /* @__PURE__ */ React10.createElement("p", { className: "text-[10px] text-blue-100 truncate" }, "Bisa dibuka cepat saat dorong troli tanpa internet"))), /* @__PURE__ */ React10.createElement("div", { className: "flex items-center gap-1.5 flex-shrink-0" }, /* @__PURE__ */ React10.createElement(
    "button",
    {
      type: "button",
      onClick: handleInstallClick,
      className: "bg-white text-primary hover:bg-blue-50 active:scale-95 font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all min-h-[36px]"
    },
    "Pasang"
  ), /* @__PURE__ */ React10.createElement(
    "button",
    {
      type: "button",
      onClick: () => setIsOpen(false),
      className: "p-1.5 text-white/80 hover:text-white rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center",
      "aria-label": "Tutup Banner"
    },
    /* @__PURE__ */ React10.createElement(X2, { className: "w-4 h-4" })
  ))), showIOSModal && /* @__PURE__ */ React10.createElement("div", { className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" }, /* @__PURE__ */ React10.createElement("div", { className: "w-full max-w-[360px] bg-white rounded-card-lg p-5 shadow-modal animate-slide-up" }, /* @__PURE__ */ React10.createElement("div", { className: "flex items-center justify-between mb-3" }, /* @__PURE__ */ React10.createElement("h3", { className: "font-bold text-base text-text-main" }, "Pasang di iPhone / iPad"), /* @__PURE__ */ React10.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowIOSModal(false),
      className: "p-1 text-gray-400 hover:text-gray-600 min-h-[40px] min-w-[40px] flex items-center justify-center"
    },
    /* @__PURE__ */ React10.createElement(X2, { className: "w-5 h-5" })
  )), /* @__PURE__ */ React10.createElement("ol", { className: "space-y-3 text-xs text-text-secondary mb-4 list-decimal list-inside" }, /* @__PURE__ */ React10.createElement("li", null, "Ketuk tombol ", /* @__PURE__ */ React10.createElement("strong", { className: "text-primary" }, "Share"), " (ikon kotak dengan panah ke atas) di bilah bawah Safari."), /* @__PURE__ */ React10.createElement("li", null, "Gulir ke bawah dan pilih", " ", /* @__PURE__ */ React10.createElement("strong", { className: "text-text-main" }, "Tambahkan ke Layar Utama (Add to Home Screen)"), "."), /* @__PURE__ */ React10.createElement("li", null, "Ketuk ", /* @__PURE__ */ React10.createElement("strong", { className: "text-primary" }, "Tambah (Add)"), " di pojok kanan atas.")), /* @__PURE__ */ React10.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowIOSModal(false),
      className: "w-full bg-primary text-white font-bold py-2.5 rounded-xl text-xs min-h-[44px]"
    },
    "Mengerti"
  ))));
};

// src/pages/ShoppingPage.tsx
var ShoppingPage = () => {
  const {
    isAddItemSheetOpen,
    editingItem,
    openAddItemSheet,
    closeAddItemSheet,
    openScanner,
    selectedPaymentMethod,
    isOnline,
    setIsOnline
  } = useStore();
  const [currentPeriod] = useState3(getCurrentMonthPeriod());
  const [budgetLimit, setBudgetLimit] = useState3(12e5);
  const [isEditingBudget, setIsEditingBudget] = useState3(false);
  const [newBudgetInput, setNewBudgetInput] = useState3("");
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState3(false);
  const [checkoutSuccessMessage, setCheckoutSuccessMessage] = useState3(null);
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState3(null);
  const cartItems = useLiveQuery(() => db.cartItems.toArray()) || [];
  const budgetRecord = useLiveQuery(() => db.budgets.where("period").equals(currentPeriod).first());
  useEffect3(() => {
    if (budgetRecord) {
      setBudgetLimit(budgetRecord.limit);
      setNewBudgetInput(budgetRecord.limit.toString());
    }
  }, [budgetRecord]);
  useEffect3(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOnline]);
  const totals = calculateCartTotals(cartItems);
  const budgetStatus = evaluateBudgetSafety(budgetLimit, totals.finalTotal, totals.discountTotal);
  const handleIncreaseQty = async (id) => {
    await groceryService.adjustQuantity(id, 1);
  };
  const handleDecreaseQty = async (id) => {
    await groceryService.adjustQuantity(id, -1);
  };
  const handleEditItem = (item) => {
    openAddItemSheet(item);
  };
  const handleDeleteItem = async (id) => {
    await groceryService.deleteCartItem(id);
  };
  const handleToggleStatus = async (id) => {
    await groceryService.toggleCartItemStatus(id);
  };
  const handleSaveItem = async (data) => {
    if (editingItem) {
      await groceryService.updateCartItem(editingItem.id, {
        nameSnapshot: data.name,
        categorySnapshot: data.category,
        unit: data.unit,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        discounts: data.discounts
      });
    } else {
      await groceryService.addItemToCart(data);
    }
  };
  const handleSaveBudgetLimit = async () => {
    const parsed = parseInt(newBudgetInput.replace(/\D/g, ""), 10) || 0;
    await groceryService.setBudget(currentPeriod, parsed);
    setBudgetLimit(parsed);
    setIsEditingBudget(false);
  };
  const handleConfirmCheckout = async () => {
    try {
      setCheckoutErrorMessage(null);
      const completedTx = await groceryService.completeCheckout(budgetLimit, selectedPaymentMethod);
      setIsCheckoutDialogOpen(false);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
      }
      setCheckoutSuccessMessage(
        `Belanja berhasil diselesaikan via ${selectedPaymentMethod}! Total ${formatRupiah(
          completedTx.finalTotal
        )} tersimpan permanen di riwayat.`
      );
      setTimeout(() => {
        setCheckoutSuccessMessage(null);
      }, 5e3);
    } catch (err) {
      console.error(err);
      setCheckoutErrorMessage(err.message || "Gagal menyelesaikan transaksi belanja");
    }
  };
  return /* @__PURE__ */ React11.createElement("div", { className: "space-y-4 pb-24" }, /* @__PURE__ */ React11.createElement(PWAInstallBanner, null), /* @__PURE__ */ React11.createElement("div", { className: "flex items-center justify-between pt-1" }, /* @__PURE__ */ React11.createElement("div", null, /* @__PURE__ */ React11.createElement("div", { className: "flex items-center gap-1.5 text-xs text-text-secondary dark:text-slate-400 font-medium" }, /* @__PURE__ */ React11.createElement("span", null, formatPeriodLabel(currentPeriod)), /* @__PURE__ */ React11.createElement("span", null, "\u2022"), /* @__PURE__ */ React11.createElement("span", { className: "text-primary dark:text-blue-400 font-semibold" }, "Troli Supermarket")), /* @__PURE__ */ React11.createElement("h1", { className: "text-xl font-extrabold text-text-main dark:text-slate-100 tracking-tight" }, "Belanja Bulanan")), /* @__PURE__ */ React11.createElement(
    "div",
    {
      className: `flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${isOnline ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"}`
    },
    isOnline ? /* @__PURE__ */ React11.createElement(React11.Fragment, null, /* @__PURE__ */ React11.createElement(Wifi, { className: "w-3 h-3 text-emerald-600 dark:text-emerald-400" }), /* @__PURE__ */ React11.createElement("span", null, "Online")) : /* @__PURE__ */ React11.createElement(React11.Fragment, null, /* @__PURE__ */ React11.createElement(WifiOff, { className: "w-3 h-3 text-amber-700 dark:text-amber-400" }), /* @__PURE__ */ React11.createElement("span", null, "Offline (Tersimpan Lokal)"))
  )), checkoutSuccessMessage && /* @__PURE__ */ React11.createElement("div", { className: "bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs animate-fade-in shadow-soft" }, /* @__PURE__ */ React11.createElement(CheckCircle, { className: "w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" }), /* @__PURE__ */ React11.createElement("span", { className: "font-semibold" }, checkoutSuccessMessage)), checkoutErrorMessage && /* @__PURE__ */ React11.createElement("div", { className: "bg-red-50 dark:bg-rose-950/80 border border-red-200 dark:border-rose-800 text-danger dark:text-rose-300 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs animate-fade-in" }, /* @__PURE__ */ React11.createElement(AlertCircle, { className: "w-4 h-4 text-danger dark:text-rose-400 flex-shrink-0" }), /* @__PURE__ */ React11.createElement("span", { className: "font-semibold" }, checkoutErrorMessage)), /* @__PURE__ */ React11.createElement(
    BudgetSafetyCard,
    {
      budgetStatus,
      itemCount: cartItems.length,
      totalSavings: totals.discountTotal,
      onEditBudget: () => setIsEditingBudget(true)
    }
  ), /* @__PURE__ */ React11.createElement("div", { className: "flex items-center justify-between pt-1" }, /* @__PURE__ */ React11.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React11.createElement("h2", { className: "font-bold text-sm text-text-main dark:text-slate-100" }, "Isi Troli"), /* @__PURE__ */ React11.createElement("span", { className: "text-xs bg-gray-200/70 dark:bg-slate-700 text-text-secondary dark:text-slate-300 font-semibold px-2 py-0.5 rounded-full" }, cartItems.length, " barang"), totals.completedCount > 0 && /* @__PURE__ */ React11.createElement("span", { className: "text-[11px] text-emerald-600 dark:text-emerald-400 font-medium" }, "(", totals.completedCount, " tercentang)")), /* @__PURE__ */ React11.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React11.createElement(
    "button",
    {
      type: "button",
      onClick: openScanner,
      className: "inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-soft transition-all min-h-[44px]",
      title: "Scan Barcode Supermarket Tanpa Input Manual"
    },
    /* @__PURE__ */ React11.createElement(Scan, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ React11.createElement("span", null, "Scan Barcode")
  ), /* @__PURE__ */ React11.createElement(
    "button",
    {
      type: "button",
      onClick: () => openAddItemSheet(null),
      className: "inline-flex items-center gap-1 bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-soft transition-all min-h-[44px]",
      title: "Tambah Barang Manual"
    },
    /* @__PURE__ */ React11.createElement(Plus3, { className: "w-3.5 h-3.5 stroke-[2.5]" }),
    /* @__PURE__ */ React11.createElement("span", null, "Manual")
  ))), cartItems.length === 0 ? /* @__PURE__ */ React11.createElement(
    EmptyState,
    {
      icon: ShoppingCart3,
      title: "Troli Masih Kosong",
      description: "Pindai barcode kemasan barang supermarket atau tambahkan barang secara manual.",
      actionLabel: "\u{1F4F7} Scan Barcode Sekarang",
      onAction: openScanner
    }
  ) : /* @__PURE__ */ React11.createElement("div", { className: "space-y-2.5" }, cartItems.map((item) => /* @__PURE__ */ React11.createElement(
    GroceryItemCard,
    {
      key: item.id,
      item,
      onIncrease: handleIncreaseQty,
      onDecrease: handleDecreaseQty,
      onEdit: handleEditItem,
      onDelete: handleDeleteItem,
      onToggleStatus: handleToggleStatus
    }
  ))), cartItems.length > 0 && /* @__PURE__ */ React11.createElement("div", { className: "bg-card/95 dark:bg-slate-800/95 backdrop-blur-md rounded-card p-4 border border-border dark:border-slate-700 shadow-float mt-4 space-y-3" }, /* @__PURE__ */ React11.createElement("div", { className: "flex items-center justify-between text-xs text-text-secondary dark:text-slate-400" }, /* @__PURE__ */ React11.createElement("span", null, "Total Sebelum Diskon (", totals.totalQuantity, " unit):"), /* @__PURE__ */ React11.createElement("span", { className: "font-semibold text-text-main dark:text-slate-200" }, formatRupiah(totals.grossTotal))), totals.discountTotal > 0 && /* @__PURE__ */ React11.createElement("div", { className: "flex items-center justify-between text-xs text-success dark:text-emerald-400 font-semibold" }, /* @__PURE__ */ React11.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React11.createElement(TrendingDown2, { className: "w-3.5 h-3.5" }), "Penghematan Promo Diskon:"), /* @__PURE__ */ React11.createElement("span", null, "-", formatRupiah(totals.discountTotal))), /* @__PURE__ */ React11.createElement("div", { className: "flex items-center justify-between text-xs pt-1 border-t border-gray-100/80 dark:border-slate-700" }, /* @__PURE__ */ React11.createElement("span", { className: "text-gray-500 dark:text-slate-400 flex items-center gap-1" }, /* @__PURE__ */ React11.createElement(CreditCard, { className: "w-3.5 h-3.5 text-blue-600 dark:text-blue-400" }), "Sumber Pembayaran:"), /* @__PURE__ */ React11.createElement("span", { className: "font-bold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-900" }, selectedPaymentMethod)), /* @__PURE__ */ React11.createElement("div", { className: "flex items-center justify-between border-t border-gray-100 dark:border-slate-700 pt-2" }, /* @__PURE__ */ React11.createElement("div", null, /* @__PURE__ */ React11.createElement("span", { className: "text-[11px] text-text-secondary dark:text-slate-400 block font-medium" }, "Total Akhir Belanja:"), /* @__PURE__ */ React11.createElement("span", { className: "text-xl font-extrabold text-primary dark:text-blue-400" }, formatRupiah(totals.finalTotal))), /* @__PURE__ */ React11.createElement(
    "button",
    {
      type: "button",
      onClick: () => setIsCheckoutDialogOpen(true),
      className: "bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-soft transition-all min-h-[48px] flex items-center gap-1.5"
    },
    /* @__PURE__ */ React11.createElement(Check, { className: "w-4 h-4 stroke-[2.5]" }),
    /* @__PURE__ */ React11.createElement("span", null, "Selesaikan Belanja")
  ))), isEditingBudget && /* @__PURE__ */ React11.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" }, /* @__PURE__ */ React11.createElement("div", { className: "w-full max-w-[360px] bg-white dark:bg-slate-900 rounded-card-lg p-5 shadow-modal animate-slide-up border dark:border-slate-800" }, /* @__PURE__ */ React11.createElement("h3", { className: "font-bold text-base text-text-main dark:text-slate-100 mb-1" }, "Atur Batas Anggaran Bulanan"), /* @__PURE__ */ React11.createElement("p", { className: "text-xs text-text-secondary dark:text-slate-400 mb-4" }, "Masukkan pagu maksimal belanja untuk bulan ", formatPeriodLabel(currentPeriod), "."), /* @__PURE__ */ React11.createElement("div", { className: "relative mb-4" }, /* @__PURE__ */ React11.createElement("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-gray-400 dark:text-slate-500" }, "Rp"), /* @__PURE__ */ React11.createElement(
    "input",
    {
      type: "number",
      inputMode: "numeric",
      value: newBudgetInput,
      onChange: (e) => setNewBudgetInput(e.target.value),
      placeholder: "1200000",
      className: "w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 font-bold text-base outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
    }
  )), /* @__PURE__ */ React11.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React11.createElement(
    "button",
    {
      type: "button",
      onClick: () => setIsEditingBudget(false),
      className: "flex-1 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-text-main dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 min-h-[44px]"
    },
    "Batal"
  ), /* @__PURE__ */ React11.createElement(
    "button",
    {
      type: "button",
      onClick: handleSaveBudgetLimit,
      className: "flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover shadow-soft min-h-[44px]"
    },
    "Simpan Limit"
  )))), /* @__PURE__ */ React11.createElement(
    AddItemSheet,
    {
      isOpen: isAddItemSheetOpen,
      onClose: closeAddItemSheet,
      onSave: handleSaveItem,
      editingItem
    }
  ), /* @__PURE__ */ React11.createElement(
    ConfirmDialog,
    {
      isOpen: isCheckoutDialogOpen,
      title: "Selesaikan Belanja Sekarang?",
      message: `Total tagihan kasir adalah ${formatRupiah(
        totals.finalTotal
      )} (${cartItems.length} jenis barang). Pembayaran dicatat menggunakan ${selectedPaymentMethod}. Transaksi akan disimpan ke riwayat dan keranjang belanja dikosongkan.`,
      confirmLabel: "Ya, Selesai Belanja",
      cancelLabel: "Kembali ke Troli",
      onConfirm: handleConfirmCheckout,
      onCancel: () => setIsCheckoutDialogOpen(false)
    }
  ));
};

// src/pages/HistoryPage.tsx
import React13, { useState as useState5, useRef } from "react";
import { useLiveQuery as useLiveQuery2 } from "dexie-react-hooks";
import {
  Search,
  Filter,
  Download,
  Upload,
  History as History2,
  TrendingDown as TrendingDown3,
  TrendingUp,
  AlertCircle as AlertCircle2,
  CheckCircle as CheckCircle3
} from "lucide-react";

// src/components/HistoryTransactionCard.tsx
import React12, { useState as useState4 } from "react";
import { Calendar, ChevronDown, ChevronUp, CheckCircle2 as CheckCircle22 } from "lucide-react";
var HistoryTransactionCard = ({ transaction }) => {
  const [isExpanded, setIsExpanded] = useState4(false);
  const formattedDate = new Date(transaction.purchasedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  return /* @__PURE__ */ React12.createElement("div", { className: "bg-card dark:bg-slate-800/90 rounded-card p-4 border border-border dark:border-slate-700 shadow-soft transition-all duration-200" }, /* @__PURE__ */ React12.createElement("div", { className: "flex items-start justify-between gap-2" }, /* @__PURE__ */ React12.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React12.createElement("div", { className: "w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-success dark:text-emerald-400 flex items-center justify-center flex-shrink-0" }, /* @__PURE__ */ React12.createElement(CheckCircle22, { className: "w-5 h-5" })), /* @__PURE__ */ React12.createElement("div", null, /* @__PURE__ */ React12.createElement("div", { className: "flex items-center gap-1.5 text-[11px] text-text-secondary dark:text-slate-400 font-medium" }, /* @__PURE__ */ React12.createElement(Calendar, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ React12.createElement("span", null, formattedDate)), /* @__PURE__ */ React12.createElement("span", { className: "text-xs font-semibold text-text-main dark:text-slate-100" }, transaction.items.length, " jenis barang dibeli"))), /* @__PURE__ */ React12.createElement("div", { className: "text-right" }, /* @__PURE__ */ React12.createElement("span", { className: "text-base font-extrabold text-primary dark:text-blue-400 block" }, formatRupiah(transaction.finalTotal)), transaction.discountTotal > 0 && /* @__PURE__ */ React12.createElement("span", { className: "text-[10px] font-bold text-success dark:text-emerald-400 block" }, "Hemat ", formatRupiah(transaction.discountTotal)))), /* @__PURE__ */ React12.createElement("div", { className: "mt-2.5 text-[11px] text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-750 px-2.5 py-1.5 rounded-lg flex flex-wrap items-center justify-between gap-1" }, transaction.budgetLimitSnapshot > 0 && /* @__PURE__ */ React12.createElement("div", null, /* @__PURE__ */ React12.createElement("span", null, "Snapshot Batas: "), /* @__PURE__ */ React12.createElement("span", { className: "font-semibold text-text-main dark:text-slate-200" }, formatRupiah(transaction.budgetLimitSnapshot), " (", (transaction.finalTotal / transaction.budgetLimitSnapshot * 100).toFixed(1), "%)")), /* @__PURE__ */ React12.createElement("div", { className: "flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900" }, /* @__PURE__ */ React12.createElement("span", null, "\u{1F4B3} ", transaction.paymentMethod || "Bank BCA"))), /* @__PURE__ */ React12.createElement(
    "button",
    {
      type: "button",
      onClick: () => setIsExpanded(!isExpanded),
      className: "w-full mt-3 pt-2 border-t border-gray-100 dark:border-slate-700 flex items-center justify-center gap-1 text-xs font-semibold text-text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors min-h-[40px]"
    },
    /* @__PURE__ */ React12.createElement("span", null, isExpanded ? "Sembunyikan Rincian" : "Lihat Rincian Item"),
    isExpanded ? /* @__PURE__ */ React12.createElement(ChevronUp, { className: "w-4 h-4" }) : /* @__PURE__ */ React12.createElement(ChevronDown, { className: "w-4 h-4" })
  ), isExpanded && /* @__PURE__ */ React12.createElement("div", { className: "mt-2.5 space-y-2 pt-2 border-t border-dashed border-gray-200 dark:border-slate-700 animate-fade-in" }, transaction.items.map((item, idx) => /* @__PURE__ */ React12.createElement(
    "div",
    {
      key: item.id || idx,
      className: "bg-gray-50/70 dark:bg-slate-700/60 p-2.5 rounded-xl border border-gray-200/80 dark:border-slate-650 flex items-center justify-between text-xs"
    },
    /* @__PURE__ */ React12.createElement("div", { className: "flex-1 min-w-0 pr-2" }, /* @__PURE__ */ React12.createElement("div", { className: "flex items-center gap-1.5 mb-0.5" }, /* @__PURE__ */ React12.createElement("span", { className: "text-[9px] font-semibold text-gray-500 dark:text-slate-300 bg-gray-200/60 dark:bg-slate-600 px-1.5 py-0.2 rounded" }, item.categorySnapshot), item.discounts.length > 0 && /* @__PURE__ */ React12.createElement("span", { className: "text-[9px] font-bold text-danger dark:text-rose-300 bg-red-50 dark:bg-rose-950/70 px-1 rounded" }, "Diskon -", item.discounts.join("% -"), "%")), /* @__PURE__ */ React12.createElement("h4", { className: "font-semibold text-text-main dark:text-slate-100 truncate text-xs" }, item.nameSnapshot), /* @__PURE__ */ React12.createElement("div", { className: "text-[11px] text-text-secondary dark:text-slate-400" }, item.quantity, " ", item.unit, " \xD7 ", formatRupiah(item.unitPrice))),
    /* @__PURE__ */ React12.createElement("div", { className: "text-right flex-shrink-0" }, /* @__PURE__ */ React12.createElement("span", { className: "font-bold text-text-main dark:text-slate-100 block" }, formatRupiah(item.finalSubtotal)), item.discountAmount > 0 && /* @__PURE__ */ React12.createElement("span", { className: "text-[10px] text-success dark:text-emerald-400 block" }, "Hemat ", formatRupiah(item.discountAmount)))
  )), /* @__PURE__ */ React12.createElement("div", { className: "bg-blue-50/50 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/60 text-xs space-y-1" }, /* @__PURE__ */ React12.createElement("div", { className: "flex justify-between text-gray-600 dark:text-slate-400" }, /* @__PURE__ */ React12.createElement("span", null, "Total Kotor Sebelum Diskon:"), /* @__PURE__ */ React12.createElement("span", { className: "text-gray-900 dark:text-slate-200" }, formatRupiah(transaction.grossTotal))), /* @__PURE__ */ React12.createElement("div", { className: "flex justify-between text-success dark:text-emerald-400 font-medium" }, /* @__PURE__ */ React12.createElement("span", null, "Total Penghematan Diskon:"), /* @__PURE__ */ React12.createElement("span", null, "-", formatRupiah(transaction.discountTotal))), /* @__PURE__ */ React12.createElement("div", { className: "flex justify-between text-primary dark:text-blue-400 font-bold text-sm pt-1 border-t border-blue-200/50 dark:border-blue-800/40" }, /* @__PURE__ */ React12.createElement("span", null, "Total Akhir Dibayar:"), /* @__PURE__ */ React12.createElement("span", null, formatRupiah(transaction.finalTotal))))));
};

// src/pages/HistoryPage.tsx
var HistoryPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState5("all");
  const [searchQuery, setSearchQuery] = useState5("");
  const [backupStatus, setBackupStatus] = useState5(
    null
  );
  const fileInputRef = useRef(null);
  const transactions = useLiveQuery2(() => db.transactions.toArray()) || [];
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
  );
  const distinctPeriods = Array.from(new Set(transactions.map((tx) => tx.period))).sort().reverse();
  const filteredTransactions = sortedTransactions.filter((tx) => {
    const matchesPeriod = selectedPeriod === "all" || tx.period === selectedPeriod;
    if (!matchesPeriod) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return tx.items.some(
      (item) => item.nameSnapshot.toLowerCase().includes(query) || item.categorySnapshot.toLowerCase().includes(query)
    );
  });
  const activeMetricsPeriod = selectedPeriod === "all" ? distinctPeriods[0] : selectedPeriod;
  const periodTransactions = transactions.filter((tx) => tx.period === activeMetricsPeriod);
  const periodTotalSpending = periodTransactions.reduce((acc, tx) => acc + tx.finalTotal, 0);
  const periodTotalSavings = periodTransactions.reduce((acc, tx) => acc + tx.discountTotal, 0);
  const prevPeriod = getPreviousMonthPeriod(activeMetricsPeriod);
  const prevTransactions = transactions.filter((tx) => tx.period === prevPeriod);
  const prevTotalSpending = prevTransactions.reduce((acc, tx) => acc + tx.finalTotal, 0);
  const spendingDiff = periodTotalSpending - prevTotalSpending;
  const spendingPctChange = prevTotalSpending > 0 ? (spendingDiff / prevTotalSpending * 100).toFixed(1) : null;
  const handleExportBackup = async () => {
    try {
      const json = await groceryService.exportBackup();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `smart-grocery-backup-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatus({ type: "success", message: "Data cadangan berhasil diunduh!" });
      setTimeout(() => setBackupStatus(null), 4e3);
    } catch (err) {
      setBackupStatus({ type: "error", message: "Gagal mengekspor data: " + err.message });
    }
  };
  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await groceryService.importBackup(text);
      setBackupStatus({ type: "success", message: "Data cadangan berhasil dipulihkan!" });
      setTimeout(() => setBackupStatus(null), 4e3);
    } catch (err) {
      setBackupStatus({ type: "error", message: "File tidak valid: " + err.message });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  return /* @__PURE__ */ React13.createElement("div", { className: "space-y-4 pb-24" }, /* @__PURE__ */ React13.createElement("div", { className: "flex items-center justify-between pt-1" }, /* @__PURE__ */ React13.createElement("div", null, /* @__PURE__ */ React13.createElement("span", { className: "text-xs text-text-secondary dark:text-slate-400 font-medium block" }, "Arsip Transaksi Selesai"), /* @__PURE__ */ React13.createElement("h1", { className: "text-xl font-extrabold text-text-main dark:text-slate-100 tracking-tight" }, "Riwayat Belanja")), /* @__PURE__ */ React13.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React13.createElement(
    "button",
    {
      type: "button",
      onClick: handleExportBackup,
      className: "p-2 text-primary dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors min-h-[40px]",
      title: "Ekspor Backup JSON"
    },
    /* @__PURE__ */ React13.createElement(Download, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ React13.createElement("span", { className: "hidden sm:inline" }, "Cadangkan")
  ), /* @__PURE__ */ React13.createElement(
    "button",
    {
      type: "button",
      onClick: () => fileInputRef.current?.click(),
      className: "p-2 text-text-secondary dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors min-h-[40px]",
      title: "Impor Backup JSON"
    },
    /* @__PURE__ */ React13.createElement(Upload, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ React13.createElement("span", { className: "hidden sm:inline" }, "Pulihkan")
  ), /* @__PURE__ */ React13.createElement(
    "input",
    {
      ref: fileInputRef,
      type: "file",
      accept: ".json",
      onChange: handleImportFile,
      className: "hidden"
    }
  ))), backupStatus && /* @__PURE__ */ React13.createElement(
    "div",
    {
      className: `p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-fade-in ${backupStatus.type === "success" ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-rose-950/80 text-danger dark:text-rose-300 border border-red-200 dark:border-rose-800"}`
    },
    backupStatus.type === "success" ? /* @__PURE__ */ React13.createElement(CheckCircle3, { className: "w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" }) : /* @__PURE__ */ React13.createElement(AlertCircle2, { className: "w-4 h-4 text-danger dark:text-rose-400 flex-shrink-0" }),
    /* @__PURE__ */ React13.createElement("span", null, backupStatus.message)
  ), activeMetricsPeriod && periodTransactions.length > 0 && /* @__PURE__ */ React13.createElement("div", { className: "bg-card dark:bg-slate-800/90 rounded-card p-4 border border-border dark:border-slate-700 shadow-soft space-y-3" }, /* @__PURE__ */ React13.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React13.createElement("span", { className: "text-xs font-bold text-text-secondary dark:text-slate-400" }, "Ringkasan ", formatPeriodLabel(activeMetricsPeriod)), /* @__PURE__ */ React13.createElement("span", { className: "text-[11px] bg-blue-50 dark:bg-blue-950/80 text-primary dark:text-blue-300 font-bold px-2 py-0.5 rounded-full" }, periodTransactions.length, " transaksi selesai")), /* @__PURE__ */ React13.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React13.createElement("div", null, /* @__PURE__ */ React13.createElement("span", { className: "text-[11px] text-text-secondary dark:text-slate-400 block" }, "Total Pengeluaran"), /* @__PURE__ */ React13.createElement("span", { className: "text-lg font-extrabold text-primary dark:text-blue-400" }, formatRupiah(periodTotalSpending))), /* @__PURE__ */ React13.createElement("div", { className: "text-right" }, /* @__PURE__ */ React13.createElement("span", { className: "text-[11px] text-text-secondary dark:text-slate-400 block" }, "Hemat dari Promo"), /* @__PURE__ */ React13.createElement("span", { className: "text-lg font-extrabold text-success dark:text-emerald-400" }, formatRupiah(periodTotalSavings)))), prevTotalSpending > 0 && spendingPctChange !== null && /* @__PURE__ */ React13.createElement("div", { className: "border-t border-gray-100 dark:border-slate-700 pt-2 flex items-center justify-between text-xs" }, /* @__PURE__ */ React13.createElement("span", { className: "text-text-secondary dark:text-slate-400" }, "Vs ", formatPeriodLabel(prevPeriod), " (", formatRupiah(prevTotalSpending), "):"), /* @__PURE__ */ React13.createElement(
    "span",
    {
      className: `font-bold flex items-center gap-1 ${spendingDiff > 0 ? "text-danger dark:text-rose-400" : "text-success dark:text-emerald-400"}`
    },
    spendingDiff > 0 ? /* @__PURE__ */ React13.createElement(React13.Fragment, null, /* @__PURE__ */ React13.createElement(TrendingUp, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ React13.createElement("span", null, "Naik ", spendingPctChange, "%")) : /* @__PURE__ */ React13.createElement(React13.Fragment, null, /* @__PURE__ */ React13.createElement(TrendingDown3, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ React13.createElement("span", null, "Turun ", Math.abs(Number(spendingPctChange)), "%"))
  ))), /* @__PURE__ */ React13.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React13.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React13.createElement("div", { className: "relative flex-1" }, /* @__PURE__ */ React13.createElement(
    "select",
    {
      value: selectedPeriod,
      onChange: (e) => setSelectedPeriod(e.target.value),
      className: "w-full appearance-none px-3 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-text-main dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
    },
    /* @__PURE__ */ React13.createElement("option", { value: "all" }, "Semua Periode Bulan"),
    distinctPeriods.map((period) => /* @__PURE__ */ React13.createElement("option", { key: period, value: period }, formatPeriodLabel(period)))
  ), /* @__PURE__ */ React13.createElement(Filter, { className: "w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" })), /* @__PURE__ */ React13.createElement("div", { className: "relative flex-[1.4]" }, /* @__PURE__ */ React13.createElement(
    "input",
    {
      type: "text",
      placeholder: "Cari nama barang...",
      value: searchQuery,
      onChange: (e) => setSearchQuery(e.target.value),
      className: "w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-text-main dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
    }
  ), /* @__PURE__ */ React13.createElement(Search, { className: "w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" })))), filteredTransactions.length === 0 ? /* @__PURE__ */ React13.createElement(
    EmptyState,
    {
      icon: History2,
      title: "Tidak Ada Riwayat",
      description: searchQuery ? `Barang "${searchQuery}" tidak ditemukan pada periode riwayat yang dipilih.` : "Belum ada transaksi belanja yang diselesaikan."
    }
  ) : /* @__PURE__ */ React13.createElement("div", { className: "space-y-3" }, filteredTransactions.map((tx) => /* @__PURE__ */ React13.createElement(HistoryTransactionCard, { key: tx.id, transaction: tx }))));
};

// src/pages/BudgetPage.tsx
import React15, { useState as useState6, useEffect as useEffect4 } from "react";
import { useLiveQuery as useLiveQuery3 } from "dexie-react-hooks";
import {
  Wallet as Wallet2,
  ShieldCheck as ShieldCheck3,
  AlertTriangle as AlertTriangle3,
  PieChart,
  Calendar as Calendar2,
  Save,
  CheckCircle as CheckCircle4,
  Info,
  CreditCard as CreditCard3,
  ChevronRight
} from "lucide-react";

// src/components/PaymentMethodSelectorModal.tsx
import React14 from "react";
import { X as X3, Check as Check2, CreditCard as CreditCard2, ShieldCheck as ShieldCheck2 } from "lucide-react";
var PaymentMethodSelectorModal = ({
  isOpen,
  onClose
}) => {
  const { selectedPaymentMethod, setSelectedPaymentMethod, username } = useStore();
  if (!isOpen) return null;
  return /* @__PURE__ */ React14.createElement("div", { className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in" }, /* @__PURE__ */ React14.createElement(
    "div",
    {
      className: "w-full max-w-[390px] bg-white dark:bg-slate-900 rounded-t-card-lg sm:rounded-card-lg p-5 shadow-modal animate-slide-up border dark:border-slate-800",
      role: "dialog",
      "aria-modal": "true"
    },
    /* @__PURE__ */ React14.createElement("div", { className: "flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800" }, /* @__PURE__ */ React14.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React14.createElement("div", { className: "w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center" }, /* @__PURE__ */ React14.createElement(CreditCard2, { className: "w-4 h-4" })), /* @__PURE__ */ React14.createElement("div", null, /* @__PURE__ */ React14.createElement("h3", { className: "font-bold text-sm text-text-main dark:text-slate-100" }, "Pilih Sumber Rekening / Bank"), /* @__PURE__ */ React14.createElement("p", { className: "text-[11px] text-text-secondary dark:text-slate-400" }, "Penyimpanan dana belanja ", username))), /* @__PURE__ */ React14.createElement(
      "button",
      {
        type: "button",
        onClick: onClose,
        className: "p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center"
      },
      /* @__PURE__ */ React14.createElement(X3, { className: "w-5 h-5" })
    )),
    /* @__PURE__ */ React14.createElement("div", { className: "space-y-2.5 py-4" }, PAYMENT_ACCOUNTS.map((acc) => {
      const isSelected = selectedPaymentMethod === acc.name;
      const isBCA = acc.id === "bca";
      return /* @__PURE__ */ React14.createElement(
        "button",
        {
          key: acc.id,
          type: "button",
          onClick: () => {
            setSelectedPaymentMethod(acc.name);
            onClose();
          },
          className: `w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all min-h-[52px] ${isSelected ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 shadow-sm ring-2 ring-blue-100 dark:ring-blue-900" : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-750"}`
        },
        /* @__PURE__ */ React14.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React14.createElement(
          "div",
          {
            className: `w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm ${isBCA ? "bg-[#005EAA]" : acc.type === "cash" ? "bg-emerald-600" : acc.type === "ewallet" ? "bg-[#00AED6]" : "bg-indigo-600"}`
          },
          isBCA ? "BCA" : acc.type === "cash" ? "\u{1F4B5}" : acc.type === "ewallet" ? "QR" : "BANK"
        ), /* @__PURE__ */ React14.createElement("div", null, /* @__PURE__ */ React14.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React14.createElement("h4", { className: "font-bold text-xs text-text-main dark:text-slate-100" }, acc.name), isBCA && /* @__PURE__ */ React14.createElement("span", { className: "text-[9px] font-extrabold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-1.5 py-0.2 rounded-full" }, "Utama")), /* @__PURE__ */ React14.createElement("p", { className: "text-[11px] text-text-secondary dark:text-slate-400 mt-0.5" }, acc.accountNumber))),
        isSelected ? /* @__PURE__ */ React14.createElement("div", { className: "w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm" }, /* @__PURE__ */ React14.createElement(Check2, { className: "w-3.5 h-3.5 stroke-[3]" })) : /* @__PURE__ */ React14.createElement("div", { className: "w-5 h-5 rounded-full border border-gray-300 dark:border-slate-600" })
      );
    })),
    /* @__PURE__ */ React14.createElement("div", { className: "bg-gray-50 dark:bg-slate-800 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700 flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400 mb-3" }, /* @__PURE__ */ React14.createElement(ShieldCheck2, { className: "w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" }), /* @__PURE__ */ React14.createElement("span", null, "Pengeluaran belanja akan otomatis dialokasikan ke rekening terpilih.")),
    /* @__PURE__ */ React14.createElement(
      "button",
      {
        type: "button",
        onClick: onClose,
        className: "w-full bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold py-2.5 rounded-xl text-xs min-h-[44px]"
      },
      "Konfirmasi Pilihan"
    )
  ));
};

// src/pages/BudgetPage.tsx
var BudgetPage = () => {
  const { username, selectedPaymentMethod } = useStore();
  const [currentPeriod] = useState6(getCurrentMonthPeriod());
  const [budgetLimitInput, setBudgetLimitInput] = useState6("1200000");
  const [isSaved, setIsSaved] = useState6(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState6(false);
  const cartItems = useLiveQuery3(() => db.cartItems.toArray()) || [];
  const budgetRecord = useLiveQuery3(() => db.budgets.where("period").equals(currentPeriod).first());
  const transactions = useLiveQuery3(() => db.transactions.toArray()) || [];
  useEffect4(() => {
    if (budgetRecord) {
      setBudgetLimitInput(budgetRecord.limit.toString());
    }
  }, [budgetRecord]);
  const activeTotals = calculateCartTotals(cartItems);
  const currentLimit = budgetRecord ? budgetRecord.limit : 12e5;
  const budgetStatus = evaluateBudgetSafety(
    currentLimit,
    activeTotals.finalTotal,
    activeTotals.discountTotal
  );
  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const parsed = parseInt(budgetLimitInput.replace(/\D/g, ""), 10) || 0;
    await groceryService.setBudget(currentPeriod, parsed);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3e3);
  };
  const categorySpending = {};
  for (const cat of PRODUCT_CATEGORIES) {
    categorySpending[cat] = 0;
  }
  for (const item of cartItems) {
    const subtotal = item.quantity * item.unitPrice;
    categorySpending[item.categorySnapshot] = (categorySpending[item.categorySnapshot] || 0) + subtotal;
  }
  const activeCategoriesWithSpending = Object.entries(categorySpending).filter(([_, amount]) => amount > 0).sort((a, b) => b[1] - a[1]);
  const historyByPeriod = {};
  for (const tx of transactions) {
    historyByPeriod[tx.period] = (historyByPeriod[tx.period] || 0) + tx.finalTotal;
  }
  const historicalPeriods = Object.entries(historyByPeriod).sort().reverse();
  return /* @__PURE__ */ React15.createElement("div", { className: "space-y-4 pb-24" }, /* @__PURE__ */ React15.createElement("div", { className: "pt-1" }, /* @__PURE__ */ React15.createElement("span", { className: "text-xs text-text-secondary dark:text-slate-400 font-medium block" }, formatPeriodLabel(currentPeriod), " \u2022 ", username), /* @__PURE__ */ React15.createElement("h1", { className: "text-xl font-extrabold text-text-main dark:text-slate-100 tracking-tight" }, "Pengendali Anggaran")), /* @__PURE__ */ React15.createElement("div", { className: "bg-gradient-to-r from-blue-700 to-indigo-800 dark:from-slate-800 dark:to-blue-950 text-white rounded-card p-4 shadow-soft space-y-2.5 border dark:border-slate-700" }, /* @__PURE__ */ React15.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React15.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React15.createElement("div", { className: "w-8 h-8 rounded-full bg-white/20 dark:bg-blue-500/20 flex items-center justify-center" }, /* @__PURE__ */ React15.createElement(CreditCard3, { className: "w-4 h-4 text-white dark:text-blue-300" })), /* @__PURE__ */ React15.createElement("div", null, /* @__PURE__ */ React15.createElement("span", { className: "text-[10px] text-blue-200 dark:text-blue-300 block" }, "Penyimpanan Duit & Rekening Bayar"), /* @__PURE__ */ React15.createElement("h3", { className: "font-extrabold text-sm text-white" }, selectedPaymentMethod))), /* @__PURE__ */ React15.createElement(
    "button",
    {
      type: "button",
      onClick: () => setIsPaymentModalOpen(true),
      className: "text-xs font-bold bg-white dark:bg-blue-600 text-blue-800 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-700 px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1 min-h-[36px]"
    },
    /* @__PURE__ */ React15.createElement("span", null, "Ubah"),
    /* @__PURE__ */ React15.createElement(ChevronRight, { className: "w-3.5 h-3.5" })
  )), /* @__PURE__ */ React15.createElement("p", { className: "text-[11px] text-blue-100 dark:text-blue-200 bg-white/10 dark:bg-slate-900/40 px-2.5 py-1.5 rounded-xl" }, "\u{1F4A1} Rekening utama: ", /* @__PURE__ */ React15.createElement("strong", null, "Bank BCA (5271-8892-01)"), " untuk pengeluaran belanja mahasiswa rantau.")), /* @__PURE__ */ React15.createElement("div", { className: "bg-card dark:bg-slate-800/90 rounded-card p-4 border border-border dark:border-slate-700 shadow-soft space-y-3" }, /* @__PURE__ */ React15.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React15.createElement("div", { className: "w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/80 text-primary dark:text-blue-400 flex items-center justify-center" }, /* @__PURE__ */ React15.createElement(Wallet2, { className: "w-4 h-4" })), /* @__PURE__ */ React15.createElement("div", null, /* @__PURE__ */ React15.createElement("h2", { className: "font-bold text-sm text-text-main dark:text-slate-100" }, "Pagu Batas Anggaran (Safety Cap)"), /* @__PURE__ */ React15.createElement("p", { className: "text-[11px] text-text-secondary dark:text-slate-400" }, "Batas belanja bulanan tanpa mempengaruhi riwayat lama"))), /* @__PURE__ */ React15.createElement("form", { onSubmit: handleSaveBudget, className: "space-y-3" }, /* @__PURE__ */ React15.createElement("div", { className: "relative" }, /* @__PURE__ */ React15.createElement("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-gray-400 dark:text-slate-500" }, "Rp"), /* @__PURE__ */ React15.createElement(
    "input",
    {
      type: "number",
      inputMode: "numeric",
      value: budgetLimitInput,
      onChange: (e) => setBudgetLimitInput(e.target.value),
      placeholder: "1200000",
      className: "w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 font-bold text-base outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
    }
  )), /* @__PURE__ */ React15.createElement(
    "button",
    {
      type: "submit",
      className: "w-full bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-soft transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
    },
    /* @__PURE__ */ React15.createElement(Save, { className: "w-4 h-4" }),
    /* @__PURE__ */ React15.createElement("span", null, "Simpan Batas Anggaran")
  )), isSaved && /* @__PURE__ */ React15.createElement("div", { className: "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 text-xs font-semibold p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 animate-fade-in" }, /* @__PURE__ */ React15.createElement(CheckCircle4, { className: "w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" }), /* @__PURE__ */ React15.createElement("span", null, "Batas anggaran berhasil diperbarui!"))), /* @__PURE__ */ React15.createElement("div", { className: "bg-card dark:bg-slate-800/90 rounded-card p-4 border border-border dark:border-slate-700 shadow-soft space-y-3" }, /* @__PURE__ */ React15.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React15.createElement("h3", { className: "font-bold text-xs text-text-main dark:text-slate-100" }, "Analisis Keselamatan Anggaran"), /* @__PURE__ */ React15.createElement(
    "span",
    {
      className: `text-[11px] font-bold px-2 py-0.5 rounded-full ${budgetStatus.level === "safe" ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" : budgetStatus.level === "warning" ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300" : "bg-red-50 dark:bg-rose-950 text-danger dark:text-rose-300"}`
    },
    budgetStatus.percentage,
    "% Digunakan"
  )), /* @__PURE__ */ React15.createElement(
    "div",
    {
      className: `p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${budgetStatus.level === "safe" ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" : budgetStatus.level === "warning" ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800" : "bg-red-50 dark:bg-rose-950/60 text-danger dark:text-rose-300 border-red-200 dark:border-rose-800"}`
    },
    budgetStatus.level === "safe" ? /* @__PURE__ */ React15.createElement(ShieldCheck3, { className: "w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" }) : /* @__PURE__ */ React15.createElement(AlertTriangle3, { className: "w-4 h-4 text-warning dark:text-amber-400 flex-shrink-0" }),
    /* @__PURE__ */ React15.createElement("span", null, budgetStatus.message)
  ), /* @__PURE__ */ React15.createElement("div", { className: "grid grid-cols-2 gap-3 pt-1" }, /* @__PURE__ */ React15.createElement("div", { className: "bg-gray-50 dark:bg-slate-750 p-2.5 rounded-xl border dark:border-slate-700/60" }, /* @__PURE__ */ React15.createElement("span", { className: "text-[11px] text-text-secondary dark:text-slate-400 block" }, "Belanja Aktif di Troli"), /* @__PURE__ */ React15.createElement("span", { className: "text-base font-extrabold text-text-main dark:text-slate-100" }, formatRupiah(budgetStatus.activeTotal))), /* @__PURE__ */ React15.createElement("div", { className: "bg-gray-50 dark:bg-slate-750 p-2.5 rounded-xl border dark:border-slate-700/60" }, /* @__PURE__ */ React15.createElement("span", { className: "text-[11px] text-text-secondary dark:text-slate-400 block" }, budgetStatus.level === "exceeded" ? "Kelebihan Pagu" : "Sisa Batas Aman"), /* @__PURE__ */ React15.createElement(
    "span",
    {
      className: `text-base font-extrabold ${budgetStatus.level === "exceeded" ? "text-danger dark:text-rose-400" : "text-success dark:text-emerald-400"}`
    },
    budgetStatus.level === "exceeded" ? `+${formatRupiah(budgetStatus.excessAmount)}` : formatRupiah(budgetStatus.remaining)
  ))), /* @__PURE__ */ React15.createElement("div", { className: "text-[11px] text-gray-500 dark:text-slate-400 bg-blue-50/60 dark:bg-slate-750 p-2.5 rounded-xl space-y-1 border dark:border-slate-700/60" }, /* @__PURE__ */ React15.createElement("div", { className: "flex items-center gap-1 font-semibold text-primary dark:text-blue-400" }, /* @__PURE__ */ React15.createElement(Info, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ React15.createElement("span", null, "Panduan Safety Cap:")), /* @__PURE__ */ React15.createElement("ul", { className: "list-disc list-inside space-y-0.5 text-gray-600 dark:text-slate-300 pl-1" }, /* @__PURE__ */ React15.createElement("li", null, /* @__PURE__ */ React15.createElement("span", { className: "text-emerald-700 dark:text-emerald-400 font-semibold" }, "Hijau (< 70%):"), " Aman untuk kebutuhan tambahan."), /* @__PURE__ */ React15.createElement("li", null, /* @__PURE__ */ React15.createElement("span", { className: "text-amber-700 dark:text-amber-400 font-semibold" }, "Kuning (70% - 89%):"), " Waspada, batasi barang tersier/camilan."), /* @__PURE__ */ React15.createElement("li", null, /* @__PURE__ */ React15.createElement("span", { className: "text-red-700 dark:text-rose-400 font-semibold" }, "Merah (\u2265 90%):"), " Kritis, segera cek ulang barang di troli.")))), /* @__PURE__ */ React15.createElement("div", { className: "bg-card dark:bg-slate-800/90 rounded-card p-4 border border-border dark:border-slate-700 shadow-soft space-y-3" }, /* @__PURE__ */ React15.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React15.createElement("div", { className: "flex items-center gap-1.5 font-bold text-xs text-text-main dark:text-slate-100" }, /* @__PURE__ */ React15.createElement(PieChart, { className: "w-4 h-4 text-primary dark:text-blue-400" }), /* @__PURE__ */ React15.createElement("span", null, "Pengeluaran per Kategori di Troli")), /* @__PURE__ */ React15.createElement("span", { className: "text-[11px] text-text-secondary dark:text-slate-400" }, activeCategoriesWithSpending.length, " kategori aktif")), activeCategoriesWithSpending.length === 0 ? /* @__PURE__ */ React15.createElement("p", { className: "text-xs text-text-secondary dark:text-slate-400 italic text-center py-2" }, "Belum ada barang di troli untuk dihitung per kategori.") : /* @__PURE__ */ React15.createElement("div", { className: "space-y-2.5" }, activeCategoriesWithSpending.map(([category, amount]) => {
    const categoryPercent = activeTotals.grossTotal > 0 ? Math.round(amount / activeTotals.grossTotal * 100) : 0;
    return /* @__PURE__ */ React15.createElement("div", { key: category, className: "space-y-1" }, /* @__PURE__ */ React15.createElement("div", { className: "flex justify-between items-center text-xs" }, /* @__PURE__ */ React15.createElement("span", { className: "font-medium text-text-main dark:text-slate-200 truncate pr-2" }, category), /* @__PURE__ */ React15.createElement("span", { className: "font-bold text-text-main dark:text-slate-100" }, formatRupiah(amount), " ", /* @__PURE__ */ React15.createElement("span", { className: "text-text-secondary dark:text-slate-400 font-normal" }, "(", categoryPercent, "%)"))), /* @__PURE__ */ React15.createElement("div", { className: "w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden" }, /* @__PURE__ */ React15.createElement(
      "div",
      {
        className: "bg-primary dark:bg-blue-500 h-full rounded-full transition-all duration-300",
        style: { width: `${Math.min(100, categoryPercent)}%` }
      }
    )));
  }))), /* @__PURE__ */ React15.createElement("div", { className: "bg-card dark:bg-slate-800/90 rounded-card p-4 border border-border dark:border-slate-700 shadow-soft space-y-3" }, /* @__PURE__ */ React15.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React15.createElement("div", { className: "flex items-center gap-1.5 font-bold text-xs text-text-main dark:text-slate-100" }, /* @__PURE__ */ React15.createElement(Calendar2, { className: "w-4 h-4 text-primary dark:text-blue-400" }), /* @__PURE__ */ React15.createElement("span", null, "Histori Pengeluaran Antar-Bulan"))), historicalPeriods.length === 0 ? /* @__PURE__ */ React15.createElement("p", { className: "text-xs text-text-secondary dark:text-slate-400 italic text-center py-2" }, "Belum ada arsip riwayat bulan sebelumnya.") : /* @__PURE__ */ React15.createElement("div", { className: "space-y-2" }, historicalPeriods.map(([period, total]) => /* @__PURE__ */ React15.createElement(
    "div",
    {
      key: period,
      className: "bg-gray-50 dark:bg-slate-750 p-2.5 rounded-xl border dark:border-slate-700/60 flex items-center justify-between text-xs"
    },
    /* @__PURE__ */ React15.createElement("div", null, /* @__PURE__ */ React15.createElement("span", { className: "font-bold text-text-main dark:text-slate-100 block" }, formatPeriodLabel(period)), /* @__PURE__ */ React15.createElement("span", { className: "text-[10px] text-text-secondary dark:text-slate-400" }, "Arsip transaksi selesai")),
    /* @__PURE__ */ React15.createElement("span", { className: "font-extrabold text-primary dark:text-blue-400 text-sm" }, formatRupiah(total))
  )))), /* @__PURE__ */ React15.createElement(
    PaymentMethodSelectorModal,
    {
      isOpen: isPaymentModalOpen,
      onClose: () => setIsPaymentModalOpen(false)
    }
  ));
};

// src/components/BarcodeScannerModal.tsx
import React16, { useState as useState7, useEffect as useEffect5, useRef as useRef2 } from "react";
import {
  X as X4,
  Scan as Scan2,
  Camera,
  CheckCircle2 as CheckCircle23,
  ShoppingBag as ShoppingBag2,
  Plus as Plus4,
  Minus as Minus3,
  Search as Search2,
  Zap
} from "lucide-react";

// src/data/supermarketCatalog.ts
var SUPERMARKET_CATALOG = [
  {
    barcode: "8998866200213",
    name: "Indomie Goreng Spesial",
    category: "Makanan instan",
    unit: "bungkus",
    unitPrice: 3100,
    brand: "Indomie",
    description: "Mie instan goreng favorit mahasiswa"
  },
  {
    barcode: "8998866200220",
    name: "Indomie Kuah Rasa Soto Mie",
    category: "Makanan instan",
    unit: "bungkus",
    unitPrice: 3e3,
    brand: "Indomie",
    description: "Mie instan kuah soto gurih segar"
  },
  {
    barcode: "8992753112104",
    name: "Susu Ultra Milk UHT Full Cream 1L",
    category: "Susu dan produk dingin",
    unit: "botol",
    unitPrice: 20500,
    discounts: [5],
    // promo 5%
    brand: "Ultra Milk",
    description: "Susu UHT segar berkualitas"
  },
  {
    barcode: "8992753111107",
    name: "Susu Ultra Milk Cokelat 250ml",
    category: "Susu dan produk dingin",
    unit: "kotak",
    unitPrice: 6500,
    brand: "Ultra Milk",
    description: "Susu UHT rasa cokelat kaya kalsium"
  },
  {
    barcode: "8991234567890",
    name: "Beras Pandan Wangi Super 5kg",
    category: "Beras dan bahan pokok",
    unit: "pack",
    unitPrice: 75e3,
    brand: "Pandan Wangi",
    description: "Beras pulen wangi kualitas super"
  },
  {
    barcode: "8992388123456",
    name: "Minyak Goreng Sania Pouch 2L",
    category: "Beras dan bahan pokok",
    unit: "pack",
    unitPrice: 37500,
    brand: "Sania",
    description: "Minyak goreng kelapa sawit jernih"
  },
  {
    barcode: "8999999000011",
    name: "Telur Ayam Negeri Fresh 1kg",
    category: "Daging dan protein",
    unit: "kg",
    unitPrice: 28e3,
    brand: "Fresh Farm",
    description: "Telur ayam segar sumber protein rantau"
  },
  {
    barcode: "8992772000010",
    name: "Aqua Air Mineral 600ml",
    category: "Minuman",
    unit: "botol",
    unitPrice: 3500,
    brand: "Aqua",
    description: "Air mineral pegunungan alami"
  },
  {
    barcode: "8992772000027",
    name: "Aqua Air Mineral Galon Mini 1.5L",
    category: "Minuman",
    unit: "botol",
    unitPrice: 6500,
    brand: "Aqua",
    description: "Air mineral kemasan besar praktis"
  },
  {
    barcode: "8991001123456",
    name: "SilverQueen Milk Chocolate Cashew 58g",
    category: "Makanan instan",
    unit: "pcs",
    unitPrice: 16500,
    discounts: [10],
    brand: "SilverQueen",
    description: "Cokelat kacang mede favorit camilan"
  },
  {
    barcode: "8999999555555",
    name: "Sabun Cair Lifebuoy Total 10 450ml",
    category: "Perlengkapan mandi",
    unit: "botol",
    unitPrice: 24e3,
    brand: "Lifebuoy",
    description: "Sabun antibakterial perlindungan kuman"
  },
  {
    barcode: "8999999777777",
    name: "Shampoo Pantene Anti Ketombe 160ml",
    category: "Perlengkapan mandi",
    unit: "botol",
    unitPrice: 26e3,
    brand: "Pantene",
    description: "Perawatan rambut bersih dan segar"
  },
  {
    barcode: "8999999888888",
    name: "Sunlight Pencuci Piring Jeruk Nipis 650ml",
    category: "Kebersihan rumah",
    unit: "pack",
    unitPrice: 14500,
    brand: "Sunlight",
    description: "Sabun cuci piring pembersih lemak cepat"
  },
  {
    barcode: "8998001000019",
    name: "Sari Roti Tawar Spesial 370g",
    category: "Makanan instan",
    unit: "bungkus",
    unitPrice: 15e3,
    brand: "Sari Roti",
    description: "Roti tawar lembut untuk sarapan kuliah"
  },
  {
    barcode: "8993001000025",
    name: "So Good Chicken Nugget 400g",
    category: "Daging dan protein",
    unit: "pack",
    unitPrice: 42e3,
    discounts: [15],
    brand: "So Good",
    description: "Nugget ayam lezat siap goreng praktis"
  },
  {
    barcode: "8991002000032",
    name: "Good Day Cappuccino Botol 250ml",
    category: "Minuman",
    unit: "botol",
    unitPrice: 7e3,
    brand: "Good Day",
    description: "Kopi susu cappuccino penyemangat tugas"
  },
  {
    barcode: "8992741000055",
    name: "Paseo Facial Tissue Soft Pack 250s",
    category: "Perlengkapan mandi",
    unit: "pack",
    unitPrice: 13500,
    brand: "Paseo",
    description: "Tisu wajah lembut higienis"
  }
];
function findProductByBarcode(barcode) {
  const cleaned = barcode.trim();
  return SUPERMARKET_CATALOG.find(
    (item) => item.barcode === cleaned || item.barcode.slice(-6) === cleaned.slice(-6)
  );
}
function searchCatalogProducts(query) {
  const lower = query.toLowerCase().trim();
  if (!lower) return SUPERMARKET_CATALOG.slice(0, 8);
  return SUPERMARKET_CATALOG.filter(
    (item) => item.name.toLowerCase().includes(lower) || item.brand?.toLowerCase().includes(lower) || item.barcode.includes(lower)
  );
}

// src/components/BarcodeScannerModal.tsx
var BarcodeScannerModal = ({
  isOpen,
  onClose,
  onAddToCart
}) => {
  const [detectedItem, setDetectedItem] = useState7(null);
  const [quantity, setQuantity] = useState7(1);
  const [cameraActive, setCameraActive] = useState7(false);
  const [cameraError, setCameraError] = useState7(null);
  const [manualInput, setManualInput] = useState7("");
  const [searchResults, setSearchResults] = useState7([]);
  const [isAdding, setIsAdding] = useState7(false);
  const videoRef = useRef2(null);
  const streamRef = useRef2(null);
  const playScannerBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(2e3, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(1e-3, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch {
    }
  };
  useEffect5(() => {
    if (!isOpen) {
      stopCamera();
      setDetectedItem(null);
      setManualInput("");
      return;
    }
    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen]);
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Kamera tidak didukung pada browser ini.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn("Camera access could not be initialized:", err);
      setCameraError("Gunakan simulasi barcode atau cari produk langsung.");
      setCameraActive(false);
    }
  };
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };
  const handleScanBarcode = (barcode) => {
    const item = findProductByBarcode(barcode);
    if (item) {
      playScannerBeep();
      setDetectedItem(item);
      setQuantity(1);
    }
  };
  const handleManualSearch = (val) => {
    setManualInput(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    const exact = findProductByBarcode(val);
    if (exact) {
      handleScanBarcode(val);
      return;
    }
    setSearchResults(searchCatalogProducts(val));
  };
  const handleConfirmAddToCart = async () => {
    if (!detectedItem) return;
    try {
      setIsAdding(true);
      await onAddToCart({
        name: detectedItem.name,
        category: detectedItem.category,
        unit: detectedItem.unit,
        quantity,
        unitPrice: detectedItem.unitPrice,
        discounts: detectedItem.discounts || []
      });
      setDetectedItem(null);
      setQuantity(1);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };
  if (!isOpen) return null;
  return /* @__PURE__ */ React16.createElement("div", { className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in" }, /* @__PURE__ */ React16.createElement(
    "div",
    {
      className: "w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-card-lg sm:rounded-card-lg max-h-[92dvh] flex flex-col shadow-modal animate-slide-up overflow-hidden border dark:border-slate-800",
      role: "dialog",
      "aria-modal": "true"
    },
    /* @__PURE__ */ React16.createElement("div", { className: "flex items-center justify-between px-5 py-3.5 bg-gray-900 dark:bg-slate-950 text-white border-b border-gray-800 dark:border-slate-800" }, /* @__PURE__ */ React16.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React16.createElement("div", { className: "w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center" }, /* @__PURE__ */ React16.createElement(Scan2, { className: "w-4 h-4" })), /* @__PURE__ */ React16.createElement("div", null, /* @__PURE__ */ React16.createElement("h2", { className: "font-bold text-sm text-white" }, "Scanner Barcode Supermarket"), /* @__PURE__ */ React16.createElement("p", { className: "text-[10px] text-gray-400" }, "Pindai harga & produk otomatis"))), /* @__PURE__ */ React16.createElement(
      "button",
      {
        type: "button",
        onClick: onClose,
        className: "p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 min-h-[44px] min-w-[44px] flex items-center justify-center",
        "aria-label": "Tutup"
      },
      /* @__PURE__ */ React16.createElement(X4, { className: "w-5 h-5" })
    )),
    /* @__PURE__ */ React16.createElement("div", { className: "relative w-full h-52 bg-black flex items-center justify-center overflow-hidden" }, cameraActive ? /* @__PURE__ */ React16.createElement(
      "video",
      {
        ref: videoRef,
        className: "absolute inset-0 w-full h-full object-cover",
        playsInline: true,
        muted: true
      }
    ) : /* @__PURE__ */ React16.createElement("div", { className: "absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-black flex flex-col items-center justify-center text-gray-400 px-6 text-center" }, /* @__PURE__ */ React16.createElement(Camera, { className: "w-8 h-8 text-gray-600 mb-2" }), /* @__PURE__ */ React16.createElement("p", { className: "text-xs text-gray-300 font-medium" }, "Mode Kamera Barcode Aktif"), /* @__PURE__ */ React16.createElement("p", { className: "text-[10px] text-gray-500 mt-0.5" }, "Arahkan ke barcode kemasan barang atau pilih produk di bawah"), cameraError && /* @__PURE__ */ React16.createElement("p", { className: "text-[10px] text-amber-400 mt-1 bg-amber-950/60 px-2 py-0.5 rounded-full" }, cameraError)), /* @__PURE__ */ React16.createElement("div", { className: "relative w-56 h-32 border-2 border-dashed border-blue-400/80 rounded-2xl flex items-center justify-center pointer-events-none z-10 shadow-lg" }, /* @__PURE__ */ React16.createElement("div", { className: "absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400" }), /* @__PURE__ */ React16.createElement("div", { className: "absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400" }), /* @__PURE__ */ React16.createElement("div", { className: "absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400" }), /* @__PURE__ */ React16.createElement("div", { className: "absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400" }), /* @__PURE__ */ React16.createElement("div", { className: "absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-pulse" })), /* @__PURE__ */ React16.createElement("div", { className: "absolute bottom-2 left-0 right-0 text-center pointer-events-none z-10" }, /* @__PURE__ */ React16.createElement("span", { className: "text-[10px] font-medium text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm" }, "\u26A1 Deteksi Barcode Otomatis"))),
    detectedItem ? /* @__PURE__ */ React16.createElement("div", { className: "p-4 bg-emerald-50 dark:bg-slate-800 border-t border-emerald-200 dark:border-slate-700 animate-slide-up space-y-3" }, /* @__PURE__ */ React16.createElement("div", { className: "flex items-start justify-between gap-2" }, /* @__PURE__ */ React16.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React16.createElement("div", { className: "w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm" }, /* @__PURE__ */ React16.createElement(CheckCircle23, { className: "w-6 h-6" })), /* @__PURE__ */ React16.createElement("div", null, /* @__PURE__ */ React16.createElement("span", { className: "text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full" }, detectedItem.category, " \u2022 ", detectedItem.brand), /* @__PURE__ */ React16.createElement("h3", { className: "font-extrabold text-sm text-gray-900 dark:text-slate-100 leading-tight mt-0.5" }, detectedItem.name), /* @__PURE__ */ React16.createElement("span", { className: "text-[11px] text-gray-500 dark:text-slate-400" }, "Barcode: ", detectedItem.barcode))), /* @__PURE__ */ React16.createElement("div", { className: "text-right" }, /* @__PURE__ */ React16.createElement("span", { className: "text-xs text-gray-500 dark:text-slate-400 block" }, "Harga Resmi:"), /* @__PURE__ */ React16.createElement("span", { className: "text-base font-extrabold text-primary dark:text-blue-400" }, formatRupiah(detectedItem.unitPrice)), /* @__PURE__ */ React16.createElement("span", { className: "text-[10px] text-gray-400" }, "/", detectedItem.unit))), /* @__PURE__ */ React16.createElement("div", { className: "flex items-center justify-between bg-white dark:bg-slate-750 p-2.5 rounded-xl border border-emerald-200 dark:border-slate-700" }, /* @__PURE__ */ React16.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React16.createElement("span", { className: "text-xs font-semibold text-gray-600 dark:text-slate-300" }, "Kuantitas:"), /* @__PURE__ */ React16.createElement("div", { className: "flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5 border border-gray-200 dark:border-slate-600" }, /* @__PURE__ */ React16.createElement(
      "button",
      {
        type: "button",
        onClick: () => setQuantity(Math.max(1, quantity - 1)),
        disabled: quantity <= 1,
        className: "w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 disabled:opacity-40"
      },
      /* @__PURE__ */ React16.createElement(Minus3, { className: "w-3.5 h-3.5" })
    ), /* @__PURE__ */ React16.createElement("span", { className: "w-9 text-center font-bold text-xs text-gray-900 dark:text-slate-100" }, quantity), /* @__PURE__ */ React16.createElement(
      "button",
      {
        type: "button",
        onClick: () => setQuantity(quantity + 1),
        className: "w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200"
      },
      /* @__PURE__ */ React16.createElement(Plus4, { className: "w-3.5 h-3.5" })
    ))), /* @__PURE__ */ React16.createElement("div", { className: "text-right" }, /* @__PURE__ */ React16.createElement("span", { className: "text-[10px] text-gray-500 dark:text-slate-400 block" }, "Subtotal:"), /* @__PURE__ */ React16.createElement("span", { className: "text-sm font-extrabold text-emerald-700 dark:text-emerald-400" }, formatRupiah(detectedItem.unitPrice * quantity)))), /* @__PURE__ */ React16.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React16.createElement(
      "button",
      {
        type: "button",
        onClick: () => setDetectedItem(null),
        className: "flex-1 py-2.5 px-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-xs text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-750 min-h-[44px]"
      },
      "Scan Ulang"
    ), /* @__PURE__ */ React16.createElement(
      "button",
      {
        type: "button",
        disabled: isAdding,
        onClick: handleConfirmAddToCart,
        className: "flex-[1.5] py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
      },
      /* @__PURE__ */ React16.createElement(ShoppingBag2, { className: "w-4 h-4" }),
      /* @__PURE__ */ React16.createElement("span", null, isAdding ? "Memasukkan..." : "Masukkan ke Troli")
    ))) : /* @__PURE__ */ React16.createElement("div", { className: "p-4 space-y-3 overflow-y-auto flex-1" }, /* @__PURE__ */ React16.createElement("div", null, /* @__PURE__ */ React16.createElement("label", { className: "block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1" }, "Ketik Barcode atau Nama Produk"), /* @__PURE__ */ React16.createElement("div", { className: "relative" }, /* @__PURE__ */ React16.createElement(
      "input",
      {
        type: "text",
        placeholder: "Contoh: 8998866200213, Indomie, Ultra Milk...",
        value: manualInput,
        onChange: (e) => handleManualSearch(e.target.value),
        className: "w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
      }
    ), /* @__PURE__ */ React16.createElement(Search2, { className: "w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" }))), /* @__PURE__ */ React16.createElement("div", null, /* @__PURE__ */ React16.createElement("div", { className: "flex items-center justify-between mb-1.5" }, /* @__PURE__ */ React16.createElement("span", { className: "text-[11px] font-bold text-gray-600 dark:text-slate-300 flex items-center gap-1" }, /* @__PURE__ */ React16.createElement(Zap, { className: "w-3.5 h-3.5 text-amber-500 fill-amber-500" }), "Katalog Barcode Supermarket (Siap Scan):"), /* @__PURE__ */ React16.createElement("span", { className: "text-[10px] text-gray-400 dark:text-slate-500" }, "Sentuh untuk scan")), /* @__PURE__ */ React16.createElement("div", { className: "grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1" }, (searchResults.length > 0 ? searchResults : SUPERMARKET_CATALOG).map((item) => /* @__PURE__ */ React16.createElement(
      "button",
      {
        key: item.barcode,
        type: "button",
        onClick: () => handleScanBarcode(item.barcode),
        className: "flex items-center justify-between p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-800 hover:bg-blue-50/60 dark:hover:bg-slate-750 hover:border-blue-300 dark:hover:border-blue-600 active:scale-98 transition-all text-left min-h-[48px]"
      },
      /* @__PURE__ */ React16.createElement("div", { className: "min-w-0 flex-1 pr-2" }, /* @__PURE__ */ React16.createElement("div", { className: "flex items-center gap-1 mb-0.5" }, /* @__PURE__ */ React16.createElement("span", { className: "text-[9px] font-semibold text-primary dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/70 px-1.5 py-0.2 rounded" }, item.brand || item.category), /* @__PURE__ */ React16.createElement("span", { className: "text-[9px] text-gray-400 dark:text-slate-500 font-mono" }, "#", item.barcode.slice(-4))), /* @__PURE__ */ React16.createElement("h4", { className: "font-semibold text-xs text-gray-900 dark:text-slate-100 truncate" }, item.name)),
      /* @__PURE__ */ React16.createElement("div", { className: "text-right flex-shrink-0" }, /* @__PURE__ */ React16.createElement("span", { className: "text-xs font-bold text-primary dark:text-blue-400 block" }, formatRupiah(item.unitPrice)), /* @__PURE__ */ React16.createElement("span", { className: "text-[9px] text-gray-400 dark:text-slate-500" }, "/", item.unit))
    )))))
  ));
};

// src/App.tsx
import { CreditCard as CreditCard4, Sparkles as Sparkles2, Scan as Scan3, Sun, Moon } from "lucide-react";
var App = () => {
  const {
    activeTab,
    username,
    selectedPaymentMethod,
    isScannerOpen,
    closeScanner,
    openScanner,
    themeMode,
    toggleThemeMode
  } = useStore();
  const [isInitialized, setIsInitialized] = useState8(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState8(false);
  const cartItems = useLiveQuery4(() => db.cartItems.toArray()) || [];
  useEffect6(() => {
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [themeMode]);
  useEffect6(() => {
    async function init() {
      try {
        await seedInitialDataIfNeeded();
      } catch (err) {
        console.error("Failed to initialize seed data:", err);
      } finally {
        setIsInitialized(true);
      }
    }
    init();
  }, []);
  const handleBarcodeAddToCart = async (item) => {
    await groceryService.addItemToCart(item);
  };
  if (!isInitialized) {
    return /* @__PURE__ */ React17.createElement("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-amber-50 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center p-4" }, /* @__PURE__ */ React17.createElement("div", { className: "text-center space-y-3" }, /* @__PURE__ */ React17.createElement("div", { className: "w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" }), /* @__PURE__ */ React17.createElement("p", { className: "text-xs font-bold text-primary dark:text-blue-400" }, "Menyiapkan Troli Belanja ", username, "...")));
  }
  const isDark = themeMode === "dark";
  return /* @__PURE__ */ React17.createElement(
    "div",
    {
      className: `min-h-screen relative flex justify-center items-start sm:py-6 bg-cover bg-center bg-no-repeat transition-colors duration-300 ${isDark ? "bg-slate-950 text-slate-100" : "bg-gray-100 text-gray-900"}`,
      style: {
        backgroundImage: isDark ? `linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.94) 100%), url('/supermarket_bg.jpg')` : `linear-gradient(135deg, rgba(238, 242, 255, 0.92) 0%, rgba(240, 253, 250, 0.88) 100%), url('/supermarket_bg.jpg')`
      }
    },
    /* @__PURE__ */ React17.createElement("main", { className: "w-full max-w-[430px] min-h-[100dvh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-text-main dark:text-dark-text flex flex-col relative shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] dark:shadow-dark-float sm:rounded-[36px] sm:overflow-hidden border border-white/60 dark:border-slate-800 transition-colors duration-200" }, /* @__PURE__ */ React17.createElement("header", { className: "px-4 pt-3.5 pb-2.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 text-white shadow-md relative overflow-hidden border-b dark:border-slate-800" }, /* @__PURE__ */ React17.createElement("div", { className: "absolute -right-6 -top-6 w-28 h-28 bg-white/10 dark:bg-blue-500/10 rounded-full blur-xl pointer-events-none" }), /* @__PURE__ */ React17.createElement("div", { className: "absolute left-1/3 -bottom-4 w-20 h-20 bg-amber-400/15 rounded-full blur-lg pointer-events-none" }), /* @__PURE__ */ React17.createElement("div", { className: "relative z-10 flex items-center justify-between gap-2" }, /* @__PURE__ */ React17.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React17.createElement("div", { className: "w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-300 to-pink-400 p-0.5 shadow-md flex-shrink-0" }, /* @__PURE__ */ React17.createElement("div", { className: "w-full h-full bg-white/90 dark:bg-slate-900 rounded-[14px] flex items-center justify-center font-extrabold text-blue-700 dark:text-blue-400 text-base" }, "N")), /* @__PURE__ */ React17.createElement("div", null, /* @__PURE__ */ React17.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React17.createElement("h2", { className: "font-extrabold text-sm tracking-tight text-white leading-none" }, username), /* @__PURE__ */ React17.createElement(Sparkles2, { className: "w-3.5 h-3.5 text-amber-300 fill-amber-300" })), /* @__PURE__ */ React17.createElement("p", { className: "text-[10px] text-blue-100 dark:text-blue-200 font-medium mt-0.5" }, "Mahasiswa Rantau \u2022 Troli Belanja"))), /* @__PURE__ */ React17.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React17.createElement(
      "button",
      {
        type: "button",
        onClick: toggleThemeMode,
        className: "bg-white/20 hover:bg-white/30 dark:bg-slate-800/80 dark:hover:bg-slate-800 active:scale-95 text-white font-bold p-2 rounded-xl backdrop-blur-sm transition-all shadow-sm min-h-[36px] min-w-[36px] flex items-center justify-center",
        title: isDark ? "Beralih ke Light Mode" : "Beralih ke Dark Mode",
        "aria-label": isDark ? "Mode Terang" : "Mode Gelap"
      },
      isDark ? /* @__PURE__ */ React17.createElement(Sun, { className: "w-4 h-4 text-amber-300" }) : /* @__PURE__ */ React17.createElement(Moon, { className: "w-4 h-4 text-blue-100" })
    ), /* @__PURE__ */ React17.createElement(
      "button",
      {
        type: "button",
        onClick: openScanner,
        className: "bg-white/20 hover:bg-white/30 dark:bg-slate-800/80 dark:hover:bg-slate-800 active:scale-95 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-xl backdrop-blur-sm transition-all flex items-center gap-1 shadow-sm min-h-[36px]",
        title: "Scan Barcode Barang"
      },
      /* @__PURE__ */ React17.createElement(Scan3, { className: "w-3.5 h-3.5 text-amber-300" }),
      /* @__PURE__ */ React17.createElement("span", null, "Scan")
    ), /* @__PURE__ */ React17.createElement(
      "button",
      {
        type: "button",
        onClick: () => setIsPaymentModalOpen(true),
        className: "bg-white text-blue-800 dark:bg-blue-600 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-700 active:scale-95 font-extrabold text-[11px] px-2.5 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1 min-h-[36px]",
        title: "Pilih Bank / Sumber Dana"
      },
      /* @__PURE__ */ React17.createElement(CreditCard4, { className: "w-3.5 h-3.5 text-blue-600 dark:text-blue-200" }),
      /* @__PURE__ */ React17.createElement("span", { className: "truncate max-w-[80px]" }, selectedPaymentMethod === "Bank BCA" ? "BCA" : selectedPaymentMethod)
    )))), /* @__PURE__ */ React17.createElement("div", { className: "flex-1 px-4 pt-3 pb-safe overflow-y-auto" }, activeTab === "shopping" && /* @__PURE__ */ React17.createElement(ShoppingPage, null), activeTab === "history" && /* @__PURE__ */ React17.createElement(HistoryPage, null), activeTab === "budget" && /* @__PURE__ */ React17.createElement(BudgetPage, null)), /* @__PURE__ */ React17.createElement(BottomNavigation, { cartItemCount: cartItems.length }), /* @__PURE__ */ React17.createElement(
      BarcodeScannerModal,
      {
        isOpen: isScannerOpen,
        onClose: closeScanner,
        onAddToCart: handleBarcodeAddToCart
      }
    ), /* @__PURE__ */ React17.createElement(
      PaymentMethodSelectorModal,
      {
        isOpen: isPaymentModalOpen,
        onClose: () => setIsPaymentModalOpen(false)
      }
    ))
  );
};
var App_default = App;

// src/main.tsx
createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ React.createElement(StrictMode, null, /* @__PURE__ */ React.createElement(App_default, null))
);
