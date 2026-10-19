import { describe, expect, it } from 'vitest';
import { getInstrument } from '../core/instruments';
import {
  chunkRows,
  eventStartBeats,
  playbackSeconds,
  totalBeats,
  transposeEvents,
  type MelodyEvent,
} from '../core/melody';

describe('transposeEvents', () => {
  const bb = getInstrument('clarinet-bb');

  it('transposes written pitches to concert and keeps durations', () => {
    const written: MelodyEvent[] = [{ pitches: ['C4'], duration: 'q' }];
    expect(transposeEvents(written, bb, 'writtenToConcert')).toEqual([{ pitches: ['Bb3'], duration: 'q' }]);
  });

  it('transposes concert pitches back to written', () => {
    const concert: MelodyEvent[] = [{ pitches: ['Eb4'], duration: 'h' }];
    expect(transposeEvents(concert, bb, 'concertToWritten')).toEqual([{ pitches: ['F4'], duration: 'h' }]);
  });

  it('keeps rests as rests', () => {
    const events: MelodyEvent[] = [{ pitches: [], duration: 'e' }];
    expect(transposeEvents(events, bb, 'writtenToConcert')).toEqual([{ pitches: [], duration: 'e' }]);
  });

  it('transposes every pitch of a chord', () => {
    const chord: MelodyEvent[] = [{ pitches: ['C4', 'E4', 'G4'], duration: 'w' }];
    const out = transposeEvents(chord, bb, 'writtenToConcert');
    expect(out[0].pitches).toEqual(['Bb3', 'D4', 'F4']);
  });
});

describe('timing', () => {
  const melody: MelodyEvent[] = [
    { pitches: ['C4'], duration: 'q' },
    { pitches: ['D4'], duration: 'e' },
    { pitches: [], duration: 'h' },
  ];

  it('sums beats', () => {
    expect(totalBeats(melody)).toBe(3.5);
  });

  it('gives start beats for each event', () => {
    expect(eventStartBeats(melody)).toEqual([0, 1, 1.5]);
  });

  it('converts beats to seconds at a tempo', () => {
    expect(playbackSeconds([{ pitches: ['C4'], duration: 'w' }], 60)).toBe(4);
    expect(playbackSeconds(melody, 120)).toBeCloseTo(1.75);
  });
});

describe('chunkRows', () => {
  it('splits into rows of at most perRow items', () => {
    expect(chunkRows([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4)).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10],
    ]);
  });

  it('returns no rows for an empty list', () => {
    expect(chunkRows([], 8)).toEqual([]);
  });
});
