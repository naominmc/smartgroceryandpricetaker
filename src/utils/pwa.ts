/**
 * PWA Installation Helper & State Manager
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    (window as any).__pwa_install_prompt = deferredPrompt;
    window.dispatchEvent(new CustomEvent('pwa-prompt-available'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    (window as any).__pwa_install_prompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

export const pwaService = {
  getPrompt(): BeforeInstallPromptEvent | null {
    if (typeof window === 'undefined') return null;
    return deferredPrompt || (window as any).__pwa_install_prompt || null;
  },

  isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  },

  isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  },

  isDismissed(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('smart_grocery_pwa_dismissed') === 'true';
  },

  setDismissed(val: boolean): void {
    if (typeof window === 'undefined') return;
    if (val) {
      localStorage.setItem('smart_grocery_pwa_dismissed', 'true');
    } else {
      localStorage.removeItem('smart_grocery_pwa_dismissed');
    }
    window.dispatchEvent(new CustomEvent('pwa-dismiss-changed', { detail: val }));
  },

  async install(): Promise<'accepted' | 'dismissed' | 'unavailable' | 'installed' | 'ios'> {
    if (this.isStandalone()) return 'installed';
    const prompt = this.getPrompt();
    if (prompt) {
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          deferredPrompt = null;
          (window as any).__pwa_install_prompt = null;
          return 'accepted';
        }
        return 'dismissed';
      } catch {
        return 'unavailable';
      }
    }
    if (this.isIOS()) return 'ios';
    return 'unavailable';
  },
};

