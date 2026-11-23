import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { themeMode } = useStore();
  const isDark = themeMode === 'dark';

  // Animasi bertahap: 'fade-in' -> 'visible' -> 'fade-out' -> 'hidden'
  const [animationStage, setAnimationStage] = useState<'fade-in' | 'visible' | 'fade-out' | 'hidden'>('fade-in');

  useEffect(() => {
    // 1. Fase Fade In halus segera dimulai saat komponen di-mount
    const enterTimer = setTimeout(() => {
      setAnimationStage('visible');
    }, 40);

    // 2. Layar splash tampil selama ~1.1 detik, lalu mulai Fase Fade Out halus
    const fadeOutTimer = setTimeout(() => {
      setAnimationStage('fade-out');
    }, 1150);

    // 3. Selesaikan splash screen setelah durasi fade out tuntas (total durasi ~1.6 detik)
    const exitTimer = setTimeout(() => {
      setAnimationStage('hidden');
      if (onFinish) {
        onFinish();
      }
    }, 1600);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(exitTimer);
    };
  }, [onFinish]);

  if (animationStage === 'hidden') {
    return null;
  }

  const isFading = animationStage === 'fade-in' || animationStage === 'fade-out';

  return (
    <aside
      aria-label="Layar Splash Smart Grocery"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-8 select-none transition-opacity duration-450 ease-in-out pointer-events-auto ${
        isFading ? 'opacity-0' : 'opacity-100'
      } ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-gray-900'}`}
      style={{
        backgroundImage: isDark
          ? `radial-gradient(circle at 50% 40%, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.98) 100%)`
          : `radial-gradient(circle at 50% 40%, rgba(238, 242, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)`,
      }}
    >
      {/* Spacer Atas untuk Menjaga Keseimbangan Layout */}
      <div className="pt-[calc(1.5rem+env(safe-area-inset-top,0px))] w-full" />

      {/* Konten Utama Splash: Terpusat di Tengah Layar */}
      <div className="flex flex-col items-center text-center space-y-4 my-auto">
        {/* Glow Halus & Kotak Maskot Capybara */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-36 h-36 rounded-full bg-blue-500/15 dark:bg-blue-400/20 blur-2xl pointer-events-none" />
          
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-amber-300 via-orange-400 to-indigo-500 p-1 shadow-2xl relative z-10 transition-transform duration-500 hover:scale-105">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[22px] overflow-hidden flex items-center justify-center p-1">
              <img
                src="/capybara_logo.png"
                alt="Smart Grocery"
                className="w-full h-full object-cover rounded-[18px]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/capybara_mascot.svg';
                }}
              />
            </div>
          </div>
        </div>

        {/* Nama & Subtitle Aplikasi Mengikuti Tipografi Smart Grocery */}
        <div className="space-y-1 pt-1">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-slate-100 tracking-tight">
            Smart Grocery
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-slate-400 tracking-wide">
            by Naomi Miracle
          </p>
        </div>
      </div>

      {/* Loading Spinner di Bawah (Warna Primary Khas Smart Grocery) */}
      <div className="pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] flex flex-col items-center">
        <div className="w-7 h-7 rounded-full border-[2.5px] border-primary border-t-transparent animate-spin dark:border-blue-400 dark:border-t-transparent shadow-xs" />
      </div>
    </aside>
  );
};
