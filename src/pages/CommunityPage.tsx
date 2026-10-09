import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import type { FromState } from '../components/BackLink';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { ChevronRightIcon, PeopleIcon, PlusIcon, UserIcon } from '../components/icons';
import { MethodIcon } from '../components/MethodIcon';
import { PageHeader } from '../components/PageHeader';
import { Segmented } from '../components/Segmented';
import { getMethod, methods } from '../data';
import { useAuth, type AccountUser } from '../features/account/auth';
import { loadProfile } from '../features/account/profile';
import { useMyDrinks } from '../features/assistant/myDrinks';
import { listRecipes, myPublished, type CommunityRecipe, type CommunitySort } from '../features/community/api';
import { SAVES } from '../features/community/CommunitySection';
import {
  canPublishDrink,
  communityDrinkPath,
  listDrinks,
  myPublishedDrinks,
  type CommunityDrink,
  type PublishedDrink,
} from '../features/community/drinks';
import { usePagedList, type PagedState } from '../features/community/usePagedList';
import { DrinkGlass } from '../features/glass/DrinkGlass';
import { recipePath } from '../features/recipes/recipe';
import { recipeLine } from '../features/recipes/RecipesSection';
import { useRecipes } from '../features/recipes/store';
import { count } from '../lib/format';
import { backendEnabled } from '../lib/supabase';
import { useOnline } from '../lib/useOnline';

const SECTIONS = ['napoje', 'przepisy', 'moje'] as const;
type CommunitySection = (typeof SECTIONS)[number];
const SECTION_LABELS: Record<CommunitySection, string> = { napoje: 'Napoje', przepisy: 'Przepisy', moje: 'Moje' };

const sectionFrom = (params: URLSearchParams): CommunitySection =>
  (SECTIONS as readonly string[]).includes(params.get('sekcja') ?? '') ? (params.get('sekcja') as CommunitySection) : 'napoje';

const RETURN = '/konto?wroc=%2Fspolecznosc';
const card =
  'flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/**
 * Społeczność (/spolecznosc): napoje i przepisy parzenia od innych. Przegląda każdy, bez konta;
 * konto jest potrzebne do publikowania i zgłaszania (sekcja „Moje”).
 */
export function CommunityPage() {
  const [params, setParams] = useSearchParams();
  const section = sectionFrom(params);
  const online = useOnline();
  const auth = useAuth();

  const header = (
    <PageHeader
      title="Społeczność"
      lead="Napoje i przepisy parzenia od innych baristów. Przeglądasz bez konta, a z kontem udostępniasz swoje."
    />
  );

  if (!backendEnabled()) {
    return (
      <>
        {header}
        <EmptyState icon={PeopleIcon} title="Społeczność nie jest dostępna w tej wersji">
          Ta wersja aplikacji nie łączy się z serwerem. Twoje napoje, przepisy i reszta aplikacji działają bez niego.
        </EmptyState>
        {/* Kopia zapasowa działa bez serwera: ekran konta musi być osiągalny i tutaj. */}
        <Link to="/konto" className={`mt-6 ${card}`}>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <UserIcon className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Kopia zapasowa i prywatność</span>
            <span className="block text-sm text-ink-muted">Zapisz swoje dane do pliku albo wczytaj je z pliku</span>
          </span>
          <ChevronRightIcon className="size-5 shrink-0 text-ink-muted" />
        </Link>
      </>
    );
  }

  return (
    <>
      {header}
      <AccountBar />
      <div className="mt-5">
        <Segmented
          label="Sekcja społeczności"
          options={SECTIONS}
          labels={SECTION_LABELS}
          value={section}
          onChange={(next) => setParams(next === 'napoje' ? {} : { sekcja: next }, { replace: true, preventScrollReset: true })}
        />
      </div>
      <div className="mt-4">
        {!online ? (
          <p className="rounded-2xl bg-surface-muted p-4 text-sm">
            Społeczność wymaga internetu. Twoje napoje, przepisy i reszta aplikacji działają bez niego.
          </p>
        ) : section === 'napoje' ? (
          <DrinksFeed />
        ) : section === 'przepisy' ? (
          <RecipesFeed />
        ) : auth.status === 'signed-in' ? (
          <MinePanel user={auth.user} />
        ) : (
          <EmptyState icon={UserIcon} title="Udostępniaj z kontem">
            Zaloguj się, żeby publikować swoje napoje i przepisy oraz widzieć, ile osób je zapisało.{' '}
            <Link to={RETURN} className="font-medium text-accent underline">
              Zaloguj się
            </Link>
          </EmptyState>
        )}
      </div>
    </>
  );
}

