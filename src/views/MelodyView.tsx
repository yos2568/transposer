import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { playMelody, type PlaybackHandle } from '../audio/player';
import { formatPitch } from '../core/format';
import { getInstrument } from '../core/instruments';
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
import { useI18n } from '../i18n/context';
import { DUR_KEY } from '../i18n/messages';
import { pillText, signedIntervalCode } from '../i18n/transposition';
import { InstrumentPicker } from '../input/InstrumentPicker';
import { PianoDock } from '../input/PianoDock';
import { MelodyStaff, type AccidentalChoice } from '../render/MelodyStaff';
import './melody.css';

/** Melody mode: build a line on the staff or piano, see it written and in concert pitch, and hear it. */
export function MelodyView() {
  const { t, lang, instrumentName } = useI18n();
  const [instrumentId, setInstrumentId] = useState('clarinet-bb');
  const [direction, setDirection] = useState<Direction>('writtenToConcert');
  const [events, setEvents] = useState<MelodyEvent[]>([]);
  const [pending, setPending] = useState<Pitch[]>([]);
  const [duration, setDuration] = useState<Duration>('q');
  const [accidental, setAccidental] = useState<AccidentalChoice>('');
  const [bpm, setBpm] = useState(100);
  const [playing, setPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState<number | null>(null);
  const playerRef = useRef<PlaybackHandle | null>(null);

  const instrument = getInstrument(instrumentId);
  const enteringWritten = direction === 'writtenToConcert';
  const tone = enteringWritten ? 'written' : 'concert';

  // Events are stored in the entry domain; the other domain is derived.
  const { written, concert } = useMemo(() => {
    if (enteringWritten) {
      return { written: events, concert: transposeEvents(events, instrument, 'writtenToConcert') };
    }
    return { written: transposeEvents(events, instrument, 'concertToWritten'), concert: events };
  }, [events, enteringWritten, instrument]);

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
    setPlayIndex(null);
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
    const handle = playMelody(
      concert,
      bpm,
      () => {
        playerRef.current = null;
        setPlaying(false);
        setPlayIndex(null);
      },
      setPlayIndex,
    );
    if (handle) {
      playerRef.current = handle;
      setPlaying(true);
    }
  };

  const beats = totalBeats(events);
  const seconds = playbackSeconds(events, bpm);
  const code = signedIntervalCode(instrument.transposition);
  const pill = pillText(instrument.transposition, lang, t);
  const hint = t('melodyStaffHint');

  return (
    <>
      <main className="page melody-page">
        <section className="panel control-strip">
          <div className="control-row">
            <div className="control-left">
              <InstrumentPicker compact value={instrument} onChange={(i) => setInstrumentId(i.id)} />
              <div className="seg2 seg2-inline" role="group" aria-label={t('enteringLabel')}>
                <button type="button" className="tone-written" aria-pressed={enteringWritten} onClick={() => setDirection('writtenToConcert')}>
                  {t('written')}
                </button>
                <button type="button" className="tone-concert" aria-pressed={!enteringWritten} onClick={() => setDirection('concertToWritten')}>
                  {t('concert')}
                </button>
              </div>
            </div>

            <div className="control-right">
              <label className="tempo-control">
                <span className="tempo-value">{t('bpmValue', { bpm })}</span>
                <input
                  type="range"
                  min={40}
                  max={180}
                  value={bpm}
                  aria-label={t('tempo', { bpm })}
                  onChange={(e) => setBpm(Number(e.target.value))}
                />
              </label>
              <span className="mono-muted">{events.length > 0 ? t('seconds', { s: seconds.toFixed(1) }) : ''}</span>
              <button type="button" className="play-main" aria-pressed={playing} disabled={events.length === 0} onClick={togglePlay}>
                <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
                  {playing ? <rect x="3" y="3" width="10" height="10" rx="1.5" fill="currentColor" /> : <path d="M4 2.5v11l9-5.5z" fill="currentColor" />}
                </svg>
                {playing ? t('stop') : t('playConcert')}
              </button>
            </div>
          </div>

          <div className="control-divider" />

          <div className="control-row entry-row">
            <div className="control-left">
              <div className="field-group">
                <span className="field-cap" id="duration-cap">{t('duration')}</span>
                <div className="dur-group" role="group" aria-labelledby="duration-cap">
                  {DURATIONS.map((d) => (
                    <button key={d} type="button" className="dur-btn" aria-pressed={duration === d} onClick={() => setDuration(d)}>
                      <NoteGlyph duration={d} />
                      <span>{t(DUR_KEY[d])}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field-group">
                <span className="field-cap" id="accidental-cap">{t('accidentalLabel')}</span>
                <div className="acc-group" role="group" aria-labelledby="accidental-cap">
                  <button type="button" aria-label={t('accNatural')} aria-pressed={accidental === ''} onClick={() => setAccidental('')}>
                    ♮
                  </button>
                  <button type="button" aria-label={t('accSharp')} aria-pressed={accidental === '#'} onClick={() => setAccidental('#')}>
                    ♯
                  </button>
                  <button type="button" aria-label={t('accFlat')} aria-pressed={accidental === 'b'} onClick={() => setAccidental('b')}>
                    ♭
                  </button>
                </div>
              </div>

              <div className="field-group">
                <span className="field-cap">{t('nextNote')}</span>
                <div className={`next-note ${tone}`}>
                  {pending.length === 0 ? (
                    <span className="next-note-hint">{t('melodyEmpty')}</span>
                  ) : (
                    pending.map((p) => (
                      <span key={p} className={`note-chip ${enteringWritten ? '' : 'concert'}`}>
                        <span className="pitch">{formatPitch(p)}</span>
                        <button
                          type="button"
                          aria-label={t('removeNote', { pitch: formatPitch(p) })}
                          onClick={() => setPending((prev) => prev.filter((x) => x !== p))}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                  <button type="button" className="primary-btn" disabled={pending.length === 0} onClick={commitNote}>
                    {t('addNote', { duration: t(DUR_KEY[duration]).toLowerCase() })}
                  </button>
                  <button type="button" className="ghost-btn" onClick={addRest}>
                    {t('addRest')}
                  </button>
                </div>
              </div>
            </div>

            <div className="control-right">
              {events.length > 0 && <span className="entry-count">{t('melodyCount', { n: events.length, beats })}</span>}
              <button type="button" className="ghost-btn" disabled={events.length === 0} onClick={() => setEvents((prev) => prev.slice(0, -1))}>
                {t('undo')}
              </button>
              <button type="button" className="ghost-btn" disabled={events.length === 0 && pending.length === 0} onClick={clearAll}>
                {t('clearAll')}
              </button>
            </div>
          </div>
        </section>

        {outOfRange.length > 0 && (
          <p className="status warn range-warning" role="alert">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M9 2.5l7 12.5H2z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M9 7.5v3M9 12.6v.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            {t('outOfRange', {
              name: instrumentName(instrument),
              low: formatPitch(instrument.writtenRange?.low ?? ''),
              high: formatPitch(instrument.writtenRange?.high ?? ''),
              list: outOfRange.map(formatPitch).join(', '),
            })}
          </p>
        )}

        <div className="staff-card">
          <div className="staff-card-head">
            <div className="staff-card-title">
              <span className="badge written">{t('writtenBadge')}</span>
              <span className="staff-card-sub">
                {t('writtenAsPrinted', { name: instrumentName(instrument) })}
                {enteringWritten ? ` · ${hint}` : ''}
              </span>
            </div>
          </div>
          <MelodyStaff
            tone="written"
            events={written}
            label={t('writtenMelodyLabel', { n: written.length })}
            onPick={enteringWritten ? addPitch : undefined}
            accidental={accidental}
          />
        </div>

        <div className="connector">
          <div className="connector-line" />
          <div className="connector-pill">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M9 3v11M4.5 10l4.5 4.5L13.5 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="interval-code">{code}</span>
            <span className="connector-text">{t('everyNote', { text: pill })}</span>
          </div>
          <div className="connector-line" />
        </div>

        <div className="staff-card">
          <div className="staff-card-head">
            <div className="staff-card-title">
              <span className="badge concert">{t('concertBadge')}</span>
              <span className="staff-card-sub">{enteringWritten ? t('audienceHearsPlayhead') : `${t('audienceHears')} · ${hint}`}</span>
            </div>
          </div>
          <MelodyStaff
            tone="concert"
            events={concert}
            label={t('concertMelodyLabel', { n: concert.length })}
            onPick={enteringWritten ? undefined : addPitch}
            accidental={accidental}
            playhead={playIndex}
          />
        </div>
      </main>

      <PianoDock compact pressed={pending} tone={tone} hint={t('tapKeyHintChord')} onPick={addPitch} />
    </>
  );
}

/** The note shape on each duration button. */
function NoteGlyph({ duration }: { duration: Duration }) {
  const props = { width: 28, height: 28, viewBox: '0 0 28 28', 'aria-hidden': true } as const;
  if (duration === 'w') {
    return (
      <svg {...props}>
        <ellipse cx="14" cy="14" rx="8" ry="5.4" fill="none" stroke="currentColor" strokeWidth="2.4" transform="rotate(-18 14 14)" />
      </svg>
    );
  }
  const hollow = duration === 'h';
  const flags = duration === 'e' ? 'M15.4 4c4 1.4 6.4 4.4 5.2 9' : duration === 's' ? 'M15.4 4c4 1.4 6.4 4.4 5.2 9M15.4 10c4 1.4 6.4 4.4 5.2 9' : '';
  return (
    <svg {...props}>
      <ellipse
        cx="10"
        cy="21"
        rx="6"
        ry="4.2"
        transform="rotate(-18 10 21)"
        fill={hollow ? 'none' : 'currentColor'}
        stroke={hollow ? 'currentColor' : 'none'}
        strokeWidth="2.2"
      />
      <path d={`M15.4 19.6V4${flags}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
