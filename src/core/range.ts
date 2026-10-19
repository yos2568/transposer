import { Note } from 'tonal';
import type { Instrument, Pitch } from './types';

export type RangeStatus = 'ok' | 'below' | 'above' | 'unknown';

/**
 * Check a WRITTEN pitch against the instrument's practical written range.
 * Returns "unknown" when the instrument has no range defined yet.
 */
export function checkWrittenRange(pitch: Pitch, instrument: Instrument): RangeStatus {
  if (!instrument.writtenRange) return 'unknown';
  const midi = Note.midi(pitch);
  const low = Note.midi(instrument.writtenRange.low);
  const high = Note.midi(instrument.writtenRange.high);
  if (midi === null || low === null || high === null) {
    throw new Error(`Invalid pitch or range for ${instrument.id}: ${pitch}`);
  }
  if (midi < low) return 'below';
  if (midi > high) return 'above';
  return 'ok';
}
