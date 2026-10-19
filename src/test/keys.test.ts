import { describe, expect, it } from 'vitest';
import { splitByClef, toVexNote } from '../render/keys';

describe('toVexNote', () => {
  it('converts natural, sharp, flat and double-flat pitches', () => {
    expect(toVexNote('C4')).toMatchObject({ key: 'c/4', accidental: '' });
    expect(toVexNote('Bb3')).toMatchObject({ key: 'b/3', accidental: 'b' });
    expect(toVexNote('F#5')).toMatchObject({ key: 'f/5', accidental: '#' });
    expect(toVexNote('Bbb3')).toMatchObject({ key: 'b/3', accidental: 'bb' });
  });

  it('puts C4 and above on treble, below on bass', () => {
    expect(toVexNote('C4').clef).toBe('treble');
    expect(toVexNote('B3').clef).toBe('bass');
  });

  it('throws on a pitch without an octave', () => {
    expect(() => toVexNote('Eb')).toThrow();
  });
});

describe('splitByClef', () => {
  it('merges duplicate pitches so a repeated note is drawn once', () => {
    const { treble } = splitByClef(['Bb4', 'C5', 'Bb4', 'E5', 'C4', 'C4']);
    expect(treble.map((n) => n.key)).toEqual(['c/4', 'b/4', 'c/5', 'e/5']);
    expect(treble.find((n) => n.key === 'b/4')?.accidental).toBe('b');
  });

  it('splits and sorts by pitch', () => {
    const { treble, bass } = splitByClef(['E5', 'C3', 'G4', 'D2']);
    expect(treble.map((n) => n.key)).toEqual(['g/4', 'e/5']);
    expect(bass.map((n) => n.key)).toEqual(['d/2', 'c/3']);
  });
});
