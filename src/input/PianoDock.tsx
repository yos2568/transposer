import { useState } from 'react';
import type { Pitch } from '../core/types';
import { useI18n } from '../i18n/context';
import type { Tone } from '../render/theme';
import { PianoKeyboard, useKeyboardOctaves } from './PianoKeyboard';

interface Props {
  /** Pitches to highlight on the keys. */
  pressed: Pitch[];
  /** Colour of highlighted keys: brass for written pitch, teal for concert pitch. */
  tone: Tone;
  hint: string;
  /** A shorter keyboard, for screens where the staves need the room. */
  compact?: boolean;
  onPick: (pitch: Pitch) => void;
}

/** The piano docked at the bottom of the screen, with an octave stepper. */
export function PianoDock({ pressed, tone, hint, compact = false, onPick }: Props) {
  const { t } = useI18n();
  const [startOctave, setStartOctave] = useState(4);
  const octaves = useKeyboardOctaves();

  const maxStart = 8 - octaves;
  const start = Math.min(startOctave, maxStart);
  const label =
    octaves === 1
      ? `${t('pianoOctave')} ${start}`
      : t('octavesLabel', { from: start, to: start + octaves - 1 });

  return (
    <footer className={`dock${compact ? ' compact' : ''}`}>
      <div className="dock-inner">
        <div className="dock-top">
          <div className="stepper">
            <button type="button" aria-label={t('lowerOctave')} disabled={start <= 1} onClick={() => setStartOctave(start - 1)}>
              ‹
            </button>
            <span className="stepper-label">{label}</span>
            <button type="button" aria-label={t('higherOctave')} disabled={start >= maxStart} onClick={() => setStartOctave(start + 1)}>
              ›
            </button>
          </div>
          <span className="dock-hint">{hint}</span>
        </div>
        <PianoKeyboard startOctave={start} pressed={pressed} tone={tone} onPick={onPick} />
      </div>
    </footer>
  );
}
