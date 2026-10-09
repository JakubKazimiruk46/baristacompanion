import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { drinks } from '../data';
import { filterDrinks } from '../features/drinks/filters';
import { currentUrl, renderApp } from '../test/renderApp';

function listedNames() {
  return screen
    .getAllByRole('heading', { level: 2 })
    .map((heading) => heading.textContent)
    .filter((name) => drinks.some((d) => d.name === name));
}

const names = (list: typeof drinks) => list.map((d) => d.name);

describe('lista napojów', () => {
  it('bez filtrów pokazuje wszystkie napoje', () => {
    renderApp('/napoje');
    expect(listedNames()).toEqual(names(drinks));
    expect(screen.getByRole('status')).toHaveTextContent(`${drinks.length} napojów`);
  });

  it('filtry łączą się: na zimno + wersja roślinna', async () => {
    const { user, router } = renderApp('/napoje');

    await user.click(screen.getByRole('button', { name: 'Na zimno' }));
    expect(listedNames()).toEqual(names(filterDrinks(drinks, { temperature: 'cold' })));
    expect(listedNames()).toContain('Kawa mrożona z lodami');

    await user.click(screen.getByRole('button', { name: 'Wersja roślinna' }));
    const expected = names(filterDrinks(drinks, { temperature: 'cold', plantBased: true }));
    expect(listedNames()).toEqual(expected);
    expect(listedNames()).not.toContain('Kawa mrożona z lodami');
    expect(currentUrl(router)).toBe('/napoje?temp=zimne&roslinne=1');
  });

  it('„Bez alkoholu” ukrywa napoje z alkoholem, które na liście mają oznaczenie', async () => {
    const { user, router } = renderApp('/napoje');
    expect(screen.getByRole('link', { name: /Irish coffee/ })).toHaveTextContent('z alkoholem 18+');
    expect(screen.getByRole('link', { name: /Espresso tonic/ })).not.toHaveTextContent('z alkoholem');

    await user.click(screen.getByRole('button', { name: 'Bez alkoholu' }));
    expect(currentUrl(router)).toBe('/napoje?alkohol=bez');
    expect(listedNames()).not.toContain('Irish coffee');
    expect(listedNames()).not.toContain('Espresso martini');
    expect(listedNames()).toHaveLength(drinks.length - 2);
  });

  it('drugi tap wyłącza filtr, a w grupie działa jeden wybór', async () => {
    const { user } = renderApp('/napoje');
    const temperature = screen.getByRole('group', { name: 'Temperatura' });

    await user.click(within(temperature).getByRole('button', { name: 'Na ciepło' }));
    await user.click(within(temperature).getByRole('button', { name: 'Na zimno' }));
    expect(within(temperature).getByRole('button', { name: 'Na zimno' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(temperature).getByRole('button', { name: 'Na ciepło' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await user.click(within(temperature).getByRole('button', { name: 'Na zimno' }));
    expect(listedNames()).toHaveLength(drinks.length);
  });

  it('czyta filtry z adresu i pozwala je wyczyścić', async () => {
    const { user } = renderApp('/napoje?temp=cieple&mleko=bez');
    expect(listedNames()).toEqual(['Americano z kawiarki', 'Kawa po turecku']);
    expect(screen.getByRole('button', { name: 'Bez mleka' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Wyczyść filtry' }));
    expect(listedNames()).toHaveLength(drinks.length);
  });
});

describe('ekran napoju', () => {
  it.each(drinks.map((d) => [d.name, d] as const))('%s ma ekran z bazą kawową', (_, drink) => {
    renderApp(`/napoje/${drink.id}`);
    expect(screen.getByRole('heading', { level: 1, name: drink.name })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Jak zaparzyć:/ })).toHaveAttribute(
      'href',
      `/parzenie/${drink.base.methodId}`,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Składniki' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Przygotowanie' })).toBeInTheDocument();
  });

  it('napój z alkoholem ma ostrzeżenie, a bez alkoholu go nie ma', () => {
    renderApp('/napoje/espresso-martini');
    expect(screen.getByText(/Napój z alkoholem, tylko dla dorosłych/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Espresso martini, kieliszek do martini/ })).toBeInTheDocument();
  });

  it('napój bez alkoholu nie ma ostrzeżenia', () => {
    renderApp('/napoje/mazagran');
    expect(screen.queryByText(/Napój z alkoholem/)).not.toBeInTheDocument();
  });

  it('link do metody prowadzi do jej ekranu', async () => {
    const { user, router } = renderApp('/napoje/espresso-tonic');
    await user.click(screen.getByRole('link', { name: 'Jak zaparzyć: Kawiarka' }));
    expect(router.state.location.pathname).toBe('/parzenie/kawiarka');
    expect(screen.getByRole('heading', { level: 1, name: 'Kawiarka' })).toBeInTheDocument();
  });

  it('powrót z napoju zachowuje filtry listy', async () => {
    const { user, router } = renderApp('/napoje?temp=zimne');
    await user.click(screen.getByRole('link', { name: /Espresso tonic/ }));
    expect(router.state.location.pathname).toBe('/napoje/espresso-tonic');

    // Dwa linki „Napoje”: zakładka (aktywna) i „wstecz” w nagłówku.
    await user.click(screen.getByRole('link', { name: 'Napoje', current: false }));
    expect(currentUrl(router)).toBe('/napoje?temp=zimne');
    expect(screen.getByRole('button', { name: 'Na zimno' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('nieznany napój pokazuje stronę błędu', () => {
    renderApp('/napoje/kawa-z-ketchupem');
    expect(screen.getByRole('heading', { level: 1, name: 'Nie ma takiej strony' })).toBeInTheDocument();
  });
});
