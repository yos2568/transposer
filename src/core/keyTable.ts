import { INSTRUMENTS } from './instruments';
import { keySignatureAccidentals, simplifyKey, transposeKey } from './transpose';
import type { Direction, Instrument, MusicalKey } from './types';

export interface KeyRow {
  instrument: Instrument;
  /** The key for this instrument: written if the source was concert, and vice versa. */
  target: MusicalKey;
  /** Sharps (positive) or flats (negative) in the target key signature. */
  accidentals: number;
}

export interface KeyTableOptions {
  /**
   * Respell to the simpler enharmonic key: double-accidental tonics, and keys
   * with more than 6 accidentals (C# major -> Db major). Default true.
   */
  respell?: boolean;
}

/**
 * Convert one key for every instrument in the table.
 * `direction` describes the SOURCE key: "writtenToConcert" means the source is
 * a written key and the rows give concert keys.
 */
export function keyTable(source: MusicalKey, direction: Direction, options: KeyTableOptions = {}): KeyRow[] {
  const respell = options.respell ?? true;
  return INSTRUMENTS.map((instrument) => {
    const converted = transposeKey(source, instrument, direction, { simplify: respell });
    const target = respell ? simplifyKey(converted) : converted;
    return { instrument, target, accidentals: keySignatureAccidentals(target) };
  });
}

/** Compact form for tiles and pills: "3♯", "2♭", or "—" for none. */
export function shortSignature(accidentals: number): string {
  if (accidentals === 0) return '—';
  return accidentals > 0 ? `${accidentals}♯` : `${-accidentals}♭`;
}

/** "3♯", "2♭", or "No sharps or flats". */
export function formatKeySignature(accidentals: number): string {
  if (accidentals === 0) return 'No sharps or flats';
  return accidentals > 0 ? `${accidentals}♯` : `${-accidentals}♭`;
}

/**
 * Describe a transposition in words, from the written pitch to the concert pitch.
 * "-2M" -> "sounds M2 lower"; "+8P" -> "sounds P8 higher"; "1P" -> "Non-transposing".
 */
export function describeTransposition(transposition: string): string {
  if (transposition === '1P') return 'Non-transposing';
  const higher = transposition.startsWith('+');
  const body = transposition.replace(/^[+-]/, '');
  const match = body.match(/^(\d+)([PMmAd])$/);
  if (!match) return transposition;
  const [, number, quality] = match;
  return `sounds ${quality}${number} ${higher ? 'higher' : 'lower'}`;
}
