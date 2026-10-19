import { useMemo, useState } from 'react';
import { INSTRUMENTS } from '../core/instruments';
import { keyTable, shortSignature, type KeyRow } from '../core/keyTable';
import type { Direction, KeyMode } from '../core/types';
import { useI18n } from '../i18n/context';
import { FAMILY_KEY } from '../i18n/messages';
import { matchesInstrument } from '../i18n/search';
import { transpositionText } from '../i18n/transposition';
import './keys.css';
import { usePinned } from './usePinned';

// Circle-of-fifths order, from 7 flats to 7 sharps. Minor keys share the signature of the
// major key above them (A♭ minor has the 7 flats of C♭ major).
const MAJOR = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
const MINOR = ['Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#'];

const FAMILIES = [...new Set(INSTRUMENTS.map((i) => i.family))];

/** "Bb" -> "B♭", "F#" -> "F♯". */
const pretty = (name: string) => name.replace('#', '♯').replace('b', '♭');

/** Keys mode: pick a key and see its written or concert equivalent for every instrument. */
export function KeysView() {
  const { t, instrumentName } = useI18n();
  const [tonic, setTonic] = useState('Bb');
  const [mode, setMode] = useState<KeyMode>('major');
  const [direction, setDirection] = useState<Direction>('concertToWritten');
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState('all');
  const { ids: pinnedIds, toggle: togglePin } = usePinned();

  const fromConcert = direction === 'concertToWritten';
  const sourceTone = fromConcert ? 'concert' : 'written';
  const targetTone = fromConcert ? 'written' : 'concert';
  const targetLabel = fromConcert ? t('keyWritten') : t('keyConcert');

  const tonics = mode === 'major' ? MAJOR : MINOR;
  const fifths = tonics.indexOf(tonic) - 7;

  const rows = useMemo(() => keyTable({ tonic, mode }, direction), [tonic, mode, direction]);

  const pinnedRows = pinnedIds
    .map((id) => rows.find((r) => r.instrument.id === id))
    .filter((r): r is KeyRow => r !== undefined);

  const visible = rows.filter(
    (r) =>
      (family === 'all' || r.instrument.family === family) &&
      matchesInstrument(r.instrument, query, t(FAMILY_KEY[r.instrument.family] ?? 'famOther')),
  );

  // Switching major/minor keeps the same tonic when that key exists, else the same signature.
  const changeMode = (next: KeyMode) => {
    if (next === mode) return;
    const list = next === 'major' ? MAJOR : MINOR;
    setTonic(list.includes(tonic) ? tonic : list[fifths + 7]);
    setMode(next);
  };

  const modeName = (m: KeyMode) => t(m === 'major' ? 'majorName' : 'minorName');
  const keyName = (row: KeyRow) => `${pretty(row.target.tonic)} ${modeName(row.target.mode)}`;

  return (
    <div className="keys2">
      <aside className="keys2-side">
        <section className="panel">
          <h2 className="panel-title" id="keys-source-label">{t('iHaveThe')}</h2>
          <div className="seg2" role="group" aria-labelledby="keys-source-label">
            <button type="button" className="tone-concert" aria-pressed={fromConcert} onClick={() => setDirection('concertToWritten')}>
              {t('keyConcert')}
            </button>
            <button type="button" className="tone-written" aria-pressed={!fromConcert} onClick={() => setDirection('writtenToConcert')}>
              {t('keyWritten')}
            </button>
          </div>

          <div className={`key-result ${sourceTone}`}>
            <span className="key-result-name">
              {pretty(tonic)} {modeName(mode)}
            </span>
            <span className="key-result-sig">{shortSignature(fifths)}</span>
          </div>

          <div className="key-grid" role="group" aria-label={t('keyGridLabel')}>
            {tonics.map((name, i) => (
              <button
                key={name}
                type="button"
                className={`key-tile ${sourceTone}`}
                aria-pressed={name === tonic}
                aria-label={`${pretty(name)} ${modeName(mode)}, ${shortSignature(i - 7)}`}
                onClick={() => setTonic(name)}
              >
                <span className="name">{pretty(name)}</span>
                <span className="sig">{shortSignature(i - 7)}</span>
              </button>
            ))}
          </div>

          <div className="seg2" role="group" aria-label={t('modeLabel')}>
            <button type="button" aria-pressed={mode === 'major'} onClick={() => changeMode('major')}>
              {t('major')}
            </button>
            <button type="button" aria-pressed={mode === 'minor'} onClick={() => changeMode('minor')}>
              {t('minor')}
            </button>
          </div>

          <p className="muted-text small">{t('respellNote')}</p>
        </section>
      </aside>

      <section className="keys2-main">
        <div className="block">
          <h2 className="block-title">{t('pinned')}</h2>
          {pinnedRows.length === 0 ? (
            <p className="pin-empty">{t('pinHint')}</p>
          ) : (
            <div className="pin-grid">
              {pinnedRows.map((r) => (
                <div className="pin-card" key={r.instrument.id}>
                  <div className="pin-card-top">
                    <span className="pin-card-name">{instrumentName(r.instrument)}</span>
                    <PinButton
                      pinned
                      label={t('unpinInstrument', { name: instrumentName(r.instrument) })}
                      onClick={() => togglePin(r.instrument.id)}
                    />
                  </div>
                  <span className={`pin-card-key tone-${targetTone}`}>{keyName(r)}</span>
                  <div className="pin-card-foot">
                    <span className="pin-card-interval">{transpositionText(r.instrument.transposition, t)}</span>
                    <span className="sig-pill" title={r.accidentals === 0 ? t('noSharpsFlats') : undefined}>
                      {shortSignature(r.accidentals)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="block">
          <div className="block-head">
            <h2 className="block-title">{t('allInstruments')}</h2>
            <label className="search-box">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                aria-label={t('searchInstruments')}
                placeholder={t('searchInstruments')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>

          <div className="filter-row" role="group" aria-label={t('filterByFamily')}>
            <button type="button" className="filter-chip" aria-pressed={family === 'all'} onClick={() => setFamily('all')}>
              {t('filterAll')}
            </button>
            {FAMILIES.map((f) => (
              <button key={f} type="button" className="filter-chip" aria-pressed={family === f} onClick={() => setFamily(f)}>
                {t(FAMILY_KEY[f] ?? 'famOther')}
              </button>
            ))}
          </div>

          <div className="table-wrap">
            <table className="keys-table">
              <thead>
                <tr>
                  <th scope="col" className="col-pin">
                    <span className="sr-only">{t('colPin')}</span>
                  </th>
                  <th scope="col">{t('colInstrument')}</th>
                  <th scope="col">{t('colTransposition')}</th>
                  <th scope="col" className={`tone-${targetTone}`}>
                    {targetLabel}
                  </th>
                  <th scope="col" className="right">
                    {t('colSignature')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const pinned = pinnedIds.includes(r.instrument.id);
                  const name = instrumentName(r.instrument);
                  return (
                    <tr key={r.instrument.id}>
                      <td className="col-pin">
                        <PinButton pinned={pinned} label={t(pinned ? 'unpinInstrument' : 'pinInstrument', { name })} onClick={() => togglePin(r.instrument.id)} />
                      </td>
                      <td>
                        <span className="row-name">
                          <strong>{name}</strong>
                          <span>{t(FAMILY_KEY[r.instrument.family] ?? 'famOther')}</span>
                        </span>
                      </td>
                      <td className="row-interval">{transpositionText(r.instrument.transposition, t)}</td>
                      <td className={`row-key tone-${targetTone}`}>{keyName(r)}</td>
                      <td className="right">
                        <span className="sig-pill" title={r.accidentals === 0 ? t('noSharpsFlats') : undefined}>
                          {shortSignature(r.accidentals)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visible.length === 0 && <p className="muted-text pad">{t('noMatches')}</p>}
          </div>

          <p className="keys-foot">
            {t('keysShowing', { shown: visible.length, total: INSTRUMENTS.length, key: `${pretty(tonic)} ${modeName(mode)}` })}
          </p>
        </div>
      </section>
    </div>
  );
}

function PinButton({ pinned, label, onClick }: { pinned: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" className="star-btn" aria-pressed={pinned} aria-label={label} onClick={onClick}>
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 2.5l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
