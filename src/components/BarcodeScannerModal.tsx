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
} from 'lucide-react';
import {
  SUPERMARKET_CATALOG,
  findProductByBarcode,
  searchCatalogProducts,
} from '../data/supermarketCatalog';
import type { SupermarketCatalogItem, ProductCategory } from '../types';
import { formatRupiah } from '../utils/currency';

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
  const [detectedItem, setDetectedItem] = useState<SupermarketCatalogItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [searchResults, setSearchResults] = useState<SupermarketCatalogItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sound effect generator for supermarket scanner gun beep
  const playScannerBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch {
      // AudioContext unavailable
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setDetectedItem(null);
      setManualInput('');
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
        setCameraError('Kamera tidak didukung pada browser ini.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access could not be initialized:', err);
      setCameraError('Gunakan simulasi barcode atau cari produk langsung.');
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

  const handleScanBarcode = (barcode: string) => {
    const item = findProductByBarcode(barcode);
    if (item) {
      playScannerBeep();
      setDetectedItem(item);
      setQuantity(1);
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
      <div
        className="w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-card-lg sm:rounded-card-lg max-h-[92dvh] flex flex-col shadow-modal animate-slide-up overflow-hidden border dark:border-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-900 dark:bg-slate-950 text-white border-b border-gray-800 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Scanner Barcode Supermarket</h2>
              <p className="text-[10px] text-gray-400">Pindai harga &amp; produk otomatis</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder Area */}
        <div className="relative w-full h-52 bg-black flex items-center justify-center overflow-hidden">
          {cameraActive ? (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-black flex flex-col items-center justify-center text-gray-400 px-6 text-center">
              <Camera className="w-8 h-8 text-gray-600 mb-2" />
              <p className="text-xs text-gray-300 font-medium">Mode Kamera Barcode Aktif</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Arahkan ke barcode kemasan barang atau pilih produk di bawah
              </p>
              {cameraError && (
                <p className="text-[10px] text-amber-400 mt-1 bg-amber-950/60 px-2 py-0.5 rounded-full">
                  {cameraError}
                </p>
              )}
            </div>
          )}

          {/* Viewfinder Target & Laser Animation */}
          <div className="relative w-56 h-32 border-2 border-dashed border-blue-400/80 rounded-2xl flex items-center justify-center pointer-events-none z-10 shadow-lg">
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400" />

            <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-pulse" />
          </div>

          <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none z-10">
            <span className="text-[10px] font-medium text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
              ⚡ Deteksi Barcode Otomatis
            </span>
          </div>
        </div>

        {/* Scanned Item Confirmation Pop-up / Overlay */}
        {detectedItem ? (
          <div className="p-4 bg-emerald-50 dark:bg-slate-800 border-t border-emerald-200 dark:border-slate-700 animate-slide-up space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full">
                    {detectedItem.category} • {detectedItem.brand}
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-slate-100 leading-tight mt-0.5">
                    {detectedItem.name}
                  </h3>
                  <span className="text-[11px] text-gray-500 dark:text-slate-400">
                    Barcode: {detectedItem.barcode}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-gray-500 dark:text-slate-400 block">Harga Resmi:</span>
                <span className="text-base font-extrabold text-primary dark:text-blue-400">
                  {formatRupiah(detectedItem.unitPrice)}
                </span>
                <span className="text-[10px] text-gray-400">/{detectedItem.unit}</span>
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
                    className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-9 text-center font-bold text-xs text-gray-900 dark:text-slate-100">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-gray-500 dark:text-slate-400 block">Subtotal:</span>
                <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                  {formatRupiah(detectedItem.unitPrice * quantity)}
                </span>
              </div>
            </div>

            {/* Buttons: Add or Scan Another */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDetectedItem(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-xs text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-750 min-h-[44px]"
              >
                Scan Ulang
              </button>
              <button
                type="button"
                disabled={isAdding}
                onClick={handleConfirmAddToCart}
                className="flex-[1.5] py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isAdding ? 'Memasukkan...' : 'Masukkan ke Troli'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {/* Search or Barcode Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
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

            {/* Quick-Scan Preset Chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-gray-600 dark:text-slate-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Katalog Barcode Supermarket (Siap Scan):
                </span>
                <span className="text-[10px] text-gray-400 dark:text-slate-500">Sentuh untuk scan</span>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {(searchResults.length > 0 ? searchResults : SUPERMARKET_CATALOG).map((item) => (
                  <button
                    key={item.barcode}
                    type="button"
                    onClick={() => handleScanBarcode(item.barcode)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-800 hover:bg-blue-50/60 dark:hover:bg-slate-750 hover:border-blue-300 dark:hover:border-blue-600 active:scale-98 transition-all text-left min-h-[48px]"
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
