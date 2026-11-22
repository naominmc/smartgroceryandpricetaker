/**
 * Modern UI Web Audio Sound Synthesizer
 * 100% offline, zero external audio asset dependencies, cross-browser supported.
 */

class SoundService {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public isEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    const val = localStorage.getItem('smart_grocery_sound');
    return val !== 'false';
  }

  public setEnabled(enabled: boolean): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('smart_grocery_sound', enabled ? 'true' : 'false');
    }
  }

  /**
   * Snappy, pleasant UI Pop sound on button clicks
   */
  public pop(): void {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Pitch envelope: quick drop from 750Hz to 220Hz in 0.05s
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
    } catch {}
  }

  /**
   * Cash Register / Cha-ching coin sound on successful transaction / checkout
   */
  public money(): void {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Bell 1 (Coin clink high harmonic)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Bell 2 (Shimmering ring)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1975.53, now + 0.09); // B6
      osc2.frequency.setValueAtTime(2637.02, now + 0.16); // E7
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.2, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.5);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 30, 50]);
      }
    } catch {}
  }
}

export const soundService = new SoundService();
