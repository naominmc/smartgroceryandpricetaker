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
  Check,
  Save,
  ShieldCheck,
  HardDrive,
  Trash2,
  Smartphone,
  RotateCcw,
  X,
  Calendar,
  MapPin,
  AlertTriangle,
  Languages,
} from 'lucide-react';
import type { PurchaseTransaction } from '../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { formatRupiah } from '../utils/currency';
import { useStore } from '../store/useStore';
import { pwaService } from '../utils/pwa';
import { t, type AppLanguage, getLanguageDisplayName } from '../utils/i18n';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface ProfilePageProps {
  onLogout?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onLogout }) => {
  const {
    userProfile,
    updateUserProfile,
    isEditingProfile,
    setIsEditingProfile,
    language,
    setLanguage,
    currency: storeCurrency,
    setCurrency: setStoreCurrency,
  } = useStore();

  const [pendingLangChange, setPendingLangChange] = useState<AppLanguage | null>(null);

  // Recycle Bin / Recently Deleted query
  const deletedTransactions =
    useLiveQuery(() => db.transactions.filter((t) => Boolean(t.isDeleted)).toArray()) || [];

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

  // Recycle Bin Modal Confirmation states
  const [txToRestore, setTxToRestore] = useState<PurchaseTransaction | null>(null);
  const [txToDeletePermanent, setTxToDeletePermanent] = useState<PurchaseTransaction | null>(null);

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    setCurrency(storeCurrency || userProfile.currency || 'ID Rupiah Indonesia (Rp - IDR)');

    const handleSyncStorage = () => {
      calculateStorage();
    };

    window.addEventListener('smart_grocery_remote_sync', handleSyncStorage);
    window.addEventListener('smart_grocery_cache_cleared', handleSyncStorage);

    return () => {
      window.removeEventListener('smart_grocery_remote_sync', handleSyncStorage);
      window.removeEventListener('smart_grocery_cache_cleared', handleSyncStorage);
    };
  }, [userProfile, storeCurrency]);

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

      if (typeof window !== 'undefined') {
        localStorage.setItem('smart_grocery_cache_reset_at', Date.now().toString());
        syncService.notifyChange();
      }

      await calculateStorage();
      showToast(t('cacheClearedToast', language));
    } catch (err: any) {
      showToast(
        language === 'zh'
          ? '清理缓存失败：' + (err.message || 'Error')
          : language === 'en'
          ? 'Failed to clear cache: ' + (err.message || 'Error')
          : 'Gagal membersihkan cache: ' + (err.message || 'Error')
      );
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
      showToast(t('appAlreadyInstalled', language));
    } else if (outcome === 'accepted') {
      setIsPwaInstalled(true);
      showToast(
        language === 'zh'
          ? 'PWA 已成功安装到主屏幕！📱'
          : language === 'en'
          ? 'PWA successfully installed to home screen! 📱'
          : 'PWA berhasil dipasang ke layar utama! 📱'
      );
    } else if (outcome === 'ios') {
      setShowIOSModal(true);
    } else {
      showToast(
        language === 'zh'
          ? '请打开浏览器菜单并选择“添加到主屏幕”/“安装应用”💡'
          : language === 'en'
          ? 'Open browser menu and select "Add to Home Screen" / "Install App" 💡'
          : 'Buka menu browser Anda lalu pilih "Tambahkan ke Layar Utama" / "Install App" 💡'
      );
    }
  };

  const handleRestorePWABanner = () => {
    pwaService.setDismissed(false);
    setIsPwaDismissed(false);
    showToast(
      language === 'zh'
        ? '购物主页上的 PWA 提示已重新开启！✨'
        : language === 'en'
        ? 'PWA notification on home banner reactivated! ✨'
        : 'Notifikasi PWA di beranda belanja diaktifkan kembali! ✨'
    );
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
        showToast(
          language === 'zh'
            ? '⚠️ 照片大小不能超过 2MB！'
            : language === 'en'
            ? '⚠️ Photo size must not exceed 2MB!'
            : '⚠️ Ukuran foto maksimal 2MB!'
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        updateUserProfile({ avatarUrl: base64 });
        showToast(
          language === 'zh'
            ? '个人资料照片已更新！📸'
            : language === 'en'
            ? 'Profile photo updated! 📸'
            : 'Foto profil Instagram berhasil diperbarui! 📸'
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    updateUserProfile({ avatarUrl: '' });
    showToast(
      language === 'zh'
        ? '头像已恢复为姓名首字母。'
        : language === 'en'
        ? 'Profile picture reset to initial.'
        : 'Foto profil dikembalikan ke inisial nama.'
    );
  };

  const handleSaveProfile = () => {
    const cleanUsername = username.trim().replace(/^@/, '');
    if (!cleanUsername) {
      showToast(
        language === 'zh'
          ? '⚠️ 用户名不能为空！'
          : language === 'en'
          ? '⚠️ Username cannot be empty!'
          : '⚠️ Username tidak boleh kosong!'
      );
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
        setPasswordError(
          language === 'zh'
            ? '请输入原密码进行验证！'
            : language === 'en'
            ? 'Enter previous password for verification!'
            : 'Masukkan kata sandi sebelumnya untuk verifikasi!'
        );
        return;
      }
      if (oldPassword !== currentActivePassword) {
        setPasswordError(
          language === 'zh'
            ? '原密码错误！验证失败。'
            : language === 'en'
            ? 'Previous password incorrect! Verification failed.'
            : 'Kata sandi sebelumnya salah! Verifikasi gagal.'
        );
        return;
      }
      if (!newPassword) {
        setPasswordError(
          language === 'zh'
            ? '请输入新密码！'
            : language === 'en'
            ? 'Enter new password!'
            : 'Masukkan kata sandi baru!'
        );
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError(
          language === 'zh'
            ? '新密码至少6个字符！'
            : language === 'en'
            ? 'New password must be at least 6 characters!'
            : 'Kata sandi baru minimal 6 karakter!'
        );
        return;
      }
      if (newPassword === oldPassword) {
        setPasswordError(
          language === 'zh'
            ? '新密码不能与原密码相同！'
            : language === 'en'
            ? 'New password cannot be the same as previous password!'
            : 'Kata sandi baru tidak boleh sama dengan kata sandi sebelumnya!'
        );
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError(
          language === 'zh'
            ? '新密码确认不匹配！'
            : language === 'en'
            ? 'New password confirmation does not match!'
            : 'Konfirmasi kata sandi baru tidak cocok!'
        );
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
        ? language === 'zh'
          ? '密码与资料已成功更新！✨'
          : language === 'en'
          ? 'Password & profile updated successfully! ✨'
          : 'Kata sandi & profil berhasil diperbarui! ✨'
        : language === 'zh'
        ? '资料与设置已成功保存！✨'
        : language === 'en'
        ? 'Profile & settings saved successfully! ✨'
        : 'Profil & Pengaturan berhasil disimpan! ✨'
    );
  };

  return (
    <div className="space-y-4 pt-3 pb-3">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary dark:text-slate-400 font-medium">
            <span>{t('myAccount', language)}</span>
          </div>
          <h1 className="text-xl font-extrabold text-text-main dark:text-slate-100 tracking-tight">
            {t('profileAndSettings', language)}
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
            {t('userProfileCardTitle', language)}
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
                <span>{t('saveBtn', language)}</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3 h-3" />
                <span>{t('editProfileBtn', language)}</span>
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
              title={language === 'zh' ? '更换头像 (选择照片)' : language === 'en' ? 'Change Profile Picture' : 'Ganti Foto Profil (Pilih Foto)'}
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
                    {t('fullNameLabel', language)}
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
                    {t('usernameLabel', language)}
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
              {t('bioLabel', language)}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('bioPlaceholder', language)}
              rows={2}
              className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            {userProfile.avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-[10px] text-danger dark:text-rose-400 font-semibold hover:underline mt-1 cursor-pointer block"
              >
                {t('removeCustomAvatar', language)}
              </button>
            )}

            {/* Kata Sandi Akun - Hanya Muncul Di Dalam Mode Edit Profil */}
            <div className="pt-2 border-t border-gray-100 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-text-secondary dark:text-slate-400 font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-primary dark:text-blue-400" />
                  <span>{t('changePasswordOptional', language)}</span>
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{t('encryptedBadge', language)}</span>
                </span>
              </div>

              <div className="space-y-1.5">
                {/* 1. Kata Sandi Sebelumnya (Verifikasi Ril) */}
                <div>
                  <label className="text-[9px] text-text-secondary dark:text-slate-400 font-semibold block mb-0.5">
                    {t('oldPasswordLabel', language)}
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => {
                        setOldPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                      }}
                      placeholder={t('oldPasswordPlaceholder', language)}
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
                    {t('newPasswordLabel', language)}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                      }}
                      placeholder={t('newPasswordPlaceholder', language)}
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
                      {t('confirmNewPasswordLabel', language)}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (passwordError) setPasswordError(null);
                        }}
                        placeholder={t('confirmNewPasswordPlaceholder', language)}
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
              <span>{t('saveProfileAndSettings', language)}</span>
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

          {/* Google Linked Status */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 pt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('googleOAuthVerified', language)}</span>
          </div>
        </div>
      </div>

      {/* Sembunyikan section lainnya saat sedang edit profil agar tidak bisa scroll ke bawah */}
      {!isEditing && (
        <>
          {/* Card: PILIHAN BAHASA (Diatas Mata Uang Belanja - Langsung Nama Tanpa Logo) */}
          <div className="bg-card dark:bg-slate-800/90 rounded-2xl p-3.5 border border-border dark:border-slate-700 shadow-soft space-y-2">
            <label className="text-[10px] font-black tracking-wider text-text-secondary dark:text-slate-400 uppercase flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-primary dark:text-blue-400" />
              <span>{t('languageSection', language)}</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'id', label: 'Indonesia' },
                { id: 'en', label: 'English' },
                { id: 'zh', label: '中文' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === language) return;
                    setPendingLangChange(item.id as AppLanguage);
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer border min-h-[42px] ${
                    language === item.id
                      ? 'bg-primary text-white border-primary shadow-sm font-black'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Konfirmasi Ganti Bahasa di Halaman Profil */}
          <ConfirmDialog
            isOpen={Boolean(pendingLangChange)}
            title={t('confirmLangTitle', language)}
            message={t('confirmLangDesc', language, {
              lang: pendingLangChange ? getLanguageDisplayName(pendingLangChange) : '',
            })}
            confirmLabel={t('confirmLangBtn', language)}
            cancelLabel={t('cancelBtn', language)}
            onConfirm={() => {
              if (pendingLangChange) {
                setLanguage(pendingLangChange);
                showToast(
                  t('langChangedToast', pendingLangChange, {
                    lang: getLanguageDisplayName(pendingLangChange),
                  })
                );
                setPendingLangChange(null);
              }
            }}
            onCancel={() => setPendingLangChange(null)}
          />

          {/* Card 2: MATA UANG BELANJA */}
          <div className="bg-card dark:bg-slate-800/90 rounded-2xl p-3.5 border border-border dark:border-slate-700 shadow-soft space-y-1.5">
        <label className="text-[10px] font-black tracking-wider text-text-secondary dark:text-slate-400 uppercase flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-primary dark:text-blue-400" />
          <span>{t('currencySection', language)}</span>
        </label>

        <select
          value={storeCurrency || currency || userProfile.currency || 'ID Rupiah Indonesia (Rp - IDR)'}
          onChange={(e) => {
            const nextCur = e.target.value;
            setCurrency(nextCur);
            setStoreCurrency(nextCur);
            updateUserProfile({ currency: nextCur });
            showToast(
              language === 'zh'
                ? `货币已设置为 ${nextCur}`
                : language === 'en'
                ? `Currency set to ${nextCur}`
                : `Mata uang diatur ke ${nextCur}`
            );
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
            <span>{t('deviceAndApp', language)}</span>
          </span>
          {isPwaInstalled && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-500" />
              <span>{t('installed', language)}</span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-0.5">
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-text-main dark:text-slate-100 leading-tight">
              {t('installAppPwa', language)}
            </h4>
            <p className="text-[10.5px] text-text-secondary dark:text-slate-400 mt-0.5 leading-snug">
              {t('pwaQuickAccess', language)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleInstallPWA}
            className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-primary dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-xs flex items-center gap-1.5 shadow-soft transition-all cursor-pointer flex-shrink-0 min-h-[38px] active:scale-95"
            title={t('installAppPwa', language)}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{t('installAppBtn', language)}</span>
          </button>
        </div>

        {isPwaDismissed && (
          <div className="pt-2 border-t border-gray-100 dark:border-slate-700/80 flex items-center justify-between text-[10.5px]">
            <span className="text-text-secondary dark:text-slate-400">
              {t('pwaBannerHidden', language)}
            </span>
            <button
              type="button"
              onClick={handleRestorePWABanner}
              className="text-primary dark:text-blue-400 font-bold hover:underline cursor-pointer"
            >
              {t('reactivate', language)}
            </button>
          </div>
        )}
      </div>

      {/* Card: BARU SAJA DIHAPUS (RECYCLE BIN 30 HARI - SETELAH PWA) */}
      <div className="bg-card dark:bg-slate-800/90 rounded-2xl p-4 border border-border dark:border-slate-700 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-black tracking-wider text-text-secondary dark:text-slate-400 uppercase flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5 text-danger dark:text-rose-400" />
            <span>{t('recentlyDeletedSection', language)}</span>
          </span>

          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-red-50 dark:bg-rose-950/70 border border-red-200/60 dark:border-rose-900/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span>{deletedTransactions.length} {language === 'zh' ? '张收据' : language === 'en' ? 'Receipts' : 'Struk'}</span>
          </span>
        </div>

        <p className="text-[11px] text-text-secondary dark:text-slate-400 leading-snug">
          {t('recycleBinNote', language)}
        </p>

        {deletedTransactions.length === 0 ? (
          <div className="bg-gray-50/80 dark:bg-slate-900/60 rounded-xl p-4 text-center border border-dashed border-gray-200 dark:border-slate-750">
            <p className="text-xs font-semibold text-text-secondary dark:text-slate-400">
              {t('noTrashItems', language)}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {deletedTransactions.map((tx) => {
              const txDate = new Date(tx.purchasedAt);
              const dateStr = txDate.toLocaleDateString(
                language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'id-ID',
                {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }
              );
              const timeStr = `${t('atTime', language)} ${txDate.toLocaleTimeString(
                language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'id-ID',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                }
              )}`;
              const daysRemaining = tx.deletedAt
                ? Math.max(1, 30 - Math.floor((Date.now() - new Date(tx.deletedAt).getTime()) / (1000 * 60 * 60 * 24)))
                : 30;

              return (
                <div
                  key={tx.id}
                  className="bg-white dark:bg-slate-900/90 rounded-2xl p-3.5 border border-gray-200 dark:border-slate-700/80 shadow-xs flex flex-col gap-2.5"
                >
                  {/* Top row: Tanggal & Waktu + Sisa Hari */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary dark:text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 flex-shrink-0" />
                      <span className="font-bold text-text-main dark:text-slate-200">{dateStr}</span>
                      <span className="text-[10.5px]">({timeStr})</span>
                    </div>

                    <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {t('daysRemaining', language, { days: daysRemaining })}
                    </span>
                  </div>

                  {/* Middle row: Toko Lokasi */}
                  <div className="text-[11px] font-bold text-primary dark:text-blue-400 uppercase tracking-tight flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">
                      {((tx.location && tx.location.trim()) ? tx.location.trim() : 'LOTTE MART GROCERY - PURI INDAH').toUpperCase()}
                    </span>
                  </div>

                  {/* Pricing row */}
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-gray-100 dark:border-slate-800">
                    <span className="text-[11px] text-text-secondary dark:text-slate-400 font-medium">
                      {tx.items?.length || 0} {language === 'zh' ? '种商品' : language === 'en' ? 'items' : 'jenis barang'}
                    </span>
                    <span className="font-extrabold text-sm text-text-main dark:text-slate-100">
                      {formatRupiah(tx.finalTotal)}
                    </span>
                  </div>

                  {/* Action buttons with warning modals */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setTxToRestore(tx)}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-primary dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-blue-200 dark:border-blue-900/60 min-h-[36px] active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t('restoreBtn', language)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTxToDeletePermanent(tx)}
                      className="py-2 px-3.5 rounded-xl text-danger dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/60 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-red-200 dark:border-rose-900/60 min-h-[36px] active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('permanentDeleteBtn', language)}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {deletedTransactions.length > 1 && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(language === 'zh' ? '确定要永久清空废纸篓中的所有收据吗？' : language === 'en' ? 'Permanently delete all receipts in the recycle bin?' : 'Hapus seluruh struk di tempat sampah secara permanen?')) {
                    const ids = deletedTransactions.map((t) => t.id);
                    await Promise.all(ids.map((id) => db.transactions.delete(id)));
                    syncService.notifyChange();
                    showToast(language === 'zh' ? '废纸篓已全部清空。' : language === 'en' ? 'All receipts in the trash have been cleared.' : 'Semua struk di tempat sampah telah dikosongkan.');
                  }
                }}
                className="w-full text-center text-[11px] font-bold text-danger dark:text-rose-400 hover:underline pt-1 cursor-pointer block"
              >
                {t('clearAllTrashBtn', language)}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Card 4: PENYIMPANAN & CACHE APLIKASI (Memberikan info kapasitas GB yang terpakai) */}
      <div className="bg-card dark:bg-slate-800/90 rounded-2xl p-3.5 border border-border dark:border-slate-700 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-wider text-text-secondary dark:text-slate-400 uppercase flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-primary dark:text-blue-400" />
            <span>{t('storageCacheTitle', language)}</span>
          </span>
        </div>

        {/* Storage Meter Display */}
        <div className="bg-gray-50/80 dark:bg-slate-900/60 rounded-xl p-3 border border-gray-100 dark:border-slate-750 space-y-2">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[10px] text-text-secondary dark:text-slate-400 font-semibold block">
                {t('storageUsedLabel', language)}
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
                {t('deviceQuota', language)}
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
            <span>{t('storageDbNote', language)}</span>
            <span className="font-semibold">{storageInfo.percent}% {language === 'zh' ? '已使用' : language === 'en' ? 'used' : 'terpakai'}</span>
          </div>
        </div>

        {/* Cache Cleaner Row */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-slate-700/80">
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-text-main dark:text-slate-100 leading-tight">
              {t('clearCacheReset', language)}
            </h4>
            <p className="text-[10px] text-text-secondary dark:text-slate-400 mt-0.5 line-clamp-1">
              {t('clearCacheDesc', language)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearCacheAndStorage}
            disabled={isClearingCache}
            className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-rose-900/60 bg-red-50/60 dark:bg-rose-950/40 hover:bg-red-100 dark:hover:bg-rose-900/60 active:scale-95 text-danger dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 disabled:opacity-50"
            title={t('clearCacheBtn', language)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isClearingCache ? t('clearing', language) : t('clearCacheBtn', language)}</span>
          </button>
        </div>
      </div>

      {/* 1 Bar Panjang Keluar Akun */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-3 px-4 rounded-xl border border-red-200 dark:border-rose-900/60 bg-red-50/70 dark:bg-rose-950/40 text-danger dark:text-rose-400 hover:bg-red-100 dark:hover:bg-rose-900/60 active:scale-98 font-bold text-xs shadow-soft flex items-center justify-center gap-2 transition-all min-h-[44px] cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('logoutBarBtn', language)}</span>
        </button>
      </div>
      </>
      )}

      {/* Modal Konfirmasi Peringatan Keluar */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-[350px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-modal animate-slide-up space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-red-100 dark:bg-rose-950/80 text-danger dark:text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-sm sm:text-base text-text-main dark:text-slate-100">
                  {t('logoutConfirmTitle', language)}
                </h3>
                <p className="text-xs text-text-secondary dark:text-slate-400 mt-1 leading-relaxed">
                  {t('logoutConfirmDesc', language)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 px-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-750 font-bold text-xs flex items-center justify-center transition-all cursor-pointer min-h-[42px]"
              >
                {t('cancelBtn', language)}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) {
                    onLogout();
                  }
                }}
                className="py-2.5 px-3 rounded-xl bg-danger hover:bg-red-700 active:scale-98 text-white font-extrabold text-xs shadow-soft flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[42px]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('yesLogoutBtn', language)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-[360px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-modal animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-text-main dark:text-slate-100">
                {language === 'zh' ? '在 iPhone / iPad 上安装' : language === 'en' ? 'Install on iPhone / iPad' : 'Pasang di iPhone / iPad'}
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
                {language === 'zh' ? '在 Safari 浏览器中点击 ' : language === 'en' ? 'Tap the ' : 'Ketuk tombol '}
                <strong className="text-primary dark:text-blue-400">Share / {language === 'zh' ? '分享' : 'Bagikan'}</strong>
                {language === 'zh' ? ' 按钮 (向上箭头图标)。' : language === 'en' ? ' button (box with upward arrow) in Safari.' : ' (ikon kotak panah atas) di Safari.'}
              </li>
              <li>
                {language === 'zh' ? '向下滚动并选择 ' : language === 'en' ? 'Scroll down and select ' : 'Gulir ke bawah dan pilih '}
                <strong className="text-text-main dark:text-slate-100">{language === 'zh' ? '添加到主屏幕 (Add to Home Screen)' : language === 'en' ? 'Add to Home Screen' : 'Tambahkan ke Layar Utama (Add to Home Screen)'}</strong>.
              </li>
              <li>
                {language === 'zh' ? '在右上角点击 ' : language === 'en' ? 'Tap ' : 'Ketuk '}
                <strong className="text-primary dark:text-blue-400">{language === 'zh' ? '添加 (Add)' : language === 'en' ? 'Add' : 'Tambah (Add)'}</strong>
                {language === 'zh' ? '。' : language === 'en' ? ' in the top right corner.' : ' di pojok kanan atas.'}
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-primary hover:bg-primary-hover active:scale-98 text-white font-bold py-2.5 rounded-xl text-xs min-h-[42px] cursor-pointer"
            >
              {language === 'zh' ? '我知道了' : language === 'en' ? 'Got it' : 'Mengerti'}
            </button>
          </div>
        </div>
      )}

      {/* Warning Modal: Konfirmasi Pulihkan Struk Belanja */}
      {txToRestore && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setTxToRestore(null)}
        >
          <div
            className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-modal animate-scale-up border dark:border-slate-800 space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
              <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/80 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-text-main dark:text-slate-100">
                  {t('restoreReceiptTitle', language)}
                </h3>
                <span className="text-[10px] text-text-secondary dark:text-slate-400 font-medium">
                  {t('restoreConfirmSub', language)}
                </span>
              </div>
            </div>

            <p className="text-xs text-text-secondary dark:text-slate-300 leading-relaxed">
              {t('restoreReceiptBody', language, {
                location: txToRestore.location || 'LOTTE MART GROCERY',
                amount: formatRupiah(txToRestore.finalTotal),
              })}
            </p>

            <div className="bg-blue-50/80 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/60 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-1.5 font-medium">
              <span className="flex-shrink-0">💡</span>
              <span>{t('restoreReceiptTip', language)}</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTxToRestore(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-gray-300 dark:border-slate-700 text-text-main dark:text-slate-200 font-bold text-xs hover:bg-gray-50 dark:hover:bg-slate-800 min-h-[42px] cursor-pointer"
              >
                {t('cancelBtn', language)}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = txToRestore;
                  setTxToRestore(null);
                  if (target) {
                    await db.transactions.update(target.id, {
                      isDeleted: false,
                      deletedAt: undefined,
                    });
                    syncService.notifyChange();
                    showToast(language === 'zh' ? '收据已成功恢复至历史记录！🎉' : language === 'en' ? 'Receipt successfully restored to History! 🎉' : 'Struk berhasil dipulihkan ke Riwayat! 🎉');
                  }
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold text-xs shadow-soft min-h-[42px] cursor-pointer"
              >
                {t('yesRestoreBtn', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal: Konfirmasi Hapus Struk Permanen */}
      {txToDeletePermanent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setTxToDeletePermanent(null)}
        >
          <div
            className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-modal animate-scale-up border border-rose-200 dark:border-rose-950 space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-danger dark:text-rose-400">
              <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-rose-950/80 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-text-main dark:text-slate-100">
                  {t('deletePermanentTitle', language)}
                </h3>
                <span className="text-[10px] text-danger dark:text-rose-400 font-bold">
                  {t('cannotUndo', language)}
                </span>
              </div>
            </div>

            <p className="text-xs text-text-secondary dark:text-slate-300 leading-relaxed">
              {t('deletePermanentBody', language, {
                location: txToDeletePermanent.location || 'LOTTE MART GROCERY',
                amount: formatRupiah(txToDeletePermanent.finalTotal),
              })}
            </p>

            <div className="bg-red-50/80 dark:bg-rose-950/40 p-2.5 rounded-xl border border-red-200/80 dark:border-rose-900/60 text-[11px] text-rose-800 dark:text-rose-300 flex items-start gap-1.5 font-semibold">
              <span className="flex-shrink-0">⚠️</span>
              <span>{t('deletePermanentWarning', language)}</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTxToDeletePermanent(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-gray-300 dark:border-slate-700 text-text-main dark:text-slate-200 font-bold text-xs hover:bg-gray-50 dark:hover:bg-slate-800 min-h-[42px] cursor-pointer"
              >
                {t('cancelBtn', language)}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = txToDeletePermanent;
                  setTxToDeletePermanent(null);
                  if (target) {
                    await db.transactions.delete(target.id);
                    syncService.notifyChange();
                    showToast(language === 'zh' ? '收据已永久删除。' : language === 'en' ? 'Receipt has been permanently deleted.' : 'Struk telah dihapus permanen.');
                  }
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-danger hover:bg-red-700 active:scale-95 text-white font-bold text-xs shadow-soft min-h-[42px] cursor-pointer"
              >
                {t('deletePermanentBtn', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

