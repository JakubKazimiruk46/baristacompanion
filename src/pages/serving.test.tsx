import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { drinks, getDrink, vessels } from '../data';
import { capitalize } from '../lib/format';
import { renderApp } from '../test/renderApp';

describe('sekcja „Jak podać”', () => {
  it.each(drinks.map((d) => [d.name, d] as const))('%s ma sekcję podania', (_, drink) => {
    renderApp(`/napoje/${drink.id}`);
    const section = screen.getByRole('region', { name: 'Jak podać' });
    expect(within(section).getByText(capitalize(vessels[drink.serving.vessel].name))).toBeInTheDocument();
    expect(within(section).getByText(drink.serving.why)).toBeInTheDocument();
    for (const decoration of drink.serving.decorations) {
      expect(within(section).getByText(decoration.instruction)).toBeInTheDocument();
    }
  });

  it('kolejność zgodna z przepływem: składniki → przygotowanie → podanie', () => {
    renderApp('/napoje/mocha');
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings.indexOf('Składniki')).toBeLessThan(headings.indexOf('Przygotowanie'));
    expect(headings.indexOf('Przygotowanie')).toBeLessThan(headings.indexOf('Jak podać'));
  });

  it('dekoracje dzielą się na te przed nalaniem i na koniec', () => {
    renderApp('/napoje/kawa-pomaranczowa');
    const section = screen.getByRole('region', { name: 'Jak podać' });
    const groups = within(section).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(groups).toEqual(['Zanim nalejesz', 'Na koniec']);
    expect(within(section).getByText('Cukier ze skórką pomarańczy')).toBeInTheDocument();
    expect(within(section).getByText('Plaster pomarańczy')).toBeInTheDocument();
  });

  it('dekoracja opcjonalna jest oznaczona', () => {
    renderApp('/napoje/espresso-tonic');
    expect(screen.getByText('Dekoracja na górze · opcjonalnie')).toBeInTheDocument();
  });

  it('napój bez dekoracji ma krótką informację', () => {
    const drink = getDrink('latte-macchiato')!;
    expect(drink.serving.decorations).toHaveLength(0);
    renderApp('/napoje/latte-macchiato');
    expect(screen.getByText(/Bez dekoracji/)).toBeInTheDocument();
  });
});
