import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import confetti from 'canvas-confetti';
import {
  Plus,
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

  // Live queries to Dexie IndexedDB
  const cartItems = useLiveQuery(() => db.cartItems.toArray()) || [];
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
    await groceryService.adjustQuantity(id, -1);
  };

  const handleEditItem = (item: CartItem) => {
    openAddItemSheet(item);
  };

  const handleDeleteItem = async (id: string) => {
    await groceryService.deleteCartItem(id);
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
      const completedTx = await groceryService.completeCheckout(budgetLimit, selectedPaymentMethod);
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
        `Belanja berhasil diselesaikan via ${selectedPaymentMethod}! Total ${formatRupiah(
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
    <div className="space-y-4 pb-24">
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

      {/* F-05 Budget Safety Card */}
      <BudgetSafetyCard
        budgetStatus={budgetStatus}
        itemCount={cartItems.length}
        totalSavings={totals.discountTotal}
        onEditBudget={() => setIsEditingBudget(true)}
      />

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

        {/* Dual Actions: Scan Barcode & Manual Add */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={openScanner}
            className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-soft transition-all min-h-[44px]"
            title="Scan Barcode Supermarket Tanpa Input Manual"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Scan Barcode</span>
          </button>

          <button
            type="button"
            onClick={() => openAddItemSheet(null)}
            className="inline-flex items-center gap-1 bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-soft transition-all min-h-[44px]"
            title="Tambah Barang Manual"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Manual</span>
          </button>
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

      {/* Checkout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCheckoutDialogOpen}
        title="Selesaikan Belanja Sekarang?"
        message={`Total tagihan kasir adalah ${formatRupiah(
          totals.finalTotal
        )} (${cartItems.length} jenis barang). Pembayaran dicatat menggunakan ${selectedPaymentMethod}. Transaksi akan disimpan ke riwayat dan keranjang belanja dikosongkan.`}
        confirmLabel="Ya, Selesai Belanja"
        cancelLabel="Kembali ke Troli"
        onConfirm={handleConfirmCheckout}
        onCancel={() => setIsCheckoutDialogOpen(false)}
      />
    </div>
  );
};
