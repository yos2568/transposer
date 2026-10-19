import type { MessageKey } from './messages';

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** A transposition in words, in the current language: "sounds M2 lower", or "Non-transposing". */
export function transpositionText(transposition: string, t: Translate): string {
  if (transposition === '1P') return t('nonTransposing');
  const higher = transposition.startsWith('+');
  const match = transposition.replace(/^[+-]/, '').match(/^(\d+)([PMmAd])$/);
  if (!match) return transposition;
  return t(higher ? 'soundsHigher' : 'soundsLower', { interval: `${match[2]}${match[1]}` });
}

const QUALITY_EN: Record<string, string> = { M: 'major', m: 'minor', P: 'perfect', A: 'augmented', d: 'diminished' };
const QUALITY_TH: Record<string, string> = { M: 'เมเจอร์', m: 'ไมเนอร์', P: 'เพอร์เฟกต์', A: 'ออกเมนเต็ด', d: 'ดิมินิชด์' };
const OCTAVES_EN = ['', 'an octave', 'two octaves', 'three octaves', 'four octaves'];

function ordinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
}

/**
 * An interval in words, without direction: "-2M" -> "a major 2nd" (English) or
 * "คู่ 2 เมเจอร์" (Thai); "+8P" -> "an octave" or "คู่ 8".
 */
export function intervalWords(transposition: string, lang: 'en' | 'th'): string {
  const match = transposition.replace(/^[+-]/, '').match(/^(\d+)([PMmAd])$/);
  if (!match) return transposition;
  const num = Number(match[1]);
  const quality = match[2];
  const octaves = quality === 'P' && num > 1 && (num - 1) % 7 === 0 ? (num - 1) / 7 : 0;

  if (lang === 'th') {
    return octaves ? `คู่ ${num}` : `คู่ ${num} ${QUALITY_TH[quality]}`;
  }
  if (octaves && OCTAVES_EN[octaves]) return OCTAVES_EN[octaves];
  const word = QUALITY_EN[quality];
  return `${word.startsWith('a') ? 'an' : 'a'} ${word} ${ordinal(num)}`;
}

/** Signed short code: "-2M" -> "−M2", "+8P" -> "+P8", "1P" -> "=". */
export function signedIntervalCode(transposition: string): string {
  if (transposition === '1P') return '=';
  const match = transposition.replace(/^[+-]/, '').match(/^(\d+)([PMmAd])$/);
  if (!match) return transposition;
  return `${transposition.startsWith('-') ? '−' : '+'}${match[2]}${match[1]}`;
}

/** The sentence for the connector pill: "sounds a major 2nd lower", or "sounds as written". */
export function pillText(transposition: string, lang: 'en' | 'th', t: Translate): string {
  if (transposition === '1P') return t('pillSame');
  return t(transposition.startsWith('-') ? 'pillLower' : 'pillHigher', {
    interval: intervalWords(transposition, lang),
  });
}
