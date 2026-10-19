import { useEffect, useMemo, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { INSTRUMENTS } from '../core/instruments';
import { parseScore, readParts, serializeScore, toConcert, toWritten, type PartInfo } from '../score/musicxml';
import { readScoreFile } from '../score/mxl';
import { useI18n } from '../i18n/context';
import { FAMILY_KEY } from '../i18n/messages';
import { transpositionText } from '../i18n/transposition';

type Mode = 'written' | 'concert';

const FILE_CHOICE = 'file';

type Analysis =
  | { ok: true; concertXml: string; parts: PartInfo[] }
  | { ok: false; message: string };

function analyze(xml: string): Analysis {
  try {
    const doc = parseScore(xml);
    return { ok: true, concertXml: serializeScore(toConcert(doc)), parts: readParts(doc) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** Score mode: open a MusicXML file, pick each part's instrument, and see it written or in concert pitch. */
export function ScoreView() {
  const { t, instrumentName } = useI18n();
  const [source, setSource] = useState<{ name: string; xml: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>('written');
  const [choices, setChoices] = useState<Record<string, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const analysis = useMemo(() => (source ? analyze(source.xml) : null), [source]);
  const parts = analysis?.ok ? analysis.parts : [];

  // Each part's written -> concert interval: the file's own, or the chosen instrument's.
  const intervals = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of parts) {
      const choice = choices[p.id] ?? FILE_CHOICE;
      map[p.id] = choice === FILE_CHOICE ? p.transposition : INSTRUMENTS.find((i) => i.id === choice)!.transposition;
    }
    return map;
  }, [parts, choices]);

  const display = useMemo((): { xml: string } | { error: string } | null => {
    if (!analysis?.ok) return null;
    try {
      if (mode === 'concert') return { xml: analysis.concertXml };
      return { xml: serializeScore(toWritten(parseScore(analysis.concertXml), intervals)) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [analysis, intervals, mode]);

  const displayXml = display && 'xml' in display ? display.xml : null;
  const displayError = display && 'error' in display ? display.error : analysis && !analysis.ok ? analysis.message : null;

  // Render the displayed MusicXML with OpenSheetMusicDisplay.
  // One renderer per displayed score, bound to the container that is mounted right now.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !displayXml) return;
    let cancelled = false;
    // OSMD appends to its container, so start from an empty one each time.
    el.innerHTML = '';
    const osmd = new OpenSheetMusicDisplay(el, { autoResize: true, backend: 'svg', drawTitle: true });
    setBusy(true);
    osmd
      .load(displayXml)
      .then(() => {
        if (!cancelled) osmd.render();
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(t('couldNotDraw', { msg: e instanceof Error ? e.message : String(e) }));
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
      osmd.clear();
    };
  }, [displayXml]);

  async function openFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const xml = await readScoreFile(file);
      setSource({ name: file.name, xml });
      setChoices({});
      setMode('written');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function loadSample() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}sample.musicxml`);
      if (!res.ok) throw new Error(t('sampleNotFound', { status: res.status }));
      setSource({ name: 'sample.musicxml', xml: await res.text() });
      setChoices({});
      setMode('written');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!displayXml || !source) return;
    const base = source.name.replace(/\.(musicxml|xml|mxl)$/i, '');
    const blob = new Blob([displayXml], { type: 'application/vnd.recordare.musicxml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${base}-${mode}.musicxml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const groups = INSTRUMENTS.reduce<Record<string, typeof INSTRUMENTS>>((acc, inst) => {
    (acc[inst.family] ??= []).push(inst);
    return acc;
  }, {});

  const shownError = error ?? displayError;

  return (
    <div className="layout">
      <aside className="card">
        <div className="field">
          <span className="field-label">{t('scoreFile')}</span>
          <div className="actions">
            <label className="btn file-btn">
              {t('openFile')}
              <input
                type="file"
                accept=".musicxml,.xml,.mxl,application/vnd.recordare.musicxml+xml"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void openFile(f);
                  e.target.value = '';
                }}
              />
            </label>
            <button type="button" className="btn" onClick={() => void loadSample()}>
              {t('loadSample')}
            </button>
          </div>
          {source && <p className="hint">{t('openedFile', { name: source.name })}</p>}
        </div>

        {analysis?.ok && (
          <>
            <div className="field">
              <span className="field-label" id="score-mode-label">{t('show')}</span>
              <div className="segmented" role="radiogroup" aria-labelledby="score-mode-label">
                <label>
                  <input type="radio" name="score-mode" checked={mode === 'written'} onChange={() => setMode('written')} />
                  {t('writtenParts')}
                </label>
                <label>
                  <input type="radio" name="score-mode" checked={mode === 'concert'} onChange={() => setMode('concert')} />
                  {t('concertScore')}
                </label>
              </div>
            </div>

            <div className="field">
              <span className="field-label">{t('parts')}</span>
              <div className="part-list">
                {parts.map((p) => (
                  <div className="part-row" key={p.id}>
                    <div className="part-name">{p.name}</div>
                    <select
                      aria-label={t('instrumentFor', { name: p.name })}
                      value={choices[p.id] ?? FILE_CHOICE}
                      onChange={(e) => setChoices((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      disabled={mode === 'concert'}
                    >
                      <option value={FILE_CHOICE}>{t('asInFile', { desc: transpositionText(p.transposition, t) })}</option>
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
                ))}
              </div>
              {mode === 'concert' && <p className="hint">{t('instrumentChoicesHint')}</p>}
            </div>

            <button type="button" className="btn primary" onClick={download} disabled={!displayXml}>
              {t('downloadXml')}
            </button>
          </>
        )}

        {shownError && (
          <p className="warning" role="alert">
            {shownError}
          </p>
        )}
      </aside>

      <section className="main">
        <div className="score score-wide">
          <div className="score-head">
            <span className={`badge ${mode === 'concert' ? 'concert' : 'written'}`}>
              {mode === 'concert' ? t('concertBadge') : t('writtenBadge')}
            </span>
            <span className="score-sub">{busy ? t('drawing') : source ? source.name : t('noScoreOpen')}</span>
          </div>
          {displayXml ? (
            <div className="osmd" ref={containerRef} />
          ) : (
            <p className="empty score-empty">{t('scoreEmpty')}</p>
          )}
        </div>
      </section>
    </div>
  );
}
