/**
 * Web Audio API synthesizer for procedural sound effects.
 * Requires no external audio assets and handles browser autoplay policies safely.
 * Dynamically adapts acoustic soundscapes according to the active theme:
 * - ARABIAN_MAJLIS: warm acoustic wooden clatters, coffee clinks, and classic percussive taps
 * - CYBERPUNK_NEON: high-pass filters, square/sawtooth waves, and laser sweeps
 * - DEEP_SPACE: deep resonant low-frequency sines, cosmic sweeps, and sub-bass resonance
 * - MEDIEVAL_FANTASY: fanfare horn frequencies, bell chimes, and steel shield clanks
 */

export type AudioThemeId =
  | "ARABIAN_MAJLIS"
  | "CYBERPUNK_NEON"
  | "DEEP_SPACE"
  | "MEDIEVAL_FANTASY";

export class GameSynthesizer {
  private ctx: AudioContext | null = null;
  private currentTheme: string = "ARABIAN_MAJLIS";
  private muted: boolean = false;

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

  /**
   * Updates the active theme for dynamic procedural audio synthesis.
   */
  public setAudioTheme = (themeId: string): void => {
    if (themeId) {
      this.currentTheme = themeId;
    }
  };

  /**
   * Retrieves the current audio theme ID.
   */
  public getAudioTheme = (): string => {
    return this.currentTheme;
  };

  public unlockAudio = (): void => {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  };

  /** Mute all procedural sound effects (narrator voice is controlled separately). */
  public setMuted = (muted: boolean): void => {
    this.muted = muted;
    if (muted && this.ctx && this.ctx.state === "running") {
      this.ctx.suspend().catch(() => {});
    } else if (!muted) {
      this.unlockAudio();
    }
  };

  public isMuted = (): boolean => this.muted;

  private masterCompressor: DynamicsCompressorNode | null = null;
  private cachedNoiseBuffer: AudioBuffer | null = null;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
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

    // Initialize master dynamics compressor / limiter on first run
    if (this.ctx && !this.masterCompressor) {
      try {
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.setValueAtTime(-6, this.ctx.currentTime);
        comp.knee.setValueAtTime(12, this.ctx.currentTime);
        comp.ratio.setValueAtTime(8, this.ctx.currentTime);
        comp.attack.setValueAtTime(0.003, this.ctx.currentTime);
        comp.release.setValueAtTime(0.25, this.ctx.currentTime);
        comp.connect(this.ctx.destination);
        this.masterCompressor = comp;
      } catch {}
    }

