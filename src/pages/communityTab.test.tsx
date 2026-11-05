import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { drinks, getDrink, getMethod, hasAlcohol, hasMilk, type Drink } from '../data';
import { resetAuthForTests } from '../features/account/auth';
import { myDrinksStore } from '../features/assistant/myDrinks';
import { recipesStore } from '../features/recipes/store';
import { resetSyncEngineForTests } from '../features/sync/engine';
import { resetSyncTrackingForTests } from '../features/sync/local';
import { foldText } from '../lib/format';
import { resetSupabaseForTests } from '../lib/supabase';
import { installFakeSupabase, type FakeSupabase } from '../test/fakeSupabase';
import { currentUrl, mainNav, renderApp } from '../test/renderApp';

vi.mock('@supabase/supabase-js', () => import('../test/fakeSupabase').then((m) => m.fakeSupabaseModule));

let fake: FakeSupabase;

const mocha = getDrink('mocha')!;
const tonic = getDrink('espresso-tonic')!;

/** Kolumny wyszukiwania jak trigger w bazie (migracja community_search). */
function searchColumns(drink: Drink, nick: string) {
  const extras = drink.extras.map((extra) => (extra.kind === 'syrup' ? extra.syrupId : `${extra.name} ${extra.ingredientId}`));
  return {
    search_text: foldText([drink.name, drink.tagline, drink.description, nick, ...extras, ...(drink.milk?.options ?? [])].join(' ')),
    method_ids: [drink.base.methodId, ...(drink.base.anyMethod ? ['*'] : (drink.base.alternativeMethodIds ?? []))],
    has_milk: hasMilk(drink),
    has_alcohol: hasAlcohol(drink),
  };
}

/** Wiersz public_drinks jak w bazie (trigger ustawia nick, nazwę, temperaturę, wyszukiwanie, liczniki i stan). */
function drinkRow(id: string, drink: object, patch: Record<string, unknown> = {}) {
  const d = drink as { name: string; temperature: string };
  return {
    ...searchColumns(drink as Drink, (patch.author_nick as string | undefined) ?? 'Ola'),
    id,
    author_id: 'user-ola',
    author_nick: 'Ola',
    source_id: `moj-${id}`,
    drink,
    name: d.name,
    temperature: d.temperature,
    status: 'published',
    approved: false,
    saves_count: 0,
    reports_count: 0,
    created_at: '2026-10-01T10:00:00.000Z',
    ...patch,
  };
}

/** Odpowiedniki triggerów i funkcji z migracji napojów społeczności. */
function installServer() {
  const drinks = fake.table('public_drinks');
  fake.onBeforeInsert('public_drinks', (r) => ({
    status: 'published',
    approved: false,
    saves_count: 0,
    reports_count: 0,
    author_nick: fake.table('profiles').find((p) => p.id === r.author_id)?.nick,
    name: (r.drink as { name: string }).name,
    ...searchColumns(r.drink as Drink, String(fake.table('profiles').find((p) => p.id === r.author_id)?.nick)),
    ...r,
  }));
  fake.onRpc('save_public_drink', ({ p_drink_id }, user) => {
    const saves = fake.table('drink_saves');
    const drink = drinks.find((d) => d.id === p_drink_id)!;
    // Autorowi zapis się nie liczy.
    if (drink.author_id !== user!.id && !saves.some((s) => s.drink_id === p_drink_id && s.user_id === user!.id)) {
      saves.push({ drink_id: p_drink_id, user_id: user!.id });
      drink.saves_count = (drink.saves_count as number) + 1;
    }
    return drink.saves_count;
  });
  fake.onRpc('report_public_drink', ({ p_drink_id, p_reason, p_comment }, user) => {
    fake.table('drink_reports').push({ drink_id: p_drink_id, reporter_id: user!.id, reason: p_reason, comment: p_comment, resolved: false });
    const drink = drinks.find((d) => d.id === p_drink_id)!;
    if (!drink.approved) drink.status = 'reported';
  });
  fake.onRpc('is_moderator', (_args, user) => user?.email === 'moderator@example.com');
  fake.onRpc('moderation_queue', () =>
    drinks
      .filter((d) => d.status !== 'published')
      .map((d) => ({
        kind: 'drink',
        id: d.id,
        method_id: null,
        name: d.name,
        author_nick: d.author_nick,
        status: d.status,
        approved: d.approved,
        reports: fake
          .table('drink_reports')
          .filter((r) => r.drink_id === d.id && !r.resolved)
          .map((r) => ({ reason: r.reason, comment: r.comment, createdAt: '2026-10-09T10:00:00Z' })),
      })),
  );
  fake.onRpc('moderate_public_drink', ({ p_drink_id, p_decision }) => {
    const drink = drinks.find((d) => d.id === p_drink_id)!;
    if (p_decision === 'hide') drink.status = 'hidden';
    else Object.assign(drink, { status: 'published', approved: true });
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  recipesStore.reset();
  myDrinksStore.reset();
  resetSyncTrackingForTests();
  resetSyncEngineForTests();
  resetAuthForTests();
  resetSupabaseForTests();
  fake = installFakeSupabase();
  installServer();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('zakładka Społeczność', () => {
  it('przeglądanie napojów bez konta: rysunek, autor, zapisy; uszkodzone i ukryte pomija', async () => {
    fake.table('public_drinks').push(
      drinkRow('a', mocha, { saves_count: 4, created_at: '2026-10-02T10:00:00.000Z' }),
      drinkRow('b', tonic, { author_nick: 'Bartek', created_at: '2026-10-05T10:00:00.000Z' }),
      drinkRow('c', { ...mocha, name: 'Ukryty' }, { status: 'reported' }),
      drinkRow('d', { ...mocha, name: 'Uszkodzony', layers: [] }),
      drinkRow('e', { ...mocha, name: 'Nieznany składnik', extras: [{ kind: 'other', ingredientId: 'ketchup', name: 'k', amount: '1' }] }),
    );
    const { user } = renderApp('/');
    await user.click(within(mainNav()).getByRole('link', { name: 'Społeczność' }));
    const list = await screen.findByRole('list', { name: 'Napoje społeczności' });
    const names = within(list).getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(names).toEqual(['Espresso tonic', 'Mocha']);
    expect(within(list).getByRole('link', { name: /Mocha/ })).toHaveTextContent('od Ola · 4 zapisy');

    await user.click(screen.getByRole('button', { name: 'Najczęściej zapisywane' }));
    await vi.waitFor(() =>
      expect(within(screen.getByRole('list', { name: 'Napoje społeczności' })).getAllByRole('heading', { level: 2 })[0]).toHaveTextContent('Mocha'),
    );
  });

  it('przepisy: metoda w pigułkach, słowa i filtry w adresie zostają po powrocie z przepisu', async () => {
    const steps = [{ text: 'Zalej {water} ml', action: true }];
    const recipe = (id: string, methodId: string, name: string, description: string | null = null) => ({
      id,
      author_id: 'user-ola',
      author_nick: 'Ola',
      source_id: id,
      method_id: methodId,
      name,
      description,
      // Dawka metody: mieści się w jej granicach (walidacja jak przy własnym przepisie).
      dose: getMethod(methodId)!.dose,
      water_temp: { min: 92, max: 94 },
      grind: 'medium',
      steps,
      status: 'published',
      saves_count: 0,
      created_at: '2026-10-01T10:00:00.000Z',
      // Jak trigger w bazie: nazwa, opis, autor i metoda.
      search_text: foldText([name, description ?? '', 'Ola', methodId].join(' ')),
    });
    fake.table('public_recipes').push(
      recipe('r1', 'drip', 'Poranny V60'),
      recipe('r2', 'chemex', 'Chemex na dwoje'),
      recipe('r3', 'chemex', 'Chemex z cynamonem', 'Korzenny i słodki'),
    );
    const { user, router } = renderApp('/spolecznosc?sekcja=przepisy');
    const links = () => within(screen.getByRole('list', { name: 'Przepisy społeczności' })).getAllByRole('link');
    await screen.findByRole('list', { name: 'Przepisy społeczności' });
    expect(links()).toHaveLength(3);

    const methodsGroup = () => screen.getByRole('group', { name: 'Metoda' });
    await user.click(within(methodsGroup()).getByRole('button', { name: 'Chemex' }));
    await vi.waitFor(() => expect(links()).toHaveLength(2));
    await user.type(screen.getByRole('searchbox', { name: 'Szukaj przepisu' }), 'KORZENNY');
    await vi.waitFor(() => expect(links()).toHaveLength(1));
    expect(currentUrl(router)).toBe('/spolecznosc?sekcja=przepisy&q=KORZENNY&metoda=chemex');

    await user.click(screen.getByRole('link', { name: /Chemex z cynamonem/ }));
    expect(currentUrl(router)).toBe('/spolecznosc/przepisy/r3');
    expect(await screen.findByRole('heading', { level: 1, name: 'Chemex z cynamonem' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Społeczność', current: false })).toBeInTheDocument();
    await router.navigate(-1);
    expect(await screen.findByRole('searchbox', { name: 'Szukaj przepisu' })).toHaveValue('KORZENNY');
    expect(within(methodsGroup()).getByRole('button', { name: 'Chemex' })).toHaveAttribute('aria-pressed', 'true');
    await vi.waitFor(() => expect(links()).toHaveLength(1));

    // Metoda bez przepisów: komunikat z jej nazwą.
    await user.clear(screen.getByRole('searchbox', { name: 'Szukaj przepisu' }));
    await user.click(within(methodsGroup()).getByRole('button', { name: 'Syfon' }));
    expect(await screen.findByText(/Nikt jeszcze nie opublikował przepisu na: Syfon/)).toBeInTheDocument();
  });

  it('napoje: słowa, szybkie filtry i metoda (alternatywna albo „wszystkie metody”) w adresie', async () => {
    const alcoholic = drinks.find(hasAlcohol)!;
    const anyMethod: Drink = { ...alcoholic, base: { methodId: 'kawiarka', amountMl: alcoholic.base.amountMl, anyMethod: true } };
    const tonicChemex: Drink = { ...tonic, base: { ...tonic.base, alternativeMethodIds: ['chemex'] } };
    fake.table('public_drinks').push(
      drinkRow('a', mocha),
      drinkRow('b', tonicChemex, { author_nick: 'Bartek' }),
      drinkRow('c', anyMethod),
    );
    const { user, router } = renderApp('/spolecznosc');
    const names = () =>
      within(screen.getByRole('list', { name: 'Napoje społeczności' }))
        .getAllByRole('heading')
        .map((heading) => heading.textContent)
        .sort();
    await screen.findByRole('list', { name: 'Napoje społeczności' });
    expect(names()).toHaveLength(3);

    const quick = () => screen.getByRole('group', { name: 'Filtry' });
    await user.click(within(quick()).getByRole('button', { name: 'Bez alkoholu' }));
    await vi.waitFor(() => expect(names()).toEqual([mocha.name, tonic.name].sort()));
    await user.click(within(quick()).getByRole('button', { name: 'Na zimno' }));
    await vi.waitFor(() => expect(names()).toEqual([tonic.name]));
    expect(currentUrl(router)).toBe('/spolecznosc?temp=zimne&alkohol=bez');
    await user.click(within(quick()).getByRole('button', { name: 'Na zimno' }));
    await user.click(within(quick()).getByRole('button', { name: 'Bez alkoholu' }));
    await vi.waitFor(() => expect(names()).toHaveLength(3));

    // Chemex to alternatywa toniku, a napój „każdą metodą” pasuje do każdej.
    const methodsGroup = () => screen.getByRole('group', { name: 'Metoda' });
    await user.click(within(methodsGroup()).getByRole('button', { name: 'Chemex' }));
    await vi.waitFor(() => expect(names()).toEqual([tonic.name, alcoholic.name].sort()));
    await user.click(within(methodsGroup()).getByRole('button', { name: 'Syfon' }));
    await vi.waitFor(() => expect(names()).toEqual([alcoholic.name]));
    await user.click(within(methodsGroup()).getByRole('button', { name: 'Wszystkie metody' }));
    await vi.waitFor(() => expect(names()).toHaveLength(3));

    // Słowa: składnik i autor, wielkość liter bez znaczenia.
    const search = screen.getByRole('searchbox', { name: 'Szukaj napoju' });
    await user.type(search, 'Tonik BARTEK');
    await vi.waitFor(() => expect(names()).toEqual([tonic.name]));
    expect(currentUrl(router)).toBe('/spolecznosc?q=Tonik+BARTEK');
    await user.clear(search);
    await user.type(search, 'nie ma takiego');
    await user.click(await screen.findByRole('button', { name: 'Wyczyść filtry' }));
    await vi.waitFor(() => expect(names()).toHaveLength(3));
    expect(currentUrl(router)).toBe('/spolecznosc');
  });

  it('„Moje” bez konta: zachęta do logowania z powrotem do zakładki', () => {
    renderApp('/spolecznosc?sekcja=moje');
    expect(screen.getByRole('heading', { name: 'Udostępniaj z kontem' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Zaloguj się' })).toHaveAttribute('href', '/konto?wroc=%2Fspolecznosc');
  });

  it('bez internetu: komunikat zamiast list', () => {
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    renderApp('/spolecznosc');
    expect(screen.getByText(/Społeczność wymaga internetu/)).toBeInTheDocument();
    online.mockRestore();
  });

  it('bez backendu: zakładka mówi, że społeczności nie ma, a kopia zapasowa jest osiągalna', async () => {
    vi.unstubAllEnvs();
    const { user } = renderApp('/spolecznosc');
    expect(screen.getByRole('heading', { name: 'Społeczność nie jest dostępna w tej wersji' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /Kopia zapasowa i prywatność/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Konto' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zapisz kopię' })).toBeInTheDocument();
  });
});

describe('napój społeczności', () => {
  it('„Zapisz u siebie” robi kopię z autorem i liczy zapis zalogowanego', async () => {
    fake.table('public_drinks').push(drinkRow('a', mocha, { saves_count: 1 }));
    fake.signIn('ania@example.com');
    const { user, router } = renderApp('/spolecznosc/napoje/a');
    expect(await screen.findByRole('heading', { level: 1, name: 'Mocha' })).toBeInTheDocument();
    expect(screen.getByText(/Napój od/)).toHaveTextContent('Napój od Ola · 1 zapis');
    expect(screen.getByRole('region', { name: 'Składniki' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Zapisz u siebie' }));
    const [saved] = myDrinksStore.getSnapshot();
    expect(saved).toMatchObject({ source: 'community', origin: { communityId: 'a', author: 'Ola' } });
    expect(currentUrl(router)).toBe(`/napoje/${saved!.drink.id}`);
    expect(screen.getByText('Ze społeczności, od Ola')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Społeczność' })).toHaveTextContent('Opublikować możesz tylko własne napoje');
    await vi.waitFor(() => expect(fake.table('public_drinks')[0]!.saves_count).toBe(2));
  });

  it('zgłoszenie (zalogowany) ukrywa napój, a moderator go przywraca', async () => {
    fake.table('public_drinks').push(drinkRow('a', mocha));
    fake.signIn('ania@example.com');
    const { user } = renderApp('/spolecznosc/napoje/a');
    await user.click(await screen.findByRole('button', { name: 'Zgłoś napój' }));
    const dialog = screen.getByRole('dialog', { name: 'Zgłoś napój' });
    await user.click(within(dialog).getByLabelText('obraźliwe treści'));
    await user.click(within(dialog).getByRole('button', { name: 'Wyślij zgłoszenie' }));
    expect(await screen.findByText('Dziękujemy. Napój jest ukryty do decyzji moderatora.')).toBeInTheDocument();
    expect(fake.table('public_drinks')[0]!.status).toBe('reported');
  });

  it('moderator widzi napój w kolejce i go przywraca', async () => {
    fake.table('public_drinks').push(drinkRow('a', mocha, { status: 'reported' }));
    fake.table('drink_reports').push({ drink_id: 'a', reporter_id: 'x', reason: 'spam', comment: null, resolved: false });
    fake.signIn('moderator@example.com');
    const { user } = renderApp('/moderacja');
    const item = (await screen.findByRole('heading', { level: 2, name: 'Mocha' })).closest('li')!;
    expect(item).toHaveTextContent('od Ola · napój · ukryty po zgłoszeniu');
    expect(within(item).getByRole('link', { name: 'Mocha' })).toHaveAttribute('href', '/spolecznosc/napoje/a');
    await user.click(within(item).getByRole('button', { name: 'Przywróć' }));
    expect(await screen.findByRole('heading', { name: 'Nic do sprawdzenia' })).toBeInTheDocument();
    expect(fake.table('public_drinks')[0]).toMatchObject({ status: 'published', approved: true });
  });

  it('wycofany napój: komunikat zamiast błędu', async () => {
    renderApp('/spolecznosc/napoje/nie-ma');
    expect(await screen.findByRole('heading', { name: 'Tego napoju już nie ma' })).toBeInTheDocument();
  });
});

describe('publikowanie własnego napoju', () => {
  it('z kreatora: publikacja z nickiem, widać ją w „Moje”, potem wycofanie', async () => {
    const own = myDrinksStore.add({ ...mocha, id: 'x', name: 'Moja mocha' }, 1, { source: 'own' });
    const me = fake.signIn('ania@example.com');
    fake.table('profiles').find((p) => p.id === me.id)!.nick = 'Ania';
    const { user, router } = renderApp(`/napoje/${own.id}`);
    const section = () => screen.getByRole('region', { name: 'Społeczność' });

    await user.click(await within(section()).findByRole('button', { name: 'Opublikuj' }));
    const dialog = screen.getByRole('dialog', { name: 'Opublikować napój?' });
    expect(dialog).toHaveTextContent('z Twoim nickiem „Ania”');
    await user.click(within(dialog).getByRole('button', { name: 'Opublikuj' }));
    expect(await within(section()).findByText('Opublikowano. Dziękujemy!')).toBeInTheDocument();
    expect(fake.table('public_drinks')[0]).toMatchObject({ author_id: me.id, source_id: own.id, name: 'Moja mocha' });

    await router.navigate('/spolecznosc?sekcja=moje');
    expect(await screen.findByRole('link', { name: /Moja mocha/ })).toHaveTextContent('opublikowany · 0 zapisów');

    await router.navigate(`/napoje/${own.id}`);
    await screen.findByRole('heading', { level: 1, name: 'Moja mocha' });
    await user.click(await within(section()).findByRole('button', { name: 'Wycofaj' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Wycofać napój?' })).getByRole('button', { name: 'Wycofaj' }));
    expect(await within(section()).findByText('Wycofano napój ze społeczności.')).toBeInTheDocument();
    expect(fake.table('public_drinks')).toHaveLength(0);
  });

  it('autor napoju: zamiast „Zapisz u siebie” link do swojego oryginału', async () => {
    const own = myDrinksStore.add({ ...mocha, id: 'x', name: 'Moja mocha' }, 1, { source: 'own' });
    const me = fake.signIn('ania@example.com');
    fake.table('public_drinks').push(drinkRow('a', own, { author_id: me.id, author_nick: 'Ania', source_id: own.id }));
    renderApp('/spolecznosc/napoje/a');
    expect(await screen.findByRole('link', { name: 'Twój napój: otwórz' })).toHaveAttribute('href', `/napoje/${own.id}`);
    expect(screen.queryByRole('button', { name: 'Zapisz u siebie' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Zgłoś' })).not.toBeInTheDocument();
  });

  it('propozycji AI nie publikuje się, dopóki nie zostanie poprawiona w kreatorze', () => {
    const ai = myDrinksStore.add({ ...mocha, id: 'x' }, 1);
    fake.signIn('ania@example.com');
    renderApp(`/napoje/${ai.id}`);
    expect(screen.getByRole('region', { name: 'Społeczność' })).toHaveTextContent('To propozycja AI');
    expect(screen.queryByRole('button', { name: 'Opublikuj' })).not.toBeInTheDocument();
  });

  it('bez konta: link do logowania z powrotem do napoju', () => {
    const own = myDrinksStore.add({ ...mocha, id: 'x' }, 1, { source: 'own' });
    renderApp(`/napoje/${own.id}`);
    expect(within(screen.getByRole('region', { name: 'Społeczność' })).getByRole('link', { name: 'Zaloguj się' })).toHaveAttribute(
      'href',
      `/konto?wroc=${encodeURIComponent(`/napoje/${own.id}`)}`,
    );
  });

  it('ostatni krok kreatora: okno publikuje nowy napój, a po edycji aktualizuje opublikowany', async () => {
    const me = fake.signIn('ania@example.com');
    fake.table('profiles').find((p) => p.id === me.id)!.nick = 'Ania';
    const { user, router } = renderApp('/napoje/nowy?z=mocha');
    await user.click(screen.getByRole('button', { name: 'Zapisz napój' }));

    const [saved] = myDrinksStore.getSnapshot();
    const id = saved!.drink.id;
    expect(currentUrl(router)).toBe(`/napoje/${id}?opublikuj=1`);
    const step = () => screen.getByRole('dialog', { name: 'Napój zapisany' });
    expect(await within(step()).findByText(/z Twoim nickiem „Ania”/)).toBeInTheDocument();
    await user.click(within(step()).getByRole('button', { name: 'Opublikuj' }));
    expect(await within(step()).findByText('Opublikowano. Dziękujemy!')).toBeInTheDocument();
    expect(fake.table('public_drinks')).toMatchObject([{ author_id: me.id, source_id: id, name: 'Mocha po mojemu' }]);
    expect(within(step()).getByRole('link', { name: 'Zobacz w Społeczności' })).toHaveAttribute(
      'href',
      `/spolecznosc/napoje/${fake.table('public_drinks')[0]!.id as string}`,
    );
    await user.click(within(step()).getByRole('button', { name: 'Gotowe' }));
    expect(currentUrl(router)).toBe(`/napoje/${id}`);
    expect(within(screen.getByRole('region', { name: 'Społeczność' })).getByRole('link', { name: 'Opublikowany' })).toBeInTheDocument();

    // Edycja opublikowanego napoju: okno proponuje aktualizację, bez drugiej publikacji.
    await router.navigate(`/napoje/${id}/edycja`);
    const name = await screen.findByLabelText('Nazwa napoju');
    await user.clear(name);
    await user.type(name, 'Mocha z cynamonem');
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
    expect(await within(step()).findByText(/Ten napój jest w Społeczności/)).toBeInTheDocument();
    await user.click(within(step()).getByRole('button', { name: 'Zaktualizuj w społeczności' }));
    expect(await within(step()).findByText('Zaktualizowano napój w społeczności.')).toBeInTheDocument();
    expect(fake.table('public_drinks')).toHaveLength(1);
    expect(fake.table('public_drinks')[0]!.drink).toMatchObject({ name: 'Mocha z cynamonem' });
  });

  it('ostatni krok kreatora bez konta: logowanie wraca do okna, „Nie teraz” je zamyka', async () => {
    const { user, router } = renderApp('/napoje/nowy?z=mocha');
    await user.click(screen.getByRole('button', { name: 'Zapisz napój' }));
    const id = myDrinksStore.getSnapshot()[0]!.drink.id;

    const step = screen.getByRole('dialog', { name: 'Napój zapisany' });
    expect(within(step).getByRole('link', { name: 'Zaloguj się' })).toHaveAttribute(
      'href',
      `/konto?wroc=${encodeURIComponent(`/napoje/${id}?opublikuj=1`)}`,
    );
    await user.click(within(step).getByRole('button', { name: 'Nie teraz' }));
    expect(currentUrl(router)).toBe(`/napoje/${id}`);
    expect(screen.queryByRole('dialog', { name: 'Napój zapisany' })).not.toBeInTheDocument();
  });
});
