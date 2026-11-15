// Procedural Audio Synthesizer for Copart Live Auction using Web Audio API

class SoundManager {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        try {
          const c = this.getContext();
          if (c && c.state === 'suspended') {
            c.resume();
          }
        } catch {}
      };
      window.addEventListener('click', unlock, { passive: true });
      window.addEventListener('touchstart', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  // Sonido de nueva oferta (Copart Bid Chime)
  public playBidPing() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Sonido de martillo de subastador (Gavel strike)
  public playGavel() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const strikeTime = ctx.currentTime;
      
      // Impact thump
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, strikeTime);
      osc.frequency.exponentialRampToValueAtTime(40, strikeTime + 0.15);

      gain.gain.setValueAtTime(0.6, strikeTime);
      gain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(strikeTime);
      osc.stop(strikeTime + 0.25);

      // Wood block resonance
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, strikeTime);
      osc2.frequency.exponentialRampToValueAtTime(120, strikeTime + 0.18);

      gain2.gain.setValueAtTime(0.4, strikeTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.2);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(strikeTime);
      osc2.stop(strikeTime + 0.2);
    } catch {
      // Audio context error ignore
    }
  }

  // Alerta de última llamada (Going Once, Going Twice...)
  public playCountdownTick(pitchMultiplier: number = 1) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(600 * pitchMultiplier, ctx.currentTime);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio context error ignore
    }
  }

  // Llamadas oficiales del martillero (Going Once, Going Twice, Fair Warning)
  public playAuctioneerCall(type: 'going_once' | 'going_twice' | 'fair_warning' | string) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (type === 'going_once') {
        this.playGavel();
        setTimeout(() => this.playCountdownTick(1.2), 120);
      } else if (type === 'going_twice') {
        this.playGavel();
        setTimeout(() => this.playCountdownTick(1.5), 100);
        setTimeout(() => this.playCountdownTick(1.8), 220);
      } else {
        // fair_warning
        this.playGavel();
        setTimeout(() => this.playGavel(), 150);
        setTimeout(() => this.playCountdownTick(2.0), 300);
      }
    } catch {
      // audio context error ignore
    }
  }

  // Fanfarria de victoria / adjudicación (Sold!)
  public playSoldFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      this.playGavel();

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + 0.15 + (idx * 0.12);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.45);
      });
    } catch {
      // ignore
    }
  }
}

export const sounds = new SoundManager();

