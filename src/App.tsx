import { useState, type ReactNode } from 'react';
import { useI18n } from './i18n/context';
import type { MessageKey } from './i18n/messages';
import { KeysView } from './views/KeysView';
import { MelodyView } from './views/MelodyView';
import { NotesView } from './views/NotesView';
import { ScoreView } from './views/ScoreView';

type View = 'notes' | 'keys' | 'melody' | 'score';

const ICON_PROPS = { className: 'tab-icon', width: 22, height: 22, viewBox: '0 0 22 22', 'aria-hidden': true } as const;

const TABS: Array<{ id: View; label: MessageKey; icon: ReactNode }> = [
  {
    id: 'notes',
    label: 'tabNotes',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 6H19M3 10H19M3 14H19M3 18H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="9" cy="14" r="2.4" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'keys',
    label: 'tabKeys',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M11 3v8l5 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'melody',
    label: 'tabMelody',
    icon: (
      <svg {...ICON_PROPS}>
        <ellipse cx="7.5" cy="16" rx="3.6" ry="2.6" fill="currentColor" transform="rotate(-18 7.5 16)" />
        <path d="M10.6 15V4l7 2v9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="14.5" cy="15" rx="3.2" ry="2.4" fill="currentColor" transform="rotate(-18 14.5 15)" />
      </svg>
    ),
  },
  {
    id: 'score',
    label: 'tabScore',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M6 3h7l4 4v12H6z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M13 3v4h4M9 12h6M9 15.5h6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function App() {
  const [view, setView] = useState<View>('notes');
  const { t, lang, setLang } = useI18n();

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <button type="button" className="brand" title={t('tagline')} onClick={() => setView('notes')}>
            <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
              <rect width="36" height="36" rx="10" fill="#171d29" />
              <path d="M7 8H29M7 12.5H29M7 17H29M7 21.5H29M7 26H29" stroke="#f0b45a" strokeOpacity="0.55" strokeWidth="1.3" strokeLinecap="round" />
              <ellipse cx="15" cy="21.5" rx="4.6" ry="3.2" fill="#5ed6c5" transform="rotate(-18 15 21.5)" />
              <path d="M19.2 20.5V9" stroke="#5ed6c5" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="brand-name">Transposer</span>
          </button>
          <nav className="tabs" aria-label="Mode">
            {TABS.map((tab) => (
              <button key={tab.id} type="button" aria-current={view === tab.id ? 'page' : undefined} onClick={() => setView(tab.id)}>
                {tab.icon}
                <span>{t(tab.label)}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="lang-switch" role="group" aria-label={t('language')}>
          <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
            EN
          </button>
          <button type="button" aria-pressed={lang === 'th'} onClick={() => setLang('th')}>
            ไทย
          </button>
        </div>
      </header>

      {/* Notes and Melody draw their own <main> and docked piano; Keys and Score share this wrapper. */}
      {view === 'notes' ? (
        <NotesView />
      ) : view === 'melody' ? (
        <MelodyView />
      ) : (
        <main className="page">{view === 'keys' ? <KeysView /> : <ScoreView />}</main>
      )}

      <footer className="credit">{t('credit')}</footer>
    </div>
  );
}
