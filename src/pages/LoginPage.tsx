import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sun,
  Moon,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';
import { useStore } from '../store/useStore';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const {
    userProfile,
    themeMode,
    toggleThemeMode,
    selectedPaymentMethod,
    updateUserProfile,
  } = useStore();

  const [activeAuthTab, setActiveAuthTab] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState(userProfile.email || 'naomi@mutiarabangsa.sch.id');
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [fullNameInput, setFullNameInput] = useState(userProfile.fullName || 'naomi miracle');
  const [usernameInput, setUsernameInput] = useState(userProfile.username || 'naomiiracle');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isDark = themeMode === 'dark';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleQuickDeviceLogin = () => {
    setIsLoading(true);
    showToast(`Masuk sebagai ${userProfile.fullName}...`);
    setTimeout(() => {
      updateUserProfile({
        loginTime: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      });
      setIsLoading(false);
      onLogin();
    }, 450);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    showToast('Menghubungkan akun Google naomi miracle...');
    setTimeout(() => {
      updateUserProfile({
        isGoogleLinked: true,
        loginTime: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      });
      setIsLoading(false);
      onLogin();
    }, 450);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      showToast('Harap masukkan alamat email.');
      return;
    }
    if (!passwordInput.trim()) {
      showToast('Harap masukkan kata sandi akun.');
      return;
    }

    setIsLoading(true);
    if (activeAuthTab === 'signup') {
      updateUserProfile({
        fullName: fullNameInput.trim() || 'naomi miracle',
        username: usernameInput.trim() || 'naomiiracle',
        email: emailInput.trim(),
      });
      showToast('Akun berhasil didaftarkan! Masuk ke aplikasi...');
    } else {
      showToast('Otentikasi berhasil! Menyiapkan dashboard...');
    }

    setTimeout(() => {
      updateUserProfile({
        loginTime: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      });
      setIsLoading(false);
      onLogin();
    }, 450);
  };

  const handleGuestLogin = () => {
    showToast('Masuk dalam Mode Tamu / Demo Offline...');
    setTimeout(() => {
      onLogin();
    }, 300);
  };

  return (
    <div
      className={`min-h-screen relative flex justify-center items-start sm:py-6 bg-cover bg-center bg-no-repeat transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-100 text-gray-900'
      }`}
      style={{
        backgroundImage: isDark
          ? `linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.94) 100%), url('/supermarket_bg.jpg')`
          : `linear-gradient(135deg, rgba(238, 242, 255, 0.92) 0%, rgba(240, 253, 250, 0.88) 100%), url('/supermarket_bg.jpg')`,
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 z-50 bg-gray-900/90 dark:bg-slate-800/95 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-white/20 animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Viewport Container (Smartphone Max Width 430px) */}
      <main className="w-full max-w-[430px] min-h-[100dvh] sm:min-h-[auto] sm:max-h-[920px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-text-main dark:text-dark-text flex flex-col relative shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] dark:shadow-dark-float sm:rounded-[36px] overflow-hidden border border-white/60 dark:border-slate-800 transition-colors duration-200">
        
        {/* Top Header Bar */}
        <header className="px-5 pt-4 pb-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 text-white shadow-md relative overflow-hidden flex items-center justify-between border-b dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-indigo-500 p-0.5 shadow-md flex-shrink-0 relative group">
              <div className="w-full h-full bg-white/95 dark:bg-slate-900 rounded-[14px] overflow-hidden flex items-center justify-center">
                <img
                  src="/capybara_logo.png"
                  alt="Capybara Smart Grocery"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/capybara_mascot.svg';
                  }}
                />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs">
                <Sparkles className="w-2 h-2 text-white fill-white" />
              </span>
            </div>

            <div>
              <h1 className="font-black text-sm tracking-tight text-white leading-tight flex items-center gap-1 whitespace-nowrap">
                <span>Smart Grocery</span>
              </h1>
              <p className="text-[10px] text-amber-200 font-extrabold tracking-tight drop-shadow-xs whitespace-nowrap">
                Belanja Santai, Anti Boncos!
              </p>
            </div>
          </div>

          {/* Theme Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleThemeMode}
            className="bg-white/20 hover:bg-white/30 dark:bg-slate-800/80 dark:hover:bg-slate-800 active:scale-95 text-white font-bold p-2 rounded-xl backdrop-blur-sm transition-all shadow-sm min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            title={isDark ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
            aria-label={isDark ? 'Mode Terang' : 'Mode Gelap'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-100" />}
          </button>
        </header>

        {/* Scrollable Form Body */}
        <div className="flex-1 px-5 py-4 overflow-y-auto space-y-4">
          
          {/* Hero Welcome Banner */}
          <div className="text-center pt-1 pb-1 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Amankan Saldo &amp; Belanja Hemat Terkendali</span>
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
              Selamat Datang di Smart Grocery!
            </h2>
            <p className="text-xs text-text-secondary dark:text-slate-400">
              Pengendali anggaran belanja bulanan mahasiswa dengan Budget Safety Cap.
            </p>
          </div>

          {/* Segmented Tabs: Masuk / Daftar Akun */}
          <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl border border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveAuthTab('signin')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeAuthTab === 'signin'
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => setActiveAuthTab('signup')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeAuthTab === 'signup'
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              Daftar Akun
            </button>
          </div>

          {/* 1-Click Saved Device Account Card (Model Akun Di Perangkat Ini) */}
          <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-slate-800/90 dark:to-blue-950/40 rounded-card p-3.5 border border-blue-200/80 dark:border-blue-900/50 shadow-soft space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-blue-700 dark:text-blue-300 uppercase">
                Akun di Perangkat Ini
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 dark:text-blue-300 bg-white dark:bg-blue-900/80 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700 shadow-2xs">
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </span>
            </div>

            <div className="flex items-center gap-3 bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-slate-700">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0 relative overflow-hidden">
                {userProfile.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{(userProfile.fullName || 'naomi miracle')[0].toUpperCase()}</span>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-xs text-gray-900 dark:text-slate-100 leading-tight">
                  {userProfile.fullName || 'naomi miracle'}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                  {userProfile.email || 'naomi@mutiarabangsa.sch.id'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-bold text-primary dark:text-blue-300">
                    @{userProfile.username || 'naomiiracle'}
                  </span>
                  <span className="text-[9px] text-gray-400">•</span>
                  <span className="text-[9px] text-gray-600 dark:text-slate-400 flex items-center gap-0.5">
                    <CreditCard className="w-2.5 h-2.5 text-blue-600" />
                    <span>{selectedPaymentMethod}</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickDeviceLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[40px]"
            >
              <span>Masuk sebagai {userProfile.fullName || 'naomi miracle'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 px-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-750 text-gray-800 dark:text-slate-100 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer min-h-[42px]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Masuk Cepat dengan Google</span>
          </button>

          {/* Form Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              atau email sandi
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmitForm} className="space-y-3">
            {activeAuthTab === 'signup' && (
              <div className="space-y-3 animate-slide-up">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Naomi Miracle"
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary min-h-[42px]"
                    />
                    <User className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">@</span>
                    <input
                      type="text"
                      placeholder="naomiiracle"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary min-h-[42px]"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                Email Pengguna
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary min-h-[42px]"
                  required
                />
                <Mail className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary min-h-[42px]"
                  required
                />
                <Lock className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="text-gray-600 dark:text-slate-400 text-[11px] font-medium">Ingat Saya</span>
              </label>

              <button
                type="button"
                onClick={() => showToast('Gunakan akun naomi miracle atau mode tamu.')}
                className="text-[11px] text-primary dark:text-blue-400 font-bold hover:underline"
              >
                Lupa Sandi?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-primary to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-extrabold text-xs shadow-soft transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {isLoading
                  ? 'Memproses...'
                  : activeAuthTab === 'signin'
                  ? 'Masuk ke Dashboard Belanja'
                  : 'Buat Akun & Mulai Belanja'}
              </span>
            </button>
          </form>

          {/* Guest / Demo Option */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleGuestLogin}
              className="text-xs text-text-secondary dark:text-slate-400 font-bold hover:text-primary dark:hover:text-blue-300 underline decoration-dotted transition-colors cursor-pointer"
            >
              Lanjutkan sebagai Mode Tamu / Demo Offline &gt;
            </button>
          </div>

          {/* Bottom Security Note */}
          <div className="pt-2 text-center text-[10px] text-gray-400 dark:text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>Data tersimpan aman di browser (IndexedDB Dexie) &amp; Cloud Sync</span>
          </div>
        </div>
      </main>
    </div>
  );
};
