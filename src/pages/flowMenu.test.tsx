import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { drinks } from '../data';
import { flowStore } from '../features/flow/store';
import { shelfStore } from '../features/shelf/store';
import { wishlistStore } from '../features/wishlist/store';
import { currentUrl, renderApp } from '../test/renderApp';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  flowStore.reset();
  wishlistStore.reset();
  shelfStore.reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const h1 = () => screen.getByRole('heading', { level: 1 }).textContent;
const stepLabel = () => screen.getByText(/^Mam kawę · krok/).textContent;

describe('menu „Mam kawę”', () => {
  it('przycisk na starcie otwiera trzy drogi', async () => {
    wishlistStore.toggle('mocha');
    const { user } = renderApp('/');
    await user.click(screen.getByRole('link', { name: 'Mam kawę. Co z nią zrobić?' }));
    expect(h1()).toBe('Co dziś robimy?');
    const menu = screen.getByRole('navigation', { name: 'Jak zaczynamy' });
    expect(within(menu).getByRole('link', { name: /Napoje do spróbowania/ })).toHaveTextContent('1 napój na Twojej liście');
    expect(within(menu).getByRole('link', { name: /Zaskocz mnie/ })).toHaveAttribute('href', '/mam-kawe/zaskocz');
    expect(within(menu).getByRole('link', { name: /Wybiorę sam/ })).toHaveAttribute('href', '/mam-kawe/ziarna');
  });

  it('„Wybiorę sam” zaczyna od ziaren i zapomina poprzednią ścieżkę', async () => {
    flowStore.set({ start: 'wishlist', drinkId: 'mocha', methodId: 'kawiarka' });
    const { user } = renderApp('/mam-kawe');
    await user.click(screen.getByRole('link', { name: /Wybiorę sam/ }));
    expect(h1()).toBe('Jakie masz ziarna?');
    expect(stepLabel()).toBe('Mam kawę · krok 1 z 7');
    expect(flowStore.getSnapshot()).toEqual({});
  });
});

describe('napoje do spróbowania', () => {
  it('pusta lista prowadzi do katalogu', () => {
    renderApp('/mam-kawe/do-sprobowania');
    expect(screen.getByRole('heading', { name: 'Lista jest pusta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Przeglądaj napoje' })).toHaveAttribute('href', '/napoje');
  });

  it('ścieżka od napoju: cztery kroki, wybór metody bazy i zdjęcie z listy na końcu', async () => {
    wishlistStore.toggle('espresso-tonic');
    const { user, router } = renderApp('/mam-kawe/do-sprobowania');
    await user.click(screen.getByRole('link', { name: /Espresso tonic/ }));

    expect(h1()).toBe('Metoda i mielenie');
    expect(stepLabel()).toBe('Mam kawę · krok 1 z 4');
    expect(screen.getByText('Baza do napoju „Espresso tonic”')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mam kawę' })).toHaveAttribute('href', '/mam-kawe/do-sprobowania');
    const base = screen.getByRole('group', { name: 'Czym zaparzysz bazę?' });
    await user.click(within(base).getByLabelText('AeroPress'));
    expect(screen.getByText('AeroPress', { selector: 'p' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Dalej: parzenie' }));

    expect(h1()).toBe('Parzenie');
    expect(stepLabel()).toBe('Mam kawę · krok 2 z 4');
    await user.click(screen.getByRole('link', { name: 'Pomiń: mam już zaparzoną kawę' }));
    expect(h1()).toBe('Złóż napój');
    await user.click(screen.getByRole('link', { name: 'Dalej: jak podać' }));

    expect(h1()).toBe('Podanie');
    expect(stepLabel()).toBe('Mam kawę · krok 4 z 4');
    await user.click(screen.getByRole('button', { name: 'Spróbowane: usuń z listy' }));
    expect(screen.getByText('Usunięto z listy „Do spróbowania”.')).toBeInTheDocument();
    expect(wishlistStore.getSnapshot()).toEqual([]);

    await user.click(screen.getByRole('link', { name: 'Zacznij od nowa' }));
    expect(currentUrl(router)).toBe('/mam-kawe');
  });

  it('kroki spoza ścieżki od napoju prowadzą do jej początku, a bez napoju do menu', () => {
    flowStore.set({ start: 'surprise', drinkId: 'mocha', methodId: 'kawiarka' });
    const first = renderApp('/mam-kawe/napoje');
    expect(first.router.state.location.pathname).toBe('/mam-kawe/metoda');
    first.router.dispose();
  });

  it('ścieżka od usuniętego napoju wraca do menu', () => {
    flowStore.set({ start: 'wishlist', drinkId: 'moj-usuniety-abcd', methodId: 'kawiarka' });
    const { router } = renderApp('/mam-kawe/parzenie');
    expect(router.state.location.pathname).toBe('/mam-kawe');
  });
});

describe('zaskocz mnie', () => {
  it('losuje napój zgodny z wybraną temperaturą i zaczyna z nim ścieżkę', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { user, router } = renderApp('/mam-kawe/zaskocz');
    const first = new URLSearchParams(router.state.location.search).get('napoj');
    expect(first).toBe(drinks[0]!.id);

    await user.click(screen.getByRole('button', { name: 'Na zimno' }));
    const coldIds = drinks.filter((d) => d.temperature === 'cold').map((d) => d.id);
    const drawn = new URLSearchParams(router.state.location.search).get('napoj')!;
    expect(coldIds).toContain(drawn);

    await user.click(screen.getByRole('button', { name: 'Losuj jeszcze raz' }));
    const again = new URLSearchParams(router.state.location.search).get('napoj')!;
    expect(again).not.toBe(drawn);
    expect(coldIds).toContain(again);
    expect(router.state.location.search).toContain('temp=zimne');

    const name = drinks.find((d) => d.id === again)!.name;
    expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Robię ten napój' }));
    expect(h1()).toBe('Metoda i mielenie');
    expect(flowStore.getSnapshot()).toMatchObject({ start: 'surprise', drinkId: again });
    expect(screen.getByRole('link', { name: 'Mam kawę' })).toHaveAttribute('href', `/mam-kawe/zaskocz?napoj=${again}`);
  });

  it('nic nie pasuje: podpowiedź zamiast losowania', async () => {
    shelfStore.set({ ingredients: [], methods: ['zalewajka'] });
    const { user } = renderApp('/mam-kawe/zaskocz?mam=1&temp=zimne');
    expect(screen.getByRole('heading', { name: 'Nic nie pasuje' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mogę zrobić' }));
    expect(screen.queryByRole('heading', { name: 'Nic nie pasuje' })).not.toBeInTheDocument();
  });
});

describe('chcę spróbować', () => {
  it('przełącznik na ekranie napoju, znacznik na liście i filtr', async () => {
    const { user, router } = renderApp('/napoje/mocha');
    const button = screen.getByRole('button', { name: 'Chcę spróbować' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(wishlistStore.getSnapshot()).toEqual(['mocha']);

    await router.navigate('/napoje?sprobuj=1');
    expect(await screen.findByText('1 napój')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Mocha.*Do spróbowania/ })).toHaveAttribute('href', '/napoje/mocha');
  });
});
