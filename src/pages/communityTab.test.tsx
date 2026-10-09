import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDrink, getMethod } from '../data';
import { resetAuthForTests } from '../features/account/auth';
import { myDrinksStore } from '../features/assistant/myDrinks';
import { recipesStore } from '../features/recipes/store';
import { resetSyncEngineForTests } from '../features/sync/engine';
import { resetSyncTrackingForTests } from '../features/sync/local';
import { resetSupabaseForTests } from '../lib/supabase';
import { installFakeSupabase, type FakeSupabase } from '../test/fakeSupabase';
import { currentUrl, mainNav, renderApp } from '../test/renderApp';

vi.mock('@supabase/supabase-js', () => import('../test/fakeSupabase').then((m) => m.fakeSupabaseModule));

let fake: FakeSupabase;

const mocha = getDrink('mocha')!;
const tonic = getDrink('espresso-tonic')!;

/** Wiersz public_drinks jak w bazie (trigger ustawia nick, nazwę, temperaturę, liczniki i stan). */
function drinkRow(id: string, drink: object, patch: Record<string, unknown> = {}) {
  const d = drink as { name: string; temperature: string };
  return {
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
    ...r,
  }));
  fake.onRpc('save_public_drink', ({ p_drink_id }, user) => {
    const saves = fake.table('drink_saves');
    const drink = drinks.find((d) => d.id === p_drink_id)!;
    if (!saves.some((s) => s.drink_id === p_drink_id && s.user_id === user!.id)) {
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

  it('przepisy wszystkich metod z filtrem metody', async () => {
    const steps = [{ text: 'Zalej {water} ml', action: true }];
    const recipe = (id: string, methodId: string, name: string) => ({
      id,
      author_id: 'user-ola',
      author_nick: 'Ola',
      source_id: id,
      method_id: methodId,
      name,
      description: null,
      // Dawka metody: mieści się w jej granicach (walidacja jak przy własnym przepisie).
      dose: getMethod(methodId)!.dose,
      water_temp: { min: 92, max: 94 },
      grind: 'medium',
      steps,
      status: 'published',
      saves_count: 0,
      created_at: '2026-10-01T10:00:00.000Z',
    });
    fake.table('public_recipes').push(recipe('r1', 'drip', 'Poranny V60'), recipe('r2', 'chemex', 'Chemex na dwoje'));
    const { user, router } = renderApp('/spolecznosc?sekcja=przepisy');
    const list = await screen.findByRole('list', { name: 'Przepisy społeczności' });
    expect(within(list).getAllByRole('link')).toHaveLength(2);

    await user.selectOptions(screen.getByLabelText('Metoda'), 'chemex');
    await vi.waitFor(() => expect(within(screen.getByRole('list', { name: 'Przepisy społeczności' })).getAllByRole('link')).toHaveLength(1));
    await user.click(screen.getByRole('link', { name: /Chemex na dwoje/ }));
    expect(currentUrl(router)).toBe('/spolecznosc/przepisy/r2');
    expect(await screen.findByRole('heading', { level: 1, name: 'Chemex na dwoje' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Społeczność', current: false })).toBeInTheDocument();
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
});
