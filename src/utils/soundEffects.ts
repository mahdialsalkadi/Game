/**
 * Web Audio API synthesizer for procedural sound effects.
 * Requires no external audio assets and handles browser autoplay policies safely.
 */

export class GameSynthesizer {
  private ctx: AudioContext | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }

      // Automatically unlock on first mobile touch or click
      const unlock = () => {
        if (this.ctx && this.ctx.state === "suspended") {
          this.ctx.resume().catch(() => {});
        }
        window.removeEventListener("touchstart", unlock);
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("click", unlock);
      };
      window.addEventListener("touchstart", unlock, { passive: true });
      window.addEventListener("pointerdown", unlock, { passive: true });
      window.addEventListener("click", unlock, { passive: true });
    }
  }

  public unlockAudio = (): void => {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  };

  private ensureContext(): AudioContext | null {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * Sound effect: Rolling dice (series of wooden tumble clicks)
   */
  public playDiceRoll = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = ctx.currentTime;
    const bounces = 5;
    let timeOffset = 0;

    for (let i = 0; i < bounces; i++) {
      timeOffset += 0.045 + Math.random() * 0.035;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(700 + Math.random() * 300, now + timeOffset);
      filter.Q.setValueAtTime(2.5, now + timeOffset);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(180 + Math.random() * 60, now + timeOffset);
      osc.frequency.exponentialRampToValueAtTime(45, now + timeOffset + 0.035);

      const volume = Math.max(0.04, 0.22 - i * 0.035);
      gain.gain.setValueAtTime(0.0001, now + timeOffset);
      gain.gain.linearRampToValueAtTime(volume, now + timeOffset + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + 0.038);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + 0.04);
    }
  };

  /**
   * Sound effect: Collecting coins / reward chime
   */
  public playCoinChime = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = ctx.currentTime;

    const playTone = (
      freq: number,
      startTime: number,
      duration: number,
      peakGain: number
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // First note: B5 (~988 Hz)
    playTone(987.77, now, 0.12, 0.22);
    // Second note: E6 (~1319 Hz)
    playTone(1318.51, now + 0.08, 0.42, 0.28);
    // Sparkle harmonic overtone: E7 (~2637 Hz)
    playTone(2637.02, now + 0.08, 0.25, 0.08);
  };

  /**
   * Sound effect: Drama alert / suspense sting
   */
  public playDramaAlert = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = ctx.currentTime;

    // Sub punch for dramatic weight
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(100, now);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
    subGain.gain.setValueAtTime(0.25, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.45);

    // Tense dramatic chord (A3, Eb4, A4) with sweep filter
    const chordFrequencies = [220.0, 311.13, 440.0];
    chordFrequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = idx === 0 ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(freq, now);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1600, now);
      filter.frequency.exponentialRampToValueAtTime(350, now + 0.65);

      const noteVol = 0.18 / chordFrequencies.length;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(noteVol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.75);
    });
  };

  /**
   * Sound effect: Player turn notification chime (gentle rising arpeggio)
   */
  public playTurnChime = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const playNote = (freq: number, start: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    };

    playNote(523.25, now); // C5
    playNote(659.25, now + 0.08); // E5
    playNote(783.99, now + 0.16); // G5
  };

  /**
   * Sound effect: Warning or error buzz
   */
  public playAlert = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.setValueAtTime(110, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  };

  /**
   * Sound effect: Playing a tactical card (whoosh swipe)
   */
  public playCardPlay = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.14);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1100, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  };
}

export const sfx = new GameSynthesizer();

/**
 * Speaks Arabic text aloud using the browser's built-in Web Speech API (speechSynthesis).
 * Tuned with an upbeat, enthusiastic pace (1.05x) and prefers native Arabic voices.
 */
export function speakArabicNarrator(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel(); // Stop any pending utterances
    const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim(); // Strip emojis for smoother reading
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ar-SA";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find((v) => v.lang.startsWith("ar"));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("[TTS] Speech synthesis error:", err);
  }
}

export default sfx;
