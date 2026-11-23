import React, { useState } from 'react';
import { X, ChevronLeft, User, Mail, ShieldCheck } from 'lucide-react';

export interface GoogleAccount {
  name: string;
  email: string;
  avatarText?: string;
  avatarColor?: string;
  avatarImg?: string;
}

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (account: GoogleAccount) => void;
}

const DEFAULT_GOOGLE_ACCOUNTS: GoogleAccount[] = [
  {
    name: 'naomi miracle',
    email: 'naomi@mutiarabangsa.sch.id',
    avatarText: 'n',
    avatarColor: 'bg-teal-600',
  },
  {
    name: 'Naomi Miracle Christia',
    email: 'naomimcnmc09@gmail.com',
    avatarImg: '/capybara_mascot.svg',
  },
];

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onContinue,
}) => {
  const [step, setStep] = useState<'choose' | 'confirm' | 'custom'>('choose');
  const [selectedAccount, setSelectedAccount] = useState<GoogleAccount>(DEFAULT_GOOGLE_ACCOUNTS[0]);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  if (!isOpen) return null;

  const handleSelectAccount = (acc: GoogleAccount) => {
    setSelectedAccount(acc);
    setStep('confirm');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) return;
    const newAcc: GoogleAccount = {
      name: customName.trim() || customEmail.split('@')[0],
      email: customEmail.trim().toLowerCase(),
      avatarText: (customName.trim() || customEmail)[0].toUpperCase(),
      avatarColor: 'bg-blue-600',
    };
    setSelectedAccount(newAcc);
    setStep('confirm');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Pop-up Window Box (Sesuai Window Google Chrome di Screenshot) */}
      <div className="w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[28px] shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col animate-slide-up text-left">
        
        {/* Top Browser Bar (Chrome / Google accounts bar) */}
        <div className="bg-gray-100/90 dark:bg-slate-850 px-4 py-2.5 border-b border-gray-200 dark:border-slate-750 flex items-center justify-between text-xs text-gray-600 dark:text-slate-300">
          <div className="flex items-center gap-2 truncate">
            {step !== 'choose' ? (
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="p-1 -ml-1 text-gray-500 hover:text-gray-800 dark:hover:text-slate-100 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                title="Back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
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
            )}
            <span className="font-semibold truncate">Sign in – Google accounts</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[80vh]">
          {/* Google Brand Header */}
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
              Sign in with Google
            </span>
          </div>

          {step === 'choose' && (
            /* STEP 1: Choose an account (Sesuai Screenshot 2) */
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-2xl font-normal text-gray-900 dark:text-slate-100 tracking-tight">
                  Choose an account
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mt-1">
                  to continue to{' '}
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    smartgroceryandpricetaker.vercel.app
                  </span>
                </p>
              </div>

              {/* Account List Rows */}
              <div className="border-t border-b border-gray-100 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800 -mx-1">
                {DEFAULT_GOOGLE_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectAccount(acc)}
                    className="w-full py-3 px-2 flex items-center gap-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer text-left group"
                  >
                    {acc.avatarImg ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800">
                        <img
                          src={acc.avatarImg}
                          alt={acc.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full ${
                          acc.avatarColor || 'bg-teal-600'
                        } text-white font-bold text-base flex items-center justify-center flex-shrink-0`}
                      >
                        {acc.avatarText || 'n'}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-gray-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {acc.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
                        {acc.email}
                      </div>
                    </div>
                  </button>
                ))}

                {/* Option: Use another account */}
                <button
                  type="button"
                  onClick={() => setStep('custom')}
                  className="w-full py-3 px-2 flex items-center gap-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer text-left group"
                >
                  <div className="w-10 h-10 rounded-full border border-gray-300 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-gray-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Use another account
                    </div>
                  </div>
                </button>
              </div>

              {/* Bottom Language & Policy Footer */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
                <span className="hover:underline cursor-pointer">English (United Kingdom)</span>
                <div className="flex items-center gap-3">
                  <span className="hover:underline cursor-pointer">Help</span>
                  <span className="hover:underline cursor-pointer">Privacy</span>
                  <span className="hover:underline cursor-pointer">Terms</span>
                </div>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            /* STEP 2: You'll share this info about you (Sesuai Screenshot 3) */
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-normal text-gray-900 dark:text-slate-100 tracking-tight">
                  You'll share this info about you
                </h2>
              </div>

              {/* Shared Info Items */}
              <div className="space-y-3.5 pt-1 pb-1">
                {/* Item 1: Name and profile picture */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-slate-100">
                      {selectedAccount.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">
                      Name and profile picture
                    </div>
                  </div>
                </div>

                {/* Item 2: Email address */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-slate-100">
                      {selectedAccount.email}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">
                      Email address
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Text */}
              <div className="space-y-2 text-xs text-gray-600 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-800">
                <p className="leading-relaxed">
                  Review{' '}
                  <span className="font-medium text-gray-900 dark:text-slate-200">
                    smartgroceryandpricetaker.vercel.app
                  </span>
                  's Privacy Policy and Terms of Service.
                </p>
                <p>
                  You can make changes in your{' '}
                  <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer">
                    Google Account
                  </span>
                  .
                </p>
                <p>
                  Learn more about{' '}
                  <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer">
                    Sign in with Google
                  </span>
                  .
                </p>
              </div>

              {/* Action Buttons: Cancel and Continue (Sesuai Screenshot 3) */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-full border border-gray-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 font-semibold text-sm transition-all active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onContinue(selectedAccount)}
                  className="px-7 py-2 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm shadow-xs transition-all cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 'custom' && (
            /* STEP 3: Use another account Form */
            <form onSubmit={handleCustomSubmit} className="space-y-3 animate-fade-in">
              <div>
                <h2 className="text-xl font-normal text-gray-900 dark:text-slate-100">
                  Sign in with another Google account
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Enter your Google email to proceed with authentication
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Naomi Miracle"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    Google Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="name@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setStep('choose')}
                  className="px-5 py-2 rounded-full border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold text-xs"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                >
                  Next →
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

