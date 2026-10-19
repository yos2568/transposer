import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { playMelody, type PlaybackHandle } from '../audio/player';
import { INSTRUMENTS, getInstrument } from '../core/instruments';
import {
  DURATIONS,
  playbackSeconds,
  totalBeats,
  transposeEvents,
  type Duration,
  type MelodyEvent,
} from '../core/melody';
import { checkWrittenRange } from '../core/range';
import type { Direction, Pitch } from '../core/types';
import { Piano } from '../input/Piano';
import { MelodyStaff, type AccidentalChoice } from '../render/MelodyStaff';
import { useI18n } from '../i18n/context';
import { FAMILY_KEY } from '../i18n/messages';
import { DUR_KEY } from '../i18n/messages';

const ACCIDENTAL_LABEL: Record<AccidentalChoice, string> = { '': '♮', '#': '♯', b: '♭' };

/** Melody mode: build a line on the staff, see it in written and concert pitch, and hear the concert version. */
export function MelodyView() {
  const { t, instrumentName } = useI18n();
  const [instrumentId, setInstrumentId] = useState('clarinet-bb');
  const [direction, setDirection] = useState<Direction>('writtenToConcert');
  const [events, setEvents] = useState<MelodyEvent[]>([]);
  const [pending, setPending] = useState<Pitch[]>([]);
  const [duration, setDuration] = useState<Duration>('q');
  const [accidental, setAccidental] = useState<AccidentalChoice>('');
  const [bpm, setBpm] = useState(100);
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<PlaybackHandle | null>(null);

  const instrument = getInstrument(instrumentId);

  // Events are stored in the entry domain; the other domain is derived.
  const { written, concert } = useMemo(() => {
    if (direction === 'writtenToConcert') {
      return { written: events, concert: transposeEvents(events, instrument, 'writtenToConcert') };
    }
    return { written: transposeEvents(events, instrument, 'concertToWritten'), concert: events };
  }, [events, direction, instrument]);

  const outOfRange = useMemo(() => {
    const found: Pitch[] = [];
    for (const e of written) {
      for (const p of e.pitches) {
        const status = checkWrittenRange(p, instrument);
        if (status === 'below' || status === 'above') found.push(p);
      }
    }
    return found;
  }, [written, instrument]);

  const stopPlayback = useCallback(() => {
    playerRef.current?.stop();
    playerRef.current = null;
    setPlaying(false);
  }, []);

  // Stop playback when the melody or instrument changes, and when leaving the view.
  useEffect(() => stopPlayback, [concert, stopPlayback]);

  const addPitch = useCallback((p: Pitch) => {
    setPending((prev) => (prev.includes(p) ? prev : [...prev, p]));
  }, []);

  const commitNote = () => {
    if (pending.length === 0) return;
    setEvents((prev) => [...prev, { pitches: pending, duration }]);
    setPending([]);
  };

  const addRest = () => {
    setPending([]);
    setEvents((prev) => [...prev, { pitches: [], duration }]);
  };

  const undo = () => setEvents((prev) => prev.slice(0, -1));

  const clearAll = () => {
    stopPlayback();
    setEvents([]);
    setPending([]);
  };

  const togglePlay = () => {
    if (playerRef.current) {
      stopPlayback();
      return;
    }
    if (concert.length === 0) return;
    const handle = playMelody(concert, bpm, () => {
      playerRef.current = null;
      setPlaying(false);
    });
    if (handle) {
      playerRef.current = handle;
      setPlaying(true);
    }
  };

  const groups = INSTRUMENTS.reduce<Record<string, typeof INSTRUMENTS>>((acc, inst) => {
    (acc[inst.family] ??= []).push(inst);
    return acc;
  }, {});

  const enteringWritten = direction === 'writtenToConcert';
  const beats = totalBeats(events);
  const seconds = playbackSeconds(events, bpm);

  return (
    <div className="layout">
      <aside className="card">
        <div className="field">
          <label htmlFor="melody-instrument">{t('instrument')}</label>
          <select id="melody-instrument" value={instrumentId} onChange={(e) => setInstrumentId(e.target.value)}>
            {Object.entries(groups).map(([family, list]) => (
              <optgroup key={family} label={t(FAMILY_KEY[family] ?? 'famOther')}>
                {list.map((i) => (
                  <option key={i.id} value={i.id}>
                    {instrumentName(i)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="field">
          <span className="field-label" id="melody-direction-label">{t('enteringLabel')}</span>
          <div className="segmented" role="radiogroup" aria-labelledby="melody-direction-label">
            <label>
              <input
                type="radio"
                name="melody-direction"
                checked={enteringWritten}
                onChange={() => setDirection('writtenToConcert')}
              />
              {t('written')}
            </label>
            <label>
              <input
                type="radio"
                name="melody-direction"
                checked={!enteringWritten}
                onChange={() => setDirection('concertToWritten')}
              />
              {t('concert')}
            </label>
          </div>
          <p className="hint">{t('melodyClickHint', { side: enteringWritten ? t('sideWritten') : t('sideConcert') })}</p>
        </div>

        <div className="field">
          <span className="field-label" id="duration-label">{t('duration')}</span>
          <div className="segmented five" role="radiogroup" aria-labelledby="duration-label">
            {DURATIONS.map((d) => (
              <label key={d} title={t(DUR_KEY[d])}>
                <input type="radio" name="duration" checked={duration === d} onChange={() => setDuration(d)} />
                {t(DUR_KEY[d])}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label" id="accidental-label">{t('staffAccidental')}</span>
          <div className="segmented three" role="radiogroup" aria-labelledby="accidental-label">
            {(['', '#', 'b'] as AccidentalChoice[]).map((a) => (
              <label key={a || 'natural'}>
                <input type="radio" name="accidental" checked={accidental === a} onChange={() => setAccidental(a)} />
                {ACCIDENTAL_LABEL[a]}
              </label>
            ))}
          </div>
        </div>

        <Piano onAdd={addPitch} />
      </aside>

      <section className="main">
        <div className="card">
          {/* Always rendered, so adding the first pitch does not move the staves below. */}
          <div className="chips">
            {pending.length === 0 ? (
              <span className="empty">{t('melodyEmpty')}</span>
            ) : (
              pending.map((p) => (
                <span className="chip" key={p}>
                  {p}
                  <button
                    type="button"
                    onClick={() => setPending((prev) => prev.filter((x) => x !== p))}
                    aria-label={t('removeNote', { pitch: p })}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="actions">
            <button type="button" className="btn primary" onClick={commitNote} disabled={pending.length === 0}>
              {t('addNote', { duration: t(DUR_KEY[duration]) })}
            </button>
            <button type="button" className="btn" onClick={addRest}>
              {t('addRest')}
            </button>
            <button type="button" className="btn" onClick={undo} disabled={events.length === 0}>
              {t('undo')}
            </button>
            <button type="button" className="btn" onClick={clearAll} disabled={events.length === 0 && pending.length === 0}>
              {t('clearAll')}
            </button>
          </div>

          <p className="muted">
            {t('melodyCount', { n: events.length, beats })}
          </p>

          {outOfRange.length > 0 && (
            <p className="warning" role="alert">
              {t('outOfRange', { name: instrumentName(instrument), low: instrument.writtenRange?.low ?? '', high: instrument.writtenRange?.high ?? '', list: outOfRange.join(', ') })}
            </p>
          )}
          {instrument.writtenRange === null && events.length > 0 && (
            <p className="muted">{t('noRangeDefined')}</p>
          )}
        </div>

        <div className="card transport">
          <button type="button" className={`btn ${playing ? '' : 'primary'}`} onClick={togglePlay} disabled={events.length === 0}>
            {playing ? t('stop') : t('playConcert')}
          </button>
          <label className="tempo">
            {t('tempo', { bpm })}
            <input type="range" min={40} max={180} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />
          </label>
          <span className="muted">{events.length > 0 ? t('seconds', { s: seconds.toFixed(1) }) : ''}</span>
        </div>

        <div className="score">
          <div className="score-head">
            <span className="badge written">{t('writtenBadge')}</span>
            <span className="score-sub">{instrumentName(instrument)}</span>
          </div>
          <MelodyStaff
            events={written}
            label={t('writtenMelodyLabel', { n: written.length })}
            onPick={enteringWritten ? addPitch : undefined}
            accidental={accidental}
          />
        </div>

        <div className="score">
          <div className="score-head">
            <span className="badge concert">{t('concertBadge')}</span>
            <span className="score-sub">{t('whatSounds')}</span>
          </div>
          <MelodyStaff
            events={concert}
            label={t('concertMelodyLabel', { n: concert.length })}
            onPick={enteringWritten ? undefined : addPitch}
            accidental={accidental}
          />
        </div>
      </section>
    </div>
  );
}