/** Kto przegląda: zalogowany (nick, konto) albo zachęta do logowania z powrotem tutaj. */
function AccountBar() {
  const auth = useAuth();
  const [nick, setNick] = useState<string | null>(null);
  const userId = auth.status === 'signed-in' ? auth.user.id : null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    loadProfile(userId)
      .then((profile) => !cancelled && setNick(profile?.nick ?? null))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (auth.status === 'loading') {
    return (
      <p role="status" className="rounded-2xl bg-surface-muted p-4 text-sm text-ink-muted">
        Sprawdzam logowanie…
      </p>
    );
  }
  if (auth.status !== 'signed-in') {
    return (
      <Link to={RETURN} className={card}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <UserIcon className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Zaloguj się, żeby udostępniać</span>
          <span className="block text-sm text-ink-muted">Bez hasła: link albo kod z e-maila. Konto jest opcjonalne.</span>
        </span>
        <ChevronRightIcon className="size-5 shrink-0 text-ink-muted" />
      </Link>
    );
  }
  return (
    <Link to="/konto" className={card}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
        <UserIcon className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{nick ?? auth.user.email ?? 'Twoje konto'}</span>
        <span className="block text-sm text-ink-muted">{nick ? 'Konto i prywatność' : 'Ustaw nick, żeby publikować'}</span>
      </span>
      <ChevronRightIcon className="size-5 shrink-0 text-ink-muted" />
    </Link>
  );
}

function SortChips({ sort, onChange }: { sort: CommunitySort; onChange: (sort: CommunitySort) => void }) {
  return (
    <div role="group" aria-label="Kolejność" className="flex flex-wrap gap-2">
      <Chip pressed={sort === 'newest'} onClick={() => onChange('newest')}>
        Najnowsze
      </Chip>
      <Chip pressed={sort === 'popular'} onClick={() => onChange('popular')}>
        Najczęściej zapisywane
      </Chip>
    </div>
  );
}

/** Stan listy: wczytywanie, błąd z ponowieniem, pusta lista, „Pokaż więcej”. */
function Feed<T>({
  list,
  empty,
  children,
}: {
  list: { state: PagedState<T>; more: () => void; retry: () => void };
  empty: string;
  children: (items: T[]) => ReactNode;
}) {
  const { state } = list;
  if (state.status === 'error') {
    return (
      <div role="alert" className="mt-4 rounded-2xl border border-red-700/40 bg-red-700/10 p-4 text-sm">
        <p>{state.message}</p>
        <button type="button" className="mt-2 h-10 font-semibold text-accent" onClick={list.retry}>
          Spróbuj ponownie
        </button>
      </div>
    );
  }
  if (state.status !== 'ready') {
    return (
      <p role="status" className="mt-4 text-sm text-ink-muted">
        Wczytuję…
      </p>
    );
  }
  if (state.items.length === 0) return <p className="mt-4 text-sm text-ink-muted">{empty}</p>;
  return (
    <>
      <div className="mt-4">{children(state.items)}</div>
      {state.more && (
        <button
          type="button"
          onClick={list.more}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-full border border-line bg-surface font-semibold"
        >
          Pokaż więcej
        </button>
      )}
    </>
  );
}

