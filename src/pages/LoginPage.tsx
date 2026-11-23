import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  Sun,
  Moon,
  ShoppingBag,
  Volume2,
  VolumeX,
  Languages,
  X,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { t, type AppLanguage, getLanguageDisplayName } from '../utils/i18n';
import { soundService } from '../utils/sound';
import { LanguageSelectorModal } from '../components/LanguageSelectorModal';

interface LoginPageProps {
  onLogin: () => void;
}

interface RegisteredAccount {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

const getRegisteredAccounts = (): RegisteredAccount[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('sg_registered_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  // Initial seeded account: Naomi Miracle
  const defaultAcc: RegisteredAccount = {
    fullName: localStorage.getItem('sg_fullName') || 'Naomi Miracle',
    username: (localStorage.getItem('sg_username') || 'naomiiracle').replace(/^@/, ''),
    email: (localStorage.getItem('sg_email') || 'naomi@mutiarabangsa.sch.id').toLowerCase(),
    password: localStorage.getItem('sg_password') || 'naomi12345',
  };
  localStorage.setItem('sg_registered_users', JSON.stringify([defaultAcc]));
  return [defaultAcc];
};

const saveRegisteredAccounts = (accs: RegisteredAccount[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sg_registered_users', JSON.stringify(accs));
  }
};

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

  const isDark = themeMode === 'dark';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Realtime check for duplicates in signup mode
  const cleanUsername = usernameInput.trim().replace(/^@/, '').toLowerCase();
  const registeredAccounts = getRegisteredAccounts();
  const isUsernameTaken =
    activeAuthTab === 'signup' &&
    cleanUsername.length >= 3 &&
    registeredAccounts.some((acc) => acc.username.toLowerCase() === cleanUsername);

  const cleanEmail = emailInput.trim().toLowerCase();
  const isEmailTaken =
    activeAuthTab === 'signup' &&
    cleanEmail.length > 3 &&
    registeredAccounts.some((acc) => acc.email.toLowerCase() === cleanEmail);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    showToast(t('googleConnecting', language));
    setTimeout(() => {
      updateUserProfile({
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
      setActiveTab('shopping');
      setIsLoading(false);
      onLogin();
    }, 450);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const accounts = getRegisteredAccounts();

    if (activeAuthTab === 'signup') {
      // Validate full name
      const cleanFullName = fullNameInput.trim();
      if (!cleanFullName || cleanFullName.length < 3) {
        showToast(t('minFullName', language));
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        showToast(t('invalidEmail', language));
        return;
      }

      // Validate username
      if (!cleanUsername || cleanUsername.length < 3) {
        showToast(t('minUsername', language));
        return;
      }

      // Duplicate validations
      if (isEmailTaken) {
        showToast(t('emailTaken', language));
        return;
      }

      if (isUsernameTaken) {
        showToast(t('usernameTaken', language));
        return;
      }

      // Validate password
      if (!passwordInput.trim() || passwordInput.trim().length < 6) {
        showToast(t('minPassword', language));
        return;
      }

      setIsLoading(true);

      const newAccount: RegisteredAccount = {
        fullName: cleanFullName,
        username: cleanUsername,
        email: cleanEmail,
        password: passwordInput.trim(),
      };

      accounts.push(newAccount);
      saveRegisteredAccounts(accounts);

      soundService.pop();

      // Reset form & redirect back to Sign In tab without auto-logging in
      setTimeout(() => {
        setIsLoading(false);
        setActiveAuthTab('signin');
        setEmailInput(newAccount.username);
        setPasswordInput('');
        showToast(t('registeredSuccessRedirect', language));
      }, 350);
    } else {
      // SIGN IN (MASUK) - Harus akun yang sudah terdaftar
      const inputQuery = emailInput.trim().toLowerCase();
      if (!inputQuery) {
        showToast(t('fillEmailUser', language));
        return;
      }
      if (!passwordInput.trim()) {
        showToast(t('fillPassword', language));
        return;
      }

      setIsLoading(true);

      const matchedAccount = accounts.find(
        (acc) =>
          acc.email.toLowerCase() === inputQuery ||
          acc.username.toLowerCase() === inputQuery.replace(/^@/, '')
      );

      if (!matchedAccount) {
        setIsLoading(false);
        showToast(t('accountNotFound', language));
        return;
      }

      if (passwordInput.trim() !== matchedAccount.password) {
        setIsLoading(false);
        showToast(t('wrongPassword', language));
        return;
      }

      updateUserProfile({
        fullName: matchedAccount.fullName,
        username: matchedAccount.username,
        email: matchedAccount.email,
        passwordMasked: matchedAccount.password,
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('sg_password', matchedAccount.password);
        localStorage.setItem('sg_fullName', matchedAccount.fullName);
        localStorage.setItem('sg_username', matchedAccount.username);
        localStorage.setItem('sg_email', matchedAccount.email);
      }

      showToast(t('signInSuccess', language, { name: matchedAccount.fullName }));

      setTimeout(() => {
        updateUserProfile({
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
        setActiveTab('shopping');
        setIsLoading(false);
        onLogin();
      }, 450);
    }
  };

  return (
    <div
      className={`min-h-[100dvh] h-[100dvh] w-full overflow-hidden relative flex justify-center items-center sm:py-6 bg-cover bg-center bg-no-repeat transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-100 text-gray-900'
      }`}
      style={{
        backgroundImage: isDark
          ? `linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.94) 100%), url('/supermarket_bg.jpg')`
          : `linear-gradient(135deg, rgba(238, 242, 255, 0.92) 0%, rgba(240, 253, 250, 0.88) 100%), url('/supermarket_bg.jpg')`,
      }}
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 z-50 bg-gray-900/90 dark:bg-slate-800/95 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-white/20 animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Viewport Container (Smartphone Max Width 430px, Centered Vertically on Laptop/Desktop) */}
      <main className="w-full h-full sm:h-auto max-w-[430px] sm:max-h-[920px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-text-main dark:text-dark-text flex flex-col relative shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] dark:shadow-dark-float rounded-none sm:rounded-[36px] overflow-hidden border border-white/60 dark:border-slate-800 transition-colors duration-200">
        
        {/* Top Header Bar dengan 2 Tombol di Kiri (Suara & Tema dengan Warna Seragam), Logo Center, dan Bahasa di Kanan */}
        <header className="px-4 sm:px-5 pt-4 pb-3.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 text-white shadow-md relative overflow-hidden flex items-center justify-between border-b dark:border-slate-800">
          {/* Sebelah Kiri: 2 Tombol (Sound & Dark/Light Mode dengan Style & Warna Seragam) */}
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
                <Volume2 className="w-4 h-4 text-blue-100" />
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

          {/* Logo Maskot Capybara - 100% PASTI DI TENGAH (Absolute Centered) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-indigo-500 p-0.5 shadow-lg flex-shrink-0 relative group pointer-events-auto">
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

          {/* Sebelah Kanan: 1 Tombol Bahasa (Membuka Dialog Modal Konfirmasi agar Tidak Terpotong) */}
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

        {/* Scrollable Form Body - UI Lebih Padat & Rapi (Kalimat Subtitle dihapus bersih) */}
        <div className="flex-1 px-5 py-3.5 overflow-y-auto space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Hero Welcome Banner (Tanpa Subtitle) */}
            <div className="text-center pt-1 pb-1">
              <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">
                {activeAuthTab === 'signin' ? 'Smart Grocery' : t('registerTitle', language)}
              </h2>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleSubmitForm} className="space-y-2.5">
              {activeAuthTab === 'signup' ? (
                /* Mode Daftar Akun (Nama Lengkap, Email, Password & Username berdampingan) */
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

                  {/* Password & Username (Menggantikan kolom Class) */}
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
                        onClick={() => showToast('Gunakan akun naomi miracle atau mode demo.')}
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
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

              {/* Teks Penyesuaian Switch Sign In / Sign Up */}
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

            {/* Quick Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2 px-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-750 text-gray-800 dark:text-slate-100 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer min-h-[40px]"
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
              <span>{t('continueGoogle', language)}</span>
            </button>
          </div>

          {/* Footer Branding */}
          <footer className="pt-3 pb-2 text-center text-xs text-gray-400 dark:text-slate-500 mt-auto">
            <p className="font-semibold text-text-secondary dark:text-slate-400 text-xs">
              {t('footerBy', language)}
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};
