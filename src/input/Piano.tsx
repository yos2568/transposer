import { useState } from 'react';
import type { Pitch } from '../core/types';
import { useI18n } from '../i18n/context';

const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK = new Set(['C#', 'D#', 'F#', 'G#', 'A#']);

/** Simple one-octave piano. Pick an octave, click a key to add a note. */
export function Piano({ onAdd }: { onAdd: (pitch: Pitch) => void }) {
  const [octave, setOctave] = useState(4);
  const { t } = useI18n();

  return (
    <div className="piano">
      <label>
        {t('pianoOctave')}{' '}
        <select value={octave} onChange={(e) => setOctave(Number(e.target.value))}>
          {[2, 3, 4, 5, 6].map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
      <div className="keys" role="group" aria-label={t('pianoKeysLabel', { octave })}>
        {PITCH_CLASSES.map((pc) => (
          <button
            key={pc}
            type="button"
            className={BLACK.has(pc) ? 'key black' : 'key white'}
            onClick={() => onAdd(`${pc}${octave}`)}
          >
            {pc}
            {octave}
          </button>
        ))}
      </div>
    </div>
  );
}
