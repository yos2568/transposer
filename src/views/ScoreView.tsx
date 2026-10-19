import { useEffect, useMemo, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { getInstrument } from '../core/instruments';
import { useI18n } from '../i18n/context';
import { transpositionText } from '../i18n/transposition';
import { InstrumentPicker } from '../input/InstrumentPicker';
import { readScoreFile } from '../score/mxl';
import { ScoreError, parseScore, readParts, serializeScore, toConcert, toWritten, type PartInfo } from '../score/musicxml';
import './score.css';

type Mode = 'written' | 'concert';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.6;
const ZOOM_STEP = 0.1;

type Analysis =
  | { ok: true; concertXml: string; parts: PartInfo[] }
  | { ok: false; error: unknown };

function analyze(xml: string): Analysis {
  try {
    const doc = parseScore(xml);
    return { ok: true, concertXml: serializeScore(toConcert(doc)), parts: readParts(doc) };
  } catch (error) {
    return { ok: false, error };
  }
}

/** Score mode: open a MusicXML file, pick each part's instrument, and see it written or in concert pitch. */
export function ScoreView() {
  const { t } = useI18n();
  const [source, setSource] = useState<{ name: string; xml: string } | null>(null);
  // A file that could not be opened (kept as the error, so it can be worded in the current language).
  const [loadError, setLoadError] = useState<unknown>(null);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>('written');
  // Instrument id chosen for a part. A part with no entry keeps the instrument stored in the file.
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const zoomRef = useRef(1);

  const analysis = useMemo(() => (source ? analyze(source.xml) : null), [source]);
  const parts = analysis?.ok ? analysis.parts : [];

  // Each part's written -> concert interval: the file's own, or the chosen instrument's.
  const intervals = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of parts) {
      const choice = choices[p.id];
      map[p.id] = choice ? getInstrument(choice).transposition : p.transposition;
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
  const displayError = display && 'error' in display ? display.error : null;

  // One renderer per displayed score, bound to the container that is mounted right now.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !displayXml) return;
    let cancelled = false;
    // OSMD appends to its container, so start from an empty one each time.
    el.innerHTML = '';
    const osmd = new OpenSheetMusicDisplay(el, { autoResize: true, backend: 'svg', drawTitle: true });
    osmd.zoom = zoomRef.current;
    setDrawError(null);
    setBusy(true);
    osmd
      .load(displayXml)
      .then(() => {
        if (cancelled) return;
        osmd.render();
        osmdRef.current = osmd;
      })
      .catch((e: unknown) => {
        if (!cancelled) setDrawError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
      if (osmdRef.current === osmd) osmdRef.current = null;
      osmd.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayXml]);

  // Zoom redraws the current score without reloading it.
  useEffect(() => {
    zoomRef.current = zoom;
    const osmd = osmdRef.current;
    if (osmd) {
      osmd.zoom = zoom;
      osmd.render();
    }
  }, [zoom]);

  /** Open a score from text. A file that is not a score is rejected and the current score stays. */
  function accept(name: string, xml: string) {
    const check = analyze(xml);
    if (!check.ok) {
      setLoadError(check.error);
      return;
    }
    setLoadError(null);
    setSource({ name, xml });
    setChoices({});
    setMode('written');
  }

  async function openFile(file: File) {
    setLoadError(null);
    setBusy(true);
    try {
      accept(file.name, await readScoreFile(file));
    } catch (e) {
      setLoadError(e);
    } finally {
      setBusy(false);
    }
  }

  async function loadSample() {
    setLoadError(null);
    setBusy(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}sample.musicxml`);
      if (!res.ok) throw new Error(t('sampleNotFound', { status: res.status }));
      accept('sample.musicxml', await res.text());
    } catch (e) {
      setLoadError(e);
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

  const loadErrorText = loadError
    ? loadError instanceof ScoreError
      ? t(loadError.code === 'not-partwise' ? 'errNotPartwise' : 'errNotScore')
      : loadError instanceof Error
        ? loadError.message
        : String(loadError)
    : null;
  const shownError = loadErrorText ?? (drawError ? t('couldNotDraw', { msg: drawError }) : null) ?? displayError;
  const changeZoom = (delta: number) =>
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) * 10) / 10)));

  return (
    <div className="score2">
      <aside className="score2-side">
        <section
          className={`dropzone${dragging ? ' is-dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void openFile(file);
          }}
        >
          <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
            <rect width="44" height="44" rx="14" fill="#171d29" />
            <path d="M22 28V14M16 20l6-6 6 6" fill="none" stroke="#f0b45a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 29v2h18v-2" fill="none" stroke="#6a7894" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="drop-text">
            <span className="drop-title">{dragging ? t('dropActive') : t('dropTitle')}</span>
            <span className="drop-sub">{t('dropFormats')}</span>
          </div>
          <div className="drop-actions">
            <button type="button" className="primary-btn drop-btn" onClick={() => fileInputRef.current?.click()}>
              {t('chooseFile')}
            </button>
            <button type="button" className="outline-btn" onClick={() => void loadSample()}>
              {t('loadSample')}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".musicxml,.xml,.mxl,application/vnd.recordare.musicxml+xml"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void openFile(file);
              e.target.value = '';
            }}
          />
          {source && analysis?.ok && (
            <div className="file-pill">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5.5 9.2l2.4 2.4 4.6-4.9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="file-name">{source.name}</span>
              <span className="file-meta">{t('partsCount', { n: parts.length })}</span>
            </div>
          )}
        </section>

        {shownError && (
          <p className="status warn score-error" role="alert">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M9 2.5l7 12.5H2z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M9 7.5v3M9 12.6v.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            {shownError}
          </p>
        )}

        {analysis?.ok && (
          <>
            <section className="panel">
              <h2 className="panel-title" id="score-show-label">{t('show')}</h2>
              <div className="seg2" role="group" aria-labelledby="score-show-label">
                <button type="button" className="tone-written" aria-pressed={mode === 'written'} onClick={() => setMode('written')}>
                  {t('writtenParts')}
                </button>
                <button type="button" className="tone-concert" aria-pressed={mode === 'concert'} onClick={() => setMode('concert')}>
                  {t('concertScore')}
                </button>
              </div>
            </section>

            <section className="panel">
              <h2 className="panel-title">{t('parts')}</h2>
              <div className="part-cards">
                {parts.map((p) => {
                  const choice = choices[p.id];
                  return (
                    <div className="part-card" key={p.id}>
                      <div className="part-card-head">
                        <span className="part-card-name">{p.name}</span>
                        <span className="part-card-interval">{transpositionText(p.transposition, t)}</span>
                      </div>
                      <InstrumentPicker
                        compact
                        label={t('instrumentFor', { name: p.name })}
                        value={choice ? getInstrument(choice) : null}
                        reset={{
                          label: t('asInFile', { desc: transpositionText(p.transposition, t) }),
                          onSelect: () =>
                            setChoices((prev) => {
                              const next = { ...prev };
                              delete next[p.id];
                              return next;
                            }),
                        }}
                        onChange={(instrument) => setChoices((prev) => ({ ...prev, [p.id]: instrument.id }))}
                      />
                    </div>
                  );
                })}
              </div>
              {mode === 'concert' && <p className="muted-text small">{t('instrumentChoicesHint')}</p>}
            </section>

            <button type="button" className="download-btn" onClick={download} disabled={!displayXml}>
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 3v10M5.5 9l4.5 4.5L14.5 9M4 16.5h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t('downloadXml')}
            </button>
            <p className="download-note">{t('downloadNote')}</p>
          </>
        )}
      </aside>

      <section className="viewer">
        <div className="viewer-head">
          <div className="staff-card-title">
            <span className={`badge ${mode === 'concert' ? 'concert' : 'written'}`}>
              {mode === 'concert' ? t('concertBadge') : t('writtenBadge')}
            </span>
            <span className="staff-card-sub">{busy ? t('drawing') : source ? source.name : t('noScoreOpen')}</span>
          </div>
          <div className="zoom" role="group" aria-label={t('zoomLabel')}>
            <button type="button" aria-label={t('zoomOut')} disabled={zoom <= ZOOM_MIN} onClick={() => changeZoom(-ZOOM_STEP)}>
              −
            </button>
            <span className="zoom-value">{Math.round(zoom * 100)}%</span>
            <button type="button" aria-label={t('zoomIn')} disabled={zoom >= ZOOM_MAX} onClick={() => changeZoom(ZOOM_STEP)}>
              +
            </button>
          </div>
        </div>

        <div className="viewer-body">
          {displayXml ? (
            <>
              <div className="paper">
                <div className="osmd" ref={containerRef} />
              </div>
              <p className="viewer-foot">{t('scoreFoot')}</p>
            </>
          ) : (
            <p className="viewer-empty">{t('scoreEmpty')}</p>
          )}
        </div>
      </section>
    </div>
  );
}
