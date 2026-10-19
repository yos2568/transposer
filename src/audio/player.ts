import { Note } from 'tonal';
import { DURATION_BEATS, type MelodyEvent } from '../core/melody';

export interface PlaybackHandle {
  stop: () => void;
}

/**
 * Play a melody with simple synthesized tones (no sample files needed).
 * Pass the CONCERT events, since that is what sounds. Rests are silent.
 * `onEnd` runs once the melody finishes, or when it is stopped.
 * `onEvent` runs as each event starts, with its index, so the screen can follow along.
 */
export function playMelody(
  events: MelodyEvent[],
  bpm: number,
  onEnd?: () => void,
  onEvent?: (index: number) => void,
): PlaybackHandle | null {
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;

  const ctx = new AudioCtor();
  const beat = 60 / bpm;
  const start = ctx.currentTime + 0.05;
  let t = start;
  const oscillators: OscillatorNode[] = [];
  const timers: number[] = [];

  events.forEach((event, index) => {
    const dur = DURATION_BEATS[event.duration] * beat;
    const gainPerNote = event.pitches.length > 0 ? 0.16 / Math.sqrt(event.pitches.length) : 0;

    if (onEvent) timers.push(window.setTimeout(() => onEvent(index), Math.max(0, (t - ctx.currentTime) * 1000)));

    for (const pitch of event.pitches) {
      const freq = Note.freq(pitch);
      if (!freq) continue;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      // Short attack, sustain, quick release so repeated notes stay distinct.
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(gainPerNote, t + 0.015);
      gain.gain.setValueAtTime(gainPerNote, t + dur * 0.85);
      gain.gain.linearRampToValueAtTime(0, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
      oscillators.push(osc);
    }
    t += dur;
  });

  const totalMs = (t - ctx.currentTime + 0.3) * 1000;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(endTimer);
    timers.forEach((id) => clearTimeout(id));
    void ctx.close();
    onEnd?.();
  };
  const endTimer = window.setTimeout(finish, totalMs);

  return {
    stop: () => {
      oscillators.forEach((o) => {
        try {
          o.stop();
        } catch {
          // Already stopped.
        }
      });
      finish();
    },
  };
}
