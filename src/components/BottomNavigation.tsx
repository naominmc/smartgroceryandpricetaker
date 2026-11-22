import React from 'react';
import { ShoppingCart, History, Wallet, User } from 'lucide-react';
import type { NavigationTab } from '../store/useStore';
import { useStore } from '../store/useStore';

interface BottomNavigationProps {
  cartItemCount?: number;
  onOpenProfile?: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  cartItemCount = 0,
  onOpenProfile,
}) => {
  const { activeTab, setActiveTab, userProfile } = useStore();

  const navItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'shopping', label: 'Belanja', icon: ShoppingCart },
    { id: 'history', label: 'Riwayat', icon: History },
    { id: 'budget', label: 'Anggaran', icon: Wallet },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
      aria-label="Navigasi Utama"
    >
      <div className="w-full max-w-[430px] px-4 pb-2 pointer-events-auto">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-float dark:shadow-dark-float border border-border dark:border-slate-800 px-3 py-1.5 flex items-center justify-around transition-colors">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all duration-200 min-h-[48px] active:scale-95 ${
                  isActive
                    ? 'text-primary dark:text-blue-400 font-bold bg-blue-50/70 dark:bg-blue-950/70'
                    : 'text-text-secondary dark:text-slate-400 hover:text-text-main dark:hover:text-slate-200 font-medium'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
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

          {/* Profile Tab in Bottom Right Corner (Sejajar dengan Belanja, Riwayat, Anggaran) */}
          <button
            type="button"
            onClick={() => {
              if (onOpenProfile) {
                onOpenProfile();
              }
            }}
            className="relative flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all duration-200 min-h-[48px] active:scale-95 text-text-secondary dark:text-slate-400 hover:text-text-main dark:hover:text-slate-200 font-medium cursor-pointer"
            title="Menu Akun & Profil"
            aria-label="Menu Akun & Profil"
          >
            <div className="relative">
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.username}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-gray-300 dark:ring-slate-600"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight leading-none">Profil</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
