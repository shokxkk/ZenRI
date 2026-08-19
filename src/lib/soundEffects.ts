'use client';

/**
 * ZenRI Premium Sound Design — Apple-inspired UI Audio System
 *
 * Техники:
 * - White noise bursts для механических кликов (как механическая клавиатура Apple)
 * - Multi-oscillator chords с мягким envelope для нотных звуков
 * - Exponential decay для пружинного ощущения
 * - Compressor для ограничения динамики и профессионального звука
 * - Filter sweep для текстурных звуков (как UIKit / SwiftUI)
 */

class SoundEffects {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isMuted = localStorage.getItem('zenri_sound_muted') === 'true';
    }
  }

  public getMuted(): boolean { return this.isMuted; }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('zenri_sound_muted', String(this.isMuted));
    }
    return this.isMuted;
  }

  // ─── Инициализация Audio Graph ───────────────────────────────────────────
  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;

      this.audioCtx = new AudioCtxClass();

      // Master gain — общая громкость (нежно, как Apple)
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 0.72;

      // Compressor — срезает пики, убирает грубость
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 8;
      this.compressor.ratio.value = 3;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  private getOutput(): AudioNode | null {
    this.getContext();
    return this.masterGain;
  }

  // ─── Haptic ───────────────────────────────────────────────────────────────
  public triggerVibration(pattern: number | number[] = 15) {
    if (this.isMuted) return;
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(pattern); } catch {}
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Создаёт белый шум (noise burst) — основа механического клика */
  private createNoiseBurst(
    ctx: AudioContext,
    output: AudioNode,
    duration: number,
    volume: number,
    startTime: number,
    filterFreq = 3000,
    filterQ = 0.8
  ) {
    const bufferSize = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // BPF filter придаёт цвет шуму
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    source.start(startTime);
    source.stop(startTime + duration);
  }

  /** Создаёт один тон с быстрым attack и exponential decay */
  private createTone(
    ctx: AudioContext,
    output: AudioNode,
    freq: number,
    volume: number,
    startTime: number,
    duration: number,
    type: OscillatorType = 'sine',
    freqEnd?: number
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);
    }

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.004); // быстрый attack
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(output);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUND 1: UI CLICK — Тактильный механический щелчок (как TrackPad Apple)
  // ═══════════════════════════════════════════════════════════════════════════
  public playClick() {
    this.triggerVibration(8);
    const ctx = this.getContext();
    const out = this.getOutput();
    if (!ctx || !out) return;

    const t = ctx.currentTime;

    // Noise burst — механическая часть
    this.createNoiseBurst(ctx, out, 0.028, 0.35, t, 4500, 1.2);

    // Тихий подтон для "тела" клика
    this.createTone(ctx, out, 1200, 0.06, t, 0.025, 'sine', 600);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUND 2: APP OPEN — Мягкий приветственный аккорд (как iPhone при включении)
  // ═══════════════════════════════════════════════════════════════════════════
  public playAppOpen() {
    this.triggerVibration([10, 30, 10]);
    const ctx = this.getContext();
    const out = this.getOutput();
    if (!ctx || !out) return;

    const t = ctx.currentTime;

    // Major 7th chord: C5 + E5 + G5 + B5 (приятный, воздушный)
    const chord = [
      { freq: 523.25, delay: 0.0, vol: 0.12, dur: 0.55 },  // C5
      { freq: 659.25, delay: 0.06, vol: 0.10, dur: 0.5 },  // E5
      { freq: 783.99, delay: 0.12, vol: 0.09, dur: 0.45 }, // G5
      { freq: 987.77, delay: 0.18, vol: 0.08, dur: 0.4 },  // B5
    ];

    chord.forEach(({ freq, delay, vol, dur }) => {
      this.createTone(ctx, out, freq, vol, t + delay, dur, 'sine');
    });

    // Воздушный шум-атмосфера
    this.createNoiseBurst(ctx, out, 0.08, 0.04, t, 8000, 0.5);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUND 3: SUCCESS / INCOME — Радостный восходящий звук (как Siri success)
  // ═══════════════════════════════════════════════════════════════════════════
  public playIncomeSound() {
    this.triggerVibration([15, 20, 30]);
    const ctx = this.getContext();
    const out = this.getOutput();
    if (!ctx || !out) return;

    const t = ctx.currentTime;

    // Восходящий арпеджио + верхняя нота-"звезда"
    const notes = [
      { freq: 659.25, delay: 0.0,  vol: 0.13, dur: 0.18 }, // E5
      { freq: 783.99, delay: 0.08, vol: 0.12, dur: 0.18 }, // G5
      { freq: 1046.5, delay: 0.16, vol: 0.14, dur: 0.32 }, // C6 — финальная нота
    ];

    notes.forEach(({ freq, delay, vol, dur }) => {
      this.createTone(ctx, out, freq, vol, t + delay, dur, 'sine');
      // Обертон — делает звук "блестящим"
      this.createTone(ctx, out, freq * 2, vol * 0.25, t + delay, dur * 0.6, 'sine');
    });

    // Sparkle noise
    this.createNoiseBurst(ctx, out, 0.05, 0.06, t + 0.16, 10000, 0.4);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUND 4: EXPENSE — Лёгкий нисходящий звук (ненавязчивый, не пугающий)
  // ═══════════════════════════════════════════════════════════════════════════
  public playExpenseSound() {
    this.triggerVibration(12);
    const ctx = this.getContext();
    const out = this.getOutput();
    if (!ctx || !out) return;

    const t = ctx.currentTime;

    // Нисходящий мягкий тон — G5 → E5
    this.createTone(ctx, out, 783.99, 0.12, t, 0.18, 'sine', 659.25);
    // Гармоника
    this.createTone(ctx, out, 523.25, 0.07, t + 0.04, 0.15, 'sine', 440);

    // Тихий удар
    this.createNoiseBurst(ctx, out, 0.02, 0.20, t, 2000, 1.5);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUND 5: TASK COMPLETE — Удовлетворяющий "done" звук (как ✓ в Reminders)
  // ═══════════════════════════════════════════════════════════════════════════
  public playTaskSuccessSound() {
    this.triggerVibration([10, 15]);
    const ctx = this.getContext();
    const out = this.getOutput();
    if (!ctx || !out) return;

    const t = ctx.currentTime;

    // Двойной тон — как "тик-так" завершения
    this.createTone(ctx, out, 880,    0.12, t,       0.12, 'sine');
    this.createTone(ctx, out, 1174.7, 0.14, t + 0.1, 0.22, 'sine');

    // Micro noise для текстуры
    this.createNoiseBurst(ctx, out, 0.015, 0.15, t, 5000, 1.0);
    this.createNoiseBurst(ctx, out, 0.015, 0.12, t + 0.1, 6000, 1.0);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUND 6: HABIT STREAK — Торжественный аккорд (как "Achievement Unlocked")
  // ═══════════════════════════════════════════════════════════════════════════
  public playHabitSuccessSound() {
    this.triggerVibration([10, 20, 10, 20, 40]);
    const ctx = this.getContext();
    const out = this.getOutput();
    if (!ctx || !out) return;

    const t = ctx.currentTime;

    // Восходящий maj7 квинт-арпеджио — торжественно, но нежно
    const notes = [
      { freq: 440,   delay: 0.00, vol: 0.10, dur: 0.4  }, // A4
      { freq: 554.4, delay: 0.07, vol: 0.10, dur: 0.35 }, // C#5
      { freq: 659.3, delay: 0.14, vol: 0.11, dur: 0.35 }, // E5
      { freq: 880,   delay: 0.21, vol: 0.13, dur: 0.5  }, // A5
    ];

    notes.forEach(({ freq, delay, vol, dur }) => {
      this.createTone(ctx, out, freq, vol, t + delay, dur, 'sine');
      this.createTone(ctx, out, freq * 2, vol * 0.15, t + delay, dur * 0.5, 'sine');
    });

    // Финальный sparkle
    this.createNoiseBurst(ctx, out, 0.06, 0.05, t + 0.25, 12000, 0.3);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUND 7: ERROR / WARNING — Мягкий двойной buzz (как iOS error haptic)
  // ═══════════════════════════════════════════════════════════════════════════
  public playError() {
    this.triggerVibration([30, 20, 30]);
    const ctx = this.getContext();
    const out = this.getOutput();
    if (!ctx || !out) return;

    const t = ctx.currentTime;

    // Нисходящий интервал — малая терция вниз (грустный)
    this.createTone(ctx, out, 440, 0.12, t,       0.15, 'sine', 392);
    this.createTone(ctx, out, 440, 0.10, t + 0.2, 0.15, 'sine', 370);

    this.createNoiseBurst(ctx, out, 0.025, 0.12, t, 800, 0.7);
    this.createNoiseBurst(ctx, out, 0.020, 0.10, t + 0.2, 800, 0.7);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUND 8: NOTIFICATION / PING — Тихий кристальный звон (как Notification)
  // ═══════════════════════════════════════════════════════════════════════════
  public playNotification() {
    this.triggerVibration([5, 15, 5]);
    const ctx = this.getContext();
    const out = this.getOutput();
    if (!ctx || !out) return;

    const t = ctx.currentTime;

    // Высокий "динь" с долгим затуханием
    this.createTone(ctx, out, 1318.5, 0.11, t,       0.45, 'sine'); // E6
    this.createTone(ctx, out, 1567.0, 0.08, t + 0.1, 0.35, 'sine'); // G6

    this.createNoiseBurst(ctx, out, 0.012, 0.08, t, 9000, 0.4);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUND 9: COPY / CLIPBOARD — Короткий "pop" (как macOS copy)
  // ═══════════════════════════════════════════════════════════════════════════
  public playCopy() {
    this.triggerVibration(6);
    const ctx = this.getContext();
    const out = this.getOutput();
    if (!ctx || !out) return;

    const t = ctx.currentTime;

    // Мягкий pop: короткий высокий noise + тон
    this.createNoiseBurst(ctx, out, 0.018, 0.30, t, 3500, 1.4);
    this.createTone(ctx, out, 1046.5, 0.07, t, 0.07, 'sine', 800);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUND 10: MODAL OPEN — Плавный sweep вверх (как Sheet presentation iOS)
  // ═══════════════════════════════════════════════════════════════════════════
  public playModalOpen() {
    this.triggerVibration(8);
    const ctx = this.getContext();
    const out = this.getOutput();
    if (!ctx || !out) return;

    const t = ctx.currentTime;

    // Sweep от низкого к высокому — ощущение "выезжания"
    this.createTone(ctx, out, 280, 0.07, t, 0.18, 'sine', 560);
    this.createNoiseBurst(ctx, out, 0.05, 0.05, t + 0.05, 6000, 0.6);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUND 11: MODAL CLOSE / DISMISS — Sweep вниз
  // ═══════════════════════════════════════════════════════════════════════════
  public playModalClose() {
    this.triggerVibration(6);
    const ctx = this.getContext();
    const out = this.getOutput();
    if (!ctx || !out) return;

    const t = ctx.currentTime;

    this.createTone(ctx, out, 560, 0.06, t, 0.14, 'sine', 280);
    this.createNoiseBurst(ctx, out, 0.03, 0.04, t, 4000, 0.8);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUND 12: TOGGLE ON — Satisfying "flip" (как toggle switch iOS)
  // ═══════════════════════════════════════════════════════════════════════════
  public playToggleOn() {
    this.triggerVibration(10);
    const ctx = this.getContext();
    const out = this.getOutput();
    if (!ctx || !out) return;

    const t = ctx.currentTime;

    this.createNoiseBurst(ctx, out, 0.022, 0.28, t, 5500, 1.0);
    this.createTone(ctx, out, 900, 0.08, t, 0.08, 'sine', 1200);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUND 13: TOGGLE OFF
  // ═══════════════════════════════════════════════════════════════════════════
  public playToggleOff() {
    this.triggerVibration(8);
    const ctx = this.getContext();
    const out = this.getOutput();
    if (!ctx || !out) return;

    const t = ctx.currentTime;

    this.createNoiseBurst(ctx, out, 0.022, 0.22, t, 3500, 1.2);
    this.createTone(ctx, out, 700, 0.07, t, 0.08, 'sine', 500);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUND 14: SYNC / REFRESH — Плавный "whoosh" (как pull-to-refresh)
  // ═══════════════════════════════════════════════════════════════════════════
  public playSync() {
    this.triggerVibration([5, 10, 5]);
    const ctx = this.getContext();
    const out = this.getOutput();
    if (!ctx || !out) return;

    const t = ctx.currentTime;

    // Круговой sweep: вверх-вниз
    this.createTone(ctx, out, 400, 0.06, t, 0.2, 'sine', 800);
    this.createTone(ctx, out, 800, 0.05, t + 0.2, 0.2, 'sine', 500);
    this.createNoiseBurst(ctx, out, 0.08, 0.04, t + 0.15, 7000, 0.4);
  }
}

export const soundFx = new SoundEffects();
