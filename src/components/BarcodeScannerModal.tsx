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
  Image as ImageIcon,
  RotateCcw,
  Flashlight,
  AlertCircle,
  ShieldAlert,
  Loader2,
  Camera as CameraIcon,
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
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'>('idle');
  
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  
  const [isDecodingPhoto, setIsDecodingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Custom scanned item fields (if item scanned is not in mock catalog)
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('10000');
  const [customCategory, setCustomCategory] = useState<ProductCategory>('Makanan instan');

  const [manualInput, setManualInput] = useState('');
  const [searchResults, setSearchResults] = useState<SupermarketCatalogItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Separate file input refs: Gallery (no capture) & Camera (with capture="environment")
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const scanTimerRef = useRef<any>(null);
  const zxingReaderRef = useRef<any>(null);
  const lastScannedCodeRef = useRef<{ code: string; timestamp: number } | null>(null);
  const isModalOpenRef = useRef(isOpen);

  // Sound effect & haptic feedback for supermarket scanner gun beep
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
      // Audio or vibration unavailable
    }
  };

  useEffect(() => {
    isModalOpenRef.current = isOpen;
    if (!isOpen) {
      stopCamera();
      setDetectedItem(null);
      setManualInput('');
      setPhotoError(null);
      setIsTorchOn(false);
      return;
    }

    // Auto-request camera when modal opens
    startCamera('environment');

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async (facing: 'environment' | 'user' = 'environment') => {
    stopCamera();
    setCameraError(null);
    setPermissionState('requesting');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Kamera tidak didukung pada browser ini.');
        setPermissionState('unsupported');
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setCameraActive(true);
      setPermissionState('granted');

      // Check if torch is supported
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        setHasTorch(Boolean(capabilities && capabilities.torch));
      }

      // Start continuous scanning loop
      startRealtimeDetection();
    } catch (err: any) {
      console.warn('Camera access denied or error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Izin akses kamera ditolak. Anda dapat menggunakan opsi Galeri Foto atau Ambil Gambar di bawah.');
        setPermissionState('denied');
      } else {
        setCameraError('Kamera tidak dapat diakses (' + (err.message || 'Error') + '). Gunakan galeri atau pencarian.');
        setPermissionState('denied');
      }
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (zxingReaderRef.current) {
      try {
        zxingReaderRef.current.reset();
      } catch {}
      zxingReaderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setCameraActive(false);
    setIsTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch (err) {
      console.warn('Torch control error:', err);
    }
  };

  const toggleCameraFacing = async () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(next);
    await startCamera(next);
  };

  // Real-time Barcode Detection Loop (Native BarcodeDetector with ZXing fallback)
  const startRealtimeDetection = async () => {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    // 1. Prioritize Native W3C BarcodeDetector API (Built into modern Chromium / Android Chrome)
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'qr_code', 'itf'];
        const detector = new (window as any).BarcodeDetector({ formats });

        const detectFrame = async () => {
          if (!isModalOpenRef.current || !videoRef.current || !streamRef.current) return;

          if (videoRef.current.readyState >= 2) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const raw = barcodes[0].rawValue;
                if (raw) {
                  handleBarcodeDetected(raw);
                }
              }
            } catch {
              // Frame decoding error, continue loop
            }
          }

          scanTimerRef.current = setTimeout(detectFrame, 120);
        };

        detectFrame();
        return;
      } catch (e) {
        console.warn('Native BarcodeDetector initialization failed, trying ZXing fallback', e);
      }
    }

    // 2. Fallback: ZXing MultiFormatReader
    try {
      const ZXing = (window as any).ZXing;
      if (ZXing && videoRef.current) {
        const codeReader = new ZXing.BrowserMultiFormatReader();
        zxingReaderRef.current = codeReader;
        codeReader.decodeFromVideoElement(videoRef.current, (result: any) => {
          if (result && result.getText && isModalOpenRef.current) {
            handleBarcodeDetected(result.getText());
          }
        });
      }
    } catch (err) {
      console.warn('ZXing video detection failed:', err);
    }
  };

  // Capture current video frame as a snapshot picture and decode barcode
  const handleCaptureVideoFrame = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) return;
    try {
      setIsDecodingPhoto(true);
      setPhotoError(null);

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      }

      let detectedBarcode: string | null = null;

      // Try Native BarcodeDetector on canvas
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'qr_code', 'itf'],
          });
          const barcodes = await detector.detect(canvas);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            detectedBarcode = barcodes[0].rawValue;
          }
        } catch (e) {
          console.warn('Canvas detection error:', e);
        }
      }

      // Try ZXing on canvas dataURL
      if (!detectedBarcode && (window as any).ZXing) {
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          const codeReader = new (window as any).ZXing.BrowserMultiFormatReader();
          const result = await codeReader.decodeFromImageUrl(dataUrl);
          if (result && result.getText()) {
            detectedBarcode = result.getText();
          }
        } catch {}
      }

      if (detectedBarcode) {
        handleBarcodeDetected(detectedBarcode);
      } else {
        setPhotoError('Barcode tidak terdeteksi pada jepretan kamera. Pastikan barcode jelas dan pas di tengah kotak.');
      }
    } catch (err: any) {
      console.error('Frame capture error:', err);
      setPhotoError('Gagal memproses jepretan kamera.');
    } finally {
      setIsDecodingPhoto(false);
    }
  };

  // When a barcode is identified (via Camera or Photo Gallery)
  const handleBarcodeDetected = (code: string) => {
    if (!code) return;
    const cleanCode = code.trim();

    // Prevent immediate re-trigger within 2.5 seconds
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
      // Unknown barcode (e.g. real barcode from user's groceries)
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

  // Photo Gallery / File Picker Barcode Scanning
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

      // 1. Try Native BarcodeDetector on image
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
          console.warn('BarcodeDetector on image failed, trying ZXing:', e);
        }
      }

      // 2. Try ZXing if native didn't find or is unsupported
      if (!detectedBarcode && (window as any).ZXing) {
        try {
          const codeReader = new (window as any).ZXing.BrowserMultiFormatReader();
          const result = await codeReader.decodeFromImageUrl(objectUrl);
          if (result && result.getText()) {
            detectedBarcode = result.getText();
          }
        } catch {
          // ZXing could not decode
        }
      }

      if (detectedBarcode) {
        handleBarcodeDetected(detectedBarcode);
      } else {
        setPhotoError('Barcode tidak terdeteksi pada foto. Pastikan gambar barcode fokus, terang, dan tidak terpotong.');
      }
    } catch (err: any) {
      console.error('Error processing photo:', err);
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
      {/* Input 1: Photo Gallery (Tanpa capture, murni buka album/galeri) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
        aria-hidden="true"
      />

      {/* Input 2: Ambil Foto Kamera (Dengan capture="environment" untuk jepret langsung) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoUpload}
        className="hidden"
        aria-hidden="true"
      />

      <div
        className="w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-card-lg sm:rounded-card-lg max-h-[92dvh] flex flex-col shadow-modal animate-slide-up overflow-hidden border dark:border-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-900 dark:bg-slate-950 text-white border-b border-gray-800 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Scanner Barcode Supermarket</h2>
              <p className="text-[10px] text-gray-400">Pindai kamera real-time &amp; foto galeri</p>
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

        {/* Viewfinder / Camera Screen */}
        <div className="relative w-full h-60 bg-black flex items-center justify-center overflow-hidden flex-shrink-0">
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                autoPlay
                muted
              />

              {/* Viewfinder Overlay Reticle */}
              <div className="relative w-60 h-32 border-2 border-dashed border-blue-400/80 rounded-2xl flex items-center justify-center pointer-events-none z-10 shadow-lg">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400" />

                {/* Laser animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_10px_#ef4444] animate-pulse" />
              </div>

              {/* Viewfinder Control Buttons (Torch, Flip, Gallery, Camera Photo) */}
              <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`p-2 rounded-full backdrop-blur-md transition-all shadow-sm cursor-pointer ${
                      isTorchOn ? 'bg-amber-400 text-gray-900' : 'bg-black/60 text-white hover:bg-black/80'
                    }`}
                    title={isTorchOn ? 'Matikan Lampu Flash' : 'Nyalakan Lampu Flash'}
                  >
                    <Flashlight className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-sm cursor-pointer"
                  title="Putar Kamera"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Tombol Ambil Gambar / Snapshot dari Kamera */}
                <button
                  type="button"
                  onClick={handleCaptureVideoFrame}
                  className="p-2 rounded-full bg-emerald-600/90 hover:bg-emerald-600 text-white backdrop-blur-md transition-all shadow-sm flex items-center gap-1 px-2.5 cursor-pointer"
                  title="Jepret Foto Barcode"
                >
                  <CameraIcon className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Jepret</span>
                </button>

                {/* Tombol Buka Galeri (Murni buka album, tanpa paksa kamera) */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="p-2 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white backdrop-blur-md transition-all shadow-sm flex items-center gap-1 px-2.5 cursor-pointer"
                  title="Buka Galeri Foto"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Galeri</span>
                </button>
              </div>

              {/* Bottom Shutter Action Bar */}
              <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2 z-20 px-3">
                <button
                  type="button"
                  onClick={handleCaptureVideoFrame}
                  className="py-1 px-3.5 rounded-full bg-white/90 hover:bg-white text-gray-900 text-[11px] font-extrabold shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <CameraIcon className="w-3.5 h-3.5 text-primary" />
                  <span>Ambil Gambar</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="py-1 px-3.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-[11px] font-bold backdrop-blur-sm shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-300" />
                  <span>Pilih Galeri</span>
                </button>
              </div>
            </>
          ) : (
            /* Permission Request or Camera Denied State */
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-black flex flex-col items-center justify-center text-gray-300 px-6 text-center space-y-2.5">
              {permissionState === 'denied' ? (
                <ShieldAlert className="w-9 h-9 text-rose-500 animate-pulse" />
              ) : (
                <Camera className="w-9 h-9 text-blue-400" />
              )}

              <div>
                <h3 className="text-xs font-bold text-white">
                  {permissionState === 'denied'
                    ? 'Izin Akses Kamera Ditolak'
                    : 'Izin Akses Kamera Diperlukan'}
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                  {permissionState === 'denied'
                    ? 'Gunakan opsi Ambil Foto Kamera atau Buka Galeri Foto di bawah untuk memindai barcode.'
                    : 'Izinkan kamera untuk memindai kemasan barang belanjaan secara langsung.'}
                </p>
              </div>

              {/* 3 Action Buttons: Izinkan Kamera, Ambil Foto, & Buka Galeri */}
              <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => startCamera('environment')}
                  className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-soft transition-all flex items-center gap-1.5 min-h-[38px] cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Izinkan Kamera</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft transition-all flex items-center gap-1.5 min-h-[38px] cursor-pointer"
                  title="Ambil foto barcode dengan kamera HP"
                >
                  <CameraIcon className="w-3.5 h-3.5 text-white" />
                  <span>Ambil Foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5 min-h-[38px] cursor-pointer"
                  title="Pilih foto barcode yang sudah tersimpan di galeri"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-300" />
                  <span>Buka Galeri</span>
                </button>
              </div>

              {cameraError && (
                <p className="text-[10px] text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/60">
                  {cameraError}
                </p>
              )}
            </div>
          )}

          {/* Decoding Photo Loading Overlay */}
          {isDecodingPhoto && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white space-y-2">
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
              <p className="text-xs font-bold text-white">Membaca Barcode dari Gambar...</p>
            </div>
          )}
        </div>

        {/* Photo Decode Error Notice */}
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

        {/* Scanned Item Confirmation Pop-up / Overlay */}
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

            {/* Action Buttons: Scan Another or Add to Cart */}
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
            {/* Quick Upload Photo & Manual Search Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
                  Ketik Barcode atau Nama Produk
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CameraIcon className="w-3 h-3" />
                    <span>Ambil Foto</span>
                  </button>
                  <span className="text-gray-300 dark:text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="text-xs text-primary dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>Galeri Foto</span>
                  </button>
                </div>
              </div>

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

            {/* Quick-Scan Preset Chips from Supermarket Catalog */}
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
