import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import confetti from 'canvas-confetti';
import {
  Plus,
  Trash2,
  Sparkles,
  History,
  MapPin,
  Calendar,
  ShoppingCart,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Check,
  TrendingDown,
  Scan,
  CreditCard,
} from 'lucide-react';
import { db } from '../db/database';
import { groceryService } from '../services/groceryService';
import { useStore } from '../store/useStore';
import { BudgetSafetyCard } from '../components/BudgetSafetyCard';
import { GroceryItemCard } from '../components/GroceryItemCard';
import { AddItemSheet } from '../components/AddItemSheet';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { PWAInstallBanner } from '../components/PWAInstallBanner';
import { calculateCartTotals, evaluateBudgetSafety } from '../utils/calculations';
import { formatRupiah } from '../utils/currency';
import { formatPeriodLabel, getCurrentMonthPeriod } from '../utils/priceComparison';
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
  } = useStore();

  const [currentPeriod] = useState(getCurrentMonthPeriod());
  const [budgetLimit, setBudgetLimit] = useState(1200000);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState('');
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [checkoutSuccessMessage, setCheckoutSuccessMessage] = useState<string | null>(null);
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);
  const [isClearCartConfirmOpen, setIsClearCartConfirmOpen] = useState(false);

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

  const budgetRecord = useLiveQuery(() => db.budgets.where('period').equals(currentPeriod).first());

  useEffect(() => {
    if (budgetRecord) {
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

  // Handlers for cart items
  const handleIncreaseQty = async (id: string) => {
    await groceryService.adjustQuantity(id, 1);
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
      await groceryService.addItemToCart(data);
    }
  };

  const handleSaveBudgetLimit = async () => {
    const parsed = parseInt(newBudgetInput.replace(/\D/g, ''), 10) || 0;
    await groceryService.setBudget(currentPeriod, parsed);
    setBudgetLimit(parsed);
    setIsEditingBudget(false);
  };

  const handleConfirmCheckout = async () => {
    try {
      setCheckoutErrorMessage(null);
      const completedTx = await groceryService.completeCheckout(budgetLimit, selectedPaymentMethod, sessionLocation, sessionDate);
      setIsCheckoutDialogOpen(false);

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
    <div className="space-y-4 pb-40">
      {/* PWA Installation Prompt if applicable */}
      <PWAInstallBanner />

      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary dark:text-slate-400 font-medium">
            <span>{formatPeriodLabel(currentPeriod)}</span>
            <span>•</span>
            <span className="text-primary dark:text-blue-400 font-semibold">Troli Supermarket</span>
          </div>
          <h1 className="text-xl font-extrabold text-text-main dark:text-slate-100 tracking-tight">Belanja Bulanan</h1>
        </div>

        {/* Network & Offline Status Indicator */}
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            isOnline
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-700 dark:text-amber-400" />
              <span>Offline (Tersimpan Lokal)</span>
            </>
          )}
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

      {/* Sesi Belanja: Lokasi & Tanggal Supermarket (Fitur Lokasi) */}
      <div className="bg-card dark:bg-slate-800 rounded-2xl p-2.5 border border-border dark:border-slate-700 shadow-soft flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-primary dark:text-blue-400 flex-shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <input
            type="text"
            list="locationSuggestions"
            value={sessionLocation}
            onChange={(e) => setSessionLocation(e.target.value)}
            placeholder="Ketik / pilih lokasi supermarket..."
            className="w-full text-xs font-bold text-text-main dark:text-slate-100 bg-transparent focus:outline-none placeholder-gray-400 dark:placeholder-slate-500 truncate"
          />
          <datalist id="locationSuggestions">
            <option value="Lotte Mart Grocery - Puri Indah" />
            <option value="Superindo - Puri Indah" />
            <option value="Hypermart - Puri Mall" />
            <option value="Grand Lucky Superstore" />
            <option value="Farmers Market" />
            <option value="Indomaret Fresh" />
            <option value="Alfamidi Super" />
            <option value="Hero Supermarket" />
            <option value="Papaya Fresh Gallery" />
          </datalist>
        </div>

        <div className="flex items-center gap-1.5 pl-2.5 border-l border-gray-200 dark:border-slate-700 flex-shrink-0">
          <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400" />
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="text-xs font-semibold text-text-secondary dark:text-slate-300 bg-transparent focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* F-05 Budget Safety Card */}
      <BudgetSafetyCard
        budgetStatus={budgetStatus}
        itemCount={cartItems.length}
        totalSavings={totals.discountTotal}
        onEditBudget={() => setIsEditingBudget(true)}
      />

      {/* Top Checkout Action Bar - Cepat checkout tanpa perlu scroll */}
      {cartItems.length > 0 && (
        <div className="bg-card dark:bg-slate-800 rounded-card p-3.5 border border-border dark:border-slate-700 shadow-soft space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-text-secondary dark:text-slate-400 block font-medium">
                Total Tagihan ({totals.totalQuantity} unit):
              </span>
              <span className="text-lg font-extrabold text-primary dark:text-blue-400">
                {formatRupiah(totals.finalTotal)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsClearCartConfirmOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-danger dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/70 px-2.5 py-2 rounded-xl transition-all min-h-[44px]"
                title="Kosongkan Seluruh Troli"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCheckoutDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-soft transition-all min-h-[44px] flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Checkout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* Rekomendasi Barang dari Riwayat Pembelian (Beli Lagi 1-Klik) */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-blue-50/50 dark:from-slate-800 dark:to-slate-850 p-3.5 rounded-card border border-amber-200/70 dark:border-slate-700 shadow-soft space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-text-main dark:text-slate-100">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>Rekomendasi dari Riwayat Belanja</span>
            </div>
            <span className="text-[10px] text-text-secondary dark:text-slate-400 font-medium">
              Beli lagi dengan 1 klik
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
            {recommendations.slice(0, 10).map((rec) => {
              const inCart = cartItems.some(
                (ci) => ci.nameSnapshot.toLowerCase() === rec.name.toLowerCase()
              );
              return (
                <button
                  key={rec.name}
                  type="button"
                  onClick={() => {
                    handleSaveItem({
                      name: rec.name,
                      category: rec.category,
                      unit: rec.unit,
                      quantity: 1,
                      unitPrice: rec.lastUnitPrice,
                      discounts: rec.discounts || [],
                    });
                  }}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl border text-left transition-all active:scale-95 shadow-2xs min-h-[44px] ${
                    inCart
                      ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700 text-blue-950 dark:text-blue-100'
                      : 'bg-white dark:bg-slate-800 border-gray-200/90 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 text-text-main dark:text-slate-100'
                  }`}
                >
                  <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
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
                    <span className="text-[10px] font-bold text-primary dark:text-blue-300 bg-blue-50 dark:bg-blue-900/50 px-2 py-1 rounded-lg">
                      {inCart ? '+1' : '+ Beli'}
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
          <h2 className="font-bold text-sm text-text-main dark:text-slate-100">Isi Troli</h2>
          <span className="text-xs bg-gray-200/70 dark:bg-slate-700 text-text-secondary dark:text-slate-300 font-semibold px-2 py-0.5 rounded-full">
            {cartItems.length} barang
          </span>
          {totals.completedCount > 0 && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              ({totals.completedCount} tercentang)
            </span>
          )}
        </div>
</div>

      {/* Grocery Items List */}
      {cartItems.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Troli Masih Kosong"
          description="Pindai barcode kemasan barang supermarket atau tambahkan barang secara manual."
          actionLabel="📷 Scan Barcode Sekarang"
          onAction={openScanner}
        />
      ) : (
        <div className="space-y-2.5">
          {cartItems.map((item) => (
            <GroceryItemCard
              key={item.id}
              item={item}
              onIncrease={handleIncreaseQty}
              onDecrease={handleDecreaseQty}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Bottom Sticky Checkout Summary Bar */}
      {cartItems.length > 0 && (
        <div className="bg-card/95 dark:bg-slate-800/95 backdrop-blur-md rounded-card p-4 border border-border dark:border-slate-700 shadow-float mt-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-text-secondary dark:text-slate-400">
            <span>Total Sebelum Diskon ({totals.totalQuantity} unit):</span>
            <span className="font-semibold text-text-main dark:text-slate-200">{formatRupiah(totals.grossTotal)}</span>
          </div>

          {totals.discountTotal > 0 && (
            <div className="flex items-center justify-between text-xs text-success dark:text-emerald-400 font-semibold">
              <span className="flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                Penghematan Promo Diskon:
              </span>
              <span>-{formatRupiah(totals.discountTotal)}</span>
            </div>
          )}

          {/* Payment Method Badge */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100/80 dark:border-slate-700">
            <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Sumber Pembayaran:
            </span>
            <span className="font-bold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-900">
              {selectedPaymentMethod}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-700 pt-2">
            <div>
              <span className="text-[11px] text-text-secondary dark:text-slate-400 block font-medium">
                Total Akhir Belanja:
              </span>
              <span className="text-xl font-extrabold text-primary dark:text-blue-400">
                {formatRupiah(totals.finalTotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsCheckoutDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-soft transition-all min-h-[48px] flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Selesaikan Belanja</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Budget Limit Modal */}
      {isEditingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-[360px] bg-white dark:bg-slate-900 rounded-card-lg p-5 shadow-modal animate-slide-up border dark:border-slate-800">
            <h3 className="font-bold text-base text-text-main dark:text-slate-100 mb-1">Atur Batas Anggaran Bulanan</h3>
            <p className="text-xs text-text-secondary dark:text-slate-400 mb-4">
              Masukkan pagu maksimal belanja untuk bulan {formatPeriodLabel(currentPeriod)}.
            </p>

            <div className="relative mb-4">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-gray-400 dark:text-slate-500">
                Rp
              </span>
              <input
                type="number"
                min="0"
                onKeyDown={(e) => { if (e.key === "-" || e.key === "Subtract") e.preventDefault(); }}
                inputMode="numeric"
                value={newBudgetInput}
                onChange={(e) => setNewBudgetInput(e.target.value)}
                placeholder="1200000"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 font-bold text-base outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditingBudget(false)}
                className="flex-1 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-text-main dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveBudgetLimit}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover shadow-soft min-h-[44px]"
              >
                Simpan Limit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Item Bottom Sheet */}
      <AddItemSheet
        isOpen={isAddItemSheetOpen}
        onClose={closeAddItemSheet}
        onSave={handleSaveItem}
        editingItem={editingItem}
      />

      {/* Delete Single Item Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        title="Hapus Barang Belanja?"
        message={`Apakah Anda yakin ingin menghapus "${itemToDelete?.nameSnapshot}" dari troli belanja?`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        isDangerous={true}
        onConfirm={handleConfirmDeleteItem}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Clear Entire Cart Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isClearCartConfirmOpen}
        title="Kosongkan Seluruh Troli?"
        message={`⚠️ Peringatan: Seluruh ${cartItems.length} jenis barang di dalam troli akan dihapus sekaligus. Tindakan ini tidak dapat dibatalkan!`}
        confirmLabel="Ya, Kosongkan Troli"
        cancelLabel="Batal"
        isDangerous={true}
        onConfirm={handleConfirmClearCart}
        onCancel={() => setIsClearCartConfirmOpen(false)}
      />

      {/* Checkout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCheckoutDialogOpen}
        title="Selesaikan Belanja Sekarang?"
        message={`Lokasi: ${sessionLocation}. Total tagihan kasir adalah ${formatRupiah(
          totals.finalTotal
        )} (${cartItems.length} jenis barang). Pembayaran dicatat menggunakan ${selectedPaymentMethod}. Transaksi akan disimpan ke riwayat dan keranjang belanja dikosongkan.`}
        confirmLabel="Ya, Selesai Belanja"
        cancelLabel="Kembali ke Troli"
        onConfirm={handleConfirmCheckout}
        onCancel={() => setIsCheckoutDialogOpen(false)}
      />

      {/* Floating Sticky Quick Action Dock (Floating Island di atas Bottom Nav) */}
      <div
        className="fixed left-0 right-0 z-30 flex justify-center pointer-events-none px-4"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 12px) + 72px)' }}
      >
        <div className="w-full max-w-[430px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2.5 pointer-events-auto">
          {/* Quick Scan Barcode Floating Button */}
          <button
            type="button"
            onClick={openScanner}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-amber-500/25 transition-all min-h-[46px] cursor-pointer"
            title="Scan Barcode Supermarket"
          >
            <Scan className="w-4 h-4 text-white" />
            <span>Scan Barcode</span>
          </button>

          {/* Quick Add Item Manual Floating Button */}
          <button
            type="button"
            onClick={() => openAddItemSheet(null)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition-all min-h-[46px] cursor-pointer"
            title="Tambah Barang Belanja"
          >
            <Plus className="w-4 h-4 stroke-[3] text-white" />
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
