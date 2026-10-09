import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Chip } from '../../components/Chip';
import { ChevronRightIcon } from '../../components/icons';
import { Section } from '../../components/Section';
import { count } from '../../lib/format';
import { backendEnabled } from '../../lib/supabase';
import { useOnline } from '../../lib/useOnline';
import { recipeLine } from '../recipes/RecipesSection';
import { listRecipes, PAGE_SIZE, type CommunityRecipe, type CommunitySort } from './api';

export const communityPath = (methodId: string, id: string) => `/parzenie/${methodId}/spolecznosc/${id}`;

export const SAVES: [string, string, string] = ['zapis', 'zapisy', 'zapisów'];

type ListState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; items: CommunityRecipe[]; more: boolean }
  | { status: 'error'; message: string };

/**
 * „Przepisy społeczności” na ekranie metody: najnowsze albo najczęściej zapisywane. Lista
 * wczytuje się, gdy sekcja pojawi się na ekranie (bez tego biblioteka Supabase się nie ładuje),
 * a bez internetu zostaje komunikat. Bez backendu sekcji nie ma.
 */
export function CommunitySection({ methodId }: { methodId: string }) {
  const online = useOnline();
  const [visible, setVisible] = useState(false);
  const [sort, setSort] = useState<CommunitySort>('newest');
  const [state, setState] = useState<ListState>({ status: 'idle' });
  const [page, setPage] = useState(0);
  const anchor = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const from = location.pathname + location.search;

  useEffect(() => {
    if (visible || !('IntersectionObserver' in window) || !anchor.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
    });
    observer.observe(anchor.current);
    return () => observer.disconnect();
  }, [visible]);

  const load = useCallback(
    async (nextPage: number) => {
      setState((current) => (nextPage === 0 || current.status !== 'ready' ? { status: 'loading' } : current));
      try {
        const items = await listRecipes(methodId, sort, nextPage);
        setState((current) => ({
          status: 'ready',
          items: nextPage > 0 && current.status === 'ready' ? [...current.items, ...items] : items,
          more: items.length === PAGE_SIZE,
        }));
        setPage(nextPage);
      } catch (error) {
        setState({ status: 'error', message: error instanceof Error ? error.message : 'Nie udało się wczytać.' });
      }
    },
    [methodId, sort],
  );

  useEffect(() => {
    if (visible && online) void load(0);
  }, [visible, online, load]);

  if (!backendEnabled()) return null;

  return (
    <Section title="Przepisy społeczności">
      <div ref={anchor} />
      {!online ? (
        <p className="rounded-2xl bg-surface-muted p-4 text-sm">
          Przepisy społeczności wymagają internetu. Reszta aplikacji działa bez niego.
        </p>
      ) : !visible ? (
        <button
          type="button"
          onClick={() => setVisible(true)}
          className="flex h-12 w-full items-center justify-center rounded-full border border-line bg-surface font-semibold text-accent"
        >
          Pokaż przepisy innych
        </button>
      ) : (
        <>
          <div role="group" aria-label="Kolejność" className="mb-3 flex flex-wrap gap-2">
            <Chip pressed={sort === 'newest'} onClick={() => setSort('newest')}>
              Najnowsze
            </Chip>
            <Chip pressed={sort === 'popular'} onClick={() => setSort('popular')}>
              Najczęściej zapisywane
            </Chip>
          </div>
          {state.status === 'loading' && (
            <p role="status" className="text-sm text-ink-muted">
              Wczytuję przepisy…
            </p>
          )}
          {state.status === 'error' && (
            <div role="alert" className="rounded-2xl border border-red-700/40 bg-red-700/10 p-4 text-sm">
              <p>{state.message}</p>
              <button type="button" className="mt-2 h-10 font-semibold text-accent" onClick={() => void load(0)}>
                Spróbuj ponownie
              </button>
            </div>
          )}
          {state.status === 'ready' &&
            (state.items.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Nikt jeszcze nie opublikował przepisu na tę metodę. Zrób własną wersję i opublikuj ją jako pierwszy.
              </p>
            ) : (
              <>
                <ul className="space-y-3">
                  {state.items.map((item) => (
                    <li key={item.id}>
                      <CommunityCard item={item} from={from} />
                    </li>
                  ))}
                </ul>
                {state.more && (
                  <button
                    type="button"
                    onClick={() => void load(page + 1)}
                    className="mt-3 flex h-12 w-full items-center justify-center rounded-full border border-line bg-surface font-semibold"
                  >
                    Pokaż więcej
                  </button>
                )}
              </>
            ))}
        </>
      )}
    </Section>
  );
}

function CommunityCard({ item, from }: { item: CommunityRecipe; from: string }) {
  return (
    <Link
      to={communityPath(item.recipe.methodId, item.id)}
      state={{ from }}
      viewTransition
      className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-lg leading-tight font-semibold">{item.recipe.name}</h3>
        <p className="mt-0.5 text-sm">
          od <span className="font-medium">{item.author}</span> · {count(item.savesCount, SAVES)}
        </p>
        <p className="mt-0.5 text-sm text-ink-muted">{recipeLine(item.recipe)}</p>
      </div>
      <ChevronRightIcon className="size-5 shrink-0 text-ink-muted" />
    </Link>
  );
}
