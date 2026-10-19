import { concertToWritten, writtenToConcert } from './transpose';
import type { Direction, Instrument, Pitch } from './types';

export type Duration = 'w' | 'h' | 'q' | 'e' | 's';

export const DURATIONS: Duration[] = ['w', 'h', 'q', 'e', 's'];

export const DURATION_BEATS: Record<Duration, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };

export const DURATION_LABEL: Record<Duration, string> = {
  w: 'Whole',
  h: 'Half',
  q: 'Quarter',
  e: 'Eighth',
  s: '16th',
};

/** An empty `pitches` array is a rest. Several pitches form a chord. */
export interface MelodyEvent {
  pitches: Pitch[];
  duration: Duration;
}

/**
 * Convert every pitch in a melody. `direction` describes the SOURCE:
 * "writtenToConcert" means the events are written and the result is concert.
 */
export function transposeEvents(
  events: MelodyEvent[],
  instrument: Instrument,
  direction: Direction,
  respell = true,
): MelodyEvent[] {
  const convert = direction === 'writtenToConcert' ? writtenToConcert : concertToWritten;
  return events.map((e) => ({
    duration: e.duration,
    pitches: e.pitches.map((p) => convert(p, instrument, { simplify: respell })),
  }));
}

/** Start time of each event, in beats from the beginning. */
export function eventStartBeats(events: MelodyEvent[]): number[] {
  let t = 0;
  return events.map((e) => {
    const start = t;
    t += DURATION_BEATS[e.duration];
    return start;
  });
}

export function totalBeats(events: MelodyEvent[]): number {
  return events.reduce((sum, e) => sum + DURATION_BEATS[e.duration], 0);
}

export function playbackSeconds(events: MelodyEvent[], bpm: number): number {
  return (totalBeats(events) * 60) / bpm;
}

/** Split a list into rows of at most `perRow` items, for systems on the page. */
export function chunkRows<T>(items: T[], perRow: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow));
  return rows;
}
