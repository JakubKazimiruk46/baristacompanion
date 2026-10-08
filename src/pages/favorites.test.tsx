import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { favoritesStore } from '../features/favorites/store';
import { currentUrl, mainNav, renderApp } from '../test/renderApp';

beforeEach(() => {
  localStorage.clear();
  favoritesStore.reset();
});

const drinkNames = () =>
  screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);

describe('ulubione napoje', () => {
  it('serce na ekranie napoju zapisuje napój w ulubionych', async () => {
    const { user } = renderApp('/napoje/espresso-tonic');
    const button = screen.getByRole('button', { name: 'Ulubiony' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(favoritesStore.getSnapshot()).toEqual(['espresso-tonic']);

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(favoritesStore.getSnapshot()).toEqual([]);
  });

  it('filtr „Ulubione” w katalogu pokazuje tylko ulubione i trafia do adresu', async () => {
    favoritesStore.toggle('mocha');
    favoritesStore.toggle('affogato');
    const { user, router } = renderApp('/napoje');

    await user.click(screen.getByRole('button', { name: 'Ulubione' }));
    expect(currentUrl(router)).toBe('/napoje?ulubione=1');
    expect(screen.getByRole('status')).toHaveTextContent('2 napoje');
    const cards = screen.getAllByRole('link', { name: /Ulubiony/ });
    expect(cards).toHaveLength(2);
  });

  it('bez ulubionych filtr podpowiada, jak je dodać', () => {
    renderApp('/napoje?ulubione=1');
    expect(screen.getByRole('heading', { name: 'Nie masz jeszcze ulubionych' })).toBeInTheDocument();
  });

  it('bez ulubionych start nie pokazuje sekcji', () => {
    renderApp('/');
    expect(screen.queryByRole('region', { name: 'Twoje ulubione' })).not.toBeInTheDocument();
  });

  it('start: trzy ostatnio dodane i link „Wszystkie”', async () => {
    for (const id of ['mocha', 'affogato', 'cappuccino', 'bicerin']) favoritesStore.toggle(id);
    const { user, router } = renderApp('/');
    const section = screen.getByRole('region', { name: 'Twoje ulubione' });
    expect(within(section).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Twoje ulubione',
      'Bicerin',
      'Cappuccino',
      'Affogato',
    ]);

    await user.click(within(section).getByRole('link', { name: 'Wszystkie (4)' }));
    expect(currentUrl(router)).toBe('/napoje?ulubione=1');
    expect(within(mainNav()).getByRole('link', { name: 'Napoje' })).toHaveAttribute('aria-current', 'page');
    expect(drinkNames()).toEqual(expect.arrayContaining(['Mocha', 'Affogato', 'Cappuccino', 'Bicerin']));
  });
});
