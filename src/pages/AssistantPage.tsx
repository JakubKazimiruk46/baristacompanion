import { useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ChoiceChip } from '../components/ChoiceChip';
import { EmptyState } from '../components/EmptyState';
import { DrinkIcon } from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import type { Drink } from '../data';
import { useAuth } from '../features/account/auth';
import { AiBadge } from '../features/assistant/AiBadge';
import { DAILY_DRINKS, requestDrink, type DrinkWish } from '../features/assistant/api';
import { myDrinksStore } from '../features/assistant/myDrinks';
import { DrinkBody } from '../features/drinks/DrinkBody';
import { DrinkMeta } from '../features/drinks/DrinkMeta';
import { useSavedShelf } from '../features/shelf/store';
import { backendEnabled } from '../lib/supabase';
import { useOnline } from '../lib/useOnline';
import { MOOD_LIMIT } from '../../supabase/functions/_shared/drinkAssistant.ts';

const primary =
  'flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';
const secondary =
  'flex h-12 w-full items-center justify-center rounded-full border border-line bg-surface px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';

type State =
  | { status: 'idle' }
  | { status: 'working' }
  | { status: 'error'; message: string }
  | { status: 'ready'; drink: Drink; remaining: number | null };

/** Asystent drinków (/napoje/asystent): AI proponuje napój z katalogu aplikacji i tego, co masz w domu. */
export function AssistantPage() {
  const auth = useAuth({ load: true });
  const online = useOnline();
  const header = (
    <PageHeader
      title="Asystent drinków"
      lead="Opisz, na co masz ochotę, a AI ułoży napój ze składników i sprzętu, które zna aplikacja."
      back={{ to: '/napoje', label: 'Napoje' }}
    />
  );

  if (!backendEnabled()) {
    return (
      <>
        {header}
        <EmptyState icon={DrinkIcon} title="Asystent nie jest dostępny w tej wersji">
          Ta wersja aplikacji nie łączy się z serwerem. Wszystkie napoje z katalogu działają bez niego.
        </EmptyState>
      </>
    );
  }
  if (auth.status !== 'signed-in') {
    return (
      <>
        {header}
        <EmptyState icon={DrinkIcon} title="Asystent działa z kontem">
          {auth.status === 'loading' ? (
            'Sprawdzam logowanie…'
          ) : (
            <>
              <Link to="/konto" className="font-medium text-accent underline">
                Zaloguj się
              </Link>
              , a AI zaproponuje napój dopasowany do Ciebie. Dziennie do {DAILY_DRINKS} propozycji.
            </>
          )}
        </EmptyState>
      </>
    );
  }
  return (
    <>
      {header}
      {!online && (
        <p role="status" className="mb-4 rounded-2xl bg-surface-muted p-4 text-sm">
          Asystent wymaga internetu. Napoje z katalogu i „Moje napoje” działają bez niego.
        </p>
      )}
      <Assistant online={online} />
    </>
  );
}

