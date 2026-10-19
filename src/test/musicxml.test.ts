import { XMLSerializer } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import {
  intervalFromTranspose,
  parseScore,
  readParts,
  serializeScore,
  toConcert,
  toWritten,
  transposeValues,
} from '../score/musicxml';

/** Build a small score-partwise file. Each part has one measure of quarter notes. */
interface PartSpec {
  id: string;
  name: string;
  fifths: number;
  transpose?: { diatonic: number; chromatic: number; octaveChange?: number };
  notes: Array<{ step: string; alter?: number; octave: number }>;
}

function scoreXml(parts: PartSpec[]): string {
  const partList = parts
    .map((p) => `<score-part id="${p.id}"><part-name>${p.name}</part-name></score-part>`)
    .join('');
  const body = parts
    .map((p) => {
      const t = p.transpose
        ? `<transpose><diatonic>${p.transpose.diatonic}</diatonic><chromatic>${p.transpose.chromatic}</chromatic>${
            p.transpose.octaveChange ? `<octave-change>${p.transpose.octaveChange}</octave-change>` : ''
          }</transpose>`
        : '';
      const notes = p.notes
        .map(
          (n) =>
            `<note><pitch><step>${n.step}</step>${n.alter ? `<alter>${n.alter}</alter>` : ''}<octave>${n.octave}</octave></pitch><duration>1</duration><type>quarter</type></note>`,
        )
        .join('');
      return `<part id="${p.id}"><measure number="1"><attributes><divisions>1</divisions><key><fifths>${p.fifths}</fifths></key>${t}<clef><sign>G</sign><line>2</line></clef></attributes>${notes}</measure></part>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><part-list>${partList}</part-list>${body}</score-partwise>`;
}

/** Pitch of every note in a part, as step+alter+octave text, in order. */
function pitchesOf(doc: Document, partId: string): string[] {
  const part = Array.from(doc.getElementsByTagName('part')).find((p) => p.getAttribute('id') === partId)!;
  return Array.from(part.getElementsByTagName('pitch')).map((p) => {
    const get = (n: string) => p.getElementsByTagName(n)[0]?.textContent ?? '';
    return `${get('step')}${get('alter') ? `(${get('alter')})` : ''}${get('octave')}`;
  });
}

function keyOf(doc: Document, partId: string): string {
  const part = Array.from(doc.getElementsByTagName('part')).find((p) => p.getAttribute('id') === partId)!;
  return part.getElementsByTagName('fifths')[0]?.textContent ?? '';
}

function transposeOf(doc: Document, partId: string): string | null {
  const part = Array.from(doc.getElementsByTagName('part')).find((p) => p.getAttribute('id') === partId)!;
  const t = part.getElementsByTagName('transpose')[0];
  return t ? new XMLSerializer().serializeToString(t as never) : null;
}

describe('interval <-> transpose', () => {
  it('reads common <transpose> values', () => {
    expect(intervalFromTranspose(-1, -2)).toBe('-2M'); // Bb clarinet
    expect(intervalFromTranspose(2, 3)).toBe('+3m'); // Eb clarinet
    expect(intervalFromTranspose(-5, -9)).toBe('-6M'); // Eb alto sax
    expect(intervalFromTranspose(0, 0, -1)).toBe('-8P'); // double bass
    expect(intervalFromTranspose(-1, -2, -1)).toBe('-9M'); // Bb tenor sax, octave-change form
  });

  it('writes normalized <transpose> values', () => {
    expect(transposeValues('-2M')).toEqual({ diatonic: -1, chromatic: -2, octaveChange: 0 });
    expect(transposeValues('-6M')).toEqual({ diatonic: -5, chromatic: -9, octaveChange: 0 });
    expect(transposeValues('-9M')).toEqual({ diatonic: -1, chromatic: -2, octaveChange: -1 });
    expect(transposeValues('-8P')).toEqual({ diatonic: 0, chromatic: 0, octaveChange: -1 });
    expect(transposeValues('+8P')).toEqual({ diatonic: 0, chromatic: 0, octaveChange: 1 });
    expect(transposeValues('1P')).toEqual({ diatonic: 0, chromatic: 0, octaveChange: 0 });
  });
});

describe('readParts', () => {
  it('reads each part name and transposition', () => {
    const doc = parseScore(
      scoreXml([
        { id: 'P1', name: 'Clarinet in Bb', fifths: 0, transpose: { diatonic: -1, chromatic: -2 }, notes: [] },
        { id: 'P2', name: 'Flute', fifths: 0, notes: [] },
      ]),
    );
    expect(readParts(doc)).toEqual([
      { id: 'P1', name: 'Clarinet in Bb', transposition: '-2M' },
      { id: 'P2', name: 'Flute', transposition: '1P' },
    ]);
  });

  it('rejects score-timewise files', () => {
    expect(() => parseScore('<score-timewise version="4.0"></score-timewise>')).toThrow(/partwise/);
  });
});

describe('toConcert', () => {
  it('Bb clarinet: written C4 in C major becomes concert Bb3 in Bb major', () => {
    const written = parseScore(
      scoreXml([{ id: 'P1', name: 'Cl', fifths: 0, transpose: { diatonic: -1, chromatic: -2 }, notes: [{ step: 'C', octave: 4 }] }]),
    );
    const concert = toConcert(written);
    expect(pitchesOf(concert, 'P1')).toEqual(['B(-1)3']);
    expect(keyOf(concert, 'P1')).toBe('-2');
    expect(transposeOf(concert, 'P1')).toBeNull();
  });

  it('does not change the original document', () => {
    const written = parseScore(
      scoreXml([{ id: 'P1', name: 'Cl', fifths: 0, transpose: { diatonic: -1, chromatic: -2 }, notes: [{ step: 'C', octave: 4 }] }]),
    );
    toConcert(written);
    expect(pitchesOf(written, 'P1')).toEqual(['C4']);
  });
});

describe('toWritten', () => {
  it('concert Bb3 becomes written C4 on Bb clarinet, with <transpose> set', () => {
    const concert = parseScore(scoreXml([{ id: 'P1', name: 'Cl', fifths: -2, notes: [{ step: 'B', alter: -1, octave: 3 }] }]));
    const written = toWritten(concert, { P1: '-2M' });
    expect(pitchesOf(written, 'P1')).toEqual(['C4']);
    expect(keyOf(written, 'P1')).toBe('0');
    expect(transposeOf(written, 'P1')).toContain('<diatonic>-1</diatonic>');
    expect(transposeOf(written, 'P1')).toContain('<chromatic>-2</chromatic>');
  });

  it('concert C4 on Eb alto sax is written A4, key C major becomes A major', () => {
    const concert = parseScore(scoreXml([{ id: 'P1', name: 'Alto', fifths: 0, notes: [{ step: 'C', octave: 4 }] }]));
    const written = toWritten(concert, { P1: '-6M' });
    expect(pitchesOf(written, 'P1')).toEqual(['A4']);
    expect(keyOf(written, 'P1')).toBe('3');
    expect(transposeOf(written, 'P1')).toContain('<chromatic>-9</chromatic>');
  });

  it('double bass: concert C3 is written C4 with an octave-change', () => {
    const concert = parseScore(scoreXml([{ id: 'P1', name: 'Bass', fifths: 0, notes: [{ step: 'C', octave: 3 }] }]));
    const written = toWritten(concert, { P1: '-8P' });
    expect(pitchesOf(written, 'P1')).toEqual(['C4']);
    expect(transposeOf(written, 'P1')).toContain('<octave-change>-1</octave-change>');
  });

  it('round trip: written -> concert -> written returns the original pitches, key and transpose', () => {
    const original = scoreXml([
      {
        id: 'P1',
        name: 'Cl',
        fifths: 0,
        transpose: { diatonic: -1, chromatic: -2 },
        notes: [
          { step: 'C', octave: 4 },
          { step: 'E', alter: -1, octave: 4 },
          { step: 'G', octave: 5 },
        ],
      },
    ]);
    const doc = parseScore(original);
    const concert = toConcert(doc);
    const back = toWritten(concert, { P1: '-2M' });
    expect(pitchesOf(back, 'P1')).toEqual(pitchesOf(doc, 'P1'));
    expect(keyOf(back, 'P1')).toBe('0');
    expect(serializeScore(back)).toContain('<chromatic>-2</chromatic>');
  });
});
