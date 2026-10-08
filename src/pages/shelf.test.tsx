import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { drinks } from '../data';
import { canMake } from '../features/shelf/availability';
import { shoppingStore } from '../features/shelf/shopping';
import { DEFAULT_SHELF, shelfStore } from '../features/shelf/store';
import { count } from '../lib/format';
import { currentUrl, renderApp } from '../test/renderApp';

beforeEach(() => {
  localStorage.clear();
  shelfStore.reset();
  shoppingStore.reset();
});

afterEach(() => {
  Reflect.deleteProperty(navigator, 'share');
});

const readyCount = (ingredients: string[]) =>
  drinks.filter((d) => canMake(d, { ingredients, methods: [] })).length;

describe('Co mam w domu', () => {
  it('zaznaczanie składników zmienia liczbę napojów do zrobienia', async () => {
    const { user } = renderApp('/napoje/co-mam');
    const DRINKS: [string, string, string] = ['napój', 'napoje', 'napojów'];
    expect(screen.getByRole('status')).toHaveTextContent(
      `Zrobisz teraz: ${count(readyCount(DEFAULT_SHELF.ingredients), DRINKS)}`,
    );
    const almost = screen.getByRole('region', { name: 'Brakuje jednej rzeczy' });
    expect(within(almost).getByRole('link', { name: /Espresso tonic/ })).toBeInTheDocument();

    await user.click(screen.getByLabelText('Tonik'));
    expect(screen.getByRole('status')).toHaveTextContent(
      `Zrobisz teraz: ${count(readyCount([...DEFAULT_SHELF.ingredients, 'tonik']), DRINKS)}`,
    );
    expect(within(almost).queryByRole('link', { name: /Espresso tonic/ })).not.toBeInTheDocument();
    expect(shelfStore.getSnapshot()!.ingredients).toContain('tonik');
  });

  it('sprzęt zawęża napoje', async () => {
    const { user } = renderApp('/napoje/co-mam');
    const equipment = screen.getByRole('group', { name: 'Sprzęt do parzenia' });
    await user.click(within(equipment).getByLabelText('Prasa francuska'));
    // Z prasy, lodu i cukru nie wyjdzie americano z kawiarki.
    expect(screen.getByRole('status')).not.toHaveTextContent(`Zrobisz teraz: ${readyCount(DEFAULT_SHELF.ingredients)}`);
  });
});

describe('braki na ekranie napoju i lista zakupów', () => {
  it('bez ustawionej półki tylko zachęta', () => {
    renderApp('/napoje/espresso-tonic');
    expect(screen.getByRole('link', { name: 'Sprawdź, czy masz wszystko w domu' })).toHaveAttribute(
      'href',
      '/napoje/co-mam',
    );
  });

  it('brak → lista zakupów → kupione → napój gotowy', async () => {
    shelfStore.set({ ingredients: ['lod'], methods: [] });
    const { user, router } = renderApp('/napoje/espresso-tonic');
    const ingredients = screen.getByRole('region', { name: 'Składniki' });
    expect(within(ingredients).getByText(/Brakuje:/).parentElement).toHaveTextContent('Brakuje: tonik');

    await user.click(within(ingredients).getByRole('button', { name: 'Dodaj do listy zakupów' }));
    await user.click(within(ingredients).getByRole('link', { name: 'Na liście zakupów' }));
    expect(currentUrl(router)).toBe('/napoje/zakupy');

    const item = screen.getByRole('checkbox', { name: /Tonik/ });
    expect(item.closest('li')).toHaveTextContent('do: Espresso tonic');
    await user.click(item);
    expect(item).toBeChecked();
    expect(shelfStore.getSnapshot()!.ingredients).toContain('tonik');

    await user.click(screen.getByRole('button', { name: 'Usuń kupione' }));
    expect(screen.getByRole('heading', { name: 'Lista jest pusta' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Napoje', current: false }));
    await user.click(screen.getByRole('link', { name: /Espresso tonic/ }));
    expect(screen.getByText('Masz wszystko, co trzeba.')).toBeInTheDocument();
  });

  it('zamiennik z półki: napój da się zrobić', () => {
    shelfStore.set({ ingredients: ['lod', 'woda-gazowana'], methods: [] });
    renderApp('/napoje/espresso-tonic');
    expect(screen.getByText('Masz wszystko, z zamiennikiem.')).toBeInTheDocument();
    expect(screen.getByText(/Tonik: użyj „woda gazowana”\./)).toBeInTheDocument();
  });

  it('syrop na liście ma link do przepisu, a listę da się wysłać', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    shoppingStore.addForDrink('latte-waniliowe', ['waniliowy']);

    const { user } = renderApp('/napoje/zakupy');
    expect(screen.getByRole('link', { name: 'albo zrób sam' })).toHaveAttribute('href', '/napoje/syropy#waniliowy');
    await user.click(screen.getByRole('button', { name: 'Wyślij listę' }));
    expect(share).toHaveBeenCalledWith({ title: 'Lista zakupów', text: 'Kupić do kawy:\n- Syrop waniliowy' });
  });
});

describe('filtr „Mogę zrobić” w katalogu', () => {
  it('pokazuje tylko napoje z tego, co jest w domu', async () => {
    shelfStore.set({ ingredients: ['lod', 'tonik', 'krowie'], methods: [] });
    const { user, router } = renderApp('/napoje');
    expect(screen.getByRole('link', { name: /Co mam w domu/ })).toHaveTextContent(
      `zrobisz ${count(readyCount(['lod', 'tonik', 'krowie']), ['napój', 'napoje', 'napojów'])}`,
    );

    await user.click(screen.getByRole('button', { name: 'Mogę zrobić' }));
    expect(currentUrl(router)).toBe('/napoje?mam=1');
    const names = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(names).toContain('Espresso tonic');
    expect(names).toContain('Latte macchiato');
    expect(names).not.toContain('Kawa malinowa');
  });

  it('nic nie pasuje: podpowiedź, żeby uzupełnić półkę', () => {
    shelfStore.set({ ingredients: [], methods: ['syfon'] });
    renderApp('/napoje?mam=1');
    expect(screen.getByRole('heading', { name: 'Z tego, co masz, nic nie wyjdzie' })).toBeInTheDocument();
  });
});
