import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  ShoppingBag,
  Volume2,
  VolumeX,
  Languages,
  X,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { t, getLanguageDisplayName } from '../utils/i18n';
import { soundService } from '../utils/sound';
import { LanguageSelectorModal } from '../components/LanguageSelectorModal';
import { authService, getLocalAccounts } from '../services/authService';
import { pwaService } from '../utils/pwa';
import { syncService } from '../services/syncService';
import { SplashScreen } from '../components/SplashScreen';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const {
    userProfile,
    themeMode,
    toggleThemeMode,
    isSoundEnabled,
    toggleSound,
    language,
    setLanguage,
    updateUserProfile,
    setActiveTab,
  } = useStore();

  const [activeAuthTab, setActiveAuthTab] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullNameInput, setFullNameInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const justLoggedOut = sessionStorage.getItem('sg_just_logged_out');
      if (justLoggedOut) {
        sessionStorage.removeItem('sg_just_logged_out');
        return false;
      }
    }
    return true;
  });



  const isDark = themeMode === 'dark';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Tangani Keberhasilan Autentikasi Akun Google Asli (baik via Popup maupun Redirect)
  const handleGoogleSuccess = async (googleUser: any) => {
    setIsLoading(true);
    try {
      const email = googleUser.email?.trim().toLowerCase() || '';
      const fullName = googleUser.displayName || email.split('@')[0] || 'Pengguna Google';
      const username = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      const avatarUrl = googleUser.photoURL || '';

      let account = await authService.findAccount(email);
      if (!account) {
        account = await authService.registerAccount({
          fullName,
          username,
          email,
          password: `google_${googleUser.uid}`,
          avatarUrl,
          isGoogleLinked: true,
        });
      } else {
        if (!account.isGoogleLinked || (avatarUrl && !account.avatarUrl)) {
          account.isGoogleLinked = true;
          if (avatarUrl && !account.avatarUrl) account.avatarUrl = avatarUrl;
          await authService.saveAccountToFirestore(account);
        }
      }

      updateUserProfile({
        fullName: account.fullName || fullName,
        username: account.username || username,
        email: account.email || email,
        avatarUrl: account.avatarUrl || avatarUrl || userProfile.avatarUrl,
        passwordMasked: account.password,
        isGoogleLinked: true,
        loginTime:
          new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }) +
          ', ' +
          new Date().toLocaleTimeString(language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }) +
          ' WIB',
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('sg_password', account.password);
        localStorage.setItem('sg_fullName', account.fullName || fullName);
        localStorage.setItem('sg_username', account.username || username);
        localStorage.setItem('sg_email', account.email || email);
        localStorage.setItem('smart_grocery_authenticated', 'true');
      }

      if (account.isPwaDismissed) {
        pwaService.setDismissed(true);
        updateUserProfile({ isPwaDismissed: true });
      }
      syncService.reconnect();

      setIsLoading(false);
      showToast(t('signInSuccess', language, { name: account.fullName || fullName }));

      setTimeout(() => {
        setActiveTab('shopping');
        onLogin();
      }, 350);
    } catch (err: any) {
      console.error('Google Auth Success error:', err);
      setIsLoading(false);
      showToast(t('googleConnectionFailed', language));
    }
  };

  // Tangani hasil Redirect OAuth Google saat kembali dari proses login Google
  useEffect(() => {
    let isMounted = true;
    const checkRedirect = async () => {
      try {
        const redirectUser = await authService.checkRedirectResult();
        if (redirectUser && redirectUser.email && isMounted) {
          await handleGoogleSuccess(redirectUser);
        }
      } catch (err: any) {
        console.warn('OAuth redirect check error:', err);
      }
    };

    checkRedirect();
    return () => {
      isMounted = false;
    };
  }, []);

  // Realtime check for local duplicates in signup mode
  const cleanUsername = usernameInput.trim().replace(/^@/, '').toLowerCase();
  const registeredAccounts = getLocalAccounts();
  const isUsernameTaken =
    activeAuthTab === 'signup' &&
    cleanUsername.length >= 3 &&
    registeredAccounts.some((acc) => acc.username.toLowerCase() === cleanUsername);

  const cleanEmail = emailInput.trim().toLowerCase();
  const isEmailTaken =
    activeAuthTab === 'signup' &&
    cleanEmail.length > 3 &&
    registeredAccounts.some((acc) => acc.email.toLowerCase() === cleanEmail);

  // Jalankan alur Google OAuth Asli (Popup untuk desktop, Redirect untuk mobile iOS/Safari)
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await authService.initiateGoogleAuth();
      if (result.mode === 'popup' && result.user) {
        await handleGoogleSuccess(result.user);
      }
    } catch (err: any) {
      setIsLoading(false);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        showToast(
          language === 'zh'
            ? '已取消 Google 登录。'
            : language === 'en'
            ? 'Google sign-in was canceled.'
            : 'Koneksi Google batal atau ditutup. Silakan coba lagi.'
        );
      } else {
        showToast(
          language === 'zh'
            ? 'Google 登录失败，请重试。'
            : language === 'en'
            ? 'Google sign-in failed. Please try again.'
            : 'Koneksi Google gagal. Silakan coba lagi.'
        );
      }
    }
  };
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeAuthTab === 'signup') {
      const cleanFullName = fullNameInput.trim();
      if (!cleanFullName || cleanFullName.length < 3) {
        showToast(t('minFullName', language));
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        showToast(t('invalidEmail', language));
        return;
      }

      if (!cleanUsername || cleanUsername.length < 3) {
        showToast(t('minUsername', language));
        return;
      }

      if (!passwordInput.trim() || passwordInput.trim().length < 6) {
        showToast(t('minPassword', language));
        return;
      }

      setIsLoading(true);
      try {
        await authService.registerAccount({
          fullName: cleanFullName,
          username: cleanUsername,
          email: cleanEmail,
          password: passwordInput.trim(),
        });

        soundService.pop();
        setIsLoading(false);
        // Reset form & alihkan ke Sign In tanpa auto-login (wajib login ulang)
        setActiveAuthTab('signin');
        setEmailInput(cleanEmail);
        setPasswordInput('');
        showToast(t('registeredSuccessRedirect', language));
      } catch (err: any) {
        setIsLoading(false);
        if (err?.message === 'EMAIL_EXISTS') {
          showToast(t('emailTaken', language));
        } else if (err?.message === 'USERNAME_EXISTS') {
          showToast(t('usernameTaken', language));
        } else if (err?.message === 'WEAK_PASSWORD') {
          showToast(t('minPassword', language));
        } else {
          showToast('Pendaftaran gagal. Silakan coba lagi.');
        }
      }
    } else {
      // SIGN IN (MASUK)
      const inputQuery = emailInput.trim();
      if (!inputQuery) {
        showToast(t('fillEmailUser', language));
        return;
      }
      if (!passwordInput.trim()) {
        showToast(t('fillPassword', language));
        return;
      }

      setIsLoading(true);
      try {
        const account = await authService.loginWithCredentials(inputQuery, passwordInput);

        updateUserProfile({
          fullName: account.fullName,
          username: account.username,
          email: account.email,
          avatarUrl: account.avatarUrl || userProfile.avatarUrl,
          passwordMasked: account.password,
          isGoogleLinked: !!account.isGoogleLinked,
          loginTime:
            new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }) +
            ', ' +
            new Date().toLocaleTimeString(language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            }) +
            ' WIB',
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem('sg_password', account.password);
          localStorage.setItem('sg_fullName', account.fullName);
          localStorage.setItem('sg_username', account.username);
          localStorage.setItem('sg_email', account.email);
        }

        if (account.isPwaDismissed) {
          pwaService.setDismissed(true);
          updateUserProfile({ isPwaDismissed: true });
        }
        syncService.reconnect();

        showToast(t('signInSuccess', language, { name: account.fullName }));

        setTimeout(() => {
          setActiveTab('shopping');
          setIsLoading(false);
          onLogin();
        }, 400);
      } catch (err: any) {
        setIsLoading(false);
        if (err?.message === 'ACCOUNT_NOT_FOUND') {
          showToast(t('accountNotFound', language));
          // Arahkan pengguna baru untuk membuat akun terlebih dahulu
          setActiveAuthTab('signup');
          if (inputQuery.includes('@')) {
            setEmailInput(inputQuery);
          } else {
            setUsernameInput(inputQuery.replace(/^@/, ''));
          }
        } else if (err?.message === 'WRONG_PASSWORD') {
          showToast(t('wrongPassword', language));
        } else {
          showToast('Gagal masuk. Periksa kembali email & kata sandi.');
        }
      }
    }
  };

  return (
    <div
      className={`min-h-dvh w-full overflow-y-auto relative flex justify-center items-center p-3 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-[calc(1.25rem+env(safe-area-inset-top,0px))] bg-cover bg-center bg-no-repeat transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-100 text-gray-900'
      }`}
      style={{
        backgroundImage: isDark
          ? `linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(30, 41, 59, 0.92) 100%), url('/supermarket_bg.jpg')`
          : `linear-gradient(135deg, rgba(238, 242, 255, 0.88) 0%, rgba(240, 253, 250, 0.82) 100%), url('/supermarket_bg.jpg')`,
      }}
    >
      {/* Pure Fullscreen Background Layer behind the card (identik dengan tampilan laptop, aman & bersih di mobile Safari iOS) */}
      <div
        className="fixed inset-0 w-full h-full z-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-colors duration-300"
        style={{
          backgroundImage: isDark
            ? `linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(30, 41, 59, 0.92) 100%), url('/supermarket_bg.jpg')`
            : `linear-gradient(135deg, rgba(238, 242, 255, 0.88) 0%, rgba(240, 253, 250, 0.82) 100%), url('/supermarket_bg.jpg')`,
        }}
      />

      {/* Splash Screen Singkat (~1-2 detik) dengan Fade In & Fade Out Halus */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 z-50 bg-gray-900/95 dark:bg-slate-800/95 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-white/20 animate-fade-in flex items-center gap-2 max-w-[90%] text-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Viewport Card - Vertically Centered on Mobile & Laptop like ICT Codehub */}
      <main className="w-full max-w-[420px] max-h-[92dvh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-text-main dark:text-dark-text flex flex-col relative z-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] dark:shadow-dark-float rounded-3xl sm:rounded-[36px] overflow-hidden border border-white/60 dark:border-slate-800 transition-colors duration-200 my-auto">
        
        {/* Top Header Bar dengan Suara, Tema, Logo Center, dan Bahasa di Kanan */}
        <header className="px-4 sm:px-5 pt-3.5 pb-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 text-white shadow-md relative overflow-hidden flex items-center justify-between border-b dark:border-slate-800 flex-shrink-0">
          {/* Sebelah Kiri: 2 Tombol (Sound & Dark/Light Mode) */}
          <div className="flex items-center gap-1.5 z-10">
            {/* Fitur Suara */}
            <button
              type="button"
              onClick={toggleSound}
              className="bg-white/20 hover:bg-white/30 dark:bg-slate-800/80 dark:hover:bg-slate-800 active:scale-95 text-white font-bold p-2 rounded-xl backdrop-blur-sm transition-all shadow-sm min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              title={isSoundEnabled ? t('soundMute', language) : t('soundOn', language)}
              aria-label={isSoundEnabled ? 'Suara Aktif' : 'Suara Bisu'}
            >
              {isSoundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-300" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-300 opacity-60" />
              )}
            </button>

            {/* Dark Mode / Light Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleThemeMode}
              className="bg-white/20 hover:bg-white/30 dark:bg-slate-800/80 dark:hover:bg-slate-800 active:scale-95 text-white font-bold p-2 rounded-xl backdrop-blur-sm transition-all shadow-sm min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              title={isDark ? t('themeLight', language) : t('themeDark', language)}
              aria-label={isDark ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-100" />}
            </button>
          </div>

          {/* Logo Maskot Capybara - Absolute Centered */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-indigo-500 p-0.5 shadow-lg flex-shrink-0 relative group pointer-events-auto">
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
            </div>
          </div>

          {/* Sebelah Kanan: Tombol Bahasa */}
          <div className="flex items-center z-10">
            <button
              type="button"
              onClick={() => setIsLangModalOpen(true)}
              className="bg-white/20 hover:bg-white/30 dark:bg-slate-800/80 dark:hover:bg-slate-800 active:scale-95 text-white font-black text-xs px-2.5 py-1.5 rounded-xl backdrop-blur-sm transition-all shadow-sm min-h-[36px] flex items-center gap-1.5 cursor-pointer text-blue-100"
              title={t('langLabel', language)}
            >
              <Languages className="w-3.5 h-3.5 text-blue-100 flex-shrink-0" />
              <span>{getLanguageDisplayName(language)}</span>
            </button>
          </div>
        </header>

        {/* Modal Pemilihan & Konfirmasi Bahasa */}
        <LanguageSelectorModal
          isOpen={isLangModalOpen}
          onClose={() => setIsLangModalOpen(false)}
          currentLanguage={language}
          onConfirmLanguage={(newLang) => {
            setLanguage(newLang);
            showToast(
              t('langChangedToast', newLang, {
                lang: getLanguageDisplayName(newLang),
              })
            );
          }}
        />

        {/* Form Body - Terpusat di Tengah Layar (Vertically Centered) */}
        <div className="flex-1 px-5 py-4 overflow-y-auto flex flex-col justify-center space-y-3 my-auto">
          <div className="space-y-3 my-auto">
            {/* Title Header */}
            <div className="text-center pt-0.5 pb-0.5">
              <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">
                {activeAuthTab === 'signin' ? 'Smart Grocery' : t('registerTitle', language)}
              </h2>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleSubmitForm} className="space-y-2.5">
              {activeAuthTab === 'signup' ? (
                /* Mode Daftar Akun (Nama Lengkap, Email, Password & Username) */
                <div className="space-y-2.5 animate-slide-up">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-0.5 tracking-wider uppercase">
                      {t('fullName', language)}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Naomi Miracle"
                        value={fullNameInput}
                        onChange={(e) => setFullNameInput(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary min-h-[40px]"
                        required
                      />
                      <User className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-0.5 tracking-wider uppercase">
                      {t('email', language)}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="naomi@mutiarabangsa.sch.id"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className={`w-full pl-9 pr-8 py-2 rounded-xl border text-xs font-semibold outline-none transition-all min-h-[40px] ${
                          isEmailTaken
                            ? 'border-red-500 bg-red-50/60 dark:bg-red-950/20 text-red-700 dark:text-red-300 focus:ring-2 focus:ring-red-400'
                            : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary'
                        }`}
                        required
                      />
                      <Mail className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      {isEmailTaken && (
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300">
                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      )}
                    </div>
                    {isEmailTaken && (
                      <span className="text-[10.5px] font-bold text-red-500 block mt-0.5">
                        ✕ {t('emailTaken', language)}
                      </span>
                    )}
                  </div>

                  {/* Password & Username */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-0.5 tracking-wider uppercase">
                        {t('password', language)}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          className="w-full pl-8 pr-7 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary min-h-[40px]"
                          required
                        />
                        <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-0.5 tracking-wider uppercase">
                        {t('username', language)}
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">@</span>
                        <input
                          type="text"
                          placeholder="naomiiracle"
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          className={`w-full pl-7 pr-8 py-2 rounded-xl border text-xs font-semibold outline-none transition-all min-h-[40px] ${
                            isUsernameTaken
                              ? 'border-red-500 bg-red-50/60 dark:bg-red-950/20 text-red-700 dark:text-red-300 focus:ring-2 focus:ring-red-400'
                              : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary'
                          }`}
                          required
                        />
                        {isUsernameTaken && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300">
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        )}
                      </div>
                      {isUsernameTaken && (
                        <span className="text-[10.5px] font-bold text-red-500 block mt-0.5">
                          ✕ {t('usernameTaken', language)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Mode Masuk (Sign In) */
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-0.5 tracking-wider uppercase">
                      {t('emailOrUsername', language)}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="naomi@mutiarabangsa.sch.id / @naomiiracle"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary min-h-[40px]"
                        required
                      />
                      <Mail className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 tracking-wider uppercase">
                        {t('password', language)}
                      </label>
                      <button
                        type="button"
                        onClick={() => showToast('Gunakan akun naomi miracle atau daftar akun baru.')}
                        className="text-[11px] text-text-secondary hover:text-primary dark:text-slate-400 dark:hover:text-blue-400 font-medium cursor-pointer"
                      >
                        {t('forgotPassword', language)}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary min-h-[40px]"
                        required
                      />
                      <Lock className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span className="text-gray-600 dark:text-slate-400 text-[11px] font-medium">
                        {t('rememberMe', language)}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Teks Switch Sign In / Sign Up */}
              <div className="text-center text-xs text-text-secondary dark:text-slate-400 pt-0.5">
                {activeAuthTab === 'signin' ? (
                  <span>
                    {t('noAccount', language)}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAuthTab('signup');
                        soundService.pop();
                      }}
                      className="font-bold text-primary dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {t('createNow', language)}
                    </button>
                  </span>
                ) : (
                  <span>
                    {t('haveAccount', language)}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAuthTab('signin');
                        soundService.pop();
                      }}
                      className="font-bold text-primary dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {t('signInNow', language)}
                    </button>
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-primary to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-extrabold text-xs sm:text-sm shadow-soft transition-all flex items-center justify-center gap-2 min-h-[42px] cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {isLoading
                    ? t('processing', language)
                    : activeAuthTab === 'signin'
                    ? t('signInBtn', language)
                    : t('registerBtn', language)}
                </span>
              </button>
            </form>

            {/* Form Divider OR */}
            <div className="flex items-center gap-3 pt-0.5">
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                {t('orDivider', language)}
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
            </div>

            {/* Tombol Lanjutkan dengan Google (Membuka Pop-Up Akun Google Asli Sesuai Screenshot) */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-750 text-gray-800 dark:text-slate-100 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer min-h-[42px] active:scale-98"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
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
              <span>{t('continueGoogle', language)}</span>
            </button>
          </div>

          {/* Footer Branding */}
          <footer className="pt-2 pb-1 text-center text-xs text-gray-400 dark:text-slate-500">
            <p className="font-semibold text-text-secondary dark:text-slate-400 text-xs">
              {t('footerBy', language)}
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};
