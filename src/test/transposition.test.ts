import { describe, expect, it } from 'vitest';
import { formatPitch } from '../core/format';
import { en, th } from '../i18n/messages';
import { fill } from '../i18n/context';
import { intervalWords, pillText, signedIntervalCode } from '../i18n/transposition';

describe('intervalWords', () => {
  it('describes intervals in English', () => {
    expect(intervalWords('-2M', 'en')).toBe('a major 2nd');
    expect(intervalWords('+3m', 'en')).toBe('a minor 3rd');
    expect(intervalWords('-5P', 'en')).toBe('a perfect 5th');
    expect(intervalWords('-6M', 'en')).toBe('a major 6th');
    expect(intervalWords('-9M', 'en')).toBe('a major 9th');
    expect(intervalWords('-13M', 'en')).toBe('a major 13th');
    expect(intervalWords('+7m', 'en')).toBe('a minor 7th');
  });

  it('uses "octave" for whole octaves', () => {
    expect(intervalWords('+8P', 'en')).toBe('an octave');
    expect(intervalWords('-15P', 'en')).toBe('two octaves');
  });

  it('uses an for augmented', () => {
    expect(intervalWords('+4A', 'en')).toBe('an augmented 4th');
  });

  it('describes intervals in Thai', () => {
    expect(intervalWords('-2M', 'th')).toBe('คู่ 2 เมเจอร์');
    expect(intervalWords('-5P', 'th')).toBe('คู่ 5 เพอร์เฟกต์');
    expect(intervalWords('+8P', 'th')).toBe('คู่ 8');
  });
});

describe('signedIntervalCode', () => {
  it('writes direction and short interval', () => {
    expect(signedIntervalCode('-2M')).toBe('−M2');
    expect(signedIntervalCode('+8P')).toBe('+P8');
    expect(signedIntervalCode('+3m')).toBe('+m3');
    expect(signedIntervalCode('1P')).toBe('=');
  });
});

describe('formatPitch', () => {
  it('replaces accidentals with music symbols', () => {
    expect(formatPitch('Bb3')).toBe('B♭3');
    expect(formatPitch('F#4')).toBe('F♯4');
    expect(formatPitch('C4')).toBe('C4');
    expect(formatPitch('Ebb5')).toBe('E♭♭5');
  });
});

describe('pillText', () => {
  const tEn = (key: keyof typeof en, vars?: Record<string, string | number>) => fill(en[key], vars);
  const tTh = (key: keyof typeof th, vars?: Record<string, string | number>) => fill(th[key], vars);

  it('says which way and how far, in English', () => {
    expect(pillText('-2M', 'en', tEn)).toBe('sounds a major 2nd lower');
    expect(pillText('+8P', 'en', tEn)).toBe('sounds an octave higher');
    expect(pillText('1P', 'en', tEn)).toBe('sounds as written');
  });

  it('says it in Thai', () => {
    expect(pillText('-2M', 'th', tTh)).toBe('เสียงต่ำกว่าคู่ 2 เมเจอร์');
    expect(pillText('1P', 'th', tTh)).toBe('เสียงตรงกับที่เขียน');
  });
});
