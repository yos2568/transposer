import { describe, expect, it } from 'vitest';
import { Interval, Note } from 'tonal';
import { INSTRUMENTS, getInstrument } from '../core/instruments';
import { invertInterval } from '../core/transpose';

describe('instrument table', () => {
  it('has unique ids', () => {
    const ids = INSTRUMENTS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every transposition is a valid tonal interval', () => {
    for (const inst of INSTRUMENTS) {
      expect(Interval.get(invertInterval(inst.transposition)).empty, inst.id).toBe(false);
    }
  });

  it('defined ranges are ordered low < high', () => {
    for (const inst of INSTRUMENTS) {
      if (!inst.writtenRange) continue;
      const low = Note.midi(inst.writtenRange.low);
      const high = Note.midi(inst.writtenRange.high);
      expect(low, inst.id).not.toBeNull();
      expect(high, inst.id).not.toBeNull();
      expect(low!, inst.id).toBeLessThan(high!);
    }
  });

  it('getInstrument throws on unknown id', () => {
    expect(() => getInstrument('kazoo')).toThrow();
  });
});

describe('sourced transpositions', () => {
  const cases: Array<[string, string, string]> = [
    ['sopranino-sax', 'C4', 'Eb4'],
    ['soprano-cornet-eb', 'C4', 'Eb4'],
    ['flugelhorn-bb', 'C4', 'Bb3'],
    ['mellophone-f', 'C4', 'F3'],
    ['tenor-horn-eb', 'C4', 'Eb3'],
    ['clarinet-c', 'C4', 'C4'],
  ];
  it.each(cases)('%s: written %s sounds %s', async (id, written, concert) => {
    const { writtenToConcert, concertToWritten } = await import('../core/transpose');
    const inst = getInstrument(id);
    expect(writtenToConcert(written, inst)).toBe(concert);
    expect(concertToWritten(concert, inst)).toBe(written);
  });
});
