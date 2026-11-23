import React, { useEffect, useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { groceryService } from '../services/groceryService';
import { db } from '../db/database';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, ShoppingBag, Sparkles, Clock, Trash2, History } from 'lucide-react';
import type { ProductCategory, CartItem } from '../types';
import { PRODUCT_CATEGORIES, STANDARD_UNITS } from '../types';
import { DiscountEditor } from './DiscountEditor';
import { calculateItemSubtotals } from '../utils/calculations';
import { formatRupiah, getActiveCurrency, formatNumberWithDots } from '../utils/currency';
import { useStore } from '../store/useStore';
import { t, translateCategory } from '../utils/i18n';

const SEARCH_HISTORY_KEY = 'smart_grocery_product_search_history';

const DEFAULT_SEARCH_HISTORY = [
  'Beras Rojolele',
  'Beras 5kg',
  'Beras Pandan Wangi 5kg',
  'Minyak Goreng 2L',
  'Telur 1kg',
  'Telur Ayam Negeri 1kg',
  'Garam 500g',
  'Susu UHT Full Cream 1L',
  'Mie Instan Kuah Soto (5 bungkus)',
  'Sabun Mandi',
  'Sabun Mandi Cair 450ml',
];

const itemSchema = z.object({
  name: z.string().trim().min(1, 'Nama produk wajib diisi'),
  category: z.string().default('Beras dan bahan pokok'),
  unit: z.string().default('pcs'),
  quantity: z.preprocess(
    (v) => (v === '' || v === null || isNaN(Number(v)) ? 1 : Number(v)),
    z.number().min(0.01, 'Kuantitas harus lebih dari 0')
  ),
  unitPrice: z.preprocess(
    (v) => (v === '' || v === null || isNaN(Number(v)) ? 0 : Number(v)),
    z.number().min(0, 'Harga satuan tidak boleh negatif')
  ),
  discounts: z.array(z.number()).default([]),
});

type ItemFormData = {
  name: string;
  category: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discounts: number[];
};

interface AddItemSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    category: ProductCategory;
    unit: string;
    quantity: number;
    unitPrice: number;
    discounts: number[];
  }) => Promise<void>;
  editingItem?: CartItem | null;
}

