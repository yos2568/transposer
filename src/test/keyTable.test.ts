import { describe, expect, it } from 'vitest';
import { Note } from 'tonal';
import { INSTRUMENTS, getInstrument } from '../core/instruments';
import { describeTransposition, formatKeySignature, keyTable } from '../core/keyTable';
import { concertToWritten, transposeKey, writtenToConcert } from '../core/transpose';
import type { MusicalKey } from '../core/types';

const row = (rows: ReturnType<typeof keyTable>, id: string) => {
  const found = rows.find((r) => r.instrument.id === id);
  if (!found) throw new Error(`no row for ${id}`);
  return found;
};

describe('keyTable: sourced examples (concert -> written)', () => {
  const bbMajor: MusicalKey = { tonic: 'Bb', mode: 'major' };
  const rows = keyTable(bbMajor, 'concertToWritten');

  it('has one row per instrument', () => {
    expect(rows).toHaveLength(INSTRUMENTS.length);
  });

  it('concert Bb major: Bb clarinet = C major, alto sax = G major, F horn = F major', () => {
    expect(row(rows, 'clarinet-bb').target).toEqual({ tonic: 'C', mode: 'major' });
    expect(row(rows, 'alto-sax').target).toEqual({ tonic: 'G', mode: 'major' });
    expect(row(rows, 'horn-f').target).toEqual({ tonic: 'F', mode: 'major' });
  });

  it('concert Bb major: D trumpet = Ab major, Eb trumpet = G major', () => {
    expect(row(rows, 'trumpet-d').target).toEqual({ tonic: 'Ab', mode: 'major' });
    expect(row(rows, 'trumpet-eb').target).toEqual({ tonic: 'G', mode: 'major' });
  });

  it('concert Eb major on Bb clarinet is written F major (as in M1)', () => {
    const r = keyTable({ tonic: 'Eb', mode: 'major' }, 'concertToWritten');
    expect(row(r, 'clarinet-bb').target).toEqual({ tonic: 'F', mode: 'major' });
  });

  it('keeps mode and reports signatures', () => {
    expect(row(rows, 'clarinet-bb').accidentals).toBe(0);
    expect(row(rows, 'alto-sax').accidentals).toBe(1);
  });
});

describe('keyTable: respelling', () => {
  it('concert B major on Bb clarinet is written C# major, respelled to Db major', () => {
    const bMajor: MusicalKey = { tonic: 'B', mode: 'major' };
    const respelled = row(keyTable(bMajor, 'concertToWritten'), 'clarinet-bb');
    expect(respelled.target).toEqual({ tonic: 'Db', mode: 'major' });
    expect(respelled.accidentals).toBe(-5);
  });

  it('keeps C# major when respell is off', () => {
    const raw = row(keyTable({ tonic: 'B', mode: 'major' }, 'concertToWritten', { respell: false }), 'clarinet-bb');
    expect(raw.target).toEqual({ tonic: 'C#', mode: 'major' });
    expect(raw.accidentals).toBe(7);
  });

  it('removes double accidentals from the tonic', () => {
    // Cb major on a B-flat instrument: written Db major... check no tonic has two accidentals.
    const rows = keyTable({ tonic: 'Cb', mode: 'major' }, 'concertToWritten');
    for (const r of rows) {
      expect(r.target.tonic.replace(/^[A-G]/, '').length, r.instrument.id).toBeLessThanOrEqual(1);
    }
  });
});

describe('keyTable: other cases', () => {
  it('minor key: concert A minor on Bb clarinet = B minor', () => {
    const r = keyTable({ tonic: 'A', mode: 'minor' }, 'concertToWritten');
    expect(row(r, 'clarinet-bb').target).toEqual({ tonic: 'B', mode: 'minor' });
  });

  it('octave transposers keep the same key', () => {
    const r = keyTable({ tonic: 'C', mode: 'major' }, 'concertToWritten');
    expect(row(r, 'double-bass').target).toEqual({ tonic: 'C', mode: 'major' });
    expect(row(r, 'piccolo').target).toEqual({ tonic: 'C', mode: 'major' });
  });

  it('written -> concert direction: written C major on Bb trumpet = concert Bb major', () => {
    const r = keyTable({ tonic: 'C', mode: 'major' }, 'writtenToConcert');
    expect(row(r, 'trumpet-bb').target).toEqual({ tonic: 'Bb', mode: 'major' });
  });
});

describe('keyTable: round trip', () => {
  const tonics = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
  it('written -> concert -> written returns the same pitch class for every instrument', () => {
    for (const inst of INSTRUMENTS) {
      for (const tonic of tonics) {
        const key: MusicalKey = { tonic, mode: 'major' };
        const there = transposeKey(key, inst, 'concertToWritten');
        const back = transposeKey(there, inst, 'writtenToConcert');
        expect(Note.chroma(back.tonic), `${inst.id} ${tonic}`).toBe(Note.chroma(tonic));
      }
    }
  });
});

describe('formatKeySignature and describeTransposition', () => {
  it('formats signatures', () => {
    expect(formatKeySignature(0)).toBe('No sharps or flats');
    expect(formatKeySignature(3)).toBe('3♯');
    expect(formatKeySignature(-2)).toBe('2♭');
  });

  it('describes transpositions in words', () => {
    expect(describeTransposition('-2M')).toBe('sounds M2 lower');
    expect(describeTransposition('+8P')).toBe('sounds P8 higher');
    expect(describeTransposition('1P')).toBe('Non-transposing');
  });

  it('uses concert/written helpers consistently with the table', () => {
    const inst = getInstrument('alto-sax');
    expect(concertToWritten(writtenToConcert('C4', inst), inst)).toBe('C4');
  });
});
