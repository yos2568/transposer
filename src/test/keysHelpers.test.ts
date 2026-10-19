import { describe, expect, it } from 'vitest';
import { getInstrument } from '../core/instruments';
import { shortSignature } from '../core/keyTable';
import { matchesInstrument } from '../i18n/search';
import { DEFAULT_PINNED, parsePinned } from '../views/usePinned';

describe('shortSignature', () => {
  it('formats sharps, flats and none', () => {
    expect(shortSignature(0)).toBe('—');
    expect(shortSignature(3)).toBe('3♯');
    expect(shortSignature(-2)).toBe('2♭');
  });
});

describe('matchesInstrument', () => {
  const clarinet = getInstrument('clarinet-bb');

  it('matches everything on an empty query', () => {
    expect(matchesInstrument(clarinet, '  ', 'Woodwinds')).toBe(true);
  });

  it('matches English names, ignoring case', () => {
    expect(matchesInstrument(clarinet, 'CLARI', 'Woodwinds')).toBe(true);
    expect(matchesInstrument(clarinet, 'trumpet', 'Woodwinds')).toBe(false);
  });

  it('matches Thai names and the family label', () => {
    expect(matchesInstrument(clarinet, 'คลาริเน็ต', 'Woodwinds')).toBe(true);
    expect(matchesInstrument(clarinet, 'wood', 'Woodwinds')).toBe(true);
    expect(matchesInstrument(clarinet, 'ไม้ลม', 'ไม้ลม')).toBe(true);
  });
});

describe('parsePinned', () => {
  it('uses the defaults when nothing is saved or the data is bad', () => {
    expect(parsePinned(null)).toEqual(DEFAULT_PINNED);
    expect(parsePinned('not json')).toEqual(DEFAULT_PINNED);
    expect(parsePinned('{"a":1}')).toEqual(DEFAULT_PINNED);
  });

  it('keeps saved ids and drops unknown ones', () => {
    expect(parsePinned('["horn-f","kazoo","piccolo"]')).toEqual(['horn-f', 'piccolo']);
  });

  it('respects an empty saved list', () => {
    expect(parsePinned('[]')).toEqual([]);
  });
});
