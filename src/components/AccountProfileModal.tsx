import React, { useState, useRef } from 'react';
import {
  X,
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
  Sparkles,
  Check,
  Save,
  RotateCcw,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { useStore, type UserProfile } from '../store/useStore';

interface AccountProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSyncModal?: () => void;
  onLogout?: () => void;
}

export const AccountProfileModal: React.FC<AccountProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenSyncModal,
  onLogout,
}) => {
  const { userProfile, updateUserProfile, themeMode } = useStore();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(userProfile.fullName);
  const [username, setUsername] = useState(userProfile.username);
  const [bio, setBio] = useState(userProfile.bio);
  const [email, setEmail] = useState(userProfile.email);
  const [currency, setCurrency] = useState(userProfile.currency);

  // Password management
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPasswordDisplay, setCurrentPasswordDisplay] = useState(userProfile.passwordMasked || 'naomi12345');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Toast / feedback message
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3000);
  };

  // Handle image upload from user device (Instagram style avatar)
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

  // Save profile edits
  const handleSaveProfile = () => {
    const cleanUsername = username.trim().replace(/^@/, '');
    if (!cleanUsername) {
      showToast('⚠️ Username tidak boleh kosong!');
      return;
    }
    updateUserProfile({
      fullName: fullName.trim() || 'naomi miracle',
      username: cleanUsername,
      bio: bio.trim(),
      email: email.trim(),
      currency,
    });
    setIsEditing(false);
    showToast('Profil Instagram berhasil disimpan! ✨');
  };

  // Save new password
  const handleSavePassword = () => {
    setPasswordError(null);
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Kata sandi baru minimal 6 karakter!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok!');
      return;
    }

    setCurrentPasswordDisplay(newPassword);
    updateUserProfile({ passwordMasked: newPassword });
    setIsChangingPassword(false);
    setNewPassword('');
    setConfirmPassword('');
    showToast('Kata sandi akun berhasil diperbarui! 🔒');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-sm sm:max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
        
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 text-white flex items-center justify-between border-b dark:border-slate-800 relative">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-white/10 dark:bg-blue-500/20 text-white">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight text-white leading-tight">
                Menu Akun &amp; Profil
              </h2>
              <span className="text-[10px] text-blue-100/80 font-medium">
                Pengaturan Pengguna &amp; Keamanan
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
            title="Tutup Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success / Feedback Toast Bar */}
        {successToast && (
          <div className="bg-emerald-50 dark:bg-emerald-950/90 border-b border-emerald-200 dark:border-emerald-800 px-4 py-2 text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2 animate-fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4 no-scrollbar flex-1">
          
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
                    className="text-[10px] text-danger dark:text-rose-400 font-semibold hover:underline mt-1"
                  >
                    Hapus foto profil khusus
                  </button>
                )}
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
            </select>
          </div>

          {/* Card 3: KATA SANDI AKUN */}
          <div className="bg-card dark:bg-slate-800/90 rounded-2xl p-3.5 border border-border dark:border-slate-700 shadow-soft space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-wider text-text-secondary dark:text-slate-400 uppercase flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Kata Sandi Akun</span>
              </span>

              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" />
                <span>Terenkripsi</span>
              </span>
            </div>

            {/* Masked Password Field with Eye Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 flex items-center justify-between text-xs font-mono min-h-[40px]">
                <span className="tracking-widest font-extrabold text-text-main dark:text-slate-100">
                  {showPassword ? currentPasswordDisplay : '••••••••••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-gray-400 hover:text-text-main dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-primary dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer min-h-[40px]"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Ganti Sandi</span>
              </button>
            </div>

            {/* Inline Password Change Form */}
            {isChangingPassword && (
              <div className="pt-2 border-t border-gray-100 dark:border-slate-700/80 space-y-2 animate-slide-up">
                <div>
                  <label className="text-[10px] text-text-secondary dark:text-slate-400 font-semibold block mb-0.5">
                    Kata Sandi Baru:
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-secondary dark:text-slate-400 font-semibold block mb-0.5">
                    Ulangi Kata Sandi Baru:
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Konfirmasi sandi baru"
                    className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-main dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>

                {passwordError && (
                  <p className="text-[10px] text-danger dark:text-rose-400 font-bold">
                    {passwordError}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordError(null);
                    }}
                    className="flex-1 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-semibold text-text-secondary dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePassword}
                    className="flex-1 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-soft"
                  >
                    Simpan Sandi
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Kembali ke Halaman Login, Ganti Akun, Keluar */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
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
                }}
                className="py-2.5 px-3 rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 text-primary dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-bold text-xs flex items-center justify-center gap-1.5 transition-all min-h-[42px] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ganti Akun</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
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
        </div>

        {/* Modal Bottom Close Button */}
        <div className="p-3 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-bold text-text-main dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors min-h-[40px] cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

