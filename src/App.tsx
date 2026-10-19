import { useMemo, useState } from 'react';
import { INSTRUMENTS, getInstrument } from './core/instruments';
import { checkWrittenRange } from './core/range';
import { concertToWritten, writtenToConcert } from './core/transpose';
import type { Direction, Instrument, Pitch } from './core/types';
import { Piano } from './input/Piano';
import { GrandStaff } from './render/GrandStaff';
import { KeysView } from './views/KeysView';
import { MelodyView } from './views/MelodyView';
import { ScoreView } from './views/ScoreView';
import { useI18n } from './i18n/context';
import { FAMILY_KEY } from './i18n/messages';

type View = 'notes' | 'keys' | 'melody' | 'score';

export function App() {
  const [instrumentId, setInstrumentId] = useState('clarinet-bb');
  const [direction, setDirection] = useState<Direction>('writtenToConcert');
  const [entered, setEntered] = useState<Pitch[]>([]);
  const [view, setView] = useState<View>('notes');
  const { t, lang, setLang, instrumentName } = useI18n();

  const instrument = getInstrument(instrumentId);

  // Entered pitches are either written or concert, depending on direction.
  const { written, concert } = useMemo(() => {
    const convert = direction === 'writtenToConcert' ? writtenToConcert : concertToWritten;
    const other = entered.map((p) => convert(p, instrument));
    return direction === 'writtenToConcert'
      ? { written: entered, concert: other }
      : { written: other, concert: entered };
  }, [entered, direction, instrument]);

  const warnings = written
    .map((p) => ({ pitch: p, status: checkWrittenRange(p, instrument) }))
    .filter((w) => w.status === 'below' || w.status === 'above');

  const groups = INSTRUMENTS.reduce<Record<string, Instrument[]>>((acc, inst) => {
    (acc[inst.family] ??= []).push(inst);
    return acc;
  }, {});

  const addPitch = (pitch: Pitch) => setEntered((prev) => [...prev, pitch]);
  const removeAt = (index: number) => setEntered((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Transposer</h1>
          <p className="tagline">{t('tagline')}</p>
        </div>
        <div className="header-actions">
        <nav className="tabs" aria-label="Mode">
          <button type="button" aria-pressed={view === 'notes'} onClick={() => setView('notes')}>
            {t('tabNotes')}
          </button>
          <button type="button" aria-pressed={view === 'keys'} onClick={() => setView('keys')}>
            {t('tabKeys')}
          </button>
          <button type="button" aria-pressed={view === 'melody'} onClick={() => setView('melody')}>
            {t('tabMelody')}
          </button>
          <button type="button" aria-pressed={view === 'score'} onClick={() => setView('score')}>
            {t('tabScore')}
          </button>
        </nav>
        <div className="lang-toggle segmented compact" role="radiogroup" aria-label={t('language')}>
          <label>
            <input type="radio" name="lang" checked={lang === 'en'} onChange={() => setLang('en')} />
            EN
          </label>
          <label>
            <input type="radio" name="lang" checked={lang === 'th'} onChange={() => setLang('th')} />
            ไทย
          </label>
        </div>
        </div>
      </header>

      {view === 'score' ? (
        <ScoreView />
      ) : view === 'melody' ? (
        <MelodyView />
      ) : view === 'keys' ? (
        <KeysView />
      ) : (
      <div className="layout">
        <aside className="card">
          <div className="field">
            <label htmlFor="instrument">{t('instrument')}</label>
            <select id="instrument" value={instrumentId} onChange={(e) => setInstrumentId(e.target.value)}>
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
            <span className="field-label" id="direction-label">{t('enteringLabel')}</span>
            <div className="segmented" role="radiogroup" aria-labelledby="direction-label">
              <label>
                <input
                  type="radio"
                  name="direction"
                  checked={direction === 'writtenToConcert'}
                  onChange={() => setDirection('writtenToConcert')}
                />
                {t('written')}
              </label>
              <label>
                <input
                  type="radio"
                  name="direction"
                  checked={direction === 'concertToWritten'}
                  onChange={() => setDirection('concertToWritten')}
                />
                {t('concert')}
              </label>
            </div>
            <p className="hint">
              {t('writtenHint', { name: instrumentName(instrument) })}
            </p>
          </div>

          <Piano onAdd={addPitch} />
        </aside>

        <section className="main">
          <div className="card">
            {entered.length === 0 ? (
              <p className="empty">{t('noNotes')}</p>
            ) : (
              <div className="chips">
                {entered.map((p, i) => (
                  <span className="chip" key={`${p}-${i}`}>
                    {p}
                    <button type="button" onClick={() => removeAt(i)} aria-label={t('removeNote', { pitch: p })}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {warnings.length > 0 && (
              <p className="warning" role="alert">
                {t('outOfRange', {
                  name: instrumentName(instrument),
                  low: instrument.writtenRange?.low ?? '',
                  high: instrument.writtenRange?.high ?? '',
                  list: warnings.map((w) => `${w.pitch} (${t(w.status === 'below' ? 'below' : 'above')})`).join(', '),
                })}
              </p>
            )}
            {instrument.writtenRange === null && entered.length > 0 && (
              <p className="muted">{t('noRangeDefined')}</p>
            )}

            {entered.length > 0 && (
              <div className="entered-footer">
                <span className="muted">{t('noteCount', { n: entered.length })}</span>
                <button type="button" className="btn" onClick={() => setEntered([])}>
                  {t('clearAll')}
                </button>
              </div>
            )}
          </div>

          <div className="score">
            <div className="score-head">
              <span className="badge written">{t('writtenBadge')}</span>
              <span className="score-sub">{instrumentName(instrument)}</span>
            </div>
            <GrandStaff pitches={written} label={t('writtenStaffLabel', { list: written.join(', ') || t('none') })} />
          </div>

          <div className="score">
            <div className="score-head">
              <span className="badge concert">{t('concertBadge')}</span>
              <span className="score-sub">{t('whatSounds')}</span>
            </div>
            <GrandStaff pitches={concert} label={t('concertStaffLabel', { list: concert.join(', ') || t('none') })} />
          </div>
        </section>
      </div>
      )}
    </div>
  );
}
