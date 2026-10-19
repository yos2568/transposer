import type { Instrument } from '../core/types';
import { instrumentNameTh } from './instrumentNamesTh';

/** True when the query matches the instrument's English name, its Thai name, or its family label. */
export function matchesInstrument(instrument: Instrument, query: string, familyLabel: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    instrument.name.toLowerCase().includes(q) ||
    instrumentNameTh(instrument.name).toLowerCase().includes(q) ||
    familyLabel.toLowerCase().includes(q)
  );
}
