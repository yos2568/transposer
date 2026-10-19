import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { Interval, Note } from 'tonal';
import { invertInterval, keySignatureAccidentals, simplifyKey } from '../core/transpose';
import type { MusicalKey } from '../core/types';

/*
 * MusicXML conventions used here (score-partwise only):
 *  - <pitch> is the WRITTEN pitch. Concert (sounding) = written + <transpose>.
 *  - <transpose> diatonic/chromatic/octave-change give the interval from written to concert.
 *  - Our interval strings use the same sign: "-2M" means the part sounds a M2 lower.
 */

export interface PartInfo {
  id: string;
  name: string;
  /** Written -> concert interval; "1P" when the part is non-transposing. */
  transposition: string;
}

const FIFTHS_TO_MAJOR = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];

// ---------- DOM helpers ----------

type El = Element;

function kids(el: El, name?: string): El[] {
  const out: El[] = [];
  for (let n = el.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === 1 && (!name || (n as El).tagName === name)) out.push(n as El);
  }
  return out;
}

function child(el: El, name: string): El | undefined {
  return kids(el, name)[0];
}

function childText(el: El, name: string): string | undefined {
  return child(el, name)?.textContent?.trim();
}

function setChildText(doc: Document, el: El, name: string, value: string): void {
  let target = child(el, name);
  if (!target) {
    target = doc.createElement(name);
    el.appendChild(target);
  }
  target.textContent = value;
}

// ---------- Parsing and serializing ----------

export function parseScore(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const root = doc.documentElement;
  if (!root || root.tagName !== 'score-partwise') {
    throw new Error('Only score-partwise MusicXML is supported. Export the score as "partwise" from your notation software.');
  }
  return doc as unknown as Document;
}

export function serializeScore(doc: Document): string {
  const body = new XMLSerializer().serializeToString(doc as never);
  return body.startsWith('<?xml') ? body : `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${body}`;
}

function partElements(doc: Document): El[] {
  return kids(doc.documentElement as unknown as El, 'part');
}

// ---------- Interval <-> <transpose> ----------

/** Read a <transpose> block as a written -> concert interval string. */
export function intervalFromTranspose(diatonic: number, chromatic: number, octaveChange = 0): string {
  const d = diatonic + 7 * octaveChange;
  const s = chromatic + 12 * octaveChange;
  if (d === 0 && s === 0) return '1P';
  const sign = s < 0 || (s === 0 && d < 0) ? '-' : '+';
  const num = Math.abs(d) + 1;
  // Perfect qualities apply to 1, 4, 5 (mod 7); everything else is major/minor.
  const qualities = [1, 4, 5].includes(((num - 1) % 7) + 1) ? ['P', 'A', 'd'] : ['M', 'm', 'A', 'd'];
  for (const q of qualities) {
    if (Interval.get(`${num}${q}`).semitones === Math.abs(s)) return `${sign}${num}${q}`;
  }
  throw new Error(`Unsupported transposition: diatonic ${diatonic}, chromatic ${chromatic}, octave-change ${octaveChange}`);
}

/**
 * The <transpose> values for a written -> concert interval, normalized so that
 * octave-change holds whole octaves (e.g. Bb tenor sax: diatonic -1, chromatic -2, octave-change -1).
 */
export function transposeValues(interval: string): { diatonic: number; chromatic: number; octaveChange: number } {
  if (interval === '1P') return { diatonic: 0, chromatic: 0, octaveChange: 0 };
  const sign = interval.startsWith('-') ? -1 : 1;
  const body = interval.replace(/^[+-]/, '');
  const iv = Interval.get(body);
  if (iv.empty) throw new Error(`Invalid interval: ${interval}`);
  const d = sign * (iv.num - 1);
  const s = sign * iv.semitones;
  const octaveChange = Math.trunc(d / 7) || 0; // `|| 0` turns -0 into 0
  return { diatonic: d - 7 * octaveChange, chromatic: s - 12 * octaveChange, octaveChange };
}

// ---------- Keys ----------

export function keyFromFifths(fifths: number, mode: 'major' | 'minor'): MusicalKey {
  const major = FIFTHS_TO_MAJOR[fifths + 7];
  if (!major) throw new Error(`Unsupported key signature: ${fifths} fifths`);
  return mode === 'major' ? { tonic: major, mode } : { tonic: Note.transpose(major, '-3m'), mode };
}

/** Move a key by an interval, respelled to the simplest equivalent. */
function shiftKey(key: MusicalKey, interval: string): MusicalKey {
  const tonic = Note.simplify(Note.transpose(key.tonic, interval));
  return simplifyKey({ tonic, mode: key.mode });
}

// ---------- Pitches ----------

const ACCIDENTAL_ALTER: Record<string, number> = { bb: -2, b: -1, '': 0, '#': 1, '##': 2 };

function readPitch(pitchEl: El): string | null {
  const step = childText(pitchEl, 'step');
  const octave = childText(pitchEl, 'octave');
  const alterText = childText(pitchEl, 'alter') ?? '0';
  const alter = Number(alterText);
  if (!step || !octave || !Number.isInteger(alter) || alter < -2 || alter > 2) return null;
  const acc = Object.keys(ACCIDENTAL_ALTER).find((k) => ACCIDENTAL_ALTER[k] === alter) ?? '';
  return `${step}${acc}${octave}`;
}

