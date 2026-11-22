import React, { useState } from 'react';
import { ShoppingCart, History, Wallet, User, Lock } from 'lucide-react';
import type { NavigationTab } from '../store/useStore';
import { useStore } from '../store/useStore';
import { t } from '../utils/i18n';

interface BottomNavigationProps {
  cartItemCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  cartItemCount = 0,
}) => {
  const { activeTab, setActiveTab, userProfile, isEditingProfile, language } = useStore();
  const [blockedToast, setBlockedToast] = useState(false);

  const navItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'shopping', label: t('navShopping', language), icon: ShoppingCart },
    { id: 'history', label: t('navHistory', language), icon: History },
    { id: 'budget', label: t('navBudget', language), icon: Wallet },
    { id: 'profile', label: t('navProfile', language), icon: User },
  ];

  const handleTabClick = (tabId: NavigationTab) => {
    if (isEditingProfile && tabId !== 'profile') {
      setBlockedToast(true);
      setTimeout(() => setBlockedToast(false), 2500);
      return;
    }
    setActiveTab(tabId);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
      aria-label="Navigasi Utama"
    >
      <div className="w-full sm:max-w-[430px] pointer-events-auto relative">
        {/* Warning Toast if User Tries to Change Section While Editing Profile */}
        {blockedToast && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-black text-[11px] px-3.5 py-1.5 rounded-full shadow-lg whitespace-nowrap animate-bounce flex items-center gap-1.5 z-50">
            <Lock className="w-3.5 h-3.5" />
            <span>{t('saveProfileFirst', language)}</span>
          </div>
        )}

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-none sm:rounded-t-2xl shadow-float dark:shadow-dark-float border-t border-border dark:border-slate-800 px-2.5 pt-1.5 pb-[max(env(safe-area-inset-bottom),8px)] flex items-center justify-around transition-colors">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isBlocked = isEditingProfile && item.id !== 'profile';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all duration-200 min-h-[46px] active:scale-95 ${
                  isBlocked
                    ? 'opacity-35 cursor-not-allowed'
                    : 'cursor-pointer'
                } ${
                  isActive
                    ? 'text-primary dark:text-blue-400 font-bold bg-blue-50/70 dark:bg-blue-950/70'
                    : 'text-text-secondary dark:text-slate-400 hover:text-text-main dark:hover:text-slate-200 font-medium'
                }`}
                aria-current={isActive ? 'page' : undefined}
                title={isBlocked ? 'Simpan profil terlebih dahulu' : item.label}
              >
                <div className="relative">
                  {item.id === 'profile' && userProfile.avatarUrl ? (
                    <img
                      src={userProfile.avatarUrl}
                      alt={userProfile.username}
                      className={`w-5 h-5 rounded-full object-cover transition-transform ${
                        isActive
                          ? 'scale-110 ring-2 ring-primary dark:ring-blue-400'
                          : 'ring-1 ring-gray-300 dark:ring-slate-600'
                      }`}
                    />
                  ) : (
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  )}
                  {item.id === 'shopping' && cartItemCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-danger text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1 tracking-tight leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
