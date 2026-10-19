import type { Instrument } from './types';

/*
 * Transposition intervals: concert = written + transposition.
 *
 * Written ranges are approximate practical ranges (written pitch) and are
 * NOT yet verified against a reference. Verify before relying on range
 * warnings. Entries with `writtenRange: null` are not defined yet.
 *
 * Sources for intervals: Wikipedia transposing-instrument lists, MuseScore
 * handbook, brass-band and saxophone references found in research. Entries
 * marked "unverified" are derived by octave pattern or conflict between
 * sources, and must be checked before release.
 */
export const INSTRUMENTS: Instrument[] = [
  // Flutes and double reeds
  { id: 'piccolo', name: 'Piccolo', family: 'woodwind', transposition: '+8P', writtenClef: 'treble', writtenRange: { low: 'D5', high: 'C8' } },
  { id: 'flute', name: 'Flute (C, non-transposing)', family: 'woodwind', transposition: '1P', writtenClef: 'treble', writtenRange: { low: 'C4', high: 'C7' } },
  { id: 'alto-flute', name: 'Alto flute in G', family: 'woodwind', transposition: '-4P', writtenClef: 'treble', writtenRange: null },
  { id: 'bass-flute', name: 'Bass flute', family: 'woodwind', transposition: '-8P', writtenClef: 'treble', writtenRange: null },
  { id: 'oboe', name: 'Oboe (C, non-transposing)', family: 'woodwind', transposition: '1P', writtenClef: 'treble', writtenRange: null },
  { id: 'oboe-damore', name: "Oboe d'amore in A", family: 'woodwind', transposition: '-3m', writtenClef: 'treble', writtenRange: null },
  { id: 'cor-anglais', name: 'Cor anglais (English horn) in F', family: 'woodwind', transposition: '-5P', writtenClef: 'treble', writtenRange: null },
  { id: 'bassoon', name: 'Bassoon (C)', family: 'woodwind', transposition: '1P', writtenClef: 'bass', writtenRange: null },
  { id: 'contrabassoon', name: 'Contrabassoon', family: 'woodwind', transposition: '-8P', writtenClef: 'bass', writtenRange: null },

  // Clarinets
  { id: 'clarinet-c', name: 'Clarinet in C (non-transposing)', family: 'woodwind', transposition: '1P', writtenClef: 'treble', writtenRange: null },
  { id: 'clarinet-eb', name: 'Clarinet in E♭', family: 'woodwind', transposition: '+3m', writtenClef: 'treble', writtenRange: { low: 'E3', high: 'G6' } },
  { id: 'clarinet-bb', name: 'Clarinet in B♭', family: 'woodwind', transposition: '-2M', writtenClef: 'treble', writtenRange: { low: 'E3', high: 'G6' } },
  { id: 'clarinet-a', name: 'Clarinet in A (soprano clarinet in A)', family: 'woodwind', transposition: '-3m', writtenClef: 'treble', writtenRange: { low: 'E3', high: 'G6' } },
  { id: 'basset-horn', name: 'Basset horn in F', family: 'woodwind', transposition: '-5P', writtenClef: 'treble', writtenRange: null },
  { id: 'alto-clarinet', name: 'Alto clarinet in E♭', family: 'woodwind', transposition: '-6M', writtenClef: 'treble', writtenRange: null },
  { id: 'bass-clarinet', name: 'Bass clarinet in B♭', family: 'woodwind', transposition: '-9M', writtenClef: 'treble', writtenRange: null },
  { id: 'contra-alto-clarinet', name: 'Contra-alto clarinet in E♭', family: 'woodwind', transposition: '-13M', writtenClef: 'treble', writtenRange: null },
  { id: 'contrabass-clarinet', name: 'Contrabass clarinet in B♭', family: 'woodwind', transposition: '-16M', writtenClef: 'treble', writtenRange: null },

  // Saxophones
  // Sopranino: sources conflict (B♭ vs E♭, P4 vs m3). Wikipedia range table supports +3m. Verify.
  { id: 'sopranino-sax', name: 'Sopranino saxophone in E♭', family: 'saxophone', transposition: '+3m', writtenClef: 'treble', writtenRange: null },
  { id: 'soprano-sax', name: 'Soprano saxophone in B♭', family: 'saxophone', transposition: '-2M', writtenClef: 'treble', writtenRange: null },
  // C soprano and C melody are non-transposing. C melody is largely out of production.
  { id: 'soprano-sax-c', name: 'C soprano saxophone (non-transposing)', family: 'saxophone', transposition: '1P', writtenClef: 'treble', writtenRange: null },
  { id: 'c-melody-sax', name: 'C melody saxophone (non-transposing)', family: 'saxophone', transposition: '1P', writtenClef: 'treble', writtenRange: null },
  { id: 'alto-sax', name: 'Alto saxophone in E♭', family: 'saxophone', transposition: '-6M', writtenClef: 'treble', writtenRange: { low: 'D4', high: 'A6' } },
  { id: 'tenor-sax', name: 'Tenor saxophone in B♭', family: 'saxophone', transposition: '-9M', writtenClef: 'treble', writtenRange: null },
  { id: 'baritone-sax', name: 'Baritone saxophone in E♭', family: 'saxophone', transposition: '-13M', writtenClef: 'treble', writtenRange: null },
  { id: 'bass-sax', name: 'Bass saxophone in B♭', family: 'saxophone', transposition: '-16M', writtenClef: 'treble', writtenRange: null },
  // Unverified: derived by octave pattern from baritone (E♭) and bass (B♭). No source gave the interval.
  { id: 'contrabass-sax', name: 'Contrabass saxophone in E♭ (unverified)', family: 'saxophone', transposition: '-20M', writtenClef: 'bass', writtenRange: null },
  { id: 'subcontrabass-sax', name: 'Subcontrabass saxophone in B♭ (unverified)', family: 'saxophone', transposition: '-23M', writtenClef: 'bass', writtenRange: null },

  // Horns, trumpets, cornets, and other brass
  { id: 'horn-f', name: 'Horn in F', family: 'brass', transposition: '-5P', writtenClef: 'treble', writtenRange: null },
  { id: 'horn-eb', name: 'Horn in E♭', family: 'brass', transposition: '-6M', writtenClef: 'treble', writtenRange: null },
  { id: 'mellophone-f', name: 'Mellophone in F', family: 'brass', transposition: '-5P', writtenClef: 'treble', writtenRange: null },
  { id: 'trumpet-bb', name: 'Trumpet in B♭ / Cornet in B♭', family: 'brass', transposition: '-2M', writtenClef: 'treble', writtenRange: { low: 'F#3', high: 'C6' } },
  { id: 'flugelhorn-bb', name: 'Flugelhorn in B♭', family: 'brass', transposition: '-2M', writtenClef: 'treble', writtenRange: null },
  { id: 'trumpet-c', name: 'Trumpet in C', family: 'brass', transposition: '1P', writtenClef: 'treble', writtenRange: null },
  { id: 'trumpet-a', name: 'Trumpet in A', family: 'brass', transposition: '-3m', writtenClef: 'treble', writtenRange: null },
  { id: 'trumpet-d', name: 'Trumpet in D', family: 'brass', transposition: '+2M', writtenClef: 'treble', writtenRange: null },
  { id: 'trumpet-eb', name: 'Trumpet in E♭', family: 'brass', transposition: '+3m', writtenClef: 'treble', writtenRange: null },
  { id: 'soprano-cornet-eb', name: 'Soprano cornet in E♭ (brass band)', family: 'brass', transposition: '+3m', writtenClef: 'treble', writtenRange: null },
  { id: 'piccolo-trumpet-bb', name: 'Piccolo trumpet in B♭', family: 'brass', transposition: '+7m', writtenClef: 'treble', writtenRange: null },
  // Octave-based: A trumpet sounds a m3 lower (one source), piccolo sounds an octave above it. Octave part unverified.
  { id: 'piccolo-trumpet-a', name: 'Piccolo trumpet in A', family: 'brass', transposition: '+6M', writtenClef: 'treble', writtenRange: null },
  { id: 'tenor-horn-eb', name: 'Tenor horn in E♭ (alto horn, brass band)', family: 'brass', transposition: '-6M', writtenClef: 'treble', writtenRange: null },

  // Trombones, euphoniums, tubas
  // Orchestral convention: trombones are non-transposing. Brass bands use transposed parts, so check per context.
  { id: 'trombone-tenor', name: 'Tenor trombone (bass clef)', family: 'brass', transposition: '1P', writtenClef: 'bass', writtenRange: null },
  { id: 'trombone-bass', name: 'Bass trombone (bass clef)', family: 'brass', transposition: '1P', writtenClef: 'bass', writtenRange: null },
  { id: 'euphonium-tc', name: 'Euphonium / Baritone (treble clef, T.C.)', family: 'brass', transposition: '-9M', writtenClef: 'treble', writtenRange: null },
  { id: 'euphonium-bc', name: 'Euphonium / Trombone (bass clef, B.C.)', family: 'brass', transposition: '1P', writtenClef: 'bass', writtenRange: null },
  // Tubas are generally non-transposing; bass-clef parts are at concert pitch.
  { id: 'tuba-bass-clef', name: 'Tuba in B♭ / E♭ / C (bass clef)', family: 'brass', transposition: '1P', writtenClef: 'bass', writtenRange: null },

  // Strings and guitar
  { id: 'violin', name: 'Violin (non-transposing)', family: 'string', transposition: '1P', writtenClef: 'treble', writtenRange: null },
  { id: 'viola', name: 'Viola (C, non-transposing)', family: 'string', transposition: '1P', writtenClef: 'alto', writtenRange: null },
  { id: 'cello', name: 'Cello (C, non-transposing)', family: 'string', transposition: '1P', writtenClef: 'bass', writtenRange: null },
  { id: 'double-bass', name: 'Double bass', family: 'string', transposition: '-8P', writtenClef: 'bass', writtenRange: { low: 'E2', high: 'G5' } },
  { id: 'guitar', name: 'Guitar', family: 'guitar', transposition: '-8P', writtenClef: 'treble', writtenRange: { low: 'E3', high: 'E6' } },
  { id: 'bass-guitar', name: 'Bass guitar', family: 'guitar', transposition: '-8P', writtenClef: 'bass', writtenRange: null },

  // Percussion, keyboard, and harp
  { id: 'timpani', name: 'Timpani', family: 'percussion', transposition: '1P', writtenClef: 'bass', writtenRange: null },
  { id: 'glockenspiel', name: 'Glockenspiel', family: 'percussion', transposition: '+15P', writtenClef: 'treble', writtenRange: { low: 'G5', high: 'C8' } },
  { id: 'xylophone', name: 'Xylophone', family: 'percussion', transposition: '+8P', writtenClef: 'treble', writtenRange: { low: 'F4', high: 'C8' } },
  { id: 'marimba', name: 'Marimba', family: 'percussion', transposition: '1P', writtenClef: 'treble', writtenRange: null },
  { id: 'vibraphone', name: 'Vibraphone', family: 'percussion', transposition: '1P', writtenClef: 'treble', writtenRange: null },
  { id: 'crotales', name: 'Crotales', family: 'percussion', transposition: '+15P', writtenClef: 'treble', writtenRange: null },
  { id: 'celesta', name: 'Celesta', family: 'keyboard', transposition: '+8P', writtenClef: 'treble', writtenRange: null },
  { id: 'piano', name: 'Piano (non-transposing)', family: 'keyboard', transposition: '1P', writtenClef: 'treble', writtenRange: null },
  { id: 'harp', name: 'Harp (non-transposing)', family: 'other', transposition: '1P', writtenClef: 'treble', writtenRange: null },

  // Sarrusophones (Wikipedia range table; contrabass deferred until a clean source is found)
  { id: 'sarrusophone-sopranino', name: 'Sarrusophone sopranino in E♭', family: 'woodwind', transposition: '+3m', writtenClef: 'treble', writtenRange: null },
  { id: 'sarrusophone-soprano', name: 'Sarrusophone soprano in B♭', family: 'woodwind', transposition: '-2M', writtenClef: 'treble', writtenRange: null },
];

export function getInstrument(id: string): Instrument {
  const found = INSTRUMENTS.find((i) => i.id === id);
  if (!found) throw new Error(`Unknown instrument: ${id}`);
  return found;
}