function writePitch(doc: Document, pitchEl: El, pitch: string): void {
  const n = Note.get(pitch);
  if (n.empty || n.oct === undefined) throw new Error(`Invalid pitch: ${pitch}`);
  while (pitchEl.firstChild) pitchEl.removeChild(pitchEl.firstChild);
  setChildText(doc, pitchEl, 'step', n.letter);
  if (n.alt !== 0) setChildText(doc, pitchEl, 'alter', String(n.alt));
  setChildText(doc, pitchEl, 'octave', String(n.oct));
}

/** Apply `fn` to every pitched note in a part. Unpitched and rest notes are left alone. */
function mapPartPitches(doc: Document, part: El, fn: (pitch: string) => string): void {
  for (const note of Array.from(part.getElementsByTagName('note'))) {
    const pitchEl = child(note, 'pitch');
    if (!pitchEl) continue;
    const current = readPitch(pitchEl);
    if (current) writePitch(doc, pitchEl, fn(current));
  }
}

/** Apply `fn` to each key signature in a part. */
function mapPartKeys(doc: Document, part: El, fn: (key: MusicalKey) => MusicalKey): void {
  for (const attrs of Array.from(part.getElementsByTagName('attributes'))) {
    const keyEl = child(attrs, 'key');
    if (!keyEl) continue;
    const fifths = Number(childText(keyEl, 'fifths') ?? '0');
    const mode = childText(keyEl, 'mode') === 'minor' ? 'minor' : 'major';
    const next = fn(keyFromFifths(fifths, mode));
    setChildText(doc, keyEl, 'fifths', String(keySignatureAccidentals(next)));
    if (mode === 'minor' || next.mode === 'minor') setChildText(doc, keyEl, 'mode', next.mode);
  }
}

function shiftPitch(pitch: string, interval: string): string {
  return Note.simplify(Note.transpose(pitch, interval));
}

// ---------- <transpose> element ----------

function removeTranspose(part: El): void {
  for (const attrs of Array.from(part.getElementsByTagName('attributes'))) {
    for (const t of kids(attrs, 'transpose')) attrs.removeChild(t);
  }
}

function insertTranspose(doc: Document, part: El, interval: string): void {
  removeTranspose(part);
  if (interval === '1P') return;
  const attrs = part.getElementsByTagName('attributes')[0];
  if (!attrs) throw new Error('Part has no <attributes> element to hold <transpose>');

  const v = transposeValues(interval);
  const t = doc.createElement('transpose');
  const d = doc.createElement('diatonic');
  d.textContent = String(v.diatonic);
  const c = doc.createElement('chromatic');
  c.textContent = String(v.chromatic);
  t.appendChild(d);
  t.appendChild(c);
  if (v.octaveChange !== 0) {
    const o = doc.createElement('octave-change');
    o.textContent = String(v.octaveChange);
    t.appendChild(o);
  }

  // Schema order: <transpose> comes before for-part, directive and measure-style.
  const after = kids(attrs).find((k) => ['for-part', 'directive', 'measure-style'].includes(k.tagName));
  if (after) attrs.insertBefore(t, after);
  else attrs.appendChild(t);
}

// ---------- Reading parts ----------

export function readParts(doc: Document): PartInfo[] {
  const scoreParts = Array.from(doc.getElementsByTagName('score-part'));
  const names = new Map<string, string>();
  for (const sp of scoreParts) names.set(sp.getAttribute('id') ?? '', childText(sp, 'part-name') ?? '');

  return partElements(doc).map((part) => {
    const id = part.getAttribute('id') ?? '';
    const t = Array.from(part.getElementsByTagName('transpose'))[0];
    const transposition = t
      ? intervalFromTranspose(
          Number(childText(t, 'diatonic') ?? '0'),
          Number(childText(t, 'chromatic') ?? '0'),
          Number(childText(t, 'octave-change') ?? '0'),
        )
      : '1P';
    return { id, name: names.get(id) || id, transposition };
  });
}

// ---------- Public transforms ----------

/**
 * Turn a score into concert pitch: every part's pitches and keys move to their
 * sounding versions, and <transpose> is removed. Returns a new document.
 */
export function toConcert(doc: Document): Document {
  const out = parseScore(serializeScore(doc));
  const infos = readParts(out);
  partElements(out).forEach((part, i) => {
    const interval = infos[i].transposition;
    if (interval === '1P') return;
    mapPartPitches(out, part, (p) => shiftPitch(p, interval));
    mapPartKeys(out, part, (k) => shiftKey(k, interval));
    removeTranspose(part);
  });
  return out;
}

/**
 * Set each part's written instrument on a CONCERT document. `intervals` maps part id to the
 * written -> concert interval of the chosen instrument. Parts not listed stay concert.
 * Returns a new document.
 */
export function toWritten(concertDoc: Document, intervals: Record<string, string>): Document {
  const out = parseScore(serializeScore(concertDoc));
  for (const part of partElements(out)) {
    const id = part.getAttribute('id') ?? '';
    const interval = intervals[id] ?? '1P';
    if (interval === '1P') continue;
    const back = invertInterval(interval);
    mapPartPitches(out, part, (p) => shiftPitch(p, back));
    mapPartKeys(out, part, (k) => shiftKey(k, back));
    insertTranspose(out, part, interval);
  }
  return out;
}
