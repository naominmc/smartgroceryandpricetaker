import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Scan,
  Camera,
  CheckCircle2,
  ShoppingBag,
  Plus,
  Minus,
  Search,
  Zap,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  SUPERMARKET_CATALOG,
  findProductByBarcode,
  searchCatalogProducts,
} from '../data/supermarketCatalog';
import type { SupermarketCatalogItem, ProductCategory } from '../types';
import { PRODUCT_CATEGORIES } from '../types';
import { formatRupiah } from '../utils/currency';

interface ScannedProductItem extends SupermarketCatalogItem {
  isCustom?: boolean;
}

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: {
    name: string;
    category: ProductCategory;
    unit: string;
    quantity: number;
    unitPrice: number;
    discounts: number[];
  }) => Promise<void>;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [detectedItem, setDetectedItem] = useState<ScannedProductItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isDecodingPhoto, setIsDecodingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Custom scanned item fields (jika barcode belum terdaftar di katalog mock)
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('10000');
  const [customCategory, setCustomCategory] = useState<ProductCategory>('Makanan instan');

  const [manualInput, setManualInput] = useState('');
  const [searchResults, setSearchResults] = useState<SupermarketCatalogItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Input file tunggal (Mendukung Kamera / Ambil Foto & Galeri Foto bawaan HP dalam 1 tombol)
  const photoInputRef = useRef<HTMLInputElement>(null);
  const lastScannedCodeRef = useRef<{ code: string; timestamp: number } | null>(null);

  // Suara beep kasir supermarket
  const playScannerBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(2200, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([60, 40, 60]);
      }
    } catch {
      // Audio atau vibrasi tidak didukung
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setDetectedItem(null);
      setManualInput('');
      setPhotoError(null);
    }
  }, [isOpen]);

  // Barcode ditemukan
  const handleBarcodeDetected = (code: string) => {
    if (!code) return;
    const cleanCode = code.trim();

    const now = Date.now();
    if (
      lastScannedCodeRef.current &&
      lastScannedCodeRef.current.code === cleanCode &&
      now - lastScannedCodeRef.current.timestamp < 2500
    ) {
      return;
    }
    lastScannedCodeRef.current = { code: cleanCode, timestamp: now };

    playScannerBeep();

    const catalogMatch = findProductByBarcode(cleanCode);
    if (catalogMatch) {
      setDetectedItem({
        ...catalogMatch,
        isCustom: false,
      });
      setQuantity(1);
    } else {
      const defaultName = `Barang Barcode #${cleanCode.slice(-4) || cleanCode}`;
      setDetectedItem({
        barcode: cleanCode,
        name: defaultName,
        category: 'Makanan instan',
        unit: 'pcs',
        unitPrice: 10000,
        discounts: [],
        brand: 'Produk Terpindai',
        description: `Barcode fisik: ${cleanCode}`,
        isCustom: true,
      });
      setCustomName(defaultName);
      setCustomPrice('10000');
      setCustomCategory('Makanan instan');
      setQuantity(1);
    }
  };

  // Proses upload foto dari Kamera atau Galeri (Satu Tombol)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecodingPhoto(true);
    setPhotoError(null);

    const objectUrl = URL.createObjectURL(file);

    try {
      const img = new Image();
      img.src = objectUrl;
      await img.decode();

      let detectedBarcode: string | null = null;

      // 1. Coba Native BarcodeDetector API (Cepat di Android/Chrome)
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'qr_code', 'itf'],
          });
          const barcodes = await detector.detect(img);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            detectedBarcode = barcodes[0].rawValue;
          }
        } catch (e) {
          console.warn('BarcodeDetector error:', e);
        }
      }

      // 2. Fallback ZXing Library
      if (!detectedBarcode && (window as any).ZXing) {
        try {
          const codeReader = new (window as any).ZXing.BrowserMultiFormatReader();
          const result = await codeReader.decodeFromImageUrl(objectUrl);
          if (result && result.getText()) {
            detectedBarcode = result.getText();
          }
        } catch {
          // ZXing gagal mendeteksi
        }
      }

      if (detectedBarcode) {
        handleBarcodeDetected(detectedBarcode);
      } else {
        setPhotoError('Barcode tidak terdeteksi pada foto. Pastikan gambar barcode jelas, terang, dan tidak buram.');
      }
    } catch (err: any) {
      console.error('Error decode foto barcode:', err);
      setPhotoError('Gagal memproses gambar foto. Pastikan format file gambar valid.');
    } finally {
      setIsDecodingPhoto(false);
      URL.revokeObjectURL(objectUrl);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleManualSearch = (val: string) => {
    setManualInput(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    const exact = findProductByBarcode(val);
    if (exact) {
      handleBarcodeDetected(val);
      return;
    }
    setSearchResults(searchCatalogProducts(val));
  };

  const handleConfirmAddToCart = async () => {
    if (!detectedItem) return;
    try {
      setIsAdding(true);
      const finalName = detectedItem.isCustom && customName.trim() ? customName.trim() : detectedItem.name;
      const finalPrice = detectedItem.isCustom
        ? parseInt(customPrice.replace(/\D/g, ''), 10) || 10000
        : detectedItem.unitPrice;
      const finalCategory = detectedItem.isCustom ? customCategory : detectedItem.category;

      await onAddToCart({
        name: finalName,
        category: finalCategory,
        unit: detectedItem.unit,
        quantity,
        unitPrice: finalPrice,
        discounts: detectedItem.discounts || [],
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      {/* File input tunggal: Membuka dialog bawaan sistem HP (Bisa Take Photo / Kamera & Pilih dari Galeri) */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
        aria-hidden="true"
      />

      <div
        className="w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-card-lg sm:rounded-card-lg max-h-[92dvh] flex flex-col shadow-modal animate-slide-up overflow-hidden border dark:border-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-900 dark:bg-slate-950 text-white border-b border-gray-800 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Scanner Barcode Supermarket</h2>
              <p className="text-[10px] text-gray-400">Ambil foto langsung atau pilih dari galeri</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Area Scanner Tunggal (1 Tombol: Bisa Ambil Foto Langsung atau Pilih Galeri) */}
        <div className="relative w-full h-56 bg-gradient-to-b from-gray-950 via-slate-900 to-black flex items-center justify-center p-4 text-center flex-shrink-0">
          <div
            onClick={() => photoInputRef.current?.click()}
            className="w-full h-full border-2 border-dashed border-blue-400/60 hover:border-blue-400 rounded-3xl flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-white/5 active:scale-[0.99] transition-all group shadow-inner"
          >
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mb-2 shadow-lg group-hover:scale-105 transition-transform">
              <Camera className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-extrabold text-white mb-0.5">
              Ambil Foto / Dari Galeri
            </h3>

            <p className="text-[11px] text-gray-300 max-w-xs mb-3 leading-relaxed">
              Ketuk untuk memotret kemasan barcode atau memilih foto dari galeri HP Anda.
            </p>

            <button
              type="button"
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-soft flex items-center gap-2 pointer-events-none transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Buka Kamera / Galeri</span>
            </button>
          </div>

          {/* Loading Indicator saat membaca Barcode */}
          {isDecodingPhoto && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white space-y-2">
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
              <p className="text-xs font-bold text-white">Membaca Barcode dari Foto...</p>
            </div>
          )}
        </div>

        {/* Notifikasi Error Decode Foto */}
        {photoError && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2 px-4 animate-fade-in flex-shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <span className="font-medium text-[11px]">{photoError}</span>
            </div>
            <button
              type="button"
              onClick={() => setPhotoError(null)}
              className="p-1 text-rose-500 hover:text-rose-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Kartu Konfirmasi Barang Terdeteksi */}
        {detectedItem ? (
          <div className="p-4 bg-emerald-50 dark:bg-slate-800 border-t border-emerald-200 dark:border-slate-700 animate-slide-up space-y-3 overflow-y-auto flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full">
                      {detectedItem.isCustom ? customCategory : detectedItem.category} • {detectedItem.brand}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 dark:text-slate-400">
                      #{detectedItem.barcode}
                    </span>
                  </div>

                  {detectedItem.isCustom ? (
                    <div className="mt-1 space-y-1">
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Nama produk barcode"
                        className="w-full text-xs font-bold text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                      />
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value as ProductCategory)}
                        className="text-[11px] font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-0.5"
                      >
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-slate-100 leading-tight mt-0.5 truncate">
                      {detectedItem.name}
                    </h3>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-[10px] text-gray-500 dark:text-slate-400 block">Harga Satuan:</span>
                {detectedItem.isCustom ? (
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <span className="text-xs font-bold text-primary dark:text-blue-400">Rp</span>
                    <input
                      type="text"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value.replace(/\D/g, ''))}
                      className="w-20 text-right text-xs font-bold text-primary dark:text-blue-400 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-1.5 py-0.5 outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <span className="text-base font-extrabold text-primary dark:text-blue-400">
                      {formatRupiah(detectedItem.unitPrice)}
                    </span>
                    <span className="text-[10px] text-gray-400">/{detectedItem.unit}</span>
                  </>
                )}
              </div>
            </div>

            {/* Stepper Kuantitas & Subtotal */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-750 p-2.5 rounded-xl border border-emerald-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">Kuantitas:</span>
                <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5 border border-gray-200 dark:border-slate-600">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-9 text-center font-bold text-xs text-gray-900 dark:text-slate-100">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-gray-500 dark:text-slate-400 block">Subtotal:</span>
                <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                  {formatRupiah(
                    (detectedItem.isCustom
                      ? parseInt(customPrice.replace(/\D/g, ''), 10) || 10000
                      : detectedItem.unitPrice) * quantity
                  )}
                </span>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDetectedItem(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-xs text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-750 min-h-[44px] cursor-pointer"
              >
                Scan Ulang
              </button>
              <button
                type="button"
                disabled={isAdding}
                onClick={handleConfirmAddToCart}
                className="flex-[1.5] py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isAdding ? 'Memasukkan...' : 'Masukkan ke Troli'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {/* Input Manual Pencarian Barcode atau Nama */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
                Ketik Barcode atau Nama Produk
              </label>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Contoh: 8998866200213, Indomie, Ultra Milk..."
                  value={manualInput}
                  onChange={(e) => handleManualSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                />
                <Search className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Katalog Barcode Supermarket */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-gray-600 dark:text-slate-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Katalog Barcode Supermarket (Siap Scan):
                </span>
                <span className="text-[10px] text-gray-400 dark:text-slate-500">Sentuh untuk simulasi</span>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {(searchResults.length > 0 ? searchResults : SUPERMARKET_CATALOG).map((item) => (
                  <button
                    key={item.barcode}
                    type="button"
                    onClick={() => handleBarcodeDetected(item.barcode)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-800 hover:bg-blue-50/60 dark:hover:bg-slate-750 hover:border-blue-300 dark:hover:border-blue-600 active:scale-98 transition-all text-left min-h-[48px] cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[9px] font-semibold text-primary dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/70 px-1.5 py-0.2 rounded">
                          {item.brand || item.category}
                        </span>
                        <span className="text-[9px] text-gray-400 dark:text-slate-500 font-mono">
                          #{item.barcode.slice(-4)}
                        </span>
                      </div>
                      <h4 className="font-semibold text-xs text-gray-900 dark:text-slate-100 truncate">{item.name}</h4>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-primary dark:text-blue-400 block">
                        {formatRupiah(item.unitPrice)}
                      </span>
                      <span className="text-[9px] text-gray-400 dark:text-slate-500">/{item.unit}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};