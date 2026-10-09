import { act, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAuthForTests } from '../features/account/auth';
import type { Drink } from '../data';
import { myDrinksStore } from '../features/assistant/myDrinks';
import { shoppingStore } from '../features/shelf/shopping';
import { shelfStore } from '../features/shelf/store';
import { resetSyncEngineForTests } from '../features/sync/engine';
import { resetSyncTrackingForTests } from '../features/sync/local';
import { resetSupabaseForTests } from '../lib/supabase';
import { FakeFunctionError, installFakeSupabase, type FakeSupabase } from '../test/fakeSupabase';
import { currentUrl, renderApp } from '../test/renderApp';

vi.mock('@supabase/supabase-js', () => import('../test/fakeSupabase').then((m) => m.fakeSupabaseModule));

let fake: FakeSupabase;
let requests: Record<string, unknown>[];

/** Odpowiedź jak z drink-assistant: pola opcjonalne jako null (structured outputs). */
const AI_DRINK = {
  name: 'Kawa Tonik z Pomarańczą',
  tagline: 'Gorzki tonik, pomarańcza i kawa z kawiarki',
  description: 'Orzeźwiający napój na upał: tonik z lodem, syrop pomarańczowy i kawa na wierzchu.',
  temperature: 'cold',
  prepTimeMin: 10,
  base: { methodId: 'kawiarka', amountMl: 50, alternativeMethodIds: ['aeropress'], note: null },
  milk: null,
  extras: [
    { kind: 'syrup', syrupId: 'pomaranczowy', amountMl: 10, optional: null },
    { kind: 'mixer', ingredientId: 'tonik', name: 'tonik, schłodzony', amount: { value: 120, max: null, unit: 'ml' }, optional: null, blended: null, dairy: null },
    { kind: 'ice', ingredientId: 'lod', name: 'lód', amount: { value: 3, max: 4, unit: 'cube' }, optional: null, blended: null, dairy: null },
  ],
  equipment: ['wysoka szklanka', 'łyżka'],
  layers: [
    { name: 'syrop pomarańczowy', volumeMl: 10, color: '#e0701c', kind: 'liquid' },
    { name: 'tonik z lodem', volumeMl: 120, color: '#e4ecee', kind: 'liquid' },
    { name: 'kawa', volumeMl: 50, color: '#4a2a1a', kind: 'liquid' },
  ],
  steps: ['Wlej syrop na dno szklanki.', 'Wsyp lód i wlej tonik.', 'Powoli wlej kawę po łyżce.'],
  serving: {
    vessel: 'tall-glass',
    why: 'Wysoka szklanka pokazuje trzy warstwy.',
    decorations: [{ kind: 'garnish', name: 'skórka pomarańczy', color: '#f08a24', instruction: 'Połóż skórkę na brzegu.', optional: true, look: 'peel' }],
  },
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  myDrinksStore.reset();
  shelfStore.reset();
  shoppingStore.reset();
  resetSyncTrackingForTests();
  resetSyncEngineForTests();
  resetAuthForTests();
  resetSupabaseForTests();
  fake = installFakeSupabase();
  vi.stubEnv('VITE_AI_ENABLED', 'true');
  requests = [];
  fake.onFunction('drink-assistant', (body) => {
    requests.push(body as Record<string, unknown>);
    return { drink: { ...AI_DRINK, id: 'propozycja' }, remaining: 9 };
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('asystent drinków', () => {
  it('AI wyłączone w tej wersji (bez VITE_AI_ENABLED): bez wejścia w katalogu, bez opisu AI w polityce', async () => {
    vi.stubEnv('VITE_AI_ENABLED', '');
    fake.signIn('ania@example.com');
    const { router } = renderApp('/napoje');
    expect(screen.queryByRole('link', { name: /Asystent drinków/ })).not.toBeInTheDocument();

    await router.navigate('/napoje/asystent');
    expect(await screen.findByText('Asystent nie jest dostępny w tej wersji')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Zaproponuj napój' })).not.toBeInTheDocument();

    await router.navigate('/prywatnosc');
    expect(screen.queryByRole('heading', { name: /^AI/ })).not.toBeInTheDocument();
    vi.stubEnv('VITE_AI_ENABLED', 'true');
    await router.navigate('/napoje');
    await router.navigate('/prywatnosc');
    expect(await screen.findByRole('heading', { name: /^AI/ })).toBeInTheDocument();
  });

  it('bez konta: zachęta do zalogowania', async () => {
    renderApp('/napoje/asystent');
    expect(await screen.findByRole('link', { name: 'Zaloguj się' })).toHaveAttribute('href', '/konto');
  });

  it('wejście z katalogu napojów', async () => {
    const { user, router } = renderApp('/napoje');
    await user.click(screen.getByRole('link', { name: /Asystent drinków/ }));
    expect(currentUrl(router)).toBe('/napoje/asystent');
  });

  it('propozycja z rysunkiem, krokami i podaniem, z oznaczeniem AI; zapis w „Moich napojach”', async () => {
    shelfStore.set({ ingredients: ['lod', 'tonik', 'pomaranczowy'], methods: ['kawiarka'] });
    fake.signIn('ania@example.com');
    const { user, router } = renderApp('/napoje/asystent');

    await user.click(await screen.findByLabelText('na zimno'));
    await user.click(screen.getByLabelText('bez mleka'));
    await user.type(screen.getByLabelText(/Na co masz ochotę/), 'coś z cytrusami na upał');
    await user.click(screen.getByRole('button', { name: 'Zaproponuj napój' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Kawa Tonik z Pomarańczą' })).toBeInTheDocument();
    expect(screen.getByText('Przepis od AI, sprawdź proporcje')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Kawa Tonik z Pomarańczą, wysoka szklanka/ })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Przygotowanie' })).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Dziś zostało propozycji: 9.')).toBeInTheDocument();

    // Do serwera idą preferencje, półka i katalog aplikacji (P9: tylko te id).
    const sent = requests[0]!;
    expect(sent.wish).toEqual({
      mood: 'coś z cytrusami na upał',
      temperature: 'cold',
      milk: 'without',
      plantBased: false,
      alcohol: false,
      onlyShelf: true,
    });
    expect(sent.shelf).toEqual({ ingredients: ['lod', 'tonik', 'pomaranczowy'], methods: ['kawiarka'] });
    expect((sent.catalog as { methods: { id: string }[] }).methods.map((m) => m.id)).toContain('kawiarka');

    await user.click(screen.getByRole('button', { name: 'Zapisz w Moich napojach' }));
    const saved = myDrinksStore.getSnapshot()[0]!.drink;
    expect(saved.id).toMatch(/^moj-kawa-tonik-z-pomarancza-[a-z0-9]{4}$/);
    expect(currentUrl(router)).toBe(`/napoje/${saved.id}`);
    expect(screen.getByRole('heading', { level: 1, name: 'Kawa Tonik z Pomarańczą' })).toBeInTheDocument();
    expect(screen.getByText('Przepis od AI, sprawdź proporcje')).toBeInTheDocument();
    expect(saved).not.toHaveProperty('milk');
  });

  it('błędna propozycja nie psuje ekranu: komunikat zamiast przepisu', async () => {
    fake.onFunction('drink-assistant', () => ({ drink: { ...AI_DRINK, serving: { ...AI_DRINK.serving, vessel: 'kufel' } } }));
    fake.signIn('ania@example.com');
    const { user } = renderApp('/napoje/asystent');
    await user.click(await screen.findByRole('button', { name: 'Zaproponuj napój' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('AI nie ułożyło poprawnego przepisu');
    expect(screen.queryByRole('button', { name: 'Zapisz w Moich napojach' })).not.toBeInTheDocument();
  });

  it('limit dzienny: komunikat', async () => {
    fake.onFunction('drink-assistant', () => {
      throw new FakeFunctionError(429, { error: { code: 'limit', message: 'limit' } });
    });
    fake.signIn('ania@example.com');
    const { user } = renderApp('/napoje/asystent');
    await user.click(await screen.findByRole('button', { name: 'Zaproponuj napój' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Dzisiejszy limit propozycji od AI (10) się wyczerpał');
  });
});

describe('Moje napoje', () => {
  const { milk: _, ...withoutMilk } = AI_DRINK;
  const save = () => myDrinksStore.add({ ...withoutMilk, id: 'x' } as unknown as Drink);

  it('są w katalogu na początku listy, z filtrem „Moje napoje”', async () => {
    const drink = save();
    const { user, router } = renderApp('/napoje');
    expect(screen.getAllByRole('heading', { level: 2 })[0]).toHaveTextContent('Kawa Tonik z Pomarańczą');
    await user.click(screen.getByRole('button', { name: 'Moje napoje' }));
    expect(currentUrl(router)).toBe('/napoje?moje=1');
    expect(screen.getByRole('status')).toHaveTextContent('1 napój');
    await user.click(screen.getByRole('link', { name: /Kawa Tonik z Pomarańczą/ }));
    expect(currentUrl(router)).toBe(`/napoje/${drink.id}`);
  });

  it('półka i lista zakupów działają też dla nich; usuwanie z potwierdzeniem', async () => {
    const drink = save();
    shelfStore.set({ ingredients: ['lod'], methods: [] });
    const { user, router } = renderApp(`/napoje/${drink.id}`);
    await user.click(screen.getByRole('button', { name: /Dodaj do listy zakupów/ }));
    expect(shoppingStore.getSnapshot().map((i) => i.id).sort()).toEqual(['pomaranczowy', 'tonik']);

    // Czekamy na nagłówki ekranów: nazwa napoju jest i na liście zakupów, i na ekranie napoju,
    // więc bez tego test mógłby kliknąć przycisk ze starego, właśnie znikającego ekranu.
    await router.navigate('/napoje/zakupy');
    await screen.findByRole('heading', { level: 1, name: 'Lista zakupów' });
    expect(screen.getAllByText(/Kawa Tonik z Pomarańczą/).length).toBeGreaterThan(0);

    await router.navigate(`/napoje/${drink.id}`);
    await screen.findByRole('heading', { level: 1, name: drink.name });
    await user.click(screen.getByRole('button', { name: 'Usuń' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Usuń' }));
    expect(currentUrl(router)).toBe('/napoje?moje=1');
    expect(myDrinksStore.getSnapshot()).toEqual([]);
  });

  it('„Co mam w domu” liczy je razem z katalogiem (jak filtr „mam”)', async () => {
    shelfStore.set({ ingredients: ['lod', 'tonik', 'pomaranczowy'], methods: ['kawiarka'] });
    const { router } = renderApp('/napoje/co-mam');
    const ready = () => Number(/Zrobisz teraz: (\d+)/.exec(screen.getByText(/Zrobisz teraz/).textContent!)![1]);
    const before = ready();
    act(() => void save());
    expect(ready()).toBe(before + 1);

    await router.navigate('/napoje?mam=1');
    expect(await screen.findByRole('status')).toHaveTextContent(String(before + 1));
  });

  it('uszkodzony zapis jest pomijany', () => {
    localStorage.setItem(
      'barista-companion.my-drinks.v1',
      JSON.stringify([
        { drink: { ...AI_DRINK, id: 'moj-dobry-abcd' }, savedAt: 1 },
        { drink: { ...AI_DRINK, id: 'moj-zly-abcd', layers: [] }, savedAt: 2 },
        { drink: { ...AI_DRINK, id: 'espresso-tonic' }, savedAt: 3 },
      ]),
    );
    myDrinksStore.reset();
    expect(myDrinksStore.getSnapshot().map((d) => d.drink.id)).toEqual(['moj-dobry-abcd']);
  });
});
