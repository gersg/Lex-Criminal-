// Procedural Web Audio API synthesizer (zero external dependencies)

let audioCtx: AudioContext | null = null;

const STAGE_FREQUENCIES = [523.25, 587.33, 659.25, 783.99, 880.0]; // C5, D5, E5, G5, A5

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playTone(freq = 659.25, durationSec = 0.22, gainPeak = 0.06): void {
  const ctx = ensureContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + durationSec + 0.02);
}

export function playStageChime(stageIndex: number, enabled: boolean): void {
  if (!enabled) return;
  const freq = STAGE_FREQUENCIES[stageIndex] ?? 659.25;
  playTone(freq, 0.28, 0.055);
}

export function playInteractionPing(enabled: boolean, freq = 783.99): void {
  if (!enabled) return;
  playTone(freq, 0.16, 0.04);
}
