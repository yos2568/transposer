import { describe, expect, it } from 'vitest';
import { diatonicToPitch, pitchAtStaffY } from '../render/staffPosition';

describe('diatonicToPitch', () => {
  it('maps diatonic numbers to pitch names', () => {
    expect(diatonicToPitch(30)).toBe('E4');
    expect(diatonicToPitch(28)).toBe('C4');
    expect(diatonicToPitch(18)).toBe('G2');
  });

  it('applies accidentals', () => {
    expect(diatonicToPitch(31, '#')).toBe('F#4');
    expect(diatonicToPitch(33, 'b')).toBe('Ab4');
  });
});

describe('pitchAtStaffY', () => {
  // Treble staff: top line at y=0, lines and spaces every 5 units (spacing 10).
  it('treble: top line is F5, bottom line is E4', () => {
    expect(pitchAtStaffY(0, 'treble', 0)).toBe('F5');
    expect(pitchAtStaffY(40, 'treble', 0)).toBe('E4');
  });

  it('treble: a space between lines is the next diatonic step', () => {
    expect(pitchAtStaffY(5, 'treble', 0)).toBe('E5');
    expect(pitchAtStaffY(35, 'treble', 0)).toBe('F4');
  });

  it('bass: top line is A3, bottom line is G2', () => {
    expect(pitchAtStaffY(0, 'bass', 0)).toBe('A3');
    expect(pitchAtStaffY(40, 'bass', 0)).toBe('G2');
  });

  it('passes accidentals through', () => {
    expect(pitchAtStaffY(0, 'treble', 0, 10, '#')).toBe('F#5');
  });

  it('places points above and below the staff on ledger lines', () => {
    expect(pitchAtStaffY(-5, 'treble', 0)).toBe('G5');
    expect(pitchAtStaffY(-10, 'treble', 0)).toBe('A5');
    expect(pitchAtStaffY(50, 'treble', 0)).toBe('C4');
  });
});
