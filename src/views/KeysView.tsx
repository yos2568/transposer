import { useMemo, useState } from 'react';
import { INSTRUMENTS } from '../core/instruments';
import { formatKeySignature, keyTable } from '../core/keyTable';
import type { Direction, KeyMode, MusicalKey } from '../core/types';
import { useI18n } from '../i18n/context';
import { FAMILY_KEY } from '../i18n/messages';
import { transpositionText } from '../i18n/transposition';

const TONICS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];

/** "Bb" -> "B♭", "F#" -> "F♯". */
const pretty = (name: string) => name.replace('#', '♯').replace('b', '♭');

/** Key mode: pick a key and see its written or concert equivalent for every instrument. */
export function KeysView() {
  const { t, instrumentName } = useI18n();
  const [tonic, setTonic] = useState('Bb');
  const [mode, setMode] = useState<KeyMode>('major');
  const [direction, setDirection] = useState<Direction>('concertToWritten');

  const source: MusicalKey = { tonic, mode };
  const rows = useMemo(() => keyTable(source, direction), [tonic, mode, direction]);

  // Rows keep INSTRUMENTS order; group them under family headings.
  const sections = useMemo(() => {
    const map = new Map<string, typeof rows>();
    for (const r of rows) {
      const list = map.get(r.instrument.family) ?? [];
      list.push(r);
      map.set(r.instrument.family, list);
    }
    return [...map.entries()];
  }, [rows]);

  const sourceLabel = direction === 'concertToWritten' ? t('keyConcert') : t('keyWritten');
  const targetLabel = direction === 'concertToWritten' ? t('keyWritten') : t('keyConcert');

  return (
    <div className="keys-view">
      <section className="card keys-controls">
        <div className="field">
          <label htmlFor="tonic" className="field-caption">{sourceLabel}</label>
          <div className="key-picker">
            <select id="tonic" value={tonic} onChange={(e) => setTonic(e.target.value)}>
              {TONICS.map((t) => (
                <option key={t} value={t}>
                  {pretty(t)}
                </option>
              ))}
            </select>
            <div className="segmented compact" role="radiogroup" aria-label="Mode">
              <label>
                <input type="radio" name="mode" checked={mode === 'major'} onChange={() => setMode('major')} />
                {t('major')}
              </label>
              <label>
                <input type="radio" name="mode" checked={mode === 'minor'} onChange={() => setMode('minor')} />
                {t('minor')}
              </label>
            </div>
          </div>
        </div>

        <div className="field">
          <span className="field-caption" id="key-direction-label">{t('iHaveThe')}</span>
          <div className="segmented" role="radiogroup" aria-labelledby="key-direction-label">
            <label>
              <input
                type="radio"
                name="key-direction"
                checked={direction === 'concertToWritten'}
                onChange={() => setDirection('concertToWritten')}
              />
              {t('keyConcert')}
            </label>
            <label>
              <input
                type="radio"
                name="key-direction"
                checked={direction === 'writtenToConcert'}
                onChange={() => setDirection('writtenToConcert')}
              />
              {t('keyWritten')}
            </label>
          </div>
          <p className="hint">
            {t('keysHint')}
          </p>
        </div>
      </section>

      <section className="card table-card">
        <div className="table-scroll">
          <table className="key-table">
            <thead>
              <tr>
                <th scope="col">{t('colInstrument')}</th>
                <th scope="col">{t('colTransposition')}</th>
                <th scope="col">{targetLabel}</th>
                <th scope="col">{t('colSignature')}</th>
              </tr>
            </thead>
            {sections.map(([family, list]) => (
              <tbody key={family}>
                <tr className="family-row">
                  <th colSpan={4} scope="colgroup">
                    {t(FAMILY_KEY[family] ?? 'famOther')}
                  </th>
                </tr>
                {list.map((r) => {
                  const plain = r.instrument.transposition === '1P';
                  return (
                    <tr key={r.instrument.id} className={plain ? 'plain' : undefined}>
                      <td>{instrumentName(r.instrument)}</td>
                      <td className="muted-cell">{transpositionText(r.instrument.transposition, t)}</td>
                      <td className="key-cell">
                        {pretty(r.target.tonic)} {t(r.target.mode)}
                      </td>
                      <td>{r.accidentals === 0 ? t('noSharpsFlats') : formatKeySignature(r.accidentals)}</td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </div>
        <p className="muted table-foot">
          {t('keysFoot', { n: INSTRUMENTS.length, key: `${pretty(tonic)} ${t(mode)}`, source: sourceLabel.toLowerCase() })}
        </p>
      </section>
    </div>
  );
}
