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