    return this.ctx;
  }

  /**
   * High-Performance Buffer Pooling:
   * Reuses a pre-allocated master noise buffer instead of generating new Float32Arrays on every dice shake/tumble.
   * Completely eliminates GC pauses during rapid multi-player rolls.
   */
  private getNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    if (!this.cachedNoiseBuffer || this.cachedNoiseBuffer.sampleRate !== ctx.sampleRate) {
      const poolDuration = 3.0; // 3 seconds master noise pool
      const bufferSize = Math.floor(ctx.sampleRate * poolDuration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.cachedNoiseBuffer = buffer;
    }

    return this.cachedNoiseBuffer;
  }

  /**
   * Master bus audio routing with hardware-safe dynamics limiter
   */
  public getMasterOutput(ctx: AudioContext): AudioNode {
    return this.masterCompressor || ctx.destination;
  }

  /**
   * Sound effect: Rolling dice (backward compatibility alias to playDiceTumble)
   */
  public playDiceRoll = (): void => {
    this.playDiceTumble();
  };

  /**
   * Sound effect: Rhythmic shaking of dice
   */
  public playDiceShake = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    switch (this.currentTheme) {
      case "CYBERPUNK_NEON":
        this.playCyberpunkDiceShake(ctx);
        break;
      case "DEEP_SPACE":
        this.playDeepSpaceDiceShake(ctx);
        break;
      case "MEDIEVAL_FANTASY":
        this.playMedievalDiceShake(ctx);
        break;
      case "ARABIAN_MAJLIS":
      default:
        this.playArabianDiceShake(ctx);
        break;
    }
  };

  private playArabianDiceShake(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const shakes = 3;

    for (let s = 0; s < shakes; s++) {
      const shakeTime = now + s * 0.11;

      // 1. Friction / scrape of dice against cup lining (bandpass noise)
      const noiseBuffer = this.getNoiseBuffer(ctx, 0.08);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(1150 + s * 140, shakeTime);
      noiseFilter.Q.setValueAtTime(3.2, shakeTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, shakeTime);
      noiseGain.gain.linearRampToValueAtTime(0.16, shakeTime + 0.012);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, shakeTime + 0.075);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start(shakeTime);
      noiseSource.stop(shakeTime + 0.08);

      // 2. High-frequency rattle click of dice colliding inside cup
      const clackOsc = ctx.createOscillator();
      const clackGain = ctx.createGain();
      clackOsc.type = "triangle";
      clackOsc.frequency.setValueAtTime(1600 + Math.random() * 350, shakeTime + 0.008);
      clackOsc.frequency.exponentialRampToValueAtTime(320, shakeTime + 0.035);

      clackGain.gain.setValueAtTime(0.0001, shakeTime + 0.008);
      clackGain.gain.linearRampToValueAtTime(0.22, shakeTime + 0.012);
      clackGain.gain.exponentialRampToValueAtTime(0.0001, shakeTime + 0.04);

      clackOsc.connect(clackGain);
      clackGain.connect(ctx.destination);
      clackOsc.start(shakeTime + 0.008);
      clackOsc.stop(shakeTime + 0.045);
    }
  }

  private playCyberpunkDiceShake(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const shakes = 3;

    for (let s = 0; s < shakes; s++) {
      const shakeTime = now + s * 0.09;

      // High-pass electronic glitch rattle
      const noiseBuffer = this.getNoiseBuffer(ctx, 0.06);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const hpFilter = ctx.createBiquadFilter();
      hpFilter.type = "highpass";
      hpFilter.frequency.setValueAtTime(2600 + s * 300, shakeTime);
      hpFilter.Q.setValueAtTime(4.0, shakeTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, shakeTime);
      gain.gain.linearRampToValueAtTime(0.15, shakeTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, shakeTime + 0.055);

      noiseSource.connect(hpFilter);
      hpFilter.connect(gain);
      gain.connect(ctx.destination);
      noiseSource.start(shakeTime);
      noiseSource.stop(shakeTime + 0.06);

      // Square wave digital chirp click
      const sqOsc = ctx.createOscillator();
      const sqGain = ctx.createGain();
      sqOsc.type = "square";
      sqOsc.frequency.setValueAtTime(1800 + s * 250, shakeTime + 0.005);
      sqOsc.frequency.exponentialRampToValueAtTime(800, shakeTime + 0.025);

      sqGain.gain.setValueAtTime(0.0001, shakeTime + 0.005);
      sqGain.gain.linearRampToValueAtTime(0.12, shakeTime + 0.008);
      sqGain.gain.exponentialRampToValueAtTime(0.0001, shakeTime + 0.03);

      sqOsc.connect(sqGain);
      sqGain.connect(ctx.destination);
      sqOsc.start(shakeTime + 0.005);
      sqOsc.stop(shakeTime + 0.035);
    }
  }

  private playDeepSpaceDiceShake(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const shakes = 3;

    for (let s = 0; s < shakes; s++) {
      const shakeTime = now + s * 0.12;

      // Deep resonant low-frequency sine pulse
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(95 + s * 10, shakeTime);
      subOsc.frequency.exponentialRampToValueAtTime(45, shakeTime + 0.06);

      subGain.gain.setValueAtTime(0.0001, shakeTime);
      subGain.gain.linearRampToValueAtTime(0.24, shakeTime + 0.015);
      subGain.gain.exponentialRampToValueAtTime(0.0001, shakeTime + 0.075);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(shakeTime);
      subOsc.stop(shakeTime + 0.08);

      // Cosmic ambient particle hiss
      const noiseBuffer = this.getNoiseBuffer(ctx, 0.07);
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(1900, shakeTime);
      bp.Q.setValueAtTime(5.0, shakeTime);
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.0001, shakeTime);
      nGain.gain.linearRampToValueAtTime(0.08, shakeTime + 0.01);
      nGain.gain.exponentialRampToValueAtTime(0.0001, shakeTime + 0.065);
      noise.connect(bp);
      bp.connect(nGain);
      nGain.connect(ctx.destination);
      noise.start(shakeTime);
      noise.stop(shakeTime + 0.07);
    }
  }

  private playMedievalDiceShake(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const shakes = 3;

    for (let s = 0; s < shakes; s++) {
      const shakeTime = now + s * 0.11;

      // Heavy bronze/iron cup rattle (triangle / metallic ping)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1450 + s * 120, shakeTime);
      osc.frequency.exponentialRampToValueAtTime(480, shakeTime + 0.045);

      gain.gain.setValueAtTime(0.0001, shakeTime);
      gain.gain.linearRampToValueAtTime(0.22, shakeTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, shakeTime + 0.055);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(shakeTime);
      osc.stop(shakeTime + 0.06);

      // Ringing steel shield clank overtone
      const bell = ctx.createOscillator();
      const bGain = ctx.createGain();
      bell.type = "square";
      bell.frequency.setValueAtTime(2400 + s * 180, shakeTime + 0.005);
      bGain.gain.setValueAtTime(0.0001, shakeTime + 0.005);
      bGain.gain.linearRampToValueAtTime(0.06, shakeTime + 0.01);
      bGain.gain.exponentialRampToValueAtTime(0.0001, shakeTime + 0.045);
      bell.connect(bGain);
      bGain.connect(ctx.destination);
      bell.start(shakeTime + 0.005);
      bell.stop(shakeTime + 0.05);
    }
  }

  /**
   * Sound effect: Multi-tap clattering of dice bouncing and rolling
   */
  public playDiceTumble = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    switch (this.currentTheme) {
      case "CYBERPUNK_NEON":
        this.playCyberpunkDiceTumble(ctx);
        break;
      case "DEEP_SPACE":
        this.playDeepSpaceDiceTumble(ctx);
        break;
      case "MEDIEVAL_FANTASY":
        this.playMedievalDiceTumble(ctx);
        break;
      case "ARABIAN_MAJLIS":
      default:
        this.playArabianDiceTumble(ctx);
        break;
    }
  };

  private playArabianDiceTumble(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const bounces = 7;
    let timeOffset = 0;

    for (let i = 0; i < bounces; i++) {
      timeOffset += 0.042 + Math.random() * 0.038 + i * 0.012;
      const hitTime = now + timeOffset;

      // Layer A: Low-mid wooden felt impact thump
      const thudOsc = ctx.createOscillator();
      const thudGain = ctx.createGain();
      const thudFilter = ctx.createBiquadFilter();

      thudOsc.type = "triangle";
      const startFreq = 170 + Math.random() * 50;
      thudOsc.frequency.setValueAtTime(startFreq, hitTime);
      thudOsc.frequency.exponentialRampToValueAtTime(45, hitTime + 0.035);

      thudFilter.type = "lowpass";
      thudFilter.frequency.setValueAtTime(650, hitTime);

      const hitVol = Math.max(0.03, 0.28 - i * 0.035);
      thudGain.gain.setValueAtTime(0.0001, hitTime);
      thudGain.gain.linearRampToValueAtTime(hitVol, hitTime + 0.003);
      thudGain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.038);

      thudOsc.connect(thudFilter);
      thudFilter.connect(thudGain);
      thudGain.connect(ctx.destination);
      thudOsc.start(hitTime);
      thudOsc.stop(hitTime + 0.042);

      // Layer B: Snappy bone/acrylic dice clack (bandpass filtered noise ping)
      const noiseBuffer = this.getNoiseBuffer(ctx, 0.03);
      const clackSource = ctx.createBufferSource();
      clackSource.buffer = noiseBuffer;

      const clackFilter = ctx.createBiquadFilter();
      clackFilter.type = "bandpass";
      clackFilter.frequency.setValueAtTime(1400 + Math.random() * 800, hitTime);
      clackFilter.Q.setValueAtTime(3.5, hitTime);

      const clackGain = ctx.createGain();
      const clackVol = Math.max(0.02, 0.2 - i * 0.026);
      clackGain.gain.setValueAtTime(0.0001, hitTime);
      clackGain.gain.linearRampToValueAtTime(clackVol, hitTime + 0.002);
      clackGain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.028);

      clackSource.connect(clackFilter);
      clackFilter.connect(clackGain);
      clackGain.connect(ctx.destination);
      clackSource.start(hitTime);
      clackSource.stop(hitTime + 0.03);
    }
  }

  private playCyberpunkDiceTumble(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const bounces = 6;
    let timeOffset = 0;

    for (let i = 0; i < bounces; i++) {
      timeOffset += 0.04 + Math.random() * 0.03 + i * 0.01;
      const hitTime = now + timeOffset;

      // Layer A: Sawtooth laser sweep chirp through high-pass filter
      const laserOsc = ctx.createOscillator();
      const laserFilter = ctx.createBiquadFilter();
      const laserGain = ctx.createGain();

      laserOsc.type = "sawtooth";
      const startFreq = 2200 - i * 180 + Math.random() * 300;
      laserOsc.frequency.setValueAtTime(startFreq, hitTime);
      laserOsc.frequency.exponentialRampToValueAtTime(450, hitTime + 0.032);

      laserFilter.type = "highpass";
      laserFilter.frequency.setValueAtTime(1500, hitTime);
      laserFilter.Q.setValueAtTime(3.5, hitTime);

      const hitVol = Math.max(0.03, 0.22 - i * 0.028);
      laserGain.gain.setValueAtTime(0.0001, hitTime);
      laserGain.gain.linearRampToValueAtTime(hitVol, hitTime + 0.003);
      laserGain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.035);

      laserOsc.connect(laserFilter);
      laserFilter.connect(laserGain);
      laserGain.connect(ctx.destination);
      laserOsc.start(hitTime);
      laserOsc.stop(hitTime + 0.04);

      // Layer B: Square wave micro-burst click
      const sq = ctx.createOscillator();
      const sqGain = ctx.createGain();
      sq.type = "square";
      sq.frequency.setValueAtTime(980 + i * 80, hitTime);
      sqGain.gain.setValueAtTime(0.0001, hitTime);
      sqGain.gain.linearRampToValueAtTime(hitVol * 0.6, hitTime + 0.002);
      sqGain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.02);
      sq.connect(sqGain);
      sqGain.connect(ctx.destination);
      sq.start(hitTime);
      sq.stop(hitTime + 0.025);
    }
  }

  private playDeepSpaceDiceTumble(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const bounces = 5;
    let timeOffset = 0;

    for (let i = 0; i < bounces; i++) {
      timeOffset += 0.05 + Math.random() * 0.035 + i * 0.015;
      const hitTime = now + timeOffset;

      // Layer A: Deep resonant low-frequency sine thump with sub-bass resonance
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = "sine";
      const startFreq = 120 - i * 14;
      subOsc.frequency.setValueAtTime(startFreq, hitTime);
      subOsc.frequency.exponentialRampToValueAtTime(34, hitTime + 0.055);

      const hitVol = Math.max(0.04, 0.3 - i * 0.045);
      subGain.gain.setValueAtTime(0.0001, hitTime);
      subGain.gain.linearRampToValueAtTime(hitVol, hitTime + 0.005);
      subGain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.06);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(hitTime);
      subOsc.stop(hitTime + 0.065);

      // Layer B: Resonant cosmic sweep
      const sweepOsc = ctx.createOscillator();
      const sweepFilter = ctx.createBiquadFilter();
      const sweepGain = ctx.createGain();
      sweepOsc.type = "sine";
      sweepOsc.frequency.setValueAtTime(480, hitTime);
      sweepOsc.frequency.exponentialRampToValueAtTime(110, hitTime + 0.045);

      sweepFilter.type = "bandpass";
      sweepFilter.frequency.setValueAtTime(320, hitTime);
      sweepFilter.Q.setValueAtTime(4.5, hitTime);

      sweepGain.gain.setValueAtTime(0.0001, hitTime);
      sweepGain.gain.linearRampToValueAtTime(hitVol * 0.6, hitTime + 0.004);
      sweepGain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.05);

      sweepOsc.connect(sweepFilter);
      sweepFilter.connect(sweepGain);
      sweepGain.connect(ctx.destination);
      sweepOsc.start(hitTime);
      sweepOsc.stop(hitTime + 0.055);
    }
  }

  private playMedievalDiceTumble(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const bounces = 6;
    let timeOffset = 0;

    for (let i = 0; i < bounces; i++) {
      timeOffset += 0.045 + Math.random() * 0.035 + i * 0.012;
      const hitTime = now + timeOffset;

      // Layer A: Steel shield clank (mid-range punch)
      const clankOsc = ctx.createOscillator();
      const clankGain = ctx.createGain();
      clankOsc.type = "triangle";
      clankOsc.frequency.setValueAtTime(380 - i * 25, hitTime);
      clankOsc.frequency.exponentialRampToValueAtTime(110, hitTime + 0.04);

      const hitVol = Math.max(0.03, 0.28 - i * 0.038);
      clankGain.gain.setValueAtTime(0.0001, hitTime);
      clankGain.gain.linearRampToValueAtTime(hitVol, hitTime + 0.003);
      clankGain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.045);

      clankOsc.connect(clankGain);
      clankGain.connect(ctx.destination);
      clankOsc.start(hitTime);
      clankOsc.stop(hitTime + 0.05);

      // Layer B: Ringing metallic coin / bell overtone
      const bellOsc = ctx.createOscillator();
      const bellFilter = ctx.createBiquadFilter();
      const bellGain = ctx.createGain();
      bellOsc.type = "square";
      bellOsc.frequency.setValueAtTime(1850 + (i % 3) * 350, hitTime);

      bellFilter.type = "bandpass";
      bellFilter.frequency.setValueAtTime(2100, hitTime);
      bellFilter.Q.setValueAtTime(6.0, hitTime);

      bellGain.gain.setValueAtTime(0.0001, hitTime);
      bellGain.gain.linearRampToValueAtTime(hitVol * 0.5, hitTime + 0.002);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.06);

      bellOsc.connect(bellFilter);
      bellFilter.connect(bellGain);
      bellGain.connect(ctx.destination);
      bellOsc.start(hitTime);
      bellOsc.stop(hitTime + 0.065);
    }
  }

  /**
   * Sound effect: Collecting coins / reward chime
   */
  public playCoinChime = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    switch (this.currentTheme) {
      case "CYBERPUNK_NEON":
        this.playCyberpunkCoinChime(ctx);
        break;
      case "DEEP_SPACE":
        this.playDeepSpaceCoinChime(ctx);
        break;
      case "MEDIEVAL_FANTASY":
        this.playMedievalCoinChime(ctx);
        break;
      case "ARABIAN_MAJLIS":
      default:
        this.playArabianCoinChime(ctx);
        break;
    }
  };

  private playArabianCoinChime(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const playTone = (freq: number, startTime: number, duration: number, peakGain: number) => {
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
  }

  private playCyberpunkCoinChime(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Fast 8-bit digital credit chiptune cascade
    const notes = [1046.5, 1318.51, 1567.98, 2093.0];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.038;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const hp = ctx.createBiquadFilter();

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, t);

      hp.type = "highpass";
      hp.frequency.setValueAtTime(1000, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

      osc.connect(hp);
      hp.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    });
  }

  private playDeepSpaceCoinChime(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Sub-bass resonance + crystalline cosmic harmonic ping
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(110, now);
    subGain.gain.setValueAtTime(0.22, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.5);

    const bells = [1760.0, 3520.0];
    bells.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.05 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.55);
    });
  }

  private playMedievalCoinChime(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Royal gold coins clinking with cathedral bell overtone
    const coins = [1174.66, 1760.0, 2349.32];
    coins.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.24, now + idx * 0.06 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.48);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.52);
    });
  }

  /**
   * Sound effect: Drama alert / suspense sting
   */
  public playDramaAlert = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    switch (this.currentTheme) {
      case "CYBERPUNK_NEON":
        this.playCyberpunkDramaAlert(ctx);
        break;
      case "DEEP_SPACE":
        this.playDeepSpaceDramaAlert(ctx);
        break;
      case "MEDIEVAL_FANTASY":
        this.playMedievalDramaAlert(ctx);
        break;
      case "ARABIAN_MAJLIS":
      default:
        this.playArabianDramaAlert(ctx);
        break;
    }
  };

  private playArabianDramaAlert(ctx: AudioContext): void {
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
  }

  private playCyberpunkDramaAlert(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // High-pass emergency klaxon + harsh sawtooth drop
    const saw = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    saw.type = "sawtooth";
    saw.frequency.setValueAtTime(640, now);
    saw.frequency.exponentialRampToValueAtTime(120, now + 0.45);

    filter.type = "highpass";
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.45);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    saw.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    saw.start(now);
    saw.stop(now + 0.55);

    // Second harsh distorted glitch beep
    const beep = ctx.createOscillator();
    const bGain = ctx.createGain();
    beep.type = "square";
    beep.frequency.setValueAtTime(1800, now + 0.05);
    beep.frequency.setValueAtTime(900, now + 0.18);
    bGain.gain.setValueAtTime(0.12, now + 0.05);
    bGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    beep.connect(bGain);
    bGain.connect(ctx.destination);
    beep.start(now + 0.05);
    beep.stop(now + 0.4);
  }

  private playDeepSpaceDramaAlert(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Massive 42Hz sub-bass hull breach drone + eerie cosmic siren
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(42, now);
    subGain.gain.setValueAtTime(0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.85);

    const spaceOsc = ctx.createOscillator();
    const spaceGain = ctx.createGain();
    spaceOsc.type = "sine";
    spaceOsc.frequency.setValueAtTime(320, now);
    spaceOsc.frequency.exponentialRampToValueAtTime(80, now + 0.7);
    spaceGain.gain.setValueAtTime(0.0001, now);
    spaceGain.gain.linearRampToValueAtTime(0.2, now + 0.04);
    spaceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
    spaceOsc.connect(spaceGain);
    spaceGain.connect(ctx.destination);
    spaceOsc.start(now);
    spaceOsc.stop(now + 0.8);
  }

  private playMedievalDramaAlert(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Thunderous war drum strike + deep war horn blast (D3, A3)
    const drum = ctx.createOscillator();
    const dGain = ctx.createGain();
    drum.type = "triangle";
    drum.frequency.setValueAtTime(120, now);
    drum.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    dGain.gain.setValueAtTime(0.3, now);
    dGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    drum.connect(dGain);
    dGain.connect(ctx.destination);
    drum.start(now);
    drum.stop(now + 0.4);

    const hornNotes = [146.83, 220.0];
    hornNotes.forEach((freq) => {
      const horn = ctx.createOscillator();
      const hGain = ctx.createGain();
      horn.type = "sawtooth";
      horn.frequency.setValueAtTime(freq, now);
      hGain.gain.setValueAtTime(0.0001, now);
      hGain.gain.linearRampToValueAtTime(0.16, now + 0.05);
      hGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
      horn.connect(hGain);
      hGain.connect(ctx.destination);
      horn.start(now);
      horn.stop(now + 0.7);
    });
  }

  /**
   * Sound effect: Player turn notification chime
   */
  public playTurnChime = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    switch (this.currentTheme) {
      case "CYBERPUNK_NEON":
        this.playCyberpunkTurnChime(ctx);
        break;
      case "DEEP_SPACE":
        this.playDeepSpaceTurnChime(ctx);
        break;
      case "MEDIEVAL_FANTASY":
        this.playMedievalTurnChime(ctx);
        break;
      case "ARABIAN_MAJLIS":
      default:
        this.playArabianTurnChime(ctx);
        break;
    }
  };

  private playArabianTurnChime(ctx: AudioContext): void {
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
  }

  private playCyberpunkTurnChime(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Laser sweep intro + high-pass square/sawtooth synth arpeggio
    const laser = ctx.createOscillator();
    const lGain = ctx.createGain();
    const lFilter = ctx.createBiquadFilter();

    laser.type = "sawtooth";
    laser.frequency.setValueAtTime(1100, now);
    laser.frequency.exponentialRampToValueAtTime(3200, now + 0.06);

    lFilter.type = "highpass";
    lFilter.frequency.setValueAtTime(1200, now);

    lGain.gain.setValueAtTime(0.0001, now);
    lGain.gain.linearRampToValueAtTime(0.12, now + 0.01);
    lGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    laser.connect(lFilter);
    lFilter.connect(lGain);
    lGain.connect(ctx.destination);
    laser.start(now);
    laser.stop(now + 0.08);

    // Neon synth arpeggio: F#5, A#5, C#6, F#6
    const arpeg = [739.99, 932.33, 1108.73, 1479.98];
    arpeg.forEach((freq, idx) => {
      const t = now + 0.05 + idx * 0.055;
      const osc = ctx.createOscillator();
      const hp = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = idx % 2 === 0 ? "sawtooth" : "square";
      osc.frequency.setValueAtTime(freq, t);

      hp.type = "highpass";
      hp.frequency.setValueAtTime(900, t);
      hp.Q.setValueAtTime(2.5, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.16, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

      osc.connect(hp);
      hp.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  private playDeepSpaceTurnChime(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Deep resonant sub-bass drone + ethereal cosmic sine harmonics
    const sub = ctx.createOscillator();
    const sGain = ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(65.41, now); // C2
    sGain.gain.setValueAtTime(0.0001, now);
    sGain.gain.linearRampToValueAtTime(0.25, now + 0.08);
    sGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    sub.connect(sGain);
    sGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.65);

    // Ethereal cosmic chord: C4, G4, D5, A5
    const spaceNotes = [261.63, 392.0, 587.33, 880.0];
    spaceNotes.forEach((freq, idx) => {
      const t = now + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.16, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  private playMedievalTurnChime(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Royal herald trumpet fanfare horn frequencies + cathedral bell chime
    const hornNotes = [
      { freq: 293.66, t: 0, dur: 0.16 }, // D4
      { freq: 440.0, t: 0.08, dur: 0.16 }, // A4
      { freq: 587.33, t: 0.16, dur: 0.35 } // D5
    ];

    hornNotes.forEach(({ freq, t, dur }) => {
      const start = now + t;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1800, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.24, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    });

    // Cathedral bell chime at end (D6)
    const bell = ctx.createOscillator();
    const bGain = ctx.createGain();
    bell.type = "sine";
    bell.frequency.setValueAtTime(1174.66, now + 0.22);
    bGain.gain.setValueAtTime(0.0001, now + 0.22);
    bGain.gain.linearRampToValueAtTime(0.18, now + 0.23);
    bGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
    bell.connect(bGain);
    bGain.connect(ctx.destination);
    bell.start(now + 0.22);
    bell.stop(now + 0.7);
  }

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

    switch (this.currentTheme) {
      case "CYBERPUNK_NEON":
        this.playCyberpunkCardPlay(ctx);
        break;
      case "DEEP_SPACE":
        this.playDeepSpaceCardPlay(ctx);
        break;
      case "MEDIEVAL_FANTASY":
        this.playMedievalCardPlay(ctx);
        break;
      case "ARABIAN_MAJLIS":
      default:
        this.playArabianCardPlay(ctx);
        break;
    }
  };

  private playArabianCardPlay(ctx: AudioContext): void {
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
  }

  private playCyberpunkCardPlay(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Hologram deploy laser chirp
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(3400, now + 0.12);

    filter.type = "highpass";
    filter.frequency.setValueAtTime(1400, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  private playDeepSpaceCardPlay(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Warp pulse charge
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  private playMedievalCardPlay(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Parchment spell cast with sword swish
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Sound effect: Crisp card slide
   */
  public playCardSlide = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    switch (this.currentTheme) {
      case "CYBERPUNK_NEON":
        this.playCyberpunkCardSlide(ctx);
        break;
      case "DEEP_SPACE":
        this.playDeepSpaceCardSlide(ctx);
        break;
      case "MEDIEVAL_FANTASY":
        this.playMedievalCardSlide(ctx);
        break;
      case "ARABIAN_MAJLIS":
      default:
        this.playArabianCardSlide(ctx);
        break;
    }
  };

  private playArabianCardSlide(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.12);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(1.5, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  private playCyberpunkCardSlide(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Laser sweep & data beam swipe using highpass filter and sawtooth wave
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(3800, now + 0.11);

    filter.type = "highpass";
    filter.frequency.setValueAtTime(1500, now);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  private playDeepSpaceCardSlide(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Cosmic airlock sweep & deep resonant low-frequency sine
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.2);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(380, now);
    filter.Q.setValueAtTime(2.5, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  private playMedievalCardSlide(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Parchment unfurl with metallic steel blade ring
    const noiseBuffer = this.getNoiseBuffer(ctx, 0.12);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = "bandpass";
    nFilter.frequency.setValueAtTime(1200, now);
    nFilter.Q.setValueAtTime(2.0, now);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.0001, now);
    nGain.gain.linearRampToValueAtTime(0.12, now + 0.015);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.12);

    const bladeOsc = ctx.createOscillator();
    const bladeGain = ctx.createGain();
    bladeOsc.type = "triangle";
    bladeOsc.frequency.setValueAtTime(2100, now);
    bladeOsc.frequency.exponentialRampToValueAtTime(920, now + 0.13);
    bladeGain.gain.setValueAtTime(0.0001, now);
    bladeGain.gain.linearRampToValueAtTime(0.07, now + 0.015);
    bladeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    bladeOsc.connect(bladeGain);
    bladeGain.connect(ctx.destination);
    bladeOsc.start(now);
    bladeOsc.stop(now + 0.15);
  }

  /**
   * Sound effect: Snappy card slap onto discard pile
   */
  public playCardSlap = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    switch (this.currentTheme) {
      case "CYBERPUNK_NEON":
        this.playCyberpunkCardSlap(ctx);
        break;
      case "DEEP_SPACE":
        this.playDeepSpaceCardSlap(ctx);
        break;
      case "MEDIEVAL_FANTASY":
        this.playMedievalCardSlap(ctx);
        break;
      case "ARABIAN_MAJLIS":
      default:
        this.playArabianCardSlap(ctx);
        break;
    }
  };

  private playArabianCardSlap(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.06);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  private playCyberpunkCardSlap(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Digital capacitor discharge snap
    const sq = ctx.createOscillator();
    const hp = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    sq.type = "square";
    sq.frequency.setValueAtTime(1400, now);
    sq.frequency.exponentialRampToValueAtTime(250, now + 0.05);

    hp.type = "highpass";
    hp.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

    sq.connect(hp);
    hp.connect(gain);
    gain.connect(ctx.destination);
    sq.start(now);
    sq.stop(now + 0.07);
  }

  private playDeepSpaceCardSlap(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Magnetic dock clamp thud (sub sine drop + pneumatic seal)
    const sub = ctx.createOscillator();
    const gain = ctx.createGain();

    sub.type = "sine";
    sub.frequency.setValueAtTime(95, now);
    sub.frequency.exponentialRampToValueAtTime(35, now + 0.08);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    sub.connect(gain);
    gain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.11);
  }

  private playMedievalCardSlap(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Steel gauntlet slam on oak table
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.07);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.32, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Sound effect: Urgent energetic 'UNO!' shout fanfare & alert
   */
  public playUnoShout = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0, dur: 0.15, vol: 0.22 }, // C5
      { freq: 659.25, time: 0.08, dur: 0.15, vol: 0.25 }, // E5
      { freq: 783.99, time: 0.16, dur: 0.18, vol: 0.28 }, // G5
      { freq: 1046.5, time: 0.24, dur: 0.45, vol: 0.35 } // C6 (Triumphant hold)
    ];

    notes.forEach(({ freq, time, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + time);
      gain.gain.setValueAtTime(0.0001, now + time);
      gain.gain.linearRampToValueAtTime(vol, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);
    });
  };

  /**
   * Sound effect: Triumphant ascending chime for ladder climb (Snakes & Ladders)
   */
  public playLadderAscent = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const notes = [
      { freq: 440.0, time: 0, dur: 0.12, vol: 0.18 }, // A4
      { freq: 554.37, time: 0.07, dur: 0.12, vol: 0.2 }, // C#5
      { freq: 659.25, time: 0.14, dur: 0.14, vol: 0.22 }, // E5
      { freq: 880.0, time: 0.21, dur: 0.16, vol: 0.26 }, // A5
      { freq: 1108.73, time: 0.28, dur: 0.4, vol: 0.32 } // C#6 (triumphant chime)
    ];

    notes.forEach(({ freq, time, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + time);
      gain.gain.setValueAtTime(0.0001, now + time);
      gain.gain.linearRampToValueAtTime(vol, now + time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + dur + 0.04);
    });

    // Add high sparkle overtone
    const sparkleOsc = ctx.createOscillator();
    const sparkleGain = ctx.createGain();
    sparkleOsc.type = "triangle";
    sparkleOsc.frequency.setValueAtTime(1760, now + 0.28);
    sparkleGain.gain.setValueAtTime(0.0001, now + 0.28);
    sparkleGain.gain.linearRampToValueAtTime(0.12, now + 0.3);
    sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    sparkleOsc.connect(sparkleGain);
    sparkleGain.connect(ctx.destination);
    sparkleOsc.start(now + 0.28);
    sparkleOsc.stop(now + 0.75);
  };

  /**
   * Sound effect: Comic sad trombone / downward slide whistle for snake bite
   */
  public playSnakeSlide = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const now = ctx.currentTime;

    // Downward sliding pitch with comical wobble
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.55);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + 0.55);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.03);
    gain.gain.setValueAtTime(0.2, now + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);

    // Comic "sad wah" note at bottom
    const wahOsc = ctx.createOscillator();
    const wahGain = ctx.createGain();
    wahOsc.type = "sine";
    wahOsc.frequency.setValueAtTime(103.83, now + 0.58); // G#2
    wahGain.gain.setValueAtTime(0.0001, now + 0.58);
    wahGain.gain.linearRampToValueAtTime(0.25, now + 0.62);
    wahGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
    wahOsc.connect(wahGain);
    wahGain.connect(ctx.destination);
    wahOsc.start(now + 0.58);
    wahOsc.stop(now + 1.0);
  };

  /**
   * Sound effect: Pawn hop / step
   */
  public playPawnHop = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    switch (this.currentTheme) {
      case "CYBERPUNK_NEON":
        this.playCyberpunkPawnHop(ctx);
        break;
      case "DEEP_SPACE":
        this.playDeepSpacePawnHop(ctx);
        break;
      case "MEDIEVAL_FANTASY":
        this.playMedievalPawnHop(ctx);
        break;
      case "ARABIAN_MAJLIS":
      default:
        this.playArabianPawnHop(ctx);
        break;
    }
  };

  private playArabianPawnHop(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(560, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.045);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(3.0, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.055);
  }

  private playCyberpunkPawnHop(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Robotic servo pulse / electronic blip
    const osc = ctx.createOscillator();
    const hp = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);

    hp.type = "highpass";
    hp.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    osc.connect(hp);
    hp.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  private playDeepSpacePawnHop(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Micro-thruster burst / low magnetic latch
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.05);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  private playMedievalPawnHop(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Steel armor boot stomp on stone floor
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.045);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.26, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  /**
   * Sound effect: Comical slap / capture sound
   */
  public playCaptureSlap = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const now = ctx.currentTime;

    // 1. Noise slap burst
    const bufferSize = Math.floor(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // 2. Punchy comical tone sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);

    // 3. Comic ascending cheer chirp
    const cheer = ctx.createOscillator();
    const cheerGain = ctx.createGain();
    cheer.type = "triangle";
    cheer.frequency.setValueAtTime(500, now + 0.08);
    cheer.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
    cheerGain.gain.setValueAtTime(0.001, now + 0.08);
    cheerGain.gain.linearRampToValueAtTime(0.18, now + 0.12);
    cheerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    cheer.connect(cheerGain);
    cheerGain.connect(ctx.destination);
    cheer.start(now + 0.08);
    cheer.stop(now + 0.32);
  };

  /**
   * Sound effect: Triumphant brass/synth victory fanfare
   */
  public playVictoryFanfare = (): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    switch (this.currentTheme) {
      case "CYBERPUNK_NEON":
        this.playCyberpunkVictoryFanfare(ctx);
        break;
      case "DEEP_SPACE":
        this.playDeepSpaceVictoryFanfare(ctx);
        break;
      case "MEDIEVAL_FANTASY":
        this.playMedievalVictoryFanfare(ctx);
        break;
      case "ARABIAN_MAJLIS":
      default:
        this.playArabianVictoryFanfare(ctx);
        break;
    }
  };

  private playArabianVictoryFanfare(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0, dur: 0.15 }, // C5
      { freq: 659.25, time: 0.14, dur: 0.15 }, // E5
      { freq: 783.99, time: 0.28, dur: 0.18 }, // G5
      { freq: 1046.5, time: 0.44, dur: 0.55 } // C6
    ];

    notes.forEach(({ freq, time, dur }) => {
      const start = now + time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.24, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    });
  }

  private playCyberpunkVictoryFanfare(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Synthwave victory drop: arpeggiated sawtooth chords + punchy bass
    const notes = [
      { freq: 440.0, time: 0, dur: 0.12 }, // A4
      { freq: 554.37, time: 0.1, dur: 0.12 }, // C#5
      { freq: 659.25, time: 0.2, dur: 0.14 }, // E5
      { freq: 880.0, time: 0.32, dur: 0.16 }, // A5
      { freq: 1108.73, time: 0.46, dur: 0.55 } // C#6
    ];

    notes.forEach(({ freq, time, dur }) => {
      const start = now + time;
      const osc = ctx.createOscillator();
      const hp = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, start);

      hp.type = "highpass";
      hp.frequency.setValueAtTime(600, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.22, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(hp);
      hp.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    });
  }

  private playDeepSpaceVictoryFanfare(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Cosmic space symphony: deep sub swell + celestial chord progression
    const sub = ctx.createOscillator();
    const sGain = ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(55, now);
    sGain.gain.setValueAtTime(0.0001, now);
    sGain.gain.linearRampToValueAtTime(0.3, now + 0.1);
    sGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    sub.connect(sGain);
    sGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 1.2);

    const cosmicChords = [
      { freq: 329.63, time: 0, dur: 0.3 }, // E4
      { freq: 440.0, time: 0.18, dur: 0.35 }, // A4
      { freq: 659.25, time: 0.38, dur: 0.45 }, // E5
      { freq: 880.0, time: 0.6, dur: 0.65 } // A5
    ];

    cosmicChords.forEach(({ freq, time, dur }) => {
      const start = now + time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    });
  }

  private playMedievalVictoryFanfare(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Grand royal fanfare: trumpet triads and celebratory kettle drum
    const drum = ctx.createOscillator();
    const dGain = ctx.createGain();
    drum.type = "triangle";
    drum.frequency.setValueAtTime(140, now);
    drum.frequency.exponentialRampToValueAtTime(45, now + 0.4);
    dGain.gain.setValueAtTime(0.35, now);
    dGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    drum.connect(dGain);
    dGain.connect(ctx.destination);
    drum.start(now);
    drum.stop(now + 0.5);

    const fanfare = [
      { freq: 392.0, time: 0.05, dur: 0.16 }, // G4
      { freq: 523.25, time: 0.18, dur: 0.16 }, // C5
      { freq: 659.25, time: 0.32, dur: 0.2 }, // E5
      { freq: 783.99, time: 0.48, dur: 0.65 } // G5
    ];

    fanfare.forEach(({ freq, time, dur }) => {
      const start = now + time;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2200, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.26, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    });
  }

  /**
   * Sound effect: Cultural audio cue for live social emotes & phrases across all themes
   */
  public playReactionCue = (cueType?: string): void => {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const now = ctx.currentTime;

    switch (cueType) {
      // === Arabian Majlis Cues ===
      case "flame": { // "يا لعيب! 🔥" - High energy rising fiery arpeggio
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.055;
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.linearRampToValueAtTime(0.18, t + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.2);
        });
        break;
      }
      case "crown": { // "أكلت الجو! 👑" - Regal majestic brass fanfare
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.07;
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.3);
        });
        break;
      }
      case "dice": { // "حظك يفلق الصخر! 🎲" - Rhythmic tumble + lucky chord
        this.playDiceTumble();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);
        gain.gain.setValueAtTime(0.0001, now + 0.15);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.18);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + 0.15);
        osc.stop(now + 0.5);
        break;
      }
      case "laugh": { // "ما يصحش كده! 😅" - Playful comedic staccato wobble
        const wobble = [330, 415, 330, 494, 392];
        wobble.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.06;
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.linearRampToValueAtTime(0.08, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.09);
        });
        break;
      }
      case "coffee": { // "بالشفا! ☕" - Mellow warm acoustic bell chime
        const notes = [587.33, 880];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.08;
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.45);
        });
        break;
      }
      case "eagle": { // "وين طاير؟ 🦅" - Soaring swooping high slide
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1500, now + 0.18);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.35);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.42);
        break;
      }

      // === Cyberpunk Neon Cues ===
      case "hack": { // "نظامك تهكر! 🤖" - Rapid descending digital glitch laser sweep
        const osc = ctx.createOscillator();
        const hp = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(3200, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.22);
        hp.type = "highpass";
        hp.frequency.setValueAtTime(1400, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.24, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        osc.connect(hp);
        hp.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
        break;
      }
      case "zap": { // "شحنة خارقة! ⚡" - High-voltage electric arc crackle
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.setValueAtTime(2400, now + 0.04);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.22);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.26, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
        break;
      }
      case "glitch": { // "انقطع اتصالك! 💥" - Bitcrushed cyber disconnect drop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(140, now + 0.08);
        osc.frequency.setValueAtTime(50, now + 0.16);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
      case "bypass": { // "تجاوزت الحماية! 🔓" - 3 high-pitch digital cipher beeps
        const beeps = [1400, 1800, 2400];
        beeps.forEach((freq, idx) => {
          const t = now + idx * 0.055;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.linearRampToValueAtTime(0.15, t + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.05);
        });
        break;
      }
      case "overclock": { // "أوفركلوك! 🚀" - Turbo engine revving high-frequency synth sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(3200, now + 0.28);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }
      case "algorithm": { // "خوارزمية محكمة! 🦾" - Robotic servo lock-in + confirmation tone
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = "sine";
        osc2.type = "square";
        osc1.frequency.setValueAtTime(880, now);
        osc2.frequency.setValueAtTime(1320, now + 0.08);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(now);
        osc2.start(now + 0.08);
        osc1.stop(now + 0.32);
        osc2.stop(now + 0.32);
        break;
      }

      // === Deep Space Cues ===
      case "infinity": { // "إلى اللانهاية! 🌌" - Wide celestial chord with cosmic sweep
        const chord = [392.0, 587.33, 880.0, 1318.51];
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.05;
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.6);
        });
        break;
      }
      case "meteor": { // "اصطدام نيزكي! ☄️" - Atmospheric entry woosh + sub crater impact
        const sub = ctx.createOscillator();
        const sGain = ctx.createGain();
        sub.type = "sine";
        sub.frequency.setValueAtTime(180, now);
        sub.frequency.exponentialRampToValueAtTime(38, now + 0.35);
        sGain.gain.setValueAtTime(0.35, now);
        sGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        sub.connect(sGain);
        sGain.connect(ctx.destination);
        sub.start(now);
        sub.stop(now + 0.5);
        break;
      }
      case "blackhole": { // "جاذبية فائقة! 🕳️" - Gravitational pitch drop to 32Hz sub-bass
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.45);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.55);
        break;
      }
      case "torpedo": { // "أطلقت الطوربيدات! 🚀" - Photon torpedo beam launch + echo
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.25);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.24, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.38);
        break;
      }
      case "captain": { // "كابتن الأسطول! 👨‍🚀" - Starship bridge intercom chime + fanfare
        const notes = [587.33, 880.0, 1174.66];
        notes.forEach((freq, idx) => {
          const t = now + idx * 0.09;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.linearRampToValueAtTime(0.2, t + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.35);
        });
        break;
      }
      case "lost_space": { // "ضعت في الفضاء! 🛸" - Eerie floating theremin space wobble
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(620, now + 0.12);
        osc.frequency.linearRampToValueAtTime(390, now + 0.28);
        osc.frequency.linearRampToValueAtTime(520, now + 0.42);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.55);
        break;
      }

      // === Medieval Fantasy Cues ===
      case "kingdom": { // "لتحيا المملكة! ⚔️" - Heraldic horn blast + clashing swords
        const horn = ctx.createOscillator();
        const gain = ctx.createGain();
        horn.type = "triangle";
        horn.frequency.setValueAtTime(293.66, now);
        horn.frequency.setValueAtTime(440.0, now + 0.08);
        horn.frequency.setValueAtTime(587.33, now + 0.16);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        horn.connect(gain);
        gain.connect(ctx.destination);
        horn.start(now);
        horn.stop(now + 0.5);
        break;
      }
      case "knight_treachery": { // "غدر الفرسان! 🛡️" - Heavy shield block bang + tense blade draw
        const clang = ctx.createOscillator();
        const cGain = ctx.createGain();
        clang.type = "square";
        clang.frequency.setValueAtTime(750, now);
        clang.frequency.exponentialRampToValueAtTime(180, now + 0.18);
        cGain.gain.setValueAtTime(0.25, now);
        cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        clang.connect(cGain);
        cGain.connect(ctx.destination);
        clang.start(now);
        clang.stop(now + 0.28);
        break;
      }
      case "dragon_fire": { // "نار التنين! 🐉" - Dragon roar / flame burst noise sweep
        const roar = ctx.createOscillator();
        const rGain = ctx.createGain();
        roar.type = "sawtooth";
        roar.frequency.setValueAtTime(140, now);
        roar.frequency.exponentialRampToValueAtTime(55, now + 0.35);
        rGain.gain.setValueAtTime(0.3, now);
        rGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        roar.connect(rGain);
        rGain.connect(ctx.destination);
        roar.start(now);
        roar.stop(now + 0.45);
        break;
      }
      case "wizard_spell": { // "ضربة الساحر! 🧙‍♂️" - Sparkling mystical magic twinkle
        const sparkle = [1760.0, 2200.0, 2640.0, 3520.0];
        sparkle.forEach((freq, idx) => {
          const t = now + idx * 0.055;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.linearRampToValueAtTime(0.2, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.35);
        });
        break;
      }
      case "castle_siege": { // "حصار محكم! 🏰" - Heavy catapult stone impact
        const stone = ctx.createOscillator();
        const sGain = ctx.createGain();
        stone.type = "triangle";
        stone.frequency.setValueAtTime(180, now);
        stone.frequency.exponentialRampToValueAtTime(45, now + 0.3);
        sGain.gain.setValueAtTime(0.35, now);
        sGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        stone.connect(sGain);
        sGain.connect(ctx.destination);
        stone.start(now);
        stone.stop(now + 0.45);
        break;
      }
      case "crown_fallen": { // "سقط التاج! 👑" - Crown tumbling on stone floor with ringing bell resonance
        const crown = ctx.createOscillator();
        const cGain = ctx.createGain();
        crown.type = "sine";
        crown.frequency.setValueAtTime(1480, now);
        crown.frequency.exponentialRampToValueAtTime(740, now + 0.35);
        cGain.gain.setValueAtTime(0.0001, now);
        cGain.gain.linearRampToValueAtTime(0.24, now + 0.01);
        cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        crown.connect(cGain);
        cGain.connect(ctx.destination);
        crown.start(now);
        crown.stop(now + 0.5);
        break;
      }

      default:
        this.playTurnChime();
        break;
    }
  };
}

