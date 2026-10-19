import type { Clef } from '../core/types';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/** Diatonic number: octave * 7 + letter index (C=0 ... B=6). E4 is 30. */
export function diatonicToPitch(d: number, accidental: '' | '#' | 'b' = ''): string {
  const letter = LETTERS[((d % 7) + 7) % 7];
  return `${letter}${accidental}${Math.floor(d / 7)}`;
}

/** Diatonic number of the top staff line: F5 on treble, A3 on bass. */
const TOP_LINE: Record<'treble' | 'bass', number> = { treble: 38, bass: 26 };

/**
 * Pitch at a point on a staff. `y` and `topLineY` are in the same units as the
 * drawing. Each half-spacing is one diatonic step, so lines and spaces both map.
 */
export function pitchAtStaffY(
  y: number,
  clef: Clef,
  topLineY: number,
  spacing = 10,
  accidental: '' | '#' | 'b' = '',
): string {
  const steps = Math.round((y - topLineY) / (spacing / 2));
  return diatonicToPitch(TOP_LINE[clef === 'bass' ? 'bass' : 'treble'] - steps, accidental);
}
