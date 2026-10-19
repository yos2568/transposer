import { describe, expect, it } from 'vitest';
import { INSTRUMENTS } from '../core/instruments';
import { fill } from '../i18n/context';
import { en, th } from '../i18n/messages';
import { instrumentNameTh } from '../i18n/instrumentNamesTh';

const THAI = /[฀-๿]/;

describe('messages', () => {
  it('Thai has every English key, with no empty strings', () => {
    expect(Object.keys(th).sort()).toEqual(Object.keys(en).sort());
    for (const [key, value] of Object.entries(th)) {
      expect(value.trim(), key).not.toBe('');
    }
  });

  it('keeps placeholders identical in both languages', () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
    for (const key of Object.keys(en) as Array<keyof typeof en>) {
      expect(placeholders(th[key]), key).toBe(placeholders(en[key]));
    }
  });

  it('fills placeholders and leaves unknown ones visible', () => {
    expect(fill('Remove {pitch}', { pitch: 'C4' })).toBe('Remove C4');
    expect(fill('{a} and {b}', { a: 1 })).toBe('1 and {b}');
  });
});

describe('Thai instrument names', () => {
  it('names every instrument in Thai, except where the base name is unknown', () => {
    const missing = INSTRUMENTS.filter((i) => !THAI.test(instrumentNameTh(i.name))).map((i) => i.name);
    expect(missing).toEqual([]);
  });

  it('keeps the key and transposition notes', () => {
    expect(instrumentNameTh('Clarinet in B♭')).toBe('คลาริเน็ต (คีย์ B♭)');
    expect(instrumentNameTh('Flute (C, non-transposing)')).toBe('ฟลูต (ไม่ย้ายเสียง)');
    expect(instrumentNameTh('Double bass')).toBe('ดับเบิลเบส');
  });

  it('marks unverified rows', () => {
    expect(instrumentNameTh('Contrabass saxophone in E♭ (unverified)')).toContain('ยังไม่ยืนยัน');
  });
});