export const sfx = new GameSynthesizer();

/**
 * Helper to update global audio theme
 */
export function setAudioTheme(themeId: string): void {
  sfx.setAudioTheme(themeId);
}

/**
 * Helper to retrieve active audio theme
 */
export function getAudioTheme(): string {
  return sfx.getAudioTheme();
}

/**
 * State and guards for speech synthesis queue and anti-thrashing
 */
let lastSpokenText = "";
let lastSpokenTime = 0;
let ttsSafetyTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Speaks Arabic text aloud using the browser's built-in Web Speech API (speechSynthesis).
 * Features Anti-Thrashing Guard to prevent repetitive stutters and cutoffs during fast turn transitions.
 * Returns a Promise that resolves when speech completes or safety timeout elapses.
 */
export function speakArabicNarrator(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }

    const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim();
    if (!cleanText) {
      resolve();
      return;
    }

    const now = Date.now();

    // Guard 1: Prevent repeating identical text within 2.5 seconds
    if (cleanText === lastSpokenText && now - lastSpokenTime < 2500) {
      resolve();
      return;
    }

    // Guard 2: Prevent cutting off an in-progress sentence if less than 1.6s has elapsed
    if (window.speechSynthesis.speaking && now - lastSpokenTime < 1600) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      lastSpokenText = cleanText;
      lastSpokenTime = now;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "ar-SA";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find((v) => v.lang.startsWith("ar"));
      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }

      if (ttsSafetyTimer) clearTimeout(ttsSafetyTimer);
      ttsSafetyTimer = setTimeout(() => {
        resolve();
      }, 3000);

      utterance.onend = () => {
        if (ttsSafetyTimer) clearTimeout(ttsSafetyTimer);
        resolve();
      };
      utterance.onerror = () => {
        if (ttsSafetyTimer) clearTimeout(ttsSafetyTimer);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("[TTS] Speech synthesis error:", err);
      resolve();
    }
  });
}

export const speakArabicAnnouncement = speakArabicNarrator;

export default sfx;
