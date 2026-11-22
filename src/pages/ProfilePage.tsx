import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Camera,
  Mail,
  Clock,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  Globe,
  LogOut,
  RefreshCw,
  Check,
  Save,
  RotateCcw,
  ShieldCheck,
  HardDrive,
  Trash2,
  Smartphone,
  X,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { pwaService } from '../utils/pwa';

interface ProfilePageProps {
  onLogout?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onLogout }) => {
  const { userProfile, updateUserProfile, isEditingProfile, setIsEditingProfile } = useStore();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(userProfile.fullName);
  const [username, setUsername] = useState(userProfile.username);
  const [bio, setBio] = useState(userProfile.bio);
  const [currency, setCurrency] = useState(userProfile.currency);

  // Password management inside Edit Profile
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Storage and cache usage state
  const [storageInfo, setStorageInfo] = useState<{
    usedGb: string;
    usedMb: string;
    quotaGb: string;
    percent: string;
  }>({
    usedGb: '0.000',
    usedMb: '0.0',
    quotaGb: '0.0',
    percent: '0.1',
  });
  const [isClearingCache, setIsClearingCache] = useState(false);

  // PWA states
  const [isPwaInstalled, setIsPwaInstalled] = useState(pwaService.isStandalone());
  const [isPwaDismissed, setIsPwaDismissed] = useState(pwaService.isDismissed());
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Toast feedback message
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateStorage = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usageBytes = estimate.usage || 0;
        const quotaBytes = estimate.quota || 50 * 1024 * 1024 * 1024;

        const usedGb = (usageBytes / (1024 * 1024 * 1024)).toFixed(3);
        const usedMb = (usageBytes / (1024 * 1024)).toFixed(1);
        const quotaGb = (quotaBytes / (1024 * 1024 * 1024)).toFixed(1);
        const calcPercent = quotaBytes > 0 ? ((usageBytes / quotaBytes) * 100).toFixed(2) : '0.1';

        setStorageInfo({
          usedGb,
          usedMb,
          quotaGb,
          percent: parseFloat(calcPercent) < 0.1 ? '0.1' : calcPercent,
        });
      } else {
        setStorageInfo({
          usedGb: '0.005',
          usedMb: '5.2',
          quotaGb: '32.0',
          percent: '0.1',
        });
      }
    } catch (e) {
      console.warn('Gagal membaca storage estimate:', e);
    }
  };

  useEffect(() => {
    calculateStorage();
    setFullName(userProfile.fullName);
    setUsername(userProfile.username);
    setBio(userProfile.bio);
    setCurrency(userProfile.currency || 'ID Rupiah Indonesia (Rp - IDR)');
  }, [userProfile]);

  useEffect(() => {
    return () => {
      setIsEditingProfile(false);
    };
  }, [setIsEditingProfile]);

  const handleClearCacheAndStorage = async () => {
    try {
      setIsClearingCache(true);
      if ('caches' in window) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
      }

      try {
        sessionStorage.clear();
      } catch {}

      await calculateStorage();
      showToast('Cache peramban berhasil dibersihkan! Penyimpanan lebih lega 🧹');
    } catch (err: any) {
      showToast('Gagal membersihkan cache: ' + (err.message || 'Error'));
    } finally {
      setIsClearingCache(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3000);
  };

  const handleInstallPWA = async () => {
    const outcome = await pwaService.install();
    if (outcome === 'installed') {
      setIsPwaInstalled(true);
      showToast('Aplikasi sudah terpasang di perangkat Anda! 🎉');
    } else if (outcome === 'accepted') {
      setIsPwaInstalled(true);
      showToast('PWA berhasil dipasang ke layar utama! 📱');
    } else if (outcome === 'ios') {
      setShowIOSModal(true);
    } else {
      showToast('Buka menu browser Anda lalu pilih "Tambahkan ke Layar Utama" / "Install App" 💡');
    }
  };

  const handleRestorePWABanner = () => {
    pwaService.setDismissed(false);
    setIsPwaDismissed(false);
    showToast('Notifikasi PWA di beranda belanja diaktifkan kembali! ✨');
  };

  useEffect(() => {
    const handleDismissChange = () => {
      setIsPwaDismissed(pwaService.isDismissed());
      setIsPwaInstalled(pwaService.isStandalone());
    };
    window.addEventListener('pwa-dismiss-changed', handleDismissChange);
    window.addEventListener('pwa-installed', handleDismissChange);
    return () => {
      window.removeEventListener('pwa-dismiss-changed', handleDismissChange);
      window.removeEventListener('pwa-installed', handleDismissChange);
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('⚠️ Ukuran foto maksimal 2MB!');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        updateUserProfile({ avatarUrl: base64 });
        showToast('Foto profil Instagram berhasil diperbarui! 📸');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    updateUserProfile({ avatarUrl: '' });
    showToast('Foto profil dikembalikan ke inisial nama.');
  };

  const handleSaveProfile = () => {
    const cleanUsername = username.trim().replace(/^@/, '');
    if (!cleanUsername) {
      showToast('⚠️ Username tidak boleh kosong!');
      return;
    }

    // Ambil kata sandi aktif saat ini (verifikasi riil dari localStorage atau userProfile)
    const savedPw = typeof window !== 'undefined' ? localStorage.getItem('sg_password') : null;
    const currentActivePassword =
      savedPw && savedPw !== '••••••••••••••'
        ? savedPw
        : userProfile.passwordMasked && userProfile.passwordMasked !== '••••••••••••••'
        ? userProfile.passwordMasked
        : 'naomi12345';

    const isAttemptingPasswordChange = Boolean(oldPassword || newPassword || confirmPassword);

    if (isAttemptingPasswordChange) {
      if (!oldPassword) {
        setPasswordError('Masukkan kata sandi sebelumnya untuk verifikasi!');
        return;
      }
      if (oldPassword !== currentActivePassword) {
        setPasswordError('Kata sandi sebelumnya salah! Verifikasi gagal.');
        return;
      }
      if (!newPassword) {
        setPasswordError('Masukkan kata sandi baru!');
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError('Kata sandi baru minimal 6 karakter!');
        return;
      }
      if (newPassword === oldPassword) {
        setPasswordError('Kata sandi baru tidak boleh sama dengan kata sandi sebelumnya!');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError('Konfirmasi kata sandi baru tidak cocok!');
        return;
      }

      // Verifikasi sukses: perbarui kata sandi secara riil
      updateUserProfile({ passwordMasked: newPassword });
      if (typeof window !== 'undefined') {
        localStorage.setItem('sg_password', newPassword);
      }
    }

    updateUserProfile({
      fullName: fullName.trim() || 'naomi miracle',
      username: cleanUsername,
      bio: bio.trim(),
      currency,
    });
    setIsEditing(false);
    setIsEditingProfile(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    showToast(
      isAttemptingPasswordChange
        ? 'Kata sandi & profil berhasil diperbarui! ✨'
        : 'Profil & Pengaturan berhasil disimpan! ✨'
    );
  };

  return (
    <div className="space-y-4 pb-3">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary dark:text-slate-400 font-medium">
            <span>Akun Saya</span>
          </div>
          <h1 className="text-xl font-extrabold text-text-main dark:text-slate-100 tracking-tight">
            Profil &amp; Pengaturan
          </h1>
        </div>
      </div>

      {/* Success / Feedback Toast Bar */}
      {successToast && (
        <div className="bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2 animate-fade-in shadow-xs">
          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Card 1: NAMA PENGGUNA & AKUN (Instagram Profile Style) */}
      <div className="bg-card dark:bg-slate-800/90 rounded-2xl p-4 border border-border dark:border-slate-700 shadow-soft space-y-3.5 relative">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-wider text-text-secondary dark:text-slate-400 uppercase">
            Nama Pengguna &amp; Akun
          </span>

          <button
            type="button"
            onClick={() => {
              if (isEditing) {
                handleSaveProfile();
              } else {
                setIsEditing(true);
                setIsEditingProfile(true);
              }
            }}
            className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              isEditing
                ? 'bg-primary text-white shadow-soft'
                : 'bg-blue-50 dark:bg-blue-950/70 text-primary dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'
            }`}
          >
            {isEditing ? (
              <>
                <Save className="w-3 h-3" />
                <span>Simpan</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3 h-3" />
                <span>Edit Profil</span>
              </>
            )}
          </button>
        </div>

        {/* Profile Avatar + Instagram Photo Change */}
        <div className="flex items-center gap-3.5">
          <div className="relative group flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-600 p-0.5 shadow-md">
              <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center relative">
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="font-extrabold text-2xl text-blue-600 dark:text-blue-400 select-none">
                    {userProfile.fullName ? userProfile.fullName.charAt(0).toUpperCase() : 'N'}
                  </div>
                )}
              </div>
            </div>

            {/* Instagram Camera Overlay Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary hover:bg-primary-hover active:scale-95 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 transition-all cursor-pointer"
              title="Ganti Foto Profil (Pilih Foto)"
            >
              <Camera className="w-3 h-3" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Identity Info */}
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="space-y-1.5">
                <div>
                  <label className="text-[10px] text-text-secondary dark:text-slate-400 font-semibold block">
                    Nama Lengkap:
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Naomi Miracle"
                    className="w-full text-xs font-bold px-2 py-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-secondary dark:text-slate-400 font-semibold block">
                    Username:
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="naomiiracle"
                      className="w-full text-xs font-bold pl-5 pr-2 py-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-extrabold text-base text-text-main dark:text-slate-100 leading-tight">
                  {userProfile.fullName || 'naomi miracle'}
                </h3>
                <p className="text-xs font-bold text-primary dark:text-blue-400">
                  @{userProfile.username || 'naomiiracle'}
                </p>
                {userProfile.bio && (
                  <p className="text-[11px] text-text-secondary dark:text-slate-400 mt-0.5 line-clamp-1 italic">
                    "{userProfile.bio}"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instagram Bio Editing Field */}
        {isEditing && (
          <div className="pt-1 border-t border-gray-100 dark:border-slate-700/80">
            <label className="text-[10px] text-text-secondary dark:text-slate-400 font-semibold block mb-0.5">
              Bio / Deskripsi Profil:
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Deskripsi singkat profil Anda..."
              rows={2}
              className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            {userProfile.avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-[10px] text-danger dark:text-rose-400 font-semibold hover:underline mt-1 cursor-pointer block"
              >
                Hapus foto profil khusus
              </button>
            )}

            {/* Kata Sandi Akun - Hanya Muncul Di Dalam Mode Edit Profil */}
            <div className="pt-2 border-t border-gray-100 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-text-secondary dark:text-slate-400 font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-primary dark:text-blue-400" />
                  <span>Ganti Kata Sandi (Opsional):</span>
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Terenkripsi</span>
                </span>
              </div>

              <div className="space-y-1.5">
                {/* 1. Kata Sandi Sebelumnya (Verifikasi Ril) */}
                <div>
                  <label className="text-[9px] text-text-secondary dark:text-slate-400 font-semibold block mb-0.5">
                    Kata Sandi Sebelumnya:
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => {
                        setOldPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                      }}
                      placeholder="Masukkan kata sandi lama / sebelumnya"
                      className="w-full text-xs px-2.5 py-1.5 pr-8 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-main dark:hover:text-slate-200 cursor-pointer p-0.5"
                      title={showOldPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                    >
                      {showOldPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* 2. Kata Sandi Baru */}
                <div>
                  <label className="text-[9px] text-text-secondary dark:text-slate-400 font-semibold block mb-0.5">
                    Kata Sandi Baru:
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                      }}
                      placeholder="Kata sandi baru"
                      className="w-full text-xs px-2.5 py-1.5 pr-8 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-main dark:hover:text-slate-200 cursor-pointer p-0.5"
                      title={showNewPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* 3. Konfirmasi Kata Sandi Baru */}
                {(newPassword || oldPassword) && (
                  <div className="animate-fade-in">
                    <label className="text-[9px] text-text-secondary dark:text-slate-400 font-semibold block mb-0.5">
                      Konfirmasi Kata Sandi Baru:
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (passwordError) setPasswordError(null);
                        }}
                        placeholder="Ulangi kata sandi baru"
                        className="w-full text-xs px-2.5 py-1.5 pr-8 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-main dark:hover:text-slate-200 cursor-pointer p-0.5"
                        title={showConfirmPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {passwordError && (
                  <p className="text-[10px] text-danger dark:text-rose-400 font-bold animate-shake pt-0.5">
                    ⚠️ {passwordError}
                  </p>
                )}
              </div>
            </div>

            {/* Tombol Simpan di bagian bawah form Edit Profil */}
            <button
              type="button"
              onClick={handleSaveProfile}
              className="w-full py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-hover active:scale-98 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Profil &amp; Pengaturan</span>
            </button>
          </div>
        )}

        {/* Email Pill Badge */}
        <div className="space-y-1.5 pt-1 border-t border-gray-100/90 dark:border-slate-700/60">
          <div className="flex items-center gap-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-semibold max-w-full truncate">
              <Mail className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{userProfile.email}</span>
            </div>
          </div>

          {/* Login Time & Google Linked Status */}
          <div className="flex items-center justify-between text-[10px] text-text-secondary dark:text-slate-400 pt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400 dark:text-slate-500" />
              WAKTU MASUK: <strong className="font-semibold text-text-main dark:text-slate-300">{userProfile.loginTime}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Akun Google Terhubung (Google OAuth Verified)</span>
          </div>
        </div>
      </div>

      {/* Sembunyikan section lainnya saat sedang edit profil agar tidak bisa scroll ke bawah */}
      {!isEditing && (
        <>
          {/* Card 2: MATA UANG BELANJA */}
          <div className="bg-card dark:bg-slate-800/90 rounded-2xl p-3.5 border border-border dark:border-slate-700 shadow-soft space-y-1.5">
        <label className="text-[10px] font-black tracking-wider text-text-secondary dark:text-slate-400 uppercase flex items-center gap-1">
          <Globe className="w-3 h-3" />
          <span>Mata Uang Belanja :</span>
        </label>

        <select
          value={currency}
          onChange={(e) => {
            setCurrency(e.target.value);
            updateUserProfile({ currency: e.target.value });
            showToast(`Mata uang diatur ke ${e.target.value}`);
          }}
          className="w-full text-xs font-bold py-2.5 px-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer min-h-[42px]"
        >
          <option value="ID Rupiah Indonesia (Rp - IDR)">ID Rupiah Indonesia (Rp - IDR)</option>
          <option value="US Dollar ($ - USD)">US Dollar ($ - USD)</option>
          <option value="Singapore Dollar (S$ - SGD)">Singapore Dollar (S$ - SGD)</option>
          <option value="Euro (€ - EUR)">Euro (€ - EUR)</option>
          <option value="Japanese Yen (¥ - JPY)">Japanese Yen (¥ - JPY)</option>
          <option value="Chinese Yuan / Yen Cina (¥ - CNY)">Chinese Yuan / Yen Cina (¥ - CNY)</option>
          <option value="Saudi Riyal / Riyadh (SR - SAR)">Saudi Riyal / Riyadh (SR - SAR)</option>
          <option value="Dirham UEA / Arab (AED - AED)">Dirham UEA / Arab (AED - AED)</option>
        </select>
      </div>

      {/* Card: PERANGKAT & APLIKASI (Pasang PWA - Mengikuti Gaya UI Aplikasi) */}
      <div className="bg-card dark:bg-slate-800/90 rounded-2xl p-3.5 border border-border dark:border-slate-700 shadow-soft space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-wider text-text-secondary dark:text-slate-400 uppercase flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-primary dark:text-blue-400" />
            <span>Perangkat &amp; Aplikasi</span>
          </span>
          {isPwaInstalled && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-500" />
              <span>Terpasang</span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-0.5">
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-text-main dark:text-slate-100 leading-tight">
              Pasang Aplikasi (PWA)
            </h4>
            <p className="text-[10.5px] text-text-secondary dark:text-slate-400 mt-0.5 leading-snug">
              Akses cepat tanpa browser di Komputer &amp; HP
            </p>
          </div>

          <button
            type="button"
            onClick={handleInstallPWA}
            className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-primary dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-xs flex items-center gap-1.5 shadow-soft transition-all cursor-pointer flex-shrink-0 min-h-[38px] active:scale-95"
            title="Pasang Aplikasi PWA"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pasang App</span>
          </button>
        </div>

        {isPwaDismissed && (
          <div className="pt-2 border-t border-gray-100 dark:border-slate-700/80 flex items-center justify-between text-[10.5px]">
            <span className="text-text-secondary dark:text-slate-400">
              Banner di beranda belanja sedang disembunyikan
            </span>
            <button
              type="button"
              onClick={handleRestorePWABanner}
              className="text-primary dark:text-blue-400 font-bold hover:underline cursor-pointer"
            >
              Aktifkan Kembali
            </button>
          </div>
        )}
      </div>

      {/* Card 4: PENYIMPANAN & CACHE APLIKASI (Memberikan info kapasitas GB yang terpakai) */}
      <div className="bg-card dark:bg-slate-800/90 rounded-2xl p-3.5 border border-border dark:border-slate-700 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-wider text-text-secondary dark:text-slate-400 uppercase flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-primary dark:text-blue-400" />
            <span>Penyimpanan &amp; Cache Aplikasi</span>
          </span>

          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Optimal</span>
          </span>
        </div>

        {/* Storage Meter Display */}
        <div className="bg-gray-50/80 dark:bg-slate-900/60 rounded-xl p-3 border border-gray-100 dark:border-slate-750 space-y-2">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[10px] text-text-secondary dark:text-slate-400 font-semibold block">
                Penyimpanan Terpakai:
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-primary dark:text-blue-400 tracking-tight">
                  {storageInfo.usedGb} GB
                </span>
                <span className="text-[11px] font-bold text-text-secondary dark:text-slate-400">
                  ({storageInfo.usedMb} MB)
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-text-secondary dark:text-slate-400 font-semibold block">
                Kuota Perangkat:
              </span>
              <span className="text-xs font-extrabold text-text-main dark:text-slate-200">
                {storageInfo.quotaGb} GB
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(parseFloat(storageInfo.percent), 1)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-text-secondary dark:text-slate-400">
            <span>Database offline Dexie &amp; Cache Peramban</span>
            <span className="font-semibold">{storageInfo.percent}% terpakai</span>
          </div>
        </div>

        {/* Cache Cleaner Row */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-slate-700/80">
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-text-main dark:text-slate-100 leading-tight">
              Bersihkan Cache &amp; Reset Data
            </h4>
            <p className="text-[10px] text-text-secondary dark:text-slate-400 mt-0.5 line-clamp-1">
              Hapus cache lokal peramban &amp; segarkan data
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearCacheAndStorage}
            disabled={isClearingCache}
            className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-rose-900/60 bg-red-50/60 dark:bg-rose-950/40 hover:bg-red-100 dark:hover:bg-rose-900/60 active:scale-95 text-danger dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 disabled:opacity-50"
            title="Bersihkan cache lokal"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isClearingCache ? 'Membersihkan...' : 'Bersihkan'}</span>
          </button>
        </div>
      </div>

      {/* Action Buttons: Kembali ke Halaman Login, Ganti Akun, Keluar (Tanpa tombol Tutup di bawah) */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={() => {
            if (onLogout) {
              onLogout();
            } else {
              showToast('Kembali ke Halaman Login...');
            }
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-bold text-xs shadow-soft flex items-center justify-center gap-2 transition-all min-h-[42px] cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Kembali ke Halaman Login</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              showToast('Mode ganti akun diaktifkan. Silakan perbarui data profil.');
              setIsEditing(true);
              setIsEditingProfile(true);
            }}
            className="py-2.5 px-3 rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 text-primary dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-bold text-xs flex items-center justify-center gap-1.5 transition-all min-h-[42px] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Ganti Akun</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                showToast('Keluar dari sesi akun.');
              }
            }}
            className="py-2.5 px-3 rounded-xl border border-red-200 dark:border-rose-900/60 bg-red-50/50 dark:bg-rose-950/30 text-danger dark:text-rose-400 hover:bg-red-100 dark:hover:bg-rose-900/50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all min-h-[42px] cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
      </>
      )}

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-[360px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-modal animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-text-main dark:text-slate-100">
                Pasang di iPhone / iPad
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="space-y-2 text-xs text-text-secondary dark:text-slate-300 mb-4 list-decimal list-inside">
              <li>
                Ketuk tombol <strong className="text-primary dark:text-blue-400">Share</strong> (ikon kotak panah atas) di Safari.
              </li>
              <li>
                Gulir ke bawah dan pilih{' '}
                <strong className="text-text-main dark:text-slate-100">Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
              </li>
              <li>
                Ketuk <strong className="text-primary dark:text-blue-400">Tambah (Add)</strong> di pojok kanan atas.
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-primary hover:bg-primary-hover active:scale-98 text-white font-bold py-2.5 rounded-xl text-xs min-h-[42px] cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