function DrinksFeed() {
  const [sort, setSort] = useState<CommunitySort>('newest');
  const list = usePagedList((page) => listDrinks(sort, page), sort, true);
  const location = useLocation();
  const from = location.pathname + location.search;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SortChips sort={sort} onChange={setSort} />
      </div>
      <Feed list={list} empty="Nikt jeszcze nie opublikował napoju. Stwórz własny w kreatorze i opublikuj go jako pierwszy.">
        {(items: CommunityDrink[]) => (
          <ul aria-label="Napoje społeczności" className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to={communityDrinkPath(item.id)}
                  viewTransition
                  state={{ from } satisfies FromState}
                  className="flex h-full flex-col rounded-3xl border border-line bg-surface p-3 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="flex justify-center rounded-2xl bg-surface-muted py-2">
                    <DrinkGlass drink={item.drink} variant="thumb" className="h-28 w-20" />
                  </span>
                  <h2 className="mt-3 font-display text-base leading-tight font-semibold break-words">{item.drink.name}</h2>
                  <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{item.drink.tagline}</p>
                  <p className="mt-auto pt-2 text-xs">
                    od <span className="font-semibold">{item.author}</span> · {count(item.savesCount, SAVES)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Feed>
      <Link
        to="/napoje/nowy"
        className="mt-6 flex h-12 items-center justify-center gap-2 rounded-full border border-accent px-6 font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <PlusIcon className="size-5" />
        Stwórz własny napój
      </Link>
    </>
  );
}

function RecipesFeed() {
  const [sort, setSort] = useState<CommunitySort>('newest');
  const [methodId, setMethodId] = useState('');
  const list = usePagedList((page) => listRecipes(methodId || null, sort, page), `${sort}|${methodId}`, true);
  const location = useLocation();
  const from = location.pathname + location.search;
  return (
    <>
      <label htmlFor="community-method" className="block font-medium">
        Metoda
      </label>
      <select
        id="community-method"
        value={methodId}
        onChange={(event) => setMethodId(event.target.value)}
        className="mt-1 mb-3 h-11 w-full rounded-xl border border-line bg-surface px-3 text-base focus:border-accent focus:outline-2 focus:outline-accent/40"
      >
        <option value="">Wszystkie metody</option>
        {methods.map((method) => (
          <option key={method.id} value={method.id}>
            {method.name}
          </option>
        ))}
      </select>
      <SortChips sort={sort} onChange={setSort} />
      <Feed list={list} empty="Nikt jeszcze nie opublikował przepisu na tę metodę. Zrób własną wersję na ekranie metody.">
        {(items: CommunityRecipe[]) => (
          <ul aria-label="Przepisy społeczności" className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <Link to={`/spolecznosc/przepisy/${item.id}`} viewTransition state={{ from } satisfies FromState} className={card}>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                    <MethodIcon methodId={item.recipe.methodId} className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg leading-tight font-semibold">{item.recipe.name}</span>
                    <span className="mt-0.5 block text-sm">
                      {getMethod(item.recipe.methodId)?.name} · od <span className="font-medium">{item.author}</span> ·{' '}
                      {count(item.savesCount, SAVES)}
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-muted">{recipeLine(item.recipe)}</span>
                  </span>
                  <ChevronRightIcon className="size-5 shrink-0 text-ink-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Feed>
    </>
  );
}

type Mine =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; drinks: Map<string, PublishedDrink>; recipes: Map<string, { id: string; status: string; savesCount: number }> };

const STATUS: Record<string, string> = { published: '', reported: ' · ukryty po zgłoszeniu', hidden: ' · ukryty przez moderatora' };

/** Moje: opublikowane napoje i przepisy (stan, zapisy) i to, co można jeszcze opublikować. */
function MinePanel({ user }: { user: AccountUser }) {
  const myDrinks = useMyDrinks();
  const recipes = useRecipes();
  const [mine, setMine] = useState<Mine>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    Promise.all([myPublishedDrinks(user.id), myPublished(user.id)])
      .then(([drinks, published]) => !cancelled && setMine({ status: 'ready', drinks, recipes: published }))
      .catch((error: Error) => !cancelled && setMine({ status: 'error', message: error.message }));
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  if (mine.status === 'loading') {
    return (
      <p role="status" className="text-sm text-ink-muted">
        Wczytuję Twoje publikacje…
      </p>
    );
  }
  if (mine.status === 'error') {
    return (
      <p role="alert" className="text-sm">
        {mine.message}
      </p>
    );
  }

  const ownDrinks = myDrinks.filter(canPublishDrink);
  const ownRecipes = recipes.filter((recipe) => !recipe.origin);

  return (
    <>
      <h2 className="font-display text-xl font-semibold">Twoje napoje</h2>
      {ownDrinks.length === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">
          Nie masz jeszcze własnych napojów.{' '}
          <Link to="/napoje/nowy" className="font-medium text-accent underline">
            Stwórz napój
          </Link>{' '}
          w kreatorze, a potem opublikuj go na jego ekranie.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {ownDrinks.map(({ drink }) => {
            const published = mine.drinks.get(drink.id);
            return (
              <li key={drink.id}>
                <Link to={`/napoje/${drink.id}`} className={card}>
                  <DrinkGlass drink={drink} variant="thumb" className="h-14 w-10 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{drink.name}</span>
                    <span className="block text-sm text-ink-muted">
                      {published ? `opublikowany · ${count(published.savesCount, SAVES)}${STATUS[published.status]}` : 'nieopublikowany: opublikuj na ekranie napoju'}
                    </span>
                  </span>
                  <ChevronRightIcon className="size-5 shrink-0 text-ink-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mt-8 font-display text-xl font-semibold">Twoje przepisy parzenia</h2>
      {ownRecipes.length === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">
          Nie masz jeszcze własnych przepisów. Na ekranie metody w zakładce Parzenie wybierz „Zrób własną wersję”.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {ownRecipes.map((recipe) => {
            const published = mine.recipes.get(recipe.id);
            return (
              <li key={recipe.id}>
                <Link to={recipePath(recipe)} className={card}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                    <MethodIcon methodId={recipe.methodId} className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{recipe.name}</span>
                    <span className="block text-sm text-ink-muted">
                      {published ? `opublikowany · ${count(published.savesCount, SAVES)}${STATUS[published.status]}` : 'nieopublikowany: opublikuj na ekranie przepisu'}
                    </span>
                  </span>
                  <ChevronRightIcon className="size-5 shrink-0 text-ink-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
