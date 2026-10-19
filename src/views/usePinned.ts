import { useCallback, useEffect, useState } from 'react';
import { INSTRUMENTS } from '../core/instruments';

const STORAGE_KEY = 'transposer.pinned';
export const DEFAULT_PINNED = ['clarinet-bb', 'alto-sax', 'horn-f', 'trumpet-bb'];

/** Read a saved list of pinned instrument ids, dropping anything unknown. Falls back to the defaults. */
export function parsePinned(raw: string | null): string[] {
  if (raw === null) return DEFAULT_PINNED;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return DEFAULT_PINNED;
    return value.filter((id): id is string => typeof id === 'string' && INSTRUMENTS.some((i) => i.id === id));
  } catch {
    return DEFAULT_PINNED;
  }
}

function load(): string[] {
  try {
    return parsePinned(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_PINNED; // Storage can be blocked (private windows, strict settings).
  }
}

/** Pinned instrument ids, kept in this browser. */
export function usePinned() {
  const [ids, setIds] = useState<string[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Not saved; the pins last for this page only.
    }
  }, [ids]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  return { ids, toggle };
}
