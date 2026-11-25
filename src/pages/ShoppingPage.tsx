import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import confetti from 'canvas-confetti';
import {
  Plus,
  Trash2,
  History,
  MapPin,
  Calendar,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Check,
  TrendingDown,
  Scan,
  CreditCard,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';
import { db } from '../db/database';
import { groceryService } from '../services/groceryService';
import { soundService } from '../utils/sound';
import { useStore } from '../store/useStore';
import { BudgetSafetyCard } from '../components/BudgetSafetyCard';
import { GroceryItemCard } from '../components/GroceryItemCard';
import { AddItemSheet } from '../components/AddItemSheet';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { PWAInstallBanner } from '../components/PWAInstallBanner';
import { LocationPickerModal, SUPERMARKET_PRESETS } from '../components/LocationPickerModal';
import { syncService } from '../services/syncService';
import { calculateCartTotals, evaluateBudgetSafety, calculateItemSubtotals } from '../utils/calculations';
import { formatRupiah, formatNumberWithDots, getActiveCurrency } from '../utils/currency';
import { formatPeriodLabel, getCurrentMonthPeriod } from '../utils/priceComparison';
import { t } from '../utils/i18n';
import type { CartItem, ProductCategory } from '../types';

export const ShoppingPage: React.FC = () => {
  const {
    isAddItemSheetOpen,
    editingItem,
    openAddItemSheet,
    closeAddItemSheet,
    openScanner,
    selectedPaymentMethod,
    sessionLocation,
    setSessionLocation,
    sessionDate,
    setSessionDate,
    isOnline,
    setIsOnline,
    language,
    currency,
  } = useStore();

  const currentPeriod = useMemo(() => {
    return sessionDate ? sessionDate.substring(0, 7) : getCurrentMonthPeriod();
  }, [sessionDate]);
  const [budgetLimit, setBudgetLimit] = useState(1200000);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState('1200000');
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [checkoutSuccessMessage, setCheckoutSuccessMessage] = useState<string | null>(null);
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState<string | null>(null);
  const [budgetWarningMessage, setBudgetWarningMessage] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);
  const [isClearCartConfirmOpen, setIsClearCartConfirmOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isManualExpanded, setIsManualExpanded] = useState<boolean | null>(null);

  // Active Selected City (Default: JABODETABEK if none selected)
  const selectedCity = useMemo(() => {
    if (!sessionLocation) return 'JABODETABEK';
    const match = SUPERMARKET_PRESETS.find(
      (s) => s.name.toLowerCase() === sessionLocation.toLowerCase()
    );
    if (match && match.city) {
      return match.city.toUpperCase();
    }
    const upper = sessionLocation.toUpperCase();
    if (upper.includes('DEPOK') || upper.includes('MARGONDA') || upper.includes('CINERE') || upper.includes('SAWANGAN')) return 'DEPOK';
    if (upper.includes('BOGOR') || upper.includes('SENTUL') || upper.includes('CIBINONG') || upper.includes('PAJAJARAN')) return 'BOGOR';
    if (upper.includes('BEKASI') || upper.includes('CIKARANG') || upper.includes('SUMMARECON BEKASI') || upper.includes('GRAND METROPOLITAN')) return 'BEKASI';
    if (upper.includes('TANGERANG') || upper.includes('BSD') || upper.includes('BINTARO') || upper.includes('ALAM SUTERA') || upper.includes('GADING SERPONG') || upper.includes('KARAWACI')) return 'TANGERANG';
    if (upper.includes('JAKARTA') || upper.includes('PURI') || upper.includes('SCBD') || upper.includes('KEMANG') || upper.includes('KELAPA GADING') || upper.includes('BLOK M') || upper.includes('KUNINGAN') || upper.includes('SENAYAN') || upper.includes('TAMAN ANGGREK') || upper.includes('PONDOK INDAH') || upper.includes('KASABLANKA') || upper.includes('CENTRAL PARK')) return 'JAKARTA';
    return 'JABODETABEK';
  }, [sessionLocation]);

  useEffect(() => {
    const handleScroll = () => {
      const container = document.getElementById('app-scroll-container');
      const scrollTop = container ? container.scrollTop : (window.scrollY || document.documentElement.scrollTop || 0);
      if (scrollTop > 50) {
        setIsScrolled(true);
      } else if (scrollTop <= 15) {
        setIsScrolled(false);
        setIsManualExpanded(null);
      }
    };

    const container = document.getElementById('app-scroll-container');
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isMinimized = isManualExpanded !== null ? !isManualExpanded : isScrolled;

  const playBeep = (freq = 1200, duration = 0.08) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  // Live queries to Dexie IndexedDB
  const cartItems = useLiveQuery(() => db.cartItems.toArray()) || [];
  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const recommendations = useMemo(() => {
    const itemMap = new Map<string, {
      name: string;
      category: ProductCategory;
      unit: string;
      lastUnitPrice: number;
      discounts: number[];
      purchaseCount: number;
      lastPurchasedAt: string;
    }>();

    const sortedTx = [...allTransactions].sort(
      (a, b) => new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime()
    );

    for (const tx of sortedTx) {
      if (Array.isArray(tx.items)) {
        for (const item of tx.items) {
          const rawName = item.nameSnapshot || (item as any).name || '';
          const name = rawName.trim();
          if (!name) continue;
          const key = name.toLowerCase();
          const existing = itemMap.get(key);
          if (existing) {
            existing.purchaseCount += 1;
            existing.lastUnitPrice = item.unitPrice;
            existing.discounts = item.discounts || [];
            existing.lastPurchasedAt = tx.purchasedAt;
          } else {
            itemMap.set(key, {
              name: name,
              category: item.categorySnapshot,
              unit: item.unit || 'pcs',
              lastUnitPrice: item.unitPrice,
              discounts: item.discounts || [],
              purchaseCount: 1,
              lastPurchasedAt: tx.purchasedAt,
            });
          }
        }
      }
    }

    return Array.from(itemMap.values());
  }, [allTransactions]);

  const budgetRecord = useLiveQuery(
    () => db.budgets.where('period').equals(currentPeriod).first(),
    [currentPeriod]
  );

  useEffect(() => {
    if (budgetRecord && budgetRecord.limit > 0) {
      setBudgetLimit(budgetRecord.limit);
      setNewBudgetInput(budgetRecord.limit.toString());
    }
  }, [budgetRecord]);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  // Realtime calculations
  const totals = calculateCartTotals(cartItems);
  const budgetStatus = evaluateBudgetSafety(budgetLimit, totals.finalTotal, totals.discountTotal);

  const showBudgetWarning = (message: string) => {
    try {
      soundService.error();
    } catch {}
    setBudgetWarningMessage(message);
    setTimeout(() => {
      setBudgetWarningMessage((prev) => (prev === message ? null : prev));
    }, 3500);
  };

  // Handlers for cart items
  const handleIncreaseQty = async (id: string) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;

    if (budgetLimit > 0) {
      const unitAddCalc = calculateItemSubtotals(1, item.unitPrice, item.discounts);
      const projectedTotal = totals.finalTotal + unitAddCalc.finalSubtotal;
      if (totals.finalTotal >= budgetLimit || projectedTotal > budgetLimit || unitAddCalc.finalSubtotal > budgetStatus.remaining) {
        showBudgetWarning(
          language === 'zh'
            ? `增加 ${item.nameSnapshot} (${formatRupiah(unitAddCalc.finalSubtotal)}) 将超出剩余预算 (${formatRupiah(Math.max(0, budgetStatus.remaining))})！`
            : language === 'en'
            ? `Increasing ${item.nameSnapshot} (${formatRupiah(unitAddCalc.finalSubtotal)}) exceeds remaining budget (${formatRupiah(Math.max(0, budgetStatus.remaining))})!`
            : `Peringatan: Menambah ${item.nameSnapshot} (${formatRupiah(unitAddCalc.finalSubtotal)}) akan melebihi sisa anggaran (${formatRupiah(Math.max(0, budgetStatus.remaining))})!`
        );
        return;
      }
    }

    await groceryService.adjustQuantity(id, 1);
  };

  const handleSetQty = async (id: string, newQty: number) => {
    const safeQty = Math.max(1, Math.round(Number(newQty) || 1));
    const item = cartItems.find((i) => i.id === id);
    if (item && budgetLimit > 0 && safeQty > item.quantity) {
      const addedUnits = safeQty - item.quantity;
      const additionalCalc = calculateItemSubtotals(addedUnits, item.unitPrice, item.discounts);
      const projectedTotal = totals.finalTotal + additionalCalc.finalSubtotal;
      if (totals.finalTotal >= budgetLimit || projectedTotal > budgetLimit || additionalCalc.finalSubtotal > budgetStatus.remaining) {
        showBudgetWarning(
          language === 'zh'
            ? `增加数量 (${formatRupiah(additionalCalc.finalSubtotal)}) 将超出剩余预算 (${formatRupiah(Math.max(0, budgetStatus.remaining))})！`
            : language === 'en'
            ? `Increasing quantity (${formatRupiah(additionalCalc.finalSubtotal)}) exceeds remaining budget (${formatRupiah(Math.max(0, budgetStatus.remaining))})!`
            : `Peringatan: Menambah jumlah (${formatRupiah(additionalCalc.finalSubtotal)}) akan melebihi sisa anggaran (${formatRupiah(Math.max(0, budgetStatus.remaining))})!`
        );
        return;
      }
    }
    await groceryService.updateCartItem(id, { quantity: safeQty });
  };

  const handleDecreaseQty = async (id: string) => {
    const item = cartItems.find((i) => i.id === id);
    if (item && item.quantity <= 1) {
      setItemToDelete(item);
      return;
    }
    await groceryService.adjustQuantity(id, -1);
    playBeep(1400, 0.04);
  };

  const handleEditItem = (item: CartItem) => {
    openAddItemSheet(item);
  };

  const handleDeleteItem = (id: string) => {
    const item = cartItems.find((i) => i.id === id);
    if (item) {
      setItemToDelete(item);
      playBeep(650, 0.1);
    }
  };

  const handleConfirmDeleteItem = async () => {
    if (itemToDelete) {
      await groceryService.deleteCartItem(itemToDelete.id);
      setItemToDelete(null);
      playBeep(850, 0.08);
    }
  };

  const handleConfirmClearCart = async () => {
    await groceryService.clearCart();
    setIsClearCartConfirmOpen(false);
    playBeep(600, 0.12);
  };

  const handleToggleStatus = async (id: string) => {
    await groceryService.toggleCartItemStatus(id);
  };

  const handleSaveItem = async (data: {
    name: string;
    category: ProductCategory;
    unit: string;
    quantity: number;
    unitPrice: number;
    discounts: number[];
  }) => {
    try {
      if (editingItem) {
        await groceryService.updateCartItem(editingItem.id, {
          nameSnapshot: data.name,
          categorySnapshot: data.category,
          unit: data.unit,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          discounts: data.discounts,
        });
      } else {
        // Validasi batas anggaran ketat saat penambahan barang baru
        if (budgetLimit > 0) {
          const itemCost = calculateItemSubtotals(data.quantity, data.unitPrice, data.discounts).finalSubtotal;
          const projectedTotal = totals.finalTotal + itemCost;
          if (totals.finalTotal >= budgetLimit || projectedTotal > budgetLimit || itemCost > budgetStatus.remaining) {
            showBudgetWarning(
              language === 'zh'
                ? `商品金额 (${formatRupiah(itemCost)}) 超出剩余预算 (${formatRupiah(Math.max(0, budgetStatus.remaining))})！`
                : language === 'en'
                ? `Item total (${formatRupiah(itemCost)}) exceeds remaining budget (${formatRupiah(Math.max(0, budgetStatus.remaining))})!`
                : `Peringatan: Harga barang (${formatRupiah(itemCost)}) melebihi sisa anggaran (${formatRupiah(Math.max(0, budgetStatus.remaining))})!`
            );
            return;
          }
        }
        await groceryService.addItemToCart(data);
      }
      try {
        soundService.playSuccess();
      } catch (e) {
        // sound optional
      }
    } catch (err) {
      console.error('Gagal menyimpan barang ke troli:', err);
    }
  };

  const handleSaveBudgetLimit = async () => {
    const rawDigits = (newBudgetInput || budgetLimit.toString()).replace(/\D/g, '');
    const parsed = parseInt(rawDigits, 10);
    const finalVal = isNaN(parsed) || parsed <= 0 ? 1200000 : parsed;
    await groceryService.setBudget(currentPeriod, finalVal);
    setBudgetLimit(finalVal);
    setIsEditingBudget(false);
  };

  const handleConfirmCheckout = async () => {
    try {
      setCheckoutErrorMessage(null);
      const completedTx = await groceryService.completeCheckout(budgetLimit, selectedPaymentMethod, sessionLocation, sessionDate);
      setIsCheckoutDialogOpen(false);
      soundService.money();

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore if not supported in environment
      }

      setCheckoutSuccessMessage(
        `Belanja di ${sessionLocation} berhasil diselesaikan via ${selectedPaymentMethod}! Total ${formatRupiah(
          completedTx.finalTotal
        )} tersimpan permanen di riwayat.`
      );

      setTimeout(() => {
        setCheckoutSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setCheckoutErrorMessage(err.message || 'Gagal menyelesaikan transaksi belanja');
    }
  };

  return (
    <div className="space-y-4 pt-3 pb-3 w-full max-w-full min-w-0 box-border">
      {/* Toast Peringatan Batas Anggaran */}
      {budgetWarningMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-rose-600 dark:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl border border-white/20 animate-fade-in flex items-center gap-2 max-w-[90%] text-center">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{budgetWarningMessage}</span>
        </div>
      )}

      {/* PWA Installation Prompt if applicable */}
      <PWAInstallBanner />

      {/* Top Header: Bulan dan Tahun (Tanpa Teks "Belanja Bulanan"), Sejajar dengan Lokasi & Kalender */}
      <div className="pt-1 flex items-center justify-between gap-2 sm:gap-2.5 max-w-full min-w-0">
        {/* Kiri: Menampilkan Bulan dan Tahun warna hitam dengan ukuran font kompak */}
        <div className="min-w-0 flex-shrink-0">
          <span className="text-xs text-text-main dark:text-slate-100 font-bold truncate block">
            {formatPeriodLabel(currentPeriod, language)}
          </span>
        </div>

        {/* Kanan: Lokasi Supermarket & Ikon Kalender */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/80 border border-teal-200/80 dark:border-teal-800/80 text-[#0f766e] dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors shadow-2xs cursor-pointer max-w-[210px] sm:max-w-[280px] min-h-[36px] min-w-0"
            title="Klik untuk memilih supermarket (Jabodetabek)"
          >
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#0f766e] dark:text-teal-400" />
            <span className="text-[11px] font-extrabold uppercase truncate leading-tight">
              {sessionLocation || t('selectSupermarket', language)}
            </span>
            <ChevronRight className="w-3 h-3 flex-shrink-0 text-teal-600 dark:text-teal-400" />
          </button>

          {/* Ikon Kalender Saja (Buka picker saat ditekan, tanpa teks angka tanggal terbuka) */}
          <div
            onClick={(e) => {
              const input = e.currentTarget.querySelector('input') as HTMLInputElement | null;
              if (input && typeof input.showPicker === 'function') {
                try {
                  input.showPicker();
                } catch {}
              }
            }}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-700 cursor-pointer shadow-xs relative transition-colors"
            title="Pilih tanggal belanja"
          >
            <Calendar className="w-4 h-4 text-primary dark:text-blue-400 pointer-events-none flex-shrink-0" />
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {checkoutSuccessMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs animate-fade-in shadow-soft">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{checkoutSuccessMessage}</span>
        </div>
      )}

      {checkoutErrorMessage && (
        <div className="bg-red-50 dark:bg-rose-950/80 border border-red-200 dark:border-rose-800 text-danger dark:text-rose-300 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs animate-fade-in">
          <AlertCircle className="w-4 h-4 text-danger dark:text-rose-400 flex-shrink-0" />
          <span className="font-semibold">{checkoutErrorMessage}</span>
        </div>
      )}

      {/* Sticky Floating Container: Budget Safety Card & Quick Checkout Bar */}
      <div className="sticky top-0 z-20 space-y-2 pt-2.5 pb-2 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md -mx-4 px-4 shadow-sm border-b border-gray-100 dark:border-slate-800 transition-all duration-200 w-[calc(100%+2rem)] box-border">
        {isMinimized ? (
          /* Minimized Compact Floating Bar (~48px tinggi, seluruh kotak bisa diklik untuk buka detail) */
          <div
            onClick={() => setIsManualExpanded(true)}
            className="bg-card dark:bg-slate-800 rounded-2xl p-2.5 sm:p-3 border border-border dark:border-slate-700 shadow-soft flex items-center justify-between gap-2 animate-fade-in cursor-pointer hover:border-gray-300 dark:hover:border-slate-600 transition-colors w-full min-w-0 box-border"
            title="Klik untuk melihat rincian anggaran"
          >
            {/* Info Sisa Anggaran & Total Belanja */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
                {(() => {
                  const isRedStatus = budgetStatus.remaining <= 10000 || budgetStatus.level === 'exceeded' || budgetStatus.level === 'danger';
                  const isWarningStatus = !isRedStatus && budgetStatus.level === 'warning';
                  return (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-extrabold whitespace-nowrap shrink-0 ${
                        isRedStatus
                          ? 'text-danger dark:text-rose-400'
                          : isWarningStatus
                          ? 'text-warning dark:text-amber-400'
                          : 'text-success dark:text-emerald-400'
                      }`}
                    >
                      {isRedStatus ? (
                        budgetStatus.level === 'exceeded' ? (
                          <AlertOctagon className="w-3.5 h-3.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        )
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                      )}
                      <span>
                        {budgetStatus.level === 'exceeded'
                          ? `+${formatRupiah(budgetStatus.excessAmount)}`
                          : `${t('remainingBudget', language)}: ${formatRupiah(budgetStatus.remaining)}`}
                      </span>
                    </span>
                  );
                })()}

                <div className="flex items-center gap-1 text-[11px] text-text-secondary dark:text-slate-400 font-semibold truncate min-w-0">
                  <span className="text-gray-300 dark:text-slate-600">|</span>
                  <span className="truncate">
                    {t('totalSpent', language)}: <strong className="text-text-main dark:text-slate-100 font-black">{formatRupiah(totals.finalTotal)}</strong>
                  </span>
                  <span className="text-[10px] opacity-80 whitespace-nowrap flex-shrink-0">
                    ({t('unitsCount', language, { qty: totals.totalQuantity })})
                  </span>
                </div>
              </div>
            </div>

            {/* Aksi Cepat: Kosongkan dan Checkout */}
            <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {cartItems.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsClearCartConfirmOpen(true);
                    }}
                    className="w-9 h-9 bg-gray-100/90 dark:bg-slate-700/80 hover:bg-red-50 dark:hover:bg-rose-950/70 border border-gray-200 dark:border-slate-600 text-danger dark:text-rose-400 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-xs active:scale-95 flex-shrink-0"
                    title={t('clearCartBtn', language)}
                    aria-label={t('clearCartBtn', language)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCheckoutDialogOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-soft transition-all flex items-center gap-1 cursor-pointer min-h-[36px] flex-shrink-0 whitespace-nowrap"
                    title={t('finishShoppingNow', language)}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t('finishShoppingNow', language)}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Full View (Tampilan Lengkap) - ketuk area kartu untuk memperkecil kembali tanpa tombol/simbol perkecil */
          <div
            onClick={() => setIsManualExpanded(false)}
            className="space-y-2.5 cursor-pointer animate-fade-in"
            title="Ketuk area ini untuk memperkecil tampilan rincian anggaran"
          >
            {/* F-05 Budget Safety Card */}
            <BudgetSafetyCard
              budgetStatus={budgetStatus}
              itemCount={cartItems.length}
              totalSavings={totals.discountTotal}
              onEditBudget={() => {
                setNewBudgetInput(budgetLimit.toString());
                setIsEditingBudget(true);
              }}
            />

            {/* Top Checkout Action Bar - Cepat checkout tanpa perlu scroll */}
            {cartItems.length > 0 && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-card dark:bg-slate-800 rounded-card p-3.5 border border-border dark:border-slate-700 shadow-soft space-y-2.5 animate-fade-in cursor-default"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-secondary dark:text-slate-400 block font-medium">
                      {t('totalBeforeDiscount', language, { qty: totals.totalQuantity })}
                    </span>
                    <span className="text-lg font-extrabold text-primary dark:text-blue-400">
                      {formatRupiah(totals.finalTotal)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsClearCartConfirmOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-danger dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/70 px-2.5 py-2 rounded-xl transition-all min-h-[44px] cursor-pointer"
                      title={t('clearCartBtn', language)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('clearCartBtn', language)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCheckoutDialogOpen(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-soft transition-all min-h-[44px] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{t('checkoutBtn', language)}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rekomendasi Barang dari Riwayat Pembelian (Beli Lagi 1-Klik - Maks 6 Item) */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-blue-50/50 dark:from-slate-800 dark:to-slate-850 p-3.5 rounded-card border border-amber-200/70 dark:border-slate-700 shadow-soft space-y-2.5 animate-fade-in w-full max-w-full min-w-0 box-border overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs font-bold text-text-main dark:text-slate-100">
              <span>{t('recommendationsTitle', language)}</span>
            </div>
            <span className="text-[10px] text-text-secondary dark:text-slate-400 font-medium">
              {t('recommendationsSubtitle', language)}
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
            {recommendations.slice(0, 6).map((rec) => {
              const existingItem = cartItems.find(
                (ci) => (ci.nameSnapshot || (ci as any).name || '').toLowerCase() === rec.name.toLowerCase()
              );
              const inCart = !!existingItem;

              // Hitung biaya penambahan 1 unit barang (memperhitungkan diskon aktif)
              const unitDiscounts = existingItem ? (existingItem.discounts || []) : (rec.discounts || []);
              const unitPrice = existingItem ? existingItem.unitPrice : rec.lastUnitPrice;
              const unitAddCalc = calculateItemSubtotals(1, unitPrice, unitDiscounts);
              const additionalCost = unitAddCalc.finalSubtotal;
              const projectedTotal = totals.finalTotal + additionalCost;

              // Validasi batas anggaran ketat: jika belanja aktif sudah mencapai/melebihi limit, atau penambahan unit membuat belanja melebihi pagu anggaran
              const isOverBudget =
                budgetLimit > 0 &&
                (totals.finalTotal >= budgetLimit ||
                  projectedTotal > budgetLimit ||
                  additionalCost > budgetStatus.remaining);

              return (
                <button
                  key={rec.name}
                  type="button"
                  aria-disabled={isOverBudget}
                  onClick={async () => {
                    // Validasi Wajib (Hard Block): Jika over budget, batalkan mutlak dan tampilkan peringatan batas anggaran
                    if (isOverBudget) {
                      showBudgetWarning(
                        language === 'zh'
                          ? `添加 ${rec.name} (${formatRupiah(additionalCost)}) 将超出剩余预算 (${formatRupiah(Math.max(0, budgetStatus.remaining))})！`
                          : language === 'en'
                          ? `Adding ${rec.name} (${formatRupiah(additionalCost)}) exceeds remaining budget (${formatRupiah(Math.max(0, budgetStatus.remaining))})!`
                          : `Peringatan: Menambahkan ${rec.name} (${formatRupiah(additionalCost)}) akan melebihi sisa anggaran (${formatRupiah(Math.max(0, budgetStatus.remaining))})!`
                      );
                      return;
                    }

                    if (existingItem) {
                      await handleIncreaseQty(existingItem.id);
                      playBeep(1400, 0.04);
                    } else {
                      await handleSaveItem({
                        name: rec.name,
                        category: rec.category,
                        unit: rec.unit,
                        quantity: 1,
                        unitPrice: rec.lastUnitPrice,
                        discounts: rec.discounts || [],
                      });
                    }
                  }}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl border text-left transition-all shadow-2xs min-h-[44px] ${
                    isOverBudget
                      ? 'opacity-40 cursor-not-allowed select-none bg-gray-100/80 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500'
                      : inCart
                      ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700 text-blue-950 dark:text-blue-100 active:scale-95 cursor-pointer'
                      : 'bg-white dark:bg-slate-800 border-gray-200/90 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 text-text-main dark:text-slate-100 active:scale-95 cursor-pointer'
                  }`}
                  title={
                    isOverBudget
                      ? language === 'zh'
                        ? `超出剩余预算 (${formatRupiah(Math.max(0, budgetStatus.remaining))})，无法添加`
                        : language === 'en'
                        ? `Exceeds remaining budget (${formatRupiah(Math.max(0, budgetStatus.remaining))}), cannot add`
                        : `Melebihi sisa anggaran (${formatRupiah(Math.max(0, budgetStatus.remaining))}), tidak dapat menambah`
                      : undefined
                  }
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isOverBudget
                      ? 'bg-gray-200/70 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
                      : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                  }`}>
                    <History className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 pr-1">
                    <div className="text-xs font-bold truncate max-w-[125px] leading-tight">
                      {rec.name}
                    </div>
                    <div className="text-[10px] text-text-secondary dark:text-slate-400 font-mono font-medium">
                      {formatRupiah(rec.lastUnitPrice)}/{rec.unit}
                    </div>
                  </div>
                  <div className="flex-shrink-0 pl-1 border-l border-gray-200 dark:border-slate-700">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                      isOverBudget
                        ? 'bg-gray-200/60 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
                        : 'text-primary dark:text-blue-300 bg-blue-50 dark:bg-blue-900/50'
                    }`}>
                      {inCart ? '+1' : t('buyAgain', language)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Items Section Header & Actions (Scan Barcode & Manual Add) */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-sm text-text-main dark:text-slate-100">{t('shoppingBagTitle', language)}</h2>
          <span className="text-xs bg-gray-200/70 dark:bg-slate-700 text-text-secondary dark:text-slate-300 font-semibold px-2 py-0.5 rounded-full">
            {t('itemsBadge', language, { count: cartItems.length })}
          </span>
          {totals.completedCount > 0 && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {t('checkedBadge', language, { count: totals.completedCount })}
            </span>
          )}
        </div>
      </div>

      {/* Grocery Items List */}
      {cartItems.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={t('emptyCartTitle', language)}
          description={t('emptyCartDesc', language)}
          actionLabel={t('scanBarcodeNow', language)}
          onAction={openScanner}
        />
      ) : (
        <div className="space-y-2.5">
          {cartItems.map((item) => {
            const itemUnitCost = calculateItemSubtotals(1, item.unitPrice, item.discounts).finalSubtotal;
            const isItemIncreaseDisabled =
              budgetLimit > 0 && (totals.finalTotal >= budgetLimit || itemUnitCost > budgetStatus.remaining);

            return (
              <GroceryItemCard
                key={item.id}
                item={item}
                onIncrease={handleIncreaseQty}
                onDecrease={handleDecreaseQty}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onToggleStatus={handleToggleStatus}
                isIncreaseDisabled={isItemIncreaseDisabled}
                onSetQuantity={handleSetQty}
              />
            );
          })}
        </div>
      )}

      {/* Bottom Sticky Checkout Summary Bar */}
      {cartItems.length > 0 && (
        <div className="bg-card/95 dark:bg-slate-800/95 backdrop-blur-md rounded-card p-4 border border-border dark:border-slate-700 shadow-float mt-4 space-y-3 w-full max-w-full min-w-0 box-border overflow-hidden">
          <div className="flex items-center justify-between text-xs text-text-secondary dark:text-slate-400 gap-2 min-w-0">
            <span className="truncate">{t('totalBeforeDiscount', language, { qty: totals.totalQuantity })}</span>
            <span className="font-semibold text-text-main dark:text-slate-200 flex-shrink-0">{formatRupiah(totals.grossTotal)}</span>
          </div>

          {totals.discountTotal > 0 && (
            <div className="flex items-center justify-between text-xs text-success dark:text-emerald-400 font-semibold gap-2 min-w-0">
              <span className="flex items-center gap-1 truncate">
                <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{t('discountSavingsPromo', language)}</span>
              </span>
              <span className="flex-shrink-0">-{formatRupiah(totals.discountTotal)}</span>
            </div>
          )}

          {/* Payment Method Badge */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100/80 dark:border-slate-700 gap-2 min-w-0">
            <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1 truncate">
              <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="truncate">{t('paymentSourceShort', language)}</span>
            </span>
            <span className="font-bold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-900 truncate max-w-[140px] flex-shrink-0">
              {selectedPaymentMethod}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-700 pt-2 gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] text-text-secondary dark:text-slate-400 block font-medium truncate">
                {t('finalTotalCheckout', language)}
              </span>
              <span className="text-xl font-extrabold text-primary dark:text-blue-400 truncate block">
                {formatRupiah(totals.finalTotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsCheckoutDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl shadow-soft transition-all min-h-[44px] sm:min-h-[48px] flex items-center gap-1.5 flex-shrink-0 cursor-pointer whitespace-nowrap"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{t('finishShoppingNow', language)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Budget Limit Modal */}
      {isEditingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-[360px] bg-white dark:bg-slate-900 rounded-card-lg p-5 shadow-modal animate-slide-up border dark:border-slate-800">
            <h3 className="font-bold text-base text-text-main dark:text-slate-100 mb-1">{t('setMonthlyBudgetModal', language)}</h3>
            <p className="text-xs text-text-secondary dark:text-slate-400 mb-4">
              {t('setMonthlyBudgetDesc', language, { period: formatPeriodLabel(currentPeriod, language) })}
            </p>

            <div className="space-y-2 mb-4">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-gray-400 dark:text-slate-500">
                  {getActiveCurrency().symbol}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberWithDots(newBudgetInput || budgetLimit.toString())}
                  onChange={(e) => setNewBudgetInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="1.200.000"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 font-bold text-base outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                />
              </div>

              {/* Preset Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {[500000, 1000000, 1200000, 1500000, 2000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNewBudgetInput(preset.toString())}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-primary hover:text-primary dark:hover:text-blue-400 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 transition-all whitespace-nowrap cursor-pointer"
                  >
                    {formatRupiah(preset)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditingBudget(false)}
                className="flex-1 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-text-main dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 min-h-[44px]"
              >
                {t('cancelBtn', language)}
              </button>
              <button
                type="button"
                onClick={handleSaveBudgetLimit}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover shadow-soft min-h-[44px]"
              >
                {t('saveLimitBtn', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Item Bottom Sheet */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        currentLocation={sessionLocation}
        onSelectLocation={(loc) => {
          setSessionLocation(loc);
          syncService.notifyChange();
        }}
        onClose={() => setIsLocationModalOpen(false)}
      />

      <AddItemSheet
        isOpen={isAddItemSheetOpen}
        onClose={closeAddItemSheet}
        onSave={handleSaveItem}
        editingItem={editingItem}
        remainingBudget={budgetStatus.remaining}
        budgetLimit={budgetLimit}
      />

      {/* Delete Single Item Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        title={t('deleteItemTitle', language)}
        message={t('deleteItemMsg', language, { name: itemToDelete?.nameSnapshot || '' })}
        confirmLabel={t('deleteItemConfirmBtn', language)}
        cancelLabel={t('cancelBtn', language)}
        isDangerous={true}
        onConfirm={handleConfirmDeleteItem}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Clear Entire Cart Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isClearCartConfirmOpen}
        title={t('clearCartTitle', language)}
        message={t('clearCartMsg', language, { count: cartItems.length })}
        confirmLabel={t('clearCartConfirmBtn', language)}
        cancelLabel={t('cancelBtn', language)}
        isDangerous={true}
        onConfirm={handleConfirmClearCart}
        onCancel={() => setIsClearCartConfirmOpen(false)}
      />

      {/* Checkout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCheckoutDialogOpen}
        title={t('checkoutConfirmTitle', language)}
        message={t('checkoutConfirmMsg', language, {
          total: formatRupiah(totals.finalTotal),
          count: cartItems.length,
          payment: selectedPaymentMethod,
        })}
        confirmLabel={t('checkoutConfirmBtn', language)}
        cancelLabel={t('backToCartBtn', language)}
        onConfirm={handleConfirmCheckout}
        onCancel={() => setIsCheckoutDialogOpen(false)}
      />
    </div>
  );
};
