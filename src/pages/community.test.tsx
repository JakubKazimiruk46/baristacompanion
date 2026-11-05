import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAuthForTests } from '../features/account/auth';
import { recipesStore } from '../features/recipes/store';
import { resetSyncEngineForTests } from '../features/sync/engine';
import { resetSyncTrackingForTests } from '../features/sync/local';
import { resetSupabaseForTests } from '../lib/supabase';
import { installFakeSupabase, type FakeSupabase } from '../test/fakeSupabase';
import { currentUrl, renderApp } from '../test/renderApp';

vi.mock('@supabase/supabase-js', () => import('../test/fakeSupabase').then((m) => m.fakeSupabaseModule));

let fake: FakeSupabase;

const steps = [
  { text: 'Wsyp {coffee} g kawy', action: true },
  { text: 'Zalej {water} ml', durationSec: 30, action: true },
];

/** Wiersz public_recipes jak w bazie (trigger ustawia nick, liczniki i stan). */
function row(id: string, patch: Record<string, unknown> = {}) {
  return {
    id,
    author_id: 'user-ola',
    author_nick: 'Ola',
    source_id: `src-${id}`,
    method_id: 'drip',
    name: `Przepis ${id}`,
    description: null,
    dose: { coffeeG: 16, waterMl: 250 },
    water_temp: { min: 92, max: 94 },
    grind: 'medium-fine',
    steps,
    status: 'published',
    approved: false,
    saves_count: 0,
    reports_count: 0,
    created_at: '2026-10-01T10:00:00.000Z',
    ...patch,
  };
}

