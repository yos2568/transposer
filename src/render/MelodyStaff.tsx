import { useEffect, useRef } from 'react';
import { Accidental, Formatter, Renderer, Stave, StaveConnector, StaveNote, Voice } from 'vexflow';
import { chunkRows, type Duration, type MelodyEvent } from '../core/melody';
import type { Clef, Pitch } from '../core/types';
import { toVexNote } from './keys';
import { pitchAtStaffY } from './staffPosition';
import { INK, LINES, REST, TONE_COLOR, type Tone } from './theme';

const WIDTH = 720;
const HEIGHT = 200;
const TREBLE_Y = 20;
const BASS_Y = 110;
const STAVE_X = 14;
const STAVE_W = WIDTH - 28;
const SPACING = 10;
const PER_ROW = 8;

const VEX_DURATION: Record<Duration, string> = { w: 'w', h: 'h', q: 'q', e: '8', s: '16' };
const REST_KEY: Record<Clef, string> = { treble: 'b/4', bass: 'd/3', alto: 'c/4', tenor: 'a/3' };

export type AccidentalChoice = '' | '#' | 'b';

interface Props {
  events: MelodyEvent[];
  /** Written pitches draw in brass, concert pitches in teal. */
  tone: Tone;
  /** Called with the pitch under a click on the staff. Omit for a read-only staff. */
  onPick?: (pitch: Pitch) => void;
  /** Accidental applied to clicked pitches. */
  accidental?: AccidentalChoice;
  /** Index of the event that is sounding now; draws a playhead over it. */
  playhead?: number | null;
  label: string;
}

/**
 * A melody on treble + bass staves, wrapped into rows of `PER_ROW` events.
 * Clicking a staff picks the nearest diatonic pitch on that staff.
 */
export function MelodyStaff({ events, tone, onPick, accidental = '', playhead = null, label }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';

    const rows = events.length > 0 ? chunkRows(events, PER_ROW) : [[]];
    rows.forEach((rowEvents, rowIndex) => {
      const holder = document.createElement('div');
      holder.className = 'system';
      el.appendChild(holder);
      const local = playhead !== null ? playhead - rowIndex * PER_ROW : -1;
      drawRow(holder, rowEvents, tone, local >= 0 && local < rowEvents.length ? local : null);

      if (onPick) {
        holder.addEventListener('click', (ev) => {
          const svg = holder.querySelector('svg');
          if (!svg) return;
          const rect = svg.getBoundingClientRect();
          const y = (ev.clientY - rect.top) * (HEIGHT / rect.height);
          // Ignore clicks well outside the two staves.
          if (y < TREBLE_Y - 30 || y > BASS_Y + 70) return;
          const clef: Clef = y < (TREBLE_Y + BASS_Y + 40) / 2 ? 'treble' : 'bass';
          const top = clef === 'treble' ? TREBLE_Y : BASS_Y;
          onPick(pitchAtStaffY(y, clef, top, SPACING, accidental));
        });
      }
    });
  }, [events, tone, onPick, accidental, playhead]);

  return <div className={`melody-staff${onPick ? ' clickable' : ''}`} ref={ref} role="img" aria-label={label} />;
}

function drawRow(holder: HTMLDivElement, rowEvents: MelodyEvent[], tone: Tone, playheadIndex: number | null) {
  const renderer = new Renderer(holder, Renderer.Backends.SVG);
  renderer.resize(WIDTH, HEIGHT);
  const svg = holder.querySelector('svg');
  if (svg) {
    svg.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
    // VexFlow sets an inline pixel width; let the SVG scale to its card instead.
    svg.style.width = '100%';
    svg.style.height = 'auto';
  }
  const ctx = renderer.getContext();
  ctx.setFillStyle(INK);
  ctx.setStrokeStyle(INK);

  const treble = new Stave(STAVE_X, TREBLE_Y, STAVE_W).addClef('treble');
  const bass = new Stave(STAVE_X, BASS_Y, STAVE_W).addClef('bass');
  for (const stave of [treble, bass]) {
    // The five lines draw dim; clefs and bar lines keep the bright ink.
    stave.setStyle({ strokeStyle: LINES, fillStyle: LINES });
    for (const modifier of stave.getModifiers()) modifier.setStyle({ strokeStyle: INK, fillStyle: INK });
    stave.setContext(ctx).drawWithStyle();
  }
  new StaveConnector(treble, bass).setType('brace').setContext(ctx).draw();
  new StaveConnector(treble, bass).setType('singleLeft').setContext(ctx).draw();

  if (rowEvents.length === 0) return;

  const color = TONE_COLOR[tone];
  const trebleVoice = new Voice({ numBeats: 4, beatValue: 4 }).setStrict(false);
  trebleVoice.addTickables(rowEvents.map((e) => makeStaveNote(e, 'treble', color)));
  const bassVoice = new Voice({ numBeats: 4, beatValue: 4 }).setStrict(false);
  bassVoice.addTickables(rowEvents.map((e) => makeStaveNote(e, 'bass', color)));

  const width = treble.getNoteEndX() - treble.getNoteStartX() - 10;
  new Formatter().joinVoices([trebleVoice, bassVoice]).format([trebleVoice, bassVoice], width);
  trebleVoice.draw(ctx, treble);
  bassVoice.draw(ctx, bass);

  if (playheadIndex !== null) {
    // A soft band and a line over the sounding event, spanning both staves.
    const x = trebleVoice.getTickables()[playheadIndex].getAbsoluteX() + 8;
    const top = TREBLE_Y - 14;
    const height = BASS_Y + 40 + 14 - top;
    ctx.save();
    ctx.setFillStyle('rgba(94, 214, 197, 0.14)');
    ctx.fillRect(x - 26, top, 52, height);
    ctx.setStrokeStyle(TONE_COLOR.concert);
    ctx.setLineWidth(2.4);
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + height);
    ctx.stroke();
    ctx.restore();
  }
}

/** One event on one staff: its notes that belong to that clef, or a rest if there are none. */
function makeStaveNote(event: MelodyEvent, clef: 'treble' | 'bass', color: string): StaveNote {
  const mine = event.pitches
    .map(toVexNote)
    .filter((n) => n.clef === clef)
    .sort((a, b) => a.midi - b.midi);
  const isRest = mine.length === 0;

  const note = new StaveNote({
    keys: isRest ? [REST_KEY[clef]] : mine.map((n) => n.key),
    duration: VEX_DURATION[event.duration] + (isRest ? 'r' : ''),
    clef,
  });
  const noteColor = isRest ? REST : color;
  note.setStyle({ fillStyle: noteColor, strokeStyle: noteColor });
  if (!isRest) {
    mine.forEach((n, i) => {
      if (!n.accidental) return;
      const accidental = new Accidental(n.accidental);
      accidental.setStyle({ fillStyle: noteColor, strokeStyle: noteColor });
      note.addModifier(accidental, i);
    });
  }
  return note;
}
