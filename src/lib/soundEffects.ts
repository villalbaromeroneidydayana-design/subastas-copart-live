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

  // Locución por voz del subastador en inglés (Copart Live Auctioneer Voice)
  public speak(phrase: string, rate: number = 1.05) {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = 'en-US';
      utterance.rate = rate; // Ritmo auténtico de subastador
      utterance.pitch = 1.02;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const usVoice = voices.find((v) => v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('David') || v.name.includes('Guy') || v.name.includes('Natural') || v.name.includes('Mark') || v.name.includes('Matthew')))
        || voices.find((v) => v.lang === 'en-US' || v.lang.startsWith('en'));

      if (usVoice) {
        utterance.voice = usVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // speech synthesis error ignore
    }
  }

  // Llamadas oficiales del martillero (Going Once, Going Twice, Fair Warning) con voz en inglés
  public playAuctioneerCall(type: 'going_once' | 'going_twice' | 'fair_warning' | string, currentPrice?: number) {
    const ctx = this.getContext();

    try {
      if (type === 'going_once') {
        this.playGavel();
        setTimeout(() => this.playCountdownTick(1.2), 120);
        setTimeout(() => {
          const priceText = currentPrice ? ` at ${currentPrice.toLocaleString()} dollars` : '';
          this.speak(`Going once${priceText}!`, 1.05);
        }, 180);
      } else if (type === 'going_twice') {
        this.playGavel();
        setTimeout(() => this.playCountdownTick(1.5), 100);
        setTimeout(() => this.playCountdownTick(1.8), 220);
        setTimeout(() => {
          this.speak('Going twice! Last call!', 1.08);
        }, 180);
      } else {
        // fair_warning
        this.playGavel();
        setTimeout(() => this.playGavel(), 150);
        setTimeout(() => this.playCountdownTick(2.0), 300);
        setTimeout(() => {
          this.speak('Fair warning! Final call!', 1.05);
        }, 200);
      }
    } catch {
      // audio context error ignore
    }
  }

  // Fanfarria de victoria / adjudicación (Sold!) con voz en inglés
  public playSoldFanfare(price?: number, paddle?: string) {
    const ctx = this.getContext();

    try {
      this.playGavel();

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!ctx) return;
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

      // Voz de Sold al estilo Copart
      setTimeout(() => {
        if (price) {
          this.speak(`Sold! Sold for ${price.toLocaleString()} dollars!`, 1.02);
        } else {
          this.speak('Sold! Sold!', 1.02);
        }
      }, 700);
    } catch {
      // ignore
    }
  }

  // Locución de nueva puja en inglés al estilo Copart (VB3 Auction Chant)
  public playBidVoice(amount: number, paddleNumber?: string, isClient?: boolean) {
    this.playBidPing();

    setTimeout(() => {
      if (isClient) {
        this.speak(`Bid is ${amount.toLocaleString()} dollars, bidder one-o-one!`, 1.15);
      } else if (paddleNumber) {
        const digits = paddleNumber.replace(/[^\d]/g, '');
        this.speak(`Bid is ${amount.toLocaleString()} dollars, bidder ${digits || paddleNumber}!`, 1.15);
      } else {
        this.speak(`Bid is ${amount.toLocaleString()} dollars!`, 1.15);
      }
    }, 110);
  }

  // Locución de inicio de subasta
  public playStartVoice(startPrice?: number) {
    this.playCountdownTick(1.2);
    setTimeout(() => {
      if (startPrice) {
        this.speak(`Auction open! Starting at ${startPrice.toLocaleString()} dollars, who'll bid?`, 1.08);
      } else {
        this.speak('Auction open! Place your bids now!', 1.08);
      }
    }, 150);
  }

  // Locución de subasta en pausa
  public playPauseVoice() {
    this.speak('Auction paused, please hold your bids.', 1.05);
  }

  // Locución de reanudación
  public playResumeVoice() {
    this.playCountdownTick(1.2);
    setTimeout(() => {
      this.speak('Auction resumed, get your bids in!', 1.08);
    }, 120);
  }

  // Locución de lote no vendido / por reserva
  public playUnsoldVoice() {
    this.playGavel();
    setTimeout(() => this.playGavel(), 150);
    setTimeout(() => {
      this.speak('Lot passed, reserve not met.', 1.05);
    }, 250);
  }
}

export const sounds = new SoundManager();

