import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  QrCode,
  Check,
  Smartphone,
  Laptop,
  CheckCircle2,
  Radio,
  Copy,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { syncService, type SyncState } from '../services/syncService';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose }) => {
  const [syncState, setSyncState] = useState<SyncState>({
    isConnected: false,
    isSyncing: false,
    lastSyncTime: null,
    deviceId: '',
    lastOrigin: null,
    pendingCount: 0,
  });

  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = syncService.subscribe((state) => {
      setSyncState(state);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isOpen) {
      syncService.generateShareUrl().then((url) => {
        setShareUrl(url);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualPush = async () => {
    setActionMessage('Mengirim snapshot ke semua perangkat...');
    await syncService.broadcastSnapshot();
    setActionMessage('Snapshot berhasil disiarkan ke cloud & HP!');
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleManualPull = async () => {
    setActionMessage('Mengambil data troli & belanja dari cloud...');
    const updated = await syncService.pullLatestSnapshot(true);
    if (updated) {
      setActionMessage('Data belanja berhasil disamakan 100%!');
    } else {
      setActionMessage('Sudah menggunakan data snapshot paling baru.');
    }
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleCopyLink = async () => {
    try {
      const url = await syncService.generateShareUrl();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback
      prompt('Salin link snapshot berikut untuk dibuka di HP:', shareUrl);
    }
  };

  const isMobile = syncState.deviceId.startsWith('hp_');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden transition-all duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-slate-900 dark:to-indigo-950 p-4 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Radio className="w-4 h-4 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-white">
                Snapshot &amp; Realtime Sync
              </h3>
              <p className="text-[11px] text-blue-100 dark:text-blue-200">
                Sinkronisasi Antar Perangkat
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Single-User Profile Info */}
          <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                N
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                    naomiiracle
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-300">
                    Single User
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  BCA 5271-8892-01
                </p>
              </div>
            </div>

            {/* Connection Status Badge */}
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Realtime Aktif</span>
              </div>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                {syncState.lastSyncTime ? `Sinkron ${syncState.lastSyncTime}` : 'Siap sinkron'}
              </p>
            </div>
          </div>

          {/* Device Identity */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              {isMobile ? (
                <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <Laptop className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
              <span className="font-semibold">ID Perangkat Ini:</span>
            </div>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-[11px]">
              {syncState.deviceId || 'loading...'}
            </span>
          </div>

          {/* Action Feedback Message */}
          {actionMessage && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-xl text-xs flex items-center gap-2 font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* Main Sync Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleManualPush}
              disabled={syncState.isSyncing}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
              <span>Kirim Snapshot</span>
            </button>

            <button
              type="button"
              onClick={handleManualPull}
              disabled={syncState.isSyncing}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tarik Terbaru (HP)</span>
            </button>
          </div>

          {/* Instant 1-Tap Pairing & QR Code */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Samakan Langsung ke HP:
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">1-Detik Sync</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2 px-3 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin Link untuk HP</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="py-2 px-3 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-500" />
                <span>{showQr ? 'Tutup QR' : 'Scan QR HP'}</span>
              </button>
            </div>

            {/* QR Code display */}
            {showQr && (
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-2 animate-fadeIn">
                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  📱 Buka Kamera HP dan Arahkan ke QR Code ini:
                </p>
                <div className="flex justify-center p-2.5 bg-white rounded-2xl inline-block mx-auto shadow-md border border-slate-100">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      shareUrl || 'https://smartgroceryandpricetaker.vercel.app/'
                    )}`}
                    alt="QR Code Sinkronisasi"
                    className="w-44 h-44 mx-auto"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Data troli &amp; belanja dari laptop akan langsung pindah 100% ke HP.
                </p>
              </div>
            )}
          </div>

          {/* Explanation note */}
          <div className="bg-blue-50/50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-blue-100 dark:border-slate-800">
            <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-400">
              💡 <strong>Tips jika HP masih beda:</strong> HP kemungkinan masih menyimpan cache lama PWA. Buka link via <strong>Incognito / Mode Penyamaran</strong>, atau tekan <strong>"Tarik Terbaru (HP)"</strong> / <strong>Scan QR</strong> di atas untuk memuat data laptop secara instan.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
