import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, Edit2, Trash2, CheckCircle2, Circle } from 'lucide-react';
import type { CartItem } from '../types';
import { calculateItemSubtotals } from '../utils/calculations';
import { formatRupiah } from '../utils/currency';
import { PriceComparison } from './PriceComparison';
import { useStore } from '../store/useStore';
import { t, translateCategory } from '../utils/i18n';

interface GroceryItemCardProps {
  item: CartItem;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onEdit: (item: CartItem) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  isIncreaseDisabled?: boolean;
  onSetQuantity?: (id: string, qty: number) => void;
}

export const GroceryItemCard: React.FC<GroceryItemCardProps> = ({
  item,
  onIncrease,
  onDecrease,
  onEdit,
  onDelete,
  onToggleStatus,
  isIncreaseDisabled = false,
  onSetQuantity,
}) => {
  const { language, currency } = useStore();
  const calc = calculateItemSubtotals(item.quantity, item.unitPrice, item.discounts);
  const isCompleted = item.status === 'completed';

  const [isEditingQty, setIsEditingQty] = useState(false);
  const [qtyInput, setQtyInput] = useState(item.quantity.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQtyInput(item.quantity.toString());
  }, [item.quantity]);

  useEffect(() => {
    if (isEditingQty && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingQty]);

  const handleCommitQty = () => {
    setIsEditingQty(false);
    const parsed = parseInt(qtyInput.replace(/\D/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0 && parsed !== item.quantity) {
      if (onSetQuantity) {
        onSetQuantity(item.id, parsed);
      }
    } else {
      setQtyInput(item.quantity.toString());
    }
  };

  return (
    <div
      className={`bg-card dark:bg-slate-800/90 rounded-card p-3.5 border transition-all duration-200 shadow-soft ${
        isCompleted
          ? 'bg-gray-50/70 dark:bg-slate-900/60 border-gray-200 dark:border-slate-800 opacity-75'
          : 'border-border dark:border-slate-700/80 hover:border-blue-200 dark:hover:border-blue-800'
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        {/* Toggle Done Checkbox Icon Button */}
        <button
          type="button"
          onClick={() => onToggleStatus(item.id)}
          className="mt-0.5 text-gray-300 dark:text-slate-600 hover:text-primary active:scale-95 transition-transform flex-shrink-0 min-h-[44px] min-w-[36px] flex items-center justify-center"
          aria-label={
            isCompleted
              ? language === 'zh'
                ? '标记为未买'
                : language === 'en'
                ? 'Mark unbought'
                : 'Tandai belum dibeli'
              : language === 'zh'
              ? '标记为已入购物车'
              : language === 'en'
              ? 'Mark in cart'
              : 'Tandai sudah masuk troli'
          }
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-success dark:text-emerald-400 fill-green-50 dark:fill-emerald-950" />
          ) : (
            <Circle className="w-5 h-5 text-gray-300 dark:text-slate-600 hover:text-primary dark:hover:text-blue-400" />
          )}
        </button>

        {/* Content Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className="text-[10px] font-semibold text-primary dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded-md">
              {translateCategory(item.categorySnapshot, language)}
            </span>
            {item.discounts.length > 0 && (
              <span className="text-[10px] font-bold text-danger dark:text-rose-300 bg-red-50 dark:bg-rose-950/70 border border-red-100 dark:border-rose-900 px-1.5 py-0.5 rounded-md">
                {language === 'zh' ? '折扣' : language === 'en' ? 'Discount' : 'Diskon'} {item.discounts.join('% + ')}% ({t('savingLabel', language, { amount: formatRupiah(calc.discountAmount) })})
              </span>
            )}
          </div>

          <h3
            className={`font-semibold text-sm leading-snug truncate ${
              isCompleted ? 'line-through text-text-secondary dark:text-slate-500' : 'text-text-main dark:text-slate-100'
            }`}
          >
            {item.nameSnapshot}
          </h3>

          <div className="flex items-baseline gap-1.5 text-xs text-text-secondary dark:text-slate-400 mt-1">
            <span>
              {formatRupiah(item.unitPrice)} / {item.unit}
            </span>
            {calc.discountAmount > 0 && (
              <span className="line-through text-[11px] text-gray-400 dark:text-slate-500">
                {formatRupiah(calc.grossSubtotal)}
              </span>
            )}
          </div>

          {/* Last month price comparator (strict 1 baris utuh tanpa scroll) */}
          <div className="mt-1 flex items-center">
            <PriceComparison
              currentPrice={item.unitPrice}
              previousPrice={item.previousUnitPrice}
              unit={item.unit}
              name={item.nameSnapshot}
            />
          </div>
        </div>

        {/* Action icons: Edit & Delete */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="p-2 text-gray-400 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 active:scale-95 transition-colors min-h-[44px] min-w-[40px] flex items-center justify-center"
            title={language === 'zh' ? '编辑商品' : language === 'en' ? 'Edit item' : 'Edit barang'}
            aria-label={language === 'zh' ? '编辑商品' : language === 'en' ? 'Edit item' : 'Edit barang'}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-2 text-gray-400 dark:text-slate-400 hover:text-danger dark:hover:text-rose-400 rounded-lg hover:bg-red-50 dark:hover:bg-rose-950 active:scale-95 transition-colors min-h-[44px] min-w-[40px] flex items-center justify-center"
            title={language === 'zh' ? '删除商品' : language === 'en' ? 'Delete item' : 'Hapus barang'}
            aria-label={language === 'zh' ? '删除商品' : language === 'en' ? 'Delete item' : 'Hapus barang'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Quantity Stepper & Final Total Price */}
      <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-700/60 mt-3 pt-2.5">
        {/* Thumb-friendly Stepper */}
        <div className="flex items-center bg-gray-100/80 dark:bg-slate-700/90 rounded-xl p-0.5 border border-gray-200 dark:border-slate-600">
          <button
            type="button"
            onClick={() => onDecrease(item.id)}
            disabled={item.quantity <= 1}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 shadow-sm text-text-main dark:text-slate-100 disabled:opacity-30 disabled:shadow-none hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 transition-transform"
            aria-label="Kurangi kuantitas"
          >
            <Minus className="w-4 h-4" />
          </button>

          {isEditingQty ? (
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value.replace(/\D/g, ''))}
              onBlur={handleCommitQty}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCommitQty();
                } else if (e.key === 'Escape') {
                  setIsEditingQty(false);
                  setQtyInput(item.quantity.toString());
                }
              }}
              className="w-12 h-8 text-center font-bold text-sm bg-white dark:bg-slate-800 text-primary dark:text-blue-400 border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner px-0.5"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onDoubleClick={() => setIsEditingQty(true)}
              onClick={() => setIsEditingQty(true)}
              className="w-12 text-center font-bold text-sm text-text-main dark:text-slate-100 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-md px-1 py-1 cursor-text transition-all select-none hover:shadow-xs active:scale-95"
              title={
                language === 'zh'
                  ? '双击或点击直接使用键盘修改数量'
                  : language === 'en'
                  ? 'Double-click or click to edit quantity with keyboard'
                  : 'Klik 2x untuk ganti kuantitas dengan keyboard'
              }
            >
              {item.quantity} <span className="text-[10px] font-normal text-text-secondary dark:text-slate-400">{item.unit}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onIncrease(item.id)}
            disabled={isIncreaseDisabled}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 shadow-sm text-text-main dark:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 transition-transform"
            aria-label="Tambah kuantitas"
            title={
              isIncreaseDisabled
                ? language === 'zh'
                  ? '已超出剩余预算，无法再增加'
                  : language === 'en'
                  ? 'Exceeds remaining budget, cannot add more'
                  : 'Melebihi sisa anggaran, tidak dapat menambah'
                : undefined
            }
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Final Item Subtotal */}
        <div className="text-right">
          <span className="text-[10px] text-text-secondary dark:text-slate-400 block">{t('totalItem', language)}</span>
          <span className="text-base font-extrabold text-primary dark:text-blue-400">
            {formatRupiah(calc.finalSubtotal)}
          </span>
        </div>
      </div>
    </div>
  );
};
