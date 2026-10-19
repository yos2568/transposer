import { Note } from 'tonal';
import type { Pitch } from '../core/types';

export interface VexNote {
  /** VexFlow key, e.g. "b/3". Accidentals are applied separately. */
  key: string;
  /** VexFlow accidental code, e.g. "#", "b", "bb", or "" for naturals. */
  accidental: string;
  clef: 'treble' | 'bass';
  midi: number;
}

/**
 * Convert a scientific-pitch string ("Bb3", "C#4") into VexFlow's key form.
 * VexFlow takes the letter and octave as the key and the accidental as a
 * separate modifier, so double accidentals work ("b/3" + "bb").
 */
export function toVexNote(pitch: Pitch): VexNote {
  const note = Note.get(pitch);
  if (note.empty || note.oct === undefined || note.midi === null) {
    throw new Error(`Invalid pitch: ${pitch}`);
  }
  return {
    key: `${note.letter.toLowerCase()}/${note.oct}`,
    accidental: note.acc,
    clef: note.midi >= 60 ? 'treble' : 'bass',
    midi: note.midi,
  };
}

/**
 * Split pitches into treble and bass groups, lowest first. Middle C (C4) is treble.
 * Duplicate pitches (same MIDI number) are merged, so a repeated note is drawn once.
 */
export function splitByClef(pitches: Pitch[]): { treble: VexNote[]; bass: VexNote[] } {
  const seen = new Set<number>();
  const notes = pitches
    .map(toVexNote)
    .sort((a, b) => a.midi - b.midi)
    .filter((n) => {
      if (seen.has(n.midi)) return false;
      seen.add(n.midi);
      return true;
    });
  return {
    treble: notes.filter((n) => n.clef === 'treble'),
    bass: notes.filter((n) => n.clef === 'bass'),
  };
}
