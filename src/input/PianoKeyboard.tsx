import { useEffect, useMemo, useState } from 'react';
import { Note } from 'tonal';
import type { Pitch } from '../core/types';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
// Black keys sit on the boundary after these white keys (C, D, F, G, A).
const BLACK_SLOTS: Array<[number, string]> = [[1, 'C#'], [2, 'D#'], [4, 'F#'], [5, 'G#'], [6, 'A#']];

/** True on narrow screens, where the keyboard shows one octave instead of two. */
function useNarrow(): boolean {
  const query = '(max-width: 720px)';
  const [narrow, setNarrow] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return narrow;
}

interface Props {
  startOctave: number;
  /** Pitches to highlight, e.g. the notes the user has entered. */
  pressed: Pitch[];
  /** Colour of highlighted keys: brass for written pitch, teal for concert pitch. */
  tone: 'written' | 'concert';
  onPick: (pitch: Pitch) => void;
}

/** Number of octaves shown; the parent needs it for the octave label and limits. */
export function useKeyboardOctaves(): number {
  return useNarrow() ? 1 : 2;
}

/** A piano keyboard with the real layout: white keys in a row, black keys between them. */
export function PianoKeyboard({ startOctave, pressed, tone, onPick }: Props) {
  const octaves = useKeyboardOctaves();
  const pressedMidi = useMemo(() => new Set(pressed.map((p) => Note.midi(p))), [pressed]);
  const whiteCount = octaves * 7;
  const unit = 100 / whiteCount;
  const blackWidth = unit * 0.73;

  const whites = [];
  const blacks = [];
  for (let o = 0; o < octaves; o++) {
    const octave = startOctave + o;
    for (const letter of LETTERS) {
      const id = `${letter}${octave}`;
      whites.push({ id, on: pressedMidi.has(Note.midi(id)), label: letter === 'C' });
    }
    for (const [slot, name] of BLACK_SLOTS) {
      const id = `${name}${octave}`;
      blacks.push({ id, on: pressedMidi.has(Note.midi(id)), left: (o * 7 + slot) * unit - blackWidth / 2 });
    }
  }

  return (
    <div className={`kb ${tone}`} role="group">
      <div className="kb-whites">
        {whites.map((k) => (
          <button
            key={k.id}
            type="button"
            className={`kb-white${k.on ? ' is-on' : ''}`}
            aria-label={k.id}
            aria-pressed={k.on}
            onClick={() => onPick(k.id)}
          >
            {k.on || k.label ? k.id : ''}
          </button>
        ))}
      </div>
      {blacks.map((k) => (
        <button
          key={k.id}
          type="button"
          className={`kb-black${k.on ? ' is-on' : ''}`}
          aria-label={k.id.replace('#', '♯')}
          aria-pressed={k.on}
          style={{ left: `${k.left}%`, width: `${blackWidth}%` }}
          onClick={() => onPick(k.id)}
        />
      ))}
    </div>
  );
}
