import { useEffect, useRef } from 'react';
import { Accidental, Formatter, Renderer, Stave, StaveConnector, StaveNote, Voice } from 'vexflow';
import type { Pitch } from '../core/types';
import { splitByClef, type VexNote } from './keys';

const WIDTH = 640;
const HEIGHT = 200;
const TREBLE_Y = 20;
const BASS_Y = 110;
const STAVE_X = 20;
const STAVE_W = WIDTH - 40;

// Placeholder rests for an empty staff: b/4 on treble, d/3 on bass.
const REST_KEY: Record<'treble' | 'bass', string> = { treble: 'b/4', bass: 'd/3' };

/** One whole-note chord on a treble+bass grand staff. */
export function GrandStaff({ pitches, label }: { pitches: Pitch[]; label: string }) {
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

    const treble = new Stave(STAVE_X, TREBLE_Y, STAVE_W).addClef('treble');
    const bass = new Stave(STAVE_X, BASS_Y, STAVE_W).addClef('bass');
    treble.setContext(ctx).draw();
    bass.setContext(ctx).draw();
    new StaveConnector(treble, bass).setType('brace').setContext(ctx).draw();
    new StaveConnector(treble, bass).setType('singleLeft').setContext(ctx).draw();

    const groups = splitByClef(pitches);
    drawStaff(ctx, treble, groups.treble, 'treble');
    drawStaff(ctx, bass, groups.bass, 'bass');
  }, [pitches]);

  return <div className="staff" ref={ref} role="img" aria-label={label} />;
}

function drawStaff(
  ctx: ReturnType<Renderer['getContext']>,
  stave: Stave,
  notes: VexNote[],
  clef: 'treble' | 'bass',
) {
  const keys = notes.length > 0 ? notes.map((n) => n.key) : [REST_KEY[clef]];
  const staveNote = new StaveNote({
    keys,
    duration: notes.length > 0 ? 'w' : 'wr',
    clef,
  });
  notes.forEach((n, i) => {
    if (n.accidental) staveNote.addModifier(new Accidental(n.accidental), i);
  });

  const voice = new Voice({ numBeats: 4, beatValue: 4 }).setStrict(false);
  voice.addTickables([staveNote]);
  new Formatter().joinVoices([voice]).format([voice], stave.getNoteEndX() - stave.getNoteStartX() - 10);
  voice.draw(ctx, stave);
}