export const AddItemSheet: React.FC<AddItemSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
}) => {
  const { language } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customUnit, setCustomUnit] = useState(false);

  // Search History for Product Name
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      return DEFAULT_SEARCH_HISTORY;
    } catch {
      return DEFAULT_SEARCH_HISTORY;
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema) as any,
    defaultValues: {
      name: '',
      category: 'Beras dan bahan pokok',
      unit: 'pcs',
      quantity: 1,
      unitPrice: '' as unknown as number,
      discounts: [],
    },
  });

  const watchedName = watch('name') || '';
  const watchedQty = watch('quantity') || 0;
  const watchedPrice = Number(watch('unitPrice')) || 0;
  const watchedDiscounts = watch('discounts') || [];

  // Filtered search history based on current typed name
  const filteredHistory = useMemo(() => {
    if (!watchedName.trim()) return searchHistory;
    return searchHistory.filter((item) =>
      item.toLowerCase().includes(watchedName.toLowerCase().trim())
    );
  }, [searchHistory, watchedName]);

  // Clear all search history
  const handleClearAllHistory = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchHistory([]);
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify([]));
    } catch {}
    setIsHistoryOpen(false);
  };

  // Delete single history item
  const handleDeleteHistoryItem = (e: React.MouseEvent, itemToDelete: string) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = searchHistory.filter((item) => item !== itemToDelete);
    setSearchHistory(updated);
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Realtime calculation preview
  const liveCalc = calculateItemSubtotals(watchedQty, watchedPrice, watchedDiscounts);

  // Recommendations from purchase history
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
        discounts: editingItem.discounts || [],
      });
    } else {
      setCustomUnit(false);
      reset({
        name: '',
        category: 'Beras dan bahan pokok',
        unit: 'pcs',
        quantity: 1,
        unitPrice: '' as unknown as number,
        discounts: [],
      });
    }
  }, [editingItem, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: ItemFormData) => {
    let finalUnitPrice = Math.round(Number(data.unitPrice) || 0);

    // If unit price was left blank, check recommendations by product name / keyword
    if (finalUnitPrice <= 0) {
      const typed = (data.name || '').trim().toLowerCase();
      const match = recommendations.find((r) => {
        const rName = r.name.toLowerCase();
        return (
          rName === typed ||
          (typed.includes('beras') && rName.includes('beras')) ||
          (typed.includes('telur') && rName.includes('telur')) ||
          (typed.includes('minyak') && rName.includes('minyak')) ||
          (typed.includes('garam') && rName.includes('garam')) ||
          (typed.includes('susu') && rName.includes('susu')) ||
          (typed.includes('sabun') && rName.includes('sabun'))
        );
      });
      if (match && match.lastUnitPrice > 0) {
        finalUnitPrice = match.lastUnitPrice;
      }
    }

    if (finalUnitPrice <= 0) {
      setError('unitPrice', {
        type: 'manual',
        message:
          language === 'zh'
            ? '单价必须大于0！'
            : language === 'en'
            ? 'Unit price must be greater than 0!'
            : 'Harga satuan barang harus lebih dari 0!',
      });
      return;
    }

    if (data.quantity <= 0) {
      setError('quantity', {
        type: 'manual',
        message:
          language === 'zh'
            ? '商品数量必须大于0！'
            : language === 'en'
            ? 'Quantity must be greater than 0!'
            : 'Kuantitas barang harus lebih dari 0!',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Save product name to local search history
      const trimmedName = data.name.trim();
      if (trimmedName) {
        const updated = [
          trimmedName,
          ...searchHistory.filter((item) => item.toLowerCase() !== trimmedName.toLowerCase()),
        ].slice(0, 15);
        setSearchHistory(updated);
        try {
          localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
        } catch {}
      }

      await onSave({
        name: data.name.trim(),
        category: data.category as ProductCategory,
        unit: data.unit,
        quantity: Number(data.quantity) || 1,
        unitPrice: finalUnitPrice,
        discounts: data.discounts || [],
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-card-lg sm:rounded-card-lg max-h-[90dvh] flex flex-col shadow-modal animate-slide-up border dark:border-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Handle Bar for Touch Mobile */}
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/80 text-primary dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-text-main dark:text-slate-100">
                {editingItem ? t('editItemTitle', language) : t('addItemSheetTitle', language)}
              </h2>
              <p className="text-[11px] text-text-secondary dark:text-slate-400">
                {t('sheetSubtitle', language)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={t('cancelBtn', language)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sheet Form Scrollable Area */}
        <form
          onSubmit={handleSubmit(onSubmit, (invalidErrors) => {
            console.warn('Form validation failed:', invalidErrors);
            if (invalidErrors.name) {
              const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement | null;
              nameInput?.focus();
            }
          })}
          className="overflow-y-auto px-5 py-4 space-y-4 flex-1"
        >
          {/* Quick Scanner Shortcut (Single line text, compact and space-efficient) */}
          {!editingItem && (
            <div className="bg-gradient-to-r from-blue-50 to-amber-50 dark:from-slate-800 dark:to-slate-800/80 px-3 py-2 rounded-2xl border border-blue-200/70 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs">
              <div className="min-w-0 flex-1">
                <span className="text-[11.5px] font-extrabold text-gray-800 dark:text-slate-100 block leading-tight truncate">
                  {t('quickFillHeader', language)}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-slate-400 whitespace-nowrap truncate block">
                  {t('quickFillScan', language)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  useStore.getState().openScanner();
                }}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-xl shadow-xs transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1 min-h-[32px] cursor-pointer"
              >
                <span>{t('scanBarcodeBtn', language)}</span>
                <span>📷</span>
              </button>
            </div>
          )}

          {/* Rekomendasi dari Riwayat Pembelian (2 Kolom Kebawah) */}
          {recommendations.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-slate-800 p-2.5 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  {t('recommendationsHistory', language)}
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-normal">
                  {t('clickToAutofill', language)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5 no-scrollbar">
                {recommendations.slice(0, 12).map((rec) => (
                  <button
                    key={rec.name}
                    type="button"
                    onClick={() => {
                      setValue('name', rec.name, { shouldValidate: true, shouldDirty: true });
                      setValue('category', rec.category, { shouldValidate: true, shouldDirty: true });
                      const isStd = STANDARD_UNITS.includes(rec.unit);
                      setCustomUnit(!isStd);
                      setValue('unit', rec.unit || 'pcs', { shouldValidate: true, shouldDirty: true });
                      setValue('unitPrice', rec.lastUnitPrice || 0, { shouldValidate: true, shouldDirty: true });
                      setValue('discounts', rec.discounts || [], { shouldValidate: true, shouldDirty: true });
                    }}
                    className="w-full text-left text-[11px] font-semibold bg-white dark:bg-slate-800 hover:bg-amber-100/80 dark:hover:bg-amber-900/60 text-slate-800 dark:text-slate-100 p-2 rounded-xl border border-amber-200/80 dark:border-slate-700 shadow-2xs transition-all active:scale-95 flex flex-col justify-between min-h-[44px] cursor-pointer"
                  >
                    <span className="truncate w-full font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      {rec.name}
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black mt-0.5">
                      {formatRupiah(rec.lastUnitPrice)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nama Produk dengan Riwayat Pencarian & Hapus Semua */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-text-main dark:text-slate-200">
                Nama Produk <span className="text-danger">*</span>
              </label>

              {searchHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllHistory}
                  className="text-[10px] font-bold text-danger dark:text-rose-400 hover:text-red-700 flex items-center gap-0.5 hover:underline cursor-pointer"
                  title={language === 'zh' ? '清除所有商品名称历史' : language === 'en' ? 'Clear all product name history' : 'Hapus semua riwayat nama produk'}
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>{language === 'zh' ? '清除历史' : language === 'en' ? 'Clear History' : 'Hapus Riwayat'}</span>
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder={language === 'zh' ? '例如: 茉莉香米 5kg, 鸡蛋' : language === 'en' ? 'e.g. Jasmine Rice 5kg, Eggs' : 'Contoh: Beras Ramos 5kg, Telur Ayam'}
                {...register('name')}
                onFocus={() => setIsHistoryOpen(true)}
                onBlur={() => {
                  setTimeout(() => setIsHistoryOpen(false), 250);
                  const currentPrice = watch('unitPrice');
                  if (!currentPrice || Number(currentPrice) === 0) {
                    const typed = (watch('name') || '').trim().toLowerCase();
                    if (typed) {
                      const match = recommendations.find((r) => {
                        const rName = r.name.toLowerCase();
                        return (
                          rName === typed ||
                          (typed.includes('beras') && rName.includes('beras')) ||
                          (typed.includes('telur') && rName.includes('telur')) ||
                          (typed.includes('minyak') && rName.includes('minyak')) ||
                          (typed.includes('garam') && rName.includes('garam')) ||
                          (typed.includes('susu') && rName.includes('susu')) ||
                          (typed.includes('sabun') && rName.includes('sabun'))
                        );
                      });
                      if (match && match.lastUnitPrice > 0) {
                        setValue('unitPrice', match.lastUnitPrice, { shouldValidate: true, shouldDirty: true });
                        setValue('category', match.category, { shouldValidate: true, shouldDirty: true });
                        const isStd = STANDARD_UNITS.includes(match.unit);
                        setCustomUnit(!isStd);
                        setValue('unit', match.unit || 'pcs', { shouldValidate: true, shouldDirty: true });
                      }
                    }
                  }
                }}
                className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm min-h-[44px]"
              />

              {watchedName && (
                <button
                  type="button"
                  onClick={() => setValue('name', '')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Custom Search History Dropdown */}
            {isHistoryOpen && filteredHistory.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 overflow-hidden animate-slide-up">
                <div className="px-3 py-2 bg-gray-50 dark:bg-slate-750 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <History className="w-3 h-3 text-primary dark:text-blue-400" />
                    <span>{language === 'zh' ? '搜索历史' : language === 'en' ? 'Search History' : 'Riwayat Pencarian'}</span>
                  </span>
                  <button
                    type="button"
                    onMouseDown={handleClearAllHistory}
                    className="text-[10.5px] font-bold text-danger dark:text-rose-400 hover:text-red-700 flex items-center gap-1 transition-colors cursor-pointer px-1.5 py-0.5 rounded-lg hover:bg-red-50 dark:hover:bg-rose-950/50"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{language === 'zh' ? '全部清空' : language === 'en' ? 'Clear All' : 'Hapus Semua'}</span>
                  </button>
                </div>

                <div className="max-h-44 overflow-y-auto no-scrollbar divide-y divide-gray-50 dark:divide-slate-700/50">
                  {filteredHistory.map((item) => (
                    <div
                      key={item}
                      onMouseDown={() => {
                        setValue('name', item, { shouldValidate: true, shouldDirty: true });
                        setIsHistoryOpen(false);
                        const trimmed = item.trim().toLowerCase();
                        const rec = recommendations.find((r) => {
                          const rName = r.name.toLowerCase();
                          return (
                            rName === trimmed ||
                            (trimmed.includes('beras') && rName.includes('beras')) ||
                            (trimmed.includes('telur') && rName.includes('telur')) ||
                            (trimmed.includes('minyak') && rName.includes('minyak')) ||
                            (trimmed.includes('garam') && rName.includes('garam')) ||
                            (trimmed.includes('susu') && rName.includes('susu')) ||
                            (trimmed.includes('sabun') && rName.includes('sabun'))
                          );
                        });
                        if (rec) {
                          setValue('category', rec.category, { shouldValidate: true, shouldDirty: true });
                          const isStd = STANDARD_UNITS.includes(rec.unit);
                          setCustomUnit(!isStd);
                          setValue('unit', rec.unit || 'pcs', { shouldValidate: true, shouldDirty: true });
                          setValue('unitPrice', rec.lastUnitPrice || 0, { shouldValidate: true, shouldDirty: true });
                          setValue('discounts', rec.discounts || [], { shouldValidate: true, shouldDirty: true });
                        }
                      }}
                      className="flex items-center justify-between px-3 py-2 hover:bg-blue-50/60 dark:hover:bg-slate-700/70 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 group-hover:text-primary transition-colors flex-shrink-0" />
                        <span className="text-xs font-semibold text-text-main dark:text-slate-100 truncate">
                          {item}
                        </span>
                      </div>

                      <button
                        type="button"
                        onMouseDown={(e) => handleDeleteHistoryItem(e, item)}
                        className="p-1 text-gray-400 hover:text-danger dark:hover:text-rose-400 transition-colors rounded-lg ml-2"
                        title="Hapus dari riwayat"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.name && (
              <p className="text-xs text-danger mt-1 font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-bold text-text-main dark:text-slate-200 mb-1">{t('categoryLabel', language)}</label>
            <select
              {...register('category')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm min-h-[44px] bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 cursor-pointer"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {translateCategory(cat, language)}
                </option>
              ))}
            </select>
          </div>

          {/* Satuan & Kuantitas Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-main dark:text-slate-200 mb-1">
                {t('quantityLabel', language)} <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                inputMode="decimal"
                placeholder="1"
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'Subtract') {
                    e.preventDefault();
                  }
                }}
                {...register('quantity', { valueAsNumber: true })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm font-semibold min-h-[44px]"
              />
              {errors.quantity && (
                <p className="text-xs text-danger mt-1">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-text-main dark:text-slate-200 mb-1">{t('unitLabel', language)}</label>
              {customUnit ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder={t('customUnitPlaceholder', language)}
                    {...register('unit')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 text-sm min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCustomUnit(false);
                      setValue('unit', 'pcs');
                    }}
                    className="px-2 text-xs text-primary dark:text-blue-400 underline whitespace-nowrap min-h-[44px]"
                  >
                    {t('cancelBtn', language)}
                  </button>
                </div>
              ) : (
                <select
                  {...register('unit')}
                  value={watch('unit') || 'pcs'}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setCustomUnit(true);
                      setValue('unit', '', { shouldValidate: true });
                    } else {
                      setValue('unit', e.target.value, { shouldValidate: true });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm min-h-[44px] bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 cursor-pointer"
                >
                  {STANDARD_UNITS.filter((u) => u !== 'custom').map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                  <option value="custom">{t('customUnitPrompt', language)}</option>
                </select>
              )}
            </div>
          </div>

          {/* Harga Satuan */}
          <div>
            <label className="block text-xs font-bold text-text-main dark:text-slate-200 mb-1">
              {t('unitPriceLabel', language)} ({getActiveCurrency().symbol}) <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-gray-400">
                {getActiveCurrency().symbol}
              </span>
              <Controller
                name="unitPrice"
                control={control}
                render={({ field }) => (
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 15.000"
                    value={
                      field.value === 0 || field.value === '0' || field.value === '' || field.value === null || field.value === undefined
                        ? ''
                        : formatNumberWithDots(field.value)
                    }
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      if (digits === '') {
                        field.onChange('');
                      } else {
                        const num = parseInt(digits, 10);
                        field.onChange(isNaN(num) ? '' : num);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'Subtract') {
                        e.preventDefault();
                      }
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm font-bold min-h-[44px]"
                  />
                )}
              />
            </div>
            {errors.unitPrice && (
              <p className="text-xs text-danger mt-1">{errors.unitPrice.message}</p>
            )}
          </div>

          {/* Tiered Discount Section */}
          <Controller
            name="discounts"
            control={control}
            render={({ field }) => (
              <DiscountEditor
                basePrice={liveCalc.grossSubtotal}
                discounts={field.value}
                onChange={field.onChange}
              />
            )}
          />

          {/* Live Subtotal Calculation Preview Box */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-slate-800/80 p-3.5 rounded-2xl border border-blue-100 dark:border-blue-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary dark:text-blue-400" />
              <div>
                <span className="text-[11px] font-semibold text-text-secondary dark:text-slate-400 block">
                  {t('estimateItemTotal', language)}
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-300">
                  {watchedQty} {watch('unit')} × {formatRupiah(watchedPrice)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-lg font-extrabold text-primary dark:text-blue-400 block">
                {formatRupiah(liveCalc.finalSubtotal)}
              </span>
              {liveCalc.discountAmount > 0 && (
                <span className="text-[10px] font-semibold text-success dark:text-emerald-400 block">
                  {t('savingLabel', language, { amount: formatRupiah(liveCalc.discountAmount) })}
                </span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 dark:bg-rose-950/80 border border-red-200 dark:border-rose-900 text-danger dark:text-rose-300 text-xs font-bold p-2.5 rounded-xl mb-2 text-center animate-fade-in">
                {errors.name?.message ||
                  errors.quantity?.message ||
                  errors.unitPrice?.message ||
                  errors.unit?.message ||
                  (language === 'zh' ? '请填写商品信息' : language === 'en' ? 'Please complete product details' : 'Mohon lengkapi data barang.')}
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-hover active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-float transition-all disabled:opacity-50 min-h-[48px] flex items-center justify-center text-sm cursor-pointer"
            >
              {isSubmitting
                ? t('savingSubtotal', language)
                : editingItem
                ? t('saveChangesBtn', language)
                : t('addToCartBtn', language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};