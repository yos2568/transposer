import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { INSTRUMENTS } from '../core/instruments';
import type { Instrument } from '../core/types';
import { useI18n } from '../i18n/context';
import { FAMILY_KEY } from '../i18n/messages';
import { matchesInstrument } from '../i18n/search';

interface Props {
  /** The chosen instrument, or null while the `reset` choice is active. */
  value: Instrument | null;
  onChange: (instrument: Instrument) => void;
  /** A smaller trigger for toolbars: one line, no subtitle. */
  compact?: boolean;
  /** Adds a first choice that clears the instrument, such as "As in file". */
  reset?: { label: string; onSelect: () => void };
  /** Accessible name for the button, read together with what is chosen. */
  label?: string;
}

type Choice = { type: 'reset' } | { type: 'instrument'; instrument: Instrument };
type Row =
  | { type: 'group'; family: string }
  | { type: 'option'; choice: Choice; index: number };

/** A searchable instrument list in a popover. Arrow keys move, Enter picks, Escape closes. */
export function InstrumentPicker({ value, onChange, compact = false, reset, label }: Props) {
  const { t, instrumentName } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  // Filter by English name, Thai name or family, then group by family.
  const { rows, flat } = useMemo(() => {
    const matches = (i: Instrument) => matchesInstrument(i, query, t(FAMILY_KEY[i.family] ?? 'famOther'));

    const byFamily = new Map<string, Instrument[]>();
    for (const i of INSTRUMENTS) {
      if (!matches(i)) continue;
      const list = byFamily.get(i.family) ?? [];
      list.push(i);
      byFamily.set(i.family, list);
    }

    const rows: Row[] = [];
    const flat: Choice[] = [];
    const add = (choice: Choice) => {
      rows.push({ type: 'option', choice, index: flat.length });
      flat.push(choice);
    };
    if (reset && query.trim() === '') add({ type: 'reset' });
    for (const [family, list] of byFamily) {
      rows.push({ type: 'group', family });
      for (const instrument of list) add({ type: 'instrument', instrument });
    }
    return { rows, flat };
  }, [query, t, reset]);

  const optionId = (index: number) => `${listId}-opt-${index}`;
  const isSelected = (c: Choice) => (c.type === 'reset' ? value === null : c.instrument.id === value?.id);

  const openList = () => {
    setQuery('');
    setOpen(true);
  };

  // On open: focus the search box and start on the current choice.
  useEffect(() => {
    if (!open) return;
    const current = flat.findIndex(isSelected);
    setActive(current >= 0 ? current : 0);
    inputRef.current?.focus();
    // Only when opening; `flat` is the full list at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close when clicking elsewhere.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Keep the highlighted option visible while arrowing through a long list.
  useEffect(() => {
    if (open) document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open]);

  const choose = (choice: Choice) => {
    if (choice.type === 'reset') reset?.onSelect();
    else onChange(choice.instrument);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[active]) choose(flat[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      openList();
    }
  };

  const shownName = value ? instrumentName(value) : (reset?.label ?? '');
  const subtitle = value
    ? `${t(FAMILY_KEY[value.family] ?? 'famOther')} · ${t('searchInstrumentsCount', { n: INSTRUMENTS.length })}`
    : t('searchInstrumentsCount', { n: INSTRUMENTS.length });

  const check = (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.5 8.4l3 3 6-6.4" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className={`picker${compact ? ' compact' : ''}`} ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className="picker-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label ? `${label}: ${shownName}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onTriggerKey}
      >
        <span className="picker-text">
          <span className="picker-name">{shownName}</span>
          <span className="picker-sub">{subtitle}</span>
        </span>
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path d="M4 7l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="picker-pop">
          <input
            ref={inputRef}
            className="picker-search"
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={flat.length > 0 ? optionId(active) : undefined}
            aria-label={t('searchInstruments')}
            placeholder={t('searchInstruments')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onSearchKey}
          />
          <ul className="picker-list" id={listId} role="listbox" aria-label={t('instrumentList')}>
            {rows.map((row) =>
              row.type === 'group' ? (
                <li className="picker-group" role="presentation" key={`g-${row.family}`}>
                  {t(FAMILY_KEY[row.family] ?? 'famOther')}
                </li>
              ) : (
                <li
                  key={row.choice.type === 'reset' ? 'reset' : row.choice.instrument.id}
                  id={optionId(row.index)}
                  role="option"
                  aria-selected={isSelected(row.choice)}
                  className={`picker-option${row.index === active ? ' is-active' : ''}`}
                  onMouseEnter={() => setActive(row.index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(row.choice)}
                >
                  <span>{row.choice.type === 'reset' ? reset?.label : instrumentName(row.choice.instrument)}</span>
                  {isSelected(row.choice) && check}
                </li>
              ),
            )}
            {flat.length === 0 && <li className="picker-empty" role="presentation">{t('noInstrumentMatch', { q: query })}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
