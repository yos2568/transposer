import { describe, expect, it } from 'vitest';
import { INSTRUMENTS, getInstrument } from '../core/instruments';
import {
  concertToWritten,
  invertInterval,
  keySignatureAccidentals,
  simplifyKey,
  transposeKey,
  writtenToConcert,
} from '../core/transpose';

describe('invertInterval', () => {
  it('flips sign and handles plus prefix', () => {
    expect(invertInterval('-2M')).toBe('2M');
    expect(invertInterval('+8P')).toBe('-8P');
    expect(invertInterval('8P')).toBe('-8P');
    expect(invertInterval('1P')).toBe('1P');
  });
});

describe('written <-> concert pitch', () => {
  it('Bb clarinet: written C4 sounds Bb3', () => {
    const inst = getInstrument('clarinet-bb');
    expect(writtenToConcert('C4', inst)).toBe('Bb3');
    expect(concertToWritten('Bb3', inst)).toBe('C4');
  });

  it('Eb alto sax sounds a major sixth lower: written C4 sounds Eb3', () => {
    expect(writtenToConcert('C4', getInstrument('alto-sax'))).toBe('Eb3');
    expect(writtenToConcert('A4', getInstrument('alto-sax'))).toBe('C4');
  });

  it('Eb clarinet: written C4 sounds Eb4', () => {
    expect(writtenToConcert('C4', getInstrument('clarinet-eb'))).toBe('Eb4');
  });

  it('F horn: written C4 sounds F3', () => {
    expect(writtenToConcert('C4', getInstrument('horn-f'))).toBe('F3');
  });

  it('Trumpet in D: written C4 sounds D4', () => {
    expect(writtenToConcert('C4', getInstrument('trumpet-d'))).toBe('D4');
  });

  it('Double bass sounds an octave below written', () => {
    const inst = getInstrument('double-bass');
    expect(writtenToConcert('E2', inst)).toBe('E1');
    expect(concertToWritten('E1', inst)).toBe('E2');
  });

  it('Piccolo sounds an octave above written', () => {
    expect(writtenToConcert('C5', getInstrument('piccolo'))).toBe('C6');
  });

  it('Bass sax sounds two octaves and a major second below written', () => {
    expect(writtenToConcert('C4', getInstrument('bass-sax'))).toBe('Bb1');
  });

  it('round-trips every instrument for a spread of pitches (no simplification)', () => {
    const pitches = ['C2', 'Eb3', 'F#3', 'Bb3', 'C4', 'G#4', 'B4', 'Db5', 'E5', 'Ab5', 'C6', 'Gb6'];
    for (const inst of INSTRUMENTS) {
      for (const p of pitches) {
        const concert = writtenToConcert(p, inst);
        expect(concertToWritten(concert, inst), `${inst.id} ${p}`).toBe(p);
      }
    }
  });

  it('keeps spelling correct: concert Eb on Bb clarinet is written F (not D#)', () => {
    expect(concertToWritten('Eb4', getInstrument('clarinet-bb'))).toBe('F4');
  });

  it('simplify option respells double flats (Cb4 on Bb clarinet gives Bbb3 -> A3)', () => {
    const inst = getInstrument('clarinet-bb');
    expect(writtenToConcert('Cb4', inst)).toBe('Bbb3');
    expect(writtenToConcert('Cb4', inst, { simplify: true })).toBe('A3');
  });
});

describe('keys', () => {
  it('concert Eb major on Bb clarinet is written F major', () => {
    const written = transposeKey({ tonic: 'Eb', mode: 'major' }, getInstrument('clarinet-bb'), 'concertToWritten');
    expect(written).toEqual({ tonic: 'F', mode: 'major' });
  });

  it('written C major on Bb trumpet is concert Bb major', () => {
    const concert = transposeKey({ tonic: 'C', mode: 'major' }, getInstrument('trumpet-bb'), 'writtenToConcert');
    expect(concert).toEqual({ tonic: 'Bb', mode: 'major' });
  });

  it('counts accidentals correctly', () => {
    expect(keySignatureAccidentals({ tonic: 'C', mode: 'major' })).toBe(0);
    expect(keySignatureAccidentals({ tonic: 'G', mode: 'major' })).toBe(1);
    expect(keySignatureAccidentals({ tonic: 'Bb', mode: 'major' })).toBe(-2);
    expect(keySignatureAccidentals({ tonic: 'A', mode: 'minor' })).toBe(0);
    expect(keySignatureAccidentals({ tonic: 'Eb', mode: 'minor' })).toBe(-6);
  });

  it('simplifies keys with more than 6 accidentals', () => {
    expect(simplifyKey({ tonic: 'C#', mode: 'major' })).toEqual({ tonic: 'Db', mode: 'major' });
    expect(simplifyKey({ tonic: 'Cb', mode: 'major' })).toEqual({ tonic: 'B', mode: 'major' });
    expect(simplifyKey({ tonic: 'F#', mode: 'major' })).toEqual({ tonic: 'F#', mode: 'major' });
  });
});
