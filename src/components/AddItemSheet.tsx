import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, ShoppingBag, Sparkles } from 'lucide-react';
import type { ProductCategory, CartItem } from '../types';
import { PRODUCT_CATEGORIES, STANDARD_UNITS } from '../types';
import { DiscountEditor } from './DiscountEditor';
import { calculateItemSubtotals } from '../utils/calculations';
import { formatRupiah } from '../utils/currency';
import { useStore } from '../store/useStore';

const itemSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  category: z.string().min(1, 'Pilih kategori produk'),
  unit: z.string().min(1, 'Pilih satuan produk'),
  quantity: z.number().min(0.01, 'Kuantitas harus lebih dari 0'),
  unitPrice: z.number().min(0, 'Harga satuan tidak boleh negatif'),
  discounts: z.array(z.number()),
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customUnit, setCustomUnit] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema) as any,
    defaultValues: {
      name: '',
      category: 'Beras dan bahan pokok',
      unit: 'pcs',
      quantity: 1,
      unitPrice: 0,
      discounts: [],
    },
  });

  const watchedQty = watch('quantity') || 0;
  const watchedPrice = watch('unitPrice') || 0;
  const watchedDiscounts = watch('discounts') || [];

  // Realtime calculation preview
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
        discounts: editingItem.discounts || [],
      });
    } else {
      setCustomUnit(false);
      reset({
        name: '',
        category: 'Beras dan bahan pokok',
        unit: 'pcs',
        quantity: 1,
        unitPrice: 0,
        discounts: [],
      });
    }
  }, [editingItem, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: ItemFormData) => {
    try {
      setIsSubmitting(true);
      await onSave({
        name: data.name,
        category: data.category as ProductCategory,
        unit: data.unit,
        quantity: Number(data.quantity),
        unitPrice: Math.round(Number(data.unitPrice)),
        discounts: data.discounts,
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
                {editingItem ? 'Edit Barang Belanja' : 'Tambah Barang ke Troli'}
              </h2>
              <p className="text-[11px] text-text-secondary dark:text-slate-400">
                Pencatatan langsung saat belanja di supermarket
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sheet Form Scrollable Area */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          {/* Quick Scanner Shortcut */}
          {!editingItem && (
            <div className="bg-gradient-to-r from-blue-50 to-amber-50 dark:from-slate-800 dark:to-slate-800/80 p-3 rounded-2xl border border-blue-200/70 dark:border-slate-700 flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-gray-800 dark:text-slate-200 block">
                  Malas Ketik Harga Manual?
                </span>
                <span className="text-[10px] text-gray-500 dark:text-slate-400">
                  Scan barcode kemasan untuk isi otomatis
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  useStore.getState().openScanner();
                }}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm transition-all whitespace-nowrap min-h-[36px]"
              >
                Scan Barcode 📷
              </button>
            </div>
          )}

          {/* Nama Produk */}
          <div>
            <label className="block text-xs font-bold text-text-main dark:text-slate-200 mb-1">
              Nama Produk <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Beras Ramos 5kg, Telur Ayam"
              {...register('name')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm min-h-[44px]"
            />
            {errors.name && (
              <p className="text-xs text-danger mt-1 font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-bold text-text-main dark:text-slate-200 mb-1">Kategori</label>
            <select
              {...register('category')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm min-h-[44px] bg-white dark:bg-slate-800 text-text-main dark:text-slate-100"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Satuan & Kuantitas Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-main dark:text-slate-200 mb-1">
                Kuantitas <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="1"
                {...register('quantity', { valueAsNumber: true })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm font-semibold min-h-[44px]"
              />
              {errors.quantity && (
                <p className="text-xs text-danger mt-1">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-text-main dark:text-slate-200 mb-1">Satuan</label>
              {customUnit ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Satuan khusus..."
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
                    Batal
                  </button>
                </div>
              ) : (
                <select
                  value={watch('unit')}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setCustomUnit(true);
                      setValue('unit', '');
                    } else {
                      setValue('unit', e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm min-h-[44px] bg-white dark:bg-slate-800 text-text-main dark:text-slate-100"
                >
                  {STANDARD_UNITS.filter((u) => u !== 'custom').map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                  <option value="custom">+ Satuan Lainnya...</option>
                </select>
              )}
            </div>
          </div>

          {/* Harga Satuan */}
          <div>
            <label className="block text-xs font-bold text-text-main dark:text-slate-200 mb-1">
              Harga Satuan (Rp) <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-gray-400">
                Rp
              </span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="15000"
                {...register('unitPrice', { valueAsNumber: true })}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm font-bold min-h-[44px]"
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
                  Estimasi Total Item:
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
                  Hemat {formatRupiah(liveCalc.discountAmount)}
                </span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-hover active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-float transition-all disabled:opacity-50 min-h-[48px] flex items-center justify-center text-sm"
            >
              {isSubmitting
                ? 'Menyimpan...'
                : editingItem
                ? 'Simpan Perubahan'
                : 'Tambahkan ke Troli Belanja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
