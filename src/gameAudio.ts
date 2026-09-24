export type GameAudioCue = 'navigate' | 'confirm' | 'report' | 'warning' | 'crisis' | 'achievement';

const cuePatterns: Record<GameAudioCue, { notes: number[]; duration: number; gain: number; wave: OscillatorType }> = {
  navigate: { notes: [330, 440], duration: 0.045, gain: 0.018, wave: 'sine' },
  confirm: { notes: [392, 523, 659], duration: 0.065, gain: 0.028, wave: 'triangle' },
  report: { notes: [294, 370], duration: 0.08, gain: 0.022, wave: 'sine' },
  warning: { notes: [220, 185], duration: 0.11, gain: 0.032, wave: 'triangle' },
  crisis: { notes: [147, 147, 196], duration: 0.12, gain: 0.038, wave: 'sawtooth' },
  achievement: { notes: [392, 523, 659, 784], duration: 0.085, gain: 0.032, wave: 'triangle' },
};

let context: AudioContext | null = null;

export function inferGameAudioCue(message: string): GameAudioCue {
  if (/위기|실패|부족|위험|결렬|패배|공격/.test(message)) return 'warning';
  if (/달성|승리|해금|승진|확보|완료/.test(message)) return 'confirm';
  return 'report';
}

export function playGameAudioCue(cue: GameAudioCue, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined') return;
  const AudioContextConstructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return;
  try {
    context ??= new AudioContextConstructor();
    if (context.state === 'suspended') void context.resume();
    const pattern = cuePatterns[cue];
    const start = context.currentTime + 0.006;
    pattern.notes.forEach((frequency, index) => {
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();
      const noteStart = start + index * pattern.duration * 0.9;
      oscillator.type = pattern.wave;
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(pattern.gain, noteStart + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + pattern.duration);
      oscillator.connect(gain);
      gain.connect(context!.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + pattern.duration + 0.01);
    });
  } catch {
    // Audio is progressive enhancement; browsers may deny playback until a gesture.
  }
}