function Assistant({ online }: { online: boolean }) {
  const shelf = useSavedShelf();
  const navigate = useNavigate();
  const [wish, setWish] = useState<DrinkWish>({
    mood: '',
    temperature: null,
    milk: null,
    plantBased: false,
    alcohol: false,
    onlyShelf: shelf !== null,
  });
  const [state, setState] = useState<State>({ status: 'idle' });
  const ids = { mood: useId(), result: useId() };
  const update = (patch: Partial<DrinkWish>) => setWish((current) => ({ ...current, ...patch }));

  const ask = async (event?: FormEvent) => {
    event?.preventDefault();
    setState({ status: 'working' });
    const result = await requestDrink({ ...wish, onlyShelf: wish.onlyShelf && shelf !== null }, shelf);
    if (result.ok) {
      setState({ status: 'ready', drink: result.drink, remaining: result.remaining });
      // Czytnik ekranu i klawiatura trafiają od razu do propozycji.
      requestAnimationFrame(() => document.getElementById(ids.result)?.focus());
    } else setState({ status: 'error', message: result.message });
  };

  const working = state.status === 'working';

  return (
    <>
      <form onSubmit={ask} className="space-y-5">
        <fieldset>
          <legend className="font-medium">Temperatura</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <ChoiceChip type="radio" name="temperature" checked={wish.temperature === 'cold'} onChange={() => update({ temperature: 'cold' })}>
              na zimno
            </ChoiceChip>
            <ChoiceChip type="radio" name="temperature" checked={wish.temperature === 'hot'} onChange={() => update({ temperature: 'hot' })}>
              na ciepło
            </ChoiceChip>
            <ChoiceChip type="radio" name="temperature" checked={wish.temperature === null} onChange={() => update({ temperature: null })}>
              obojętnie
            </ChoiceChip>
          </div>
        </fieldset>
        <fieldset>
          <legend className="font-medium">Mleko</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <ChoiceChip type="radio" name="milk" checked={wish.milk === 'with'} onChange={() => update({ milk: 'with' })}>
              z mlekiem
            </ChoiceChip>
            <ChoiceChip type="radio" name="milk" checked={wish.milk === 'without'} onChange={() => update({ milk: 'without' })}>
              bez mleka
            </ChoiceChip>
            <ChoiceChip type="radio" name="milk" checked={wish.milk === null} onChange={() => update({ milk: null })}>
              obojętnie
            </ChoiceChip>
          </div>
        </fieldset>
        <fieldset>
          <legend className="font-medium">Dodatkowo</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <ChoiceChip type="checkbox" checked={wish.onlyShelf && shelf !== null} onChange={() => update({ onlyShelf: !wish.onlyShelf })}>
              tylko z tego, co mam w domu
            </ChoiceChip>
            <ChoiceChip type="checkbox" checked={wish.plantBased} onChange={() => update({ plantBased: !wish.plantBased })}>
              wersja roślinna
            </ChoiceChip>
            <ChoiceChip type="checkbox" checked={wish.alcohol} onChange={() => update({ alcohol: !wish.alcohol })}>
              może być z alkoholem (18+)
            </ChoiceChip>
          </div>
          {shelf === null && (
            <p className="mt-2 text-sm text-ink-muted">
              Zaznacz w{' '}
              <Link to="/napoje/co-mam" className="font-medium text-accent underline">
                Co mam w domu
              </Link>
              , co masz w kuchni, a asystent weźmie to pod uwagę.
            </p>
          )}
        </fieldset>
        <div>
          <label htmlFor={ids.mood} className="font-medium">
            Na co masz ochotę? <span className="font-normal text-ink-muted">(opcjonalnie)</span>
          </label>
          <textarea
            id={ids.mood}
            rows={3}
            maxLength={MOOD_LIMIT}
            value={wish.mood}
            onChange={(e) => update({ mood: e.target.value })}
            placeholder="np. coś orzeźwiającego z cytrusami na upał"
            className="mt-1 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base focus:border-accent focus:outline-2 focus:outline-accent/40"
          />
        </div>
        <p className="text-sm text-ink-muted">
          Opis i to, co masz w domu, trafią do Anthropic (dostawca modelu Claude), żeby AI ułożyło przepis. Dziennie
          do {DAILY_DRINKS} propozycji.
        </p>
        <button type="submit" className={primary} disabled={working || !online}>
          {working ? 'AI układa przepis…' : 'Zaproponuj napój'}
        </button>
      </form>

      {working && (
        <p role="status" className="mt-4 text-center text-sm text-ink-muted">
          AI układa przepis. To może potrwać do pół minuty.
        </p>
      )}
      {state.status === 'error' && (
        <p role="alert" className="mt-4 rounded-2xl border border-red-700/40 bg-red-700/10 p-4 text-sm">
          {state.message}
        </p>
      )}

      {state.status === 'ready' && (
        <section aria-labelledby={ids.result} className="mt-10 border-t border-line pt-6">
          <h2 id={ids.result} tabIndex={-1} className="font-display text-3xl font-semibold outline-none">
            {state.drink.name}
          </h2>
          <p className="mt-1 text-ink-muted">{state.drink.tagline}</p>
          <div className="mt-3 flex flex-col items-start gap-3">
            <AiBadge />
            <DrinkMeta drink={state.drink} />
          </div>
          <p className="mt-3">{state.drink.description}</p>
          {state.remaining !== null && (
            <p className="mt-2 text-sm text-ink-muted">Dziś zostało propozycji: {state.remaining}.</p>
          )}
          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              className={primary}
              onClick={() => navigate(`/napoje/${myDrinksStore.add(state.drink).id}`)}
            >
              Zapisz w Moich napojach
            </button>
            <button type="button" className={secondary} disabled={!online} onClick={() => void ask()}>
              Zaproponuj inny
            </button>
          </div>
          <DrinkBody drink={state.drink} />
        </section>
      )}
    </>
  );
}
