/** Scientific pitch notation, e.g. "C4", "Bb3", "F#5". */
export type Pitch = string;

export type Clef = 'treble' | 'bass' | 'alto' | 'tenor';

export type Family =
  | 'woodwind'
  | 'saxophone'
  | 'brass'
  | 'string'
  | 'guitar'
  | 'percussion'
  | 'keyboard'
  | 'other';

export interface PitchRange {
  low: Pitch;
  high: Pitch;
}

export interface Instrument {
  id: string;
  name: string;
  family: Family;
  /**
   * Interval from written to concert pitch, as a tonal interval string.
   * Concert = written + transposition. Examples: "-2M" (Bb clarinet sounds a
   * major second lower), "-8P" (double bass sounds an octave lower).
   */
  transposition: string;
  writtenClef: Clef;
  /**
   * Approximate practical range in WRITTEN pitch. `null` means not yet
   * defined; range checks return "unknown" for these instruments.
   */
  writtenRange: PitchRange | null;
}

export type Direction = 'writtenToConcert' | 'concertToWritten';

export type KeyMode = 'major' | 'minor';

export interface MusicalKey {
  tonic: string;
  mode: KeyMode;
}
