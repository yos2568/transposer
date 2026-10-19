import { Note } from 'tonal';
import type { Direction, Instrument, MusicalKey, Pitch } from './types';

/**
 * Invert a tonal interval string: "-2M" -> "2M", "+8P" -> "-8P", "8P" -> "-8P".
 * Unison is its own inverse.
 */
export function invertInterval(interval: string): string {
  const trimmed = interval.replace(/^\+/, '');
  if (trimmed === '1P') return '1P';
  return trimmed.startsWith('-') ? trimmed.slice(1) : `-${trimmed}`;
}

/** Interval that takes a pitch in one direction; written<->concert. */
export function intervalFor(instrument: Instrument, direction: Direction): string {
  return direction === 'writtenToConcert'
    ? instrument.transposition
    : invertInterval(instrument.transposition);
}

export interface TransposeOptions {
  /** Respell to the simplest enharmonic (B# -> C, Cb -> B). Default false. */
  simplify?: boolean;
}

function shift(pitch: Pitch, interval: string, { simplify = false }: TransposeOptions): Pitch {
  const result = Note.transpose(pitch, interval);
  if (!result || Note.get(result).empty) {
    throw new Error(`Cannot transpose ${pitch} by ${interval}`);
  }
  return simplify ? Note.simplify(result) : result;
}

/** Written pitch -> concert (sounding) pitch. */
export function writtenToConcert(pitch: Pitch, instrument: Instrument, options: TransposeOptions = {}): Pitch {
  return shift(pitch, instrument.transposition, options);
}

/** Concert (sounding) pitch -> written pitch. */
export function concertToWritten(pitch: Pitch, instrument: Instrument, options: TransposeOptions = {}): Pitch {
  return shift(pitch, invertInterval(instrument.transposition), options);
}

/** Transpose a key's tonic in the given direction. Mode is kept. */
export function transposeKey(key: MusicalKey, instrument: Instrument, direction: Direction, options: TransposeOptions = {}): MusicalKey {
  return {
    tonic: shift(key.tonic, intervalFor(instrument, direction), options),
    mode: key.mode,
  };
}

/** Number of sharps (positive) or flats (negative) in a key signature. */
export function keySignatureAccidentals(key: MusicalKey): number {
  const note = Note.get(key.tonic);
  if (note.empty) throw new Error(`Invalid key tonic: ${key.tonic}`);
  const letterFifths: Record<string, number> = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, F: -1 };
  const majorFifths = letterFifths[note.letter] + 7 * note.alt;
  return key.mode === 'major' ? majorFifths : majorFifths - 3;
}

/**
 * Swap a key to its enharmonic equivalent when the signature has more than
 * 6 accidentals (e.g. C# major -> Db major). Exactly 6 is left as-is.
 */
export function simplifyKey(key: MusicalKey): MusicalKey {
  const count = keySignatureAccidentals(key);
  if (Math.abs(count) <= 6) return key;
  return { tonic: Note.enharmonic(key.tonic), mode: key.mode };
}
