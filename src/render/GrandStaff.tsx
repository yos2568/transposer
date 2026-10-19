import { useEffect, useRef } from 'react';
import { Accidental, Formatter, Renderer, Stave, StaveConnector, StaveNote, Voice } from 'vexflow';
import type { Pitch } from '../core/types';
import { splitByClef, type VexNote } from './keys';
import { INK, LINES, REST, TONE_COLOR, type Tone } from './theme';

const WIDTH = 860;
const HEIGHT = 210;
const TREBLE_Y = 22;
const BASS_Y = 116;
const STAVE_X = 24;
const STAVE_W = WIDTH - 48;


// Placeholder rests for an empty staff: b/4 on treble, d/3 on bass.
const REST_KEY: Record<'treble' | 'bass', string> = { treble: 'b/4', bass: 'd/3' };

interface Props {
  pitches: Pitch[];
  label: string;
  /** Written pitches draw in brass, concert pitches in teal. */
  tone: Tone;
}

/** One whole-note chord on a treble+bass grand staff. */
export function GrandStaff({ pitches, label, tone }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';

    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(WIDTH, HEIGHT);
    // Let the SVG scale down to the card width on phones.
    const svg = el.querySelector('svg');
    if (svg) {
      svg.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
      svg.style.width = '100%';
      svg.style.height = 'auto';
    }
    const ctx = renderer.getContext();
    // Default ink for everything that is not styled below (clefs, brace, bar lines).
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

    const groups = splitByClef(pitches);
    drawStaff(ctx, treble, groups.treble, 'treble', TONE_COLOR[tone]);
    drawStaff(ctx, bass, groups.bass, 'bass', TONE_COLOR[tone]);
  }, [pitches, tone]);

  return <div className="staff" ref={ref} role="img" aria-label={label} />;
}

function drawStaff(
  ctx: ReturnType<Renderer['getContext']>,
  stave: Stave,
  notes: VexNote[],
  clef: 'treble' | 'bass',
  color: string,
) {
  const hasNotes = notes.length > 0;
  const keys = hasNotes ? notes.map((n) => n.key) : [REST_KEY[clef]];
  const staveNote = new StaveNote({
    keys,
    duration: hasNotes ? 'w' : 'wr',
    clef,
  });
  const noteColor = hasNotes ? color : REST;
  staveNote.setStyle({ fillStyle: noteColor, strokeStyle: noteColor });
  notes.forEach((n, i) => {
    if (n.accidental) {
      const accidental = new Accidental(n.accidental);
      accidental.setStyle({ fillStyle: noteColor, strokeStyle: noteColor });
      staveNote.addModifier(accidental, i);
    }
  });

  const voice = new Voice({ numBeats: 4, beatValue: 4 }).setStrict(false);
  voice.addTickables([staveNote]);
  new Formatter().joinVoices([voice]).format([voice], stave.getNoteEndX() - stave.getNoteStartX() - 10);
  voice.draw(ctx, stave);
}