/** Odpowiedniki funkcji z migracji (save, report, moderacja). */
function installServer() {
  const recipes = fake.table('public_recipes');
  // DEFAULT kolumn i trigger z nickiem autora.
  fake.onBeforeInsert('public_recipes', (r) => ({
    status: 'published',
    approved: false,
    saves_count: 0,
    reports_count: 0,
    author_nick: fake.table('profiles').find((p) => p.id === r.author_id)?.nick,
    ...r,
  }));
  fake.onRpc('save_public_recipe', ({ p_recipe_id }, user) => {
    const saves = fake.table('recipe_saves');
    const recipe = recipes.find((r) => r.id === p_recipe_id)!;
    // Autorowi zapis się nie liczy.
    if (recipe.author_id !== user!.id && !saves.some((s) => s.recipe_id === p_recipe_id && s.user_id === user!.id)) {
      saves.push({ recipe_id: p_recipe_id, user_id: user!.id });
      recipe.saves_count = (recipe.saves_count as number) + 1;
    }
    return recipe.saves_count;
  });
  fake.onRpc('report_public_recipe', ({ p_recipe_id, p_reason, p_comment }, user) => {
    fake.table('recipe_reports').push({ recipe_id: p_recipe_id, reporter_id: user!.id, reason: p_reason, comment: p_comment, resolved: false });
    const recipe = recipes.find((r) => r.id === p_recipe_id)!;
    if (!recipe.approved) recipe.status = 'reported';
  });
  fake.onRpc('is_moderator', (_args, user) => user?.email === 'moderator@example.com');
  fake.onRpc('moderation_queue', () =>
    recipes
      .filter((r) => r.status !== 'published' || fake.table('recipe_reports').some((rr) => rr.recipe_id === r.id && !rr.resolved))
      .map((r) => ({
        ...r,
        reports: fake
          .table('recipe_reports')
          .filter((rr) => rr.recipe_id === r.id && !rr.resolved)
          .map((rr) => ({ reason: rr.reason, comment: rr.comment, createdAt: '2026-10-09T10:00:00Z' })),
      })),
  );
  fake.onRpc('moderate_public_recipe', ({ p_recipe_id, p_decision }) => {
    const recipe = recipes.find((r) => r.id === p_recipe_id)!;
    if (p_decision === 'hide') recipe.status = 'hidden';
    else Object.assign(recipe, { status: 'published', approved: true });
    fake.table('recipe_reports').forEach((rr) => {
      if (rr.recipe_id === p_recipe_id) rr.resolved = true;
    });
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  recipesStore.reset();
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

const community = () => screen.getByRole('region', { name: 'Przepisy społeczności' });

async function showCommunity(user: ReturnType<typeof renderApp>['user']) {
  await user.click(within(community()).getByRole('button', { name: 'Pokaż przepisy innych' }));
}

describe('przepisy społeczności na ekranie metody', () => {
  it('najnowsze i najczęściej zapisywane, bez logowania', async () => {
    fake.table('public_recipes').push(
      row('a', { name: 'Klasyk', saves_count: 9, created_at: '2026-10-01T10:00:00.000Z' }),
      row('b', { name: 'Nowość', saves_count: 1, created_at: '2026-10-08T10:00:00.000Z' }),
      row('c', { name: 'Ukryty', status: 'reported' }),
      row('d', { name: 'Inna metoda', method_id: 'chemex' }),
      row('e', { name: 'Uszkodzony', steps: [] }),
    );
    const { user } = renderApp('/parzenie/drip');
    await showCommunity(user);
    const names = () => within(community()).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    await vi.waitFor(() => expect(names()).toEqual(['Nowość', 'Klasyk']));
    expect(within(community()).getByRole('link', { name: /Klasyk/ })).toHaveTextContent('od Ola · 9 zapisów');

    await user.click(within(community()).getByRole('button', { name: 'Najczęściej zapisywane' }));
    await vi.waitFor(() => expect(names()).toEqual(['Klasyk', 'Nowość']));
  });

  it('pusta lista zachęca do opublikowania pierwszego przepisu', async () => {
    const { user } = renderApp('/parzenie/drip');
    await showCommunity(user);
    expect(await within(community()).findByText(/Nikt jeszcze nie opublikował/)).toBeInTheDocument();
  });

  it('bez internetu: komunikat, a reszta ekranu działa', async () => {
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    renderApp('/parzenie/drip');
    expect(community()).toHaveTextContent('Przepisy społeczności wymagają internetu');
    expect(screen.getByRole('region', { name: 'Twoje przepisy' })).toBeInTheDocument();
    online.mockRestore();
  });

  it('bez backendu sekcji nie ma', () => {
    vi.unstubAllEnvs();
    renderApp('/parzenie/drip');
    expect(screen.queryByRole('region', { name: 'Przepisy społeczności' })).not.toBeInTheDocument();
  });
});

describe('przepis społeczności', () => {
  it('„Zapisz u siebie” robi kopię z autorem i liczy zapis zalogowanego', async () => {
    fake.table('public_recipes').push(row('a', { name: 'Klasyk', description: 'Słodki i czysty', saves_count: 2 }));
    fake.signIn('ania@example.com');
    const { user, router } = renderApp('/parzenie/drip/spolecznosc/a');
    expect(await screen.findByRole('heading', { level: 1, name: 'Klasyk' })).toBeInTheDocument();
    expect(screen.getByText('Przepis od Ola na: Drip (V60).')).toBeInTheDocument();
    expect(screen.getByText('Słodki i czysty')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Kroki' })).getAllByRole('listitem')[0]).toHaveTextContent('Wsyp 16 g kawy');

    await user.click(screen.getByRole('button', { name: 'Zapisz u siebie' }));
    const saved = recipesStore.getSnapshot()[0]!;
    expect(saved).toMatchObject({ name: 'Klasyk', origin: { communityId: 'a', author: 'Ola' }, note: 'Słodki i czysty' });
    expect(currentUrl(router)).toBe(`/parzenie/drip/przepisy/${saved.id}`);
    expect(screen.getByText('Przepis od Ola na: Drip (V60).')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Społeczność' })).toHaveTextContent('Opublikować możesz tylko własne przepisy');
    await vi.waitFor(() => expect(fake.table('public_recipes')[0]!.saves_count).toBe(3));
  });

  it('autor: zamiast „Zapisz u siebie” parzy i otwiera swój oryginał, bez kopii', async () => {
    const me = fake.signIn('ania@example.com');
    const original = recipesStore.add({
      methodId: 'drip',
      name: 'Klasyk',
      dose: { coffeeG: 16, waterMl: 250 },
      waterTempC: { min: 92, max: 94 },
      grind: 'medium-fine',
      steps,
    });
    fake.table('public_recipes').push(row('a', { name: 'Klasyk', author_id: me.id, author_nick: 'Ania', source_id: original.id }));
    const { user, router } = renderApp('/spolecznosc/przepisy/a');
    expect(await screen.findByRole('link', { name: 'Twój przepis: otwórz' })).toHaveAttribute('href', `/parzenie/drip/przepisy/${original.id}`);
    expect(screen.queryByRole('button', { name: 'Zapisz u siebie' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Parz według tego przepisu' }));
    expect(currentUrl(router)).toBe(`/parzenie/drip/start?przepis=${original.id}`);
    expect(recipesStore.getSnapshot()).toHaveLength(1);
  });

  it('„Parz według tego przepisu” zapisuje kopię (raz) i zaczyna parzenie', async () => {
    fake.table('public_recipes').push(row('a', { name: 'Klasyk' }));
    const { user, router } = renderApp('/parzenie/drip/spolecznosc/a');
    await user.click(await screen.findByRole('button', { name: 'Parz według tego przepisu' }));
    const saved = recipesStore.getSnapshot()[0]!;
    expect(currentUrl(router)).toBe(`/parzenie/drip/start?przepis=${saved.id}`);
    expect(screen.getByRole('heading', { level: 1, name: 'Klasyk' })).toBeInTheDocument();
    // Bez logowania zapis nie jest liczony na serwerze.
    expect(fake.table('recipe_saves')).toHaveLength(0);

    await router.navigate('/parzenie/drip/spolecznosc/a');
    await user.click(await screen.findByRole('button', { name: 'Parz według tego przepisu' }));
    expect(recipesStore.getSnapshot()).toHaveLength(1);
  });

  it('zgłoszenie (zalogowany): powód, komentarz jako tekst, przepis znika z listy', async () => {
    fake.table('public_recipes').push(row('a', { name: 'Podejrzany' }));
    fake.signIn('ania@example.com');
    const { user } = renderApp('/parzenie/drip/spolecznosc/a');
    await user.click(await screen.findByRole('button', { name: 'Zgłoś przepis' }));
    const dialog = screen.getByRole('dialog', { name: 'Zgłoś przepis' });
    await user.click(within(dialog).getByRole('button', { name: 'Wyślij zgłoszenie' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Wybierz powód.');
    await user.click(within(dialog).getByLabelText('spam albo reklama'));
    await user.type(within(dialog).getByLabelText(/Komentarz/), '<b>reklama</b> sklepu');
    await user.click(within(dialog).getByRole('button', { name: 'Wyślij zgłoszenie' }));

    expect(await screen.findByText('Dziękujemy. Przepis jest ukryty do decyzji moderatora.')).toBeInTheDocument();
    expect(fake.table('recipe_reports')[0]).toMatchObject({ reason: 'spam', comment: '<b>reklama</b> sklepu' });
    expect(fake.table('public_recipes')[0]!.status).toBe('reported');
  });

  it('bez logowania zgłosić się nie da: link do konta', async () => {
    fake.table('public_recipes').push(row('a'));
    renderApp('/parzenie/drip/spolecznosc/a');
    expect(await screen.findByRole('link', { name: 'Zaloguj się' })).toHaveAttribute('href', '/konto');
    expect(screen.queryByRole('button', { name: 'Zgłoś przepis' })).not.toBeInTheDocument();
  });

  it('wycofany albo ukryty przepis: komunikat zamiast błędu', async () => {
    renderApp('/parzenie/drip/spolecznosc/nie-ma');
    expect(await screen.findByRole('heading', { name: 'Tego przepisu już nie ma' })).toBeInTheDocument();
  });
});

describe('publikowanie własnego przepisu', () => {
  const recipeInput = {
    methodId: 'drip',
    name: 'Mój V60',
    dose: { coffeeG: 15, waterMl: 250 },
    waterTempC: { min: 92, max: 96 },
    grind: 'medium-fine' as const,
    steps,
    note: 'Do jasnych ziaren',
    grinder: { grinderId: 'g', grinderName: 'Comandante', unit: 'click' as const, setting: 22 },
  };

  it('bez konta: zachęta do zalogowania', () => {
    const recipe = recipesStore.add(recipeInput);
    renderApp(`/parzenie/drip/przepisy/${recipe.id}`);
    expect(screen.getByRole('region', { name: 'Społeczność' })).toHaveTextContent('żeby publikować');
  });

  it('bez nicku: prośba o ustawienie nicku', async () => {
    const recipe = recipesStore.add(recipeInput);
    fake.signIn('ania@example.com');
    renderApp(`/parzenie/drip/przepisy/${recipe.id}`);
    expect(await screen.findByRole('link', { name: 'Ustaw nick na ekranie konta' })).toHaveAttribute('href', '/konto');
  });

  it('publikacja z potwierdzeniem, aktualizacja i wycofanie', async () => {
    const recipe = recipesStore.add(recipeInput);
    const me = fake.signIn('ania@example.com');
    fake.table('profiles').find((p) => p.id === me.id)!.nick = 'Ania';
    const { user } = renderApp(`/parzenie/drip/przepisy/${recipe.id}`);
    const section = () => screen.getByRole('region', { name: 'Społeczność' });

    await user.click(await within(section()).findByRole('button', { name: 'Opublikuj' }));
    const dialog = screen.getByRole('dialog', { name: 'Opublikować przepis?' });
    expect(dialog).toHaveTextContent('z Twoim nickiem „Ania”');
    await user.click(within(dialog).getByRole('button', { name: 'Opublikuj' }));
    expect(await within(section()).findByText('Opublikowano. Dziękujemy!')).toBeInTheDocument();
    const published = fake.table('public_recipes')[0]!;
    expect(published).toMatchObject({
      author_id: me.id,
      source_id: recipe.id,
      name: 'Mój V60',
      description: 'Do jasnych ziaren',
      water_temp: { min: 92, max: 96 },
    });
    expect(published).not.toHaveProperty('grinder');
    expect(within(section()).getByRole('link', { name: 'Opublikowany' })).toBeInTheDocument();

    await user.click(within(section()).getByRole('button', { name: 'Zaktualizuj w społeczności' }));
    expect(await within(section()).findByText('Zaktualizowano przepis w społeczności.')).toBeInTheDocument();
    expect(fake.table('public_recipes')).toHaveLength(1);

    await user.click(within(section()).getByRole('button', { name: 'Wycofaj' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Wycofać przepis?' })).getByRole('button', { name: 'Wycofaj' }));
    expect(await within(section()).findByText('Wycofano przepis ze społeczności.')).toBeInTheDocument();
    expect(fake.table('public_recipes')).toHaveLength(0);
    expect(within(section()).getByRole('button', { name: 'Opublikuj' })).toBeInTheDocument();
  });
});

describe('moderacja', () => {
  it('moderator widzi zgłoszone przepisy i decyduje: ukryj albo przywróć', async () => {
    fake.table('public_recipes').push(row('a', { name: 'Zgłoszony', status: 'reported' }), row('b', { name: 'Czysty' }));
    fake.table('recipe_reports').push({ recipe_id: 'a', reporter_id: 'x', reason: 'dangerous', comment: 'za gorąca woda', resolved: false });
    fake.signIn('moderator@example.com');
    const { user } = renderApp('/konto');
    await user.click(await screen.findByRole('link', { name: 'Moderacja przepisów społeczności' }));

    const item = (await screen.findByRole('heading', { level: 2, name: 'Zgłoszony' })).closest('li')!;
    expect(item).toHaveTextContent('ukryty po zgłoszeniu');
    expect(within(item).getByRole('list', { name: 'Zgłoszenia' })).toHaveTextContent('niebezpieczny przepis: za gorąca woda');
    expect(screen.queryByRole('heading', { name: 'Czysty' })).not.toBeInTheDocument();

    await user.click(within(item).getByRole('button', { name: 'Przywróć' }));
    expect(await screen.findByRole('heading', { name: 'Nic do sprawdzenia' })).toBeInTheDocument();
    expect(fake.table('public_recipes')[0]).toMatchObject({ status: 'published', approved: true });
  });

  it('kto nie jest moderatorem, nie widzi kolejki', async () => {
    fake.signIn('ania@example.com');
    renderApp('/moderacja');
    expect(await screen.findByText('Ta strona jest dostępna dla moderatora przepisów.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tylko dla moderatora' })).toBeInTheDocument();
    expect(fake.client.rpc).not.toHaveBeenCalledWith('moderation_queue', expect.anything());
  });
});
