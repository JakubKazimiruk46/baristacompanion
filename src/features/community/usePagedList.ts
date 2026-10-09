import { useCallback, useEffect, useRef, useState } from 'react';
import { PAGE_SIZE } from './api';

export type PagedState<T> =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; items: T[]; more: boolean }
  | { status: 'error'; message: string };

/**
 * Lista z serwera wczytywana stronami („Pokaż więcej”). Nowy `key` (np. zmiana sortowania albo
 * filtra) wczytuje od początku; odpowiedź na stare zapytanie, które wróciło później, jest pomijana.
 */
export function usePagedList<T>(load: (page: number) => Promise<T[]>, key: string, enabled: boolean) {
  const [state, setState] = useState<PagedState<T>>({ status: 'idle' });
  const [page, setPage] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;
  const request = useRef(0);

  const fetchPage = useCallback(async (nextPage: number) => {
    const id = ++request.current;
    setState((current) => (nextPage === 0 || current.status !== 'ready' ? { status: 'loading' } : current));
    try {
      const items = await loadRef.current(nextPage);
      if (id !== request.current) return;
      setState((current) => ({
        status: 'ready',
        items: nextPage > 0 && current.status === 'ready' ? [...current.items, ...items] : items,
        more: items.length === PAGE_SIZE,
      }));
      setPage(nextPage);
    } catch (error) {
      if (id !== request.current) return;
      setState({ status: 'error', message: error instanceof Error ? error.message : 'Nie udało się wczytać.' });
    }
  }, []);

  useEffect(() => {
    if (enabled) void fetchPage(0);
  }, [enabled, key, fetchPage]);

  return { state, more: () => void fetchPage(page + 1), retry: () => void fetchPage(0) };
}
