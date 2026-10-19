import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Note } from 'tonal';
import { playMelody, type PlaybackHandle } from '../audio/player';
import { formatPitch } from '../core/format';
import { getInstrument } from '../core/instruments';
import { checkWrittenRange } from '../core/range';
import { concertToWritten, writtenToConcert } from '../core/transpose';
import type { Direction, Pitch } from '../core/types';
import { useI18n } from '../i18n/context';
import { pillText, signedIntervalCode } from '../i18n/transposition';
import { InstrumentPicker } from '../input/InstrumentPicker';
import { PianoDock } from '../input/PianoDock';
import { GrandStaff } from '../render/GrandStaff';
import './notes.css';

// The range bar spans C1 to C8.
const BAR_LOW = Note.midi('C1')!;
const BAR_HIGH = Note.midi('C8')!;
const barPercent = (midi: number) => ((midi - BAR_LOW) / (BAR_HIGH - BAR_LOW)) * 100;

/** Notes mode: enter pitches on a piano and see them as written and as concert pitch. */
export function NotesView() {
  const { t, lang, instrumentName } = useI18n();
  const [instrumentId, setInstrumentId] = useState('clarinet-bb');
  const [direction, setDirection] = useState<Direction>('writtenToConcert');
  const [entered, setEntered] = useState<Pitch[]>([]);
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<PlaybackHandle | null>(null);

  const instrument = getInstrument(instrumentId);
  const enteringWritten = direction === 'writtenToConcert';
  const tone = enteringWritten ? 'written' : 'concert';

  // Entered pitches are either written or concert, depending on direction.
  const { written, concert } = useMemo(() => {
    const convert = enteringWritten ? writtenToConcert : concertToWritten;
    const other = entered.map((p) => convert(p, instrument));
    return enteringWritten ? { written: entered, concert: other } : { written: other, concert: entered };
  }, [entered, enteringWritten, instrument]);

  const statuses = written.map((p) => checkWrittenRange(p, instrument));
  const outOfRange = written
    .map((p, i) => ({ pitch: p, status: statuses[i] }))
    .filter((w) => w.status === 'below' || w.status === 'above');

  const stopPlayback = useCallback(() => {
    playerRef.current?.stop();
    playerRef.current = null;
    setPlaying(false);
  }, []);

  // Stop the sound when the notes or instrument change, and when leaving the view.
  useEffect(() => stopPlayback, [concert, stopPlayback]);

  const togglePlay = () => {
    if (playerRef.current) {
      stopPlayback();
      return;
    }
    const unique = [...new Set(concert)];
    if (unique.length === 0) return;
    const handle = playMelody([{ pitches: unique, duration: 'h' }], 80, () => {
      playerRef.current = null;
      setPlaying(false);
    });
    if (handle) {
      playerRef.current = handle;
      setPlaying(true);
    }
  };

  const addPitch = (pitch: Pitch) => setEntered((prev) => [...prev, pitch]);
  const removeAt = (index: number) => setEntered((prev) => prev.filter((_, i) => i !== index));

  // Explainer: what a written C4 sounds like on this instrument.
  const exampleConcert = writtenToConcert('C4', instrument, { simplify: true });
  const code = signedIntervalCode(instrument.transposition);
  const pill = pillText(instrument.transposition, lang, t);

  // Range bar: the instrument's written range, with a marker for each distinct entered note.
  const range = instrument.writtenRange;
  const markers = [...new Map(written.map((p) => [Note.midi(p), p])).entries()]
    .filter(([midi]) => midi !== null)
    .map(([midi, pitch]) => ({
      pitch,
      left: Math.min(100, Math.max(0, barPercent(midi as number))),
      out: checkWrittenRange(pitch, instrument) !== 'ok' && checkWrittenRange(pitch, instrument) !== 'unknown',
    }));

  return (
    <>
      <main className="page notes-page">
        <aside className="notes-side">
          <section className="panel">
            <h2 className="panel-title">{t('instrument')}</h2>
            <InstrumentPicker value={instrument} onChange={(i) => setInstrumentId(i.id)} />

            <div className="explainer">
              <div className="pitch-col">
                <span className="pitch-cap tone-written">{t('written')}</span>
                <span className="pitch-val tone-written">C4</span>
              </div>
              <div className="explainer-mid">
                <span className="interval-code">{code}</span>
                <svg width="100%" height="10" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M0 5H95M89 1l6 4-6 4" fill="none" stroke="#6a7894" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
              <div className="pitch-col end">
                <span className="pitch-cap tone-concert">{t('concert')}</span>
                <span className="pitch-val tone-concert">{formatPitch(exampleConcert)}</span>
              </div>
            </div>

            <div className="range">
              {range ? (
                <>
                  <div className="range-head">
                    <span>{t('rangeWritten')}</span>
                    <span>
                      {formatPitch(range.low)} – {formatPitch(range.high)}
                    </span>
                  </div>
                  <div className="range-track">
                    <div
                      className="range-fill"
                      style={{ left: `${barPercent(Note.midi(range.low)!)}%`, width: `${barPercent(Note.midi(range.high)!) - barPercent(Note.midi(range.low)!)}%` }}
                    />
                    {markers.map((m) => (
                      <div key={m.pitch} className={`range-mark${m.out ? ' is-out' : ''}`} style={{ left: `${m.left}%` }} title={formatPitch(m.pitch)} />
                    ))}
                  </div>
                </>
              ) : (
                <p className="muted-text">{t('noRangeDefined')}</p>
              )}
            </div>
          </section>

          <section className="panel">
            <h2 className="panel-title" id="direction-label">{t('enteringLabel')}</h2>
            <div className="dir-group" role="group" aria-labelledby="direction-label">
              <button type="button" className="dir-option written" aria-pressed={enteringWritten} onClick={() => setDirection('writtenToConcert')}>
                <DirMark on={enteringWritten} />
                <span className="dir-text">
                  <span className="dir-title">{t('dirWrittenTitle')}</span>
                  <span className="dir-desc">{t('dirWrittenDesc')}</span>
                </span>
              </button>
              <button type="button" className="dir-option concert" aria-pressed={!enteringWritten} onClick={() => setDirection('concertToWritten')}>
                <DirMark on={!enteringWritten} />
                <span className="dir-text">
                  <span className="dir-title">{t('dirConcertTitle')}</span>
                  <span className="dir-desc">{t('dirConcertDesc')}</span>
                </span>
              </button>
            </div>
          </section>
        </aside>

        <section className="notes-main">
          <div className="notes-bar">
            <div className="notes-bar-left">
              <span className="notes-bar-title">{t('yourNotes')}</span>
              {entered.length === 0 ? (
                <span className="muted-text">{t('noNotes')}</span>
              ) : (
                entered.map((p, i) => {
                  const out = statuses[i] === 'below' || statuses[i] === 'above';
                  return (
                    <span key={`${p}-${i}`} className={`note-chip ${out ? 'warn' : tone}`}>
                      <span className="pitch">{formatPitch(p)}</span>
                      <button type="button" aria-label={t('removeNote', { pitch: formatPitch(p) })} onClick={() => removeAt(i)}>
                        ×
                      </button>
                    </span>
                  );
                })
              )}
            </div>
            {entered.length > 0 && (
              <div className="notes-bar-right">
                {range === null ? (
                  <span className="status none">
                    {t('rangeWritten')}: {t('rangeNotDefinedShort')}
                  </span>
                ) : outOfRange.length === 0 ? (
                  <span className="status ok">
                    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                      <circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M5.5 9.2l2.4 2.4 4.6-4.9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t('rangeAllOk', { n: entered.length })}
                  </span>
                ) : (
                  <span className="status warn" role="alert">
                    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                      <path d="M9 2.5l7 12.5H2z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      <path d="M9 7.5v3M9 12.6v.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                    {t('rangeSomeOut', {
                      n: outOfRange.length,
                      list: outOfRange.map((w) => `${formatPitch(w.pitch)} (${t(w.status === 'below' ? 'below' : 'above')})`).join(', '),
                    })}
                  </span>
                )}
                <button type="button" className="ghost-btn" onClick={() => setEntered([])}>
                  {t('clearAll')}
                </button>
              </div>
            )}
          </div>

          <div className="staff-card">
            <div className="staff-card-head">
              <div className="staff-card-title">
                <span className="badge written">{t('writtenBadge')}</span>
                <span className="staff-card-sub">{t('writtenAsPrinted', { name: instrumentName(instrument) })}</span>
              </div>
            </div>
            <GrandStaff tone="written" pitches={written} label={t('writtenStaffLabel', { list: written.map(formatPitch).join(', ') || t('none') })} />
          </div>

          <div className="connector">
            <div className="connector-line" />
            <div className="connector-pill">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M9 3v11M4.5 10l4.5 4.5L13.5 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="interval-code">{code}</span>
              <span className="connector-text">{pill}</span>
            </div>
            <div className="connector-line" />
          </div>

          <div className="staff-card">
            <div className="staff-card-head">
              <div className="staff-card-title">
                <span className="badge concert">{t('concertBadge')}</span>
                <span className="staff-card-sub">{t('audienceHears')}</span>
              </div>
              <button type="button" className="play-btn" aria-pressed={playing} disabled={entered.length === 0} onClick={togglePlay}>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  {playing ? <rect x="3" y="3" width="10" height="10" rx="1.5" fill="currentColor" /> : <path d="M4 2.5v11l9-5.5z" fill="currentColor" />}
                </svg>
                {playing ? t('stop') : t('playChord')}
              </button>
            </div>
            <GrandStaff tone="concert" pitches={concert} label={t('concertStaffLabel', { list: concert.map(formatPitch).join(', ') || t('none') })} />
          </div>
        </section>
      </main>

      <PianoDock pressed={entered} tone={tone} hint={t('tapKeyHint')} onPick={addPitch} />
    </>
  );
}

/** Radio-style mark for the direction cards: a filled check when selected, a ring when not. */
function DirMark({ on }: { on: boolean }) {
  return (
    <svg className="dir-mark" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      {on ? (
        <>
          <circle cx="14" cy="14" r="13" fill="currentColor" />
          <path d="M8.5 14.5l3.8 3.8 7.2-7.6" fill="none" stroke="var(--accent-ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <circle cx="14" cy="14" r="12.5" fill="none" stroke="#4a566b" strokeWidth="1.5" />
      )}
    </svg>
  );
}
