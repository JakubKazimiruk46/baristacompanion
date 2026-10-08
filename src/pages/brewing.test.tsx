import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { drinks, drinksForMethod, getMethod, GRIND_LABELS, methods } from '../data';
import { formatRatio, formatWaterTemp } from '../features/brewing/format';
import { capitalize, formatSeconds } from '../lib/format';
import { renderApp } from '../test/renderApp';

describe('lista metod', () => {
  it('pokazuje każdą metodę z czasem, trudnością i sprzętem', () => {
    renderApp('/parzenie');
    for (const method of methods) {
      const escaped = method.name.replace(/[()]/g, '\\$&');
      const link = screen.getByRole('link', { name: new RegExp(`^${escaped}`) });
      expect(link).toHaveAttribute('href', `/parzenie/${method.id}`);
      expect(link).toHaveTextContent(formatSeconds(method.totalTimeSec));
      expect(link).toHaveTextContent(method.equipment[0]!);
    }
  });
});

describe('ekran metody', () => {
  it.each(methods.map((m) => [m.name, m] as const))('%s', (_, method) => {
    renderApp(`/parzenie/${method.id}`);

    expect(screen.getByRole('heading', { level: 1, name: method.name })).toBeInTheDocument();
    expect(screen.getByText(formatRatio(method))).toBeInTheDocument();
    expect(screen.getByText(formatWaterTemp(method))).toBeInTheDocument();

    const scale = screen.getByRole('list', { name: 'Skala mielenia' });
    const active = within(scale).getAllByRole('listitem').find((li) => li.getAttribute('aria-current'));
    expect(active).toHaveTextContent(GRIND_LABELS[method.grind]);
    expect(screen.getByText(capitalize(GRIND_LABELS[method.grind]))).toBeInTheDocument();

    const steps = screen.getByRole('region', { name: 'Kroki' });
    expect(within(steps).getAllByRole('listitem')).toHaveLength(method.steps.length);

    for (const link of screen.getAllByRole('link', { name: 'Zacznij parzenie' })) {
      expect(link).toHaveAttribute('href', `/parzenie/${method.id}/start`);
    }

    const related = screen.getByRole('region', { name: 'Co z tego zrobić' });
    for (const drink of drinksForMethod(method.id)) {
      expect(within(related).getByRole('heading', { name: drink.name })).toBeInTheDocument();
    }
  });

  it('jasne palenie jest oznaczone jako niepasujące do kawiarki', () => {
    renderApp('/parzenie/kawiarka');
    const roasts = screen.getByRole('list', { name: 'Palenie' });
    expect(within(roasts).getByText('jasne')).toHaveTextContent('jasne (nie pasuje)');
    expect(within(roasts).getByText('ciemne')).toHaveTextContent('ciemne (pasuje)');
  });

  it('nieznana metoda pokazuje stronę błędu', () => {
    renderApp('/parzenie/ekspres-kolbowy');
    expect(screen.getByRole('heading', { level: 1, name: 'Nie ma takiej strony' })).toBeInTheDocument();
  });
});

describe('linki z napojów', () => {
  it.each(drinks.map((d) => [d.name, d] as const))('%s prowadzi do właściwej metody', async (_, drink) => {
    const { user, router } = renderApp(`/napoje/${drink.id}`);
    const method = getMethod(drink.base.methodId)!;
    await user.click(screen.getByRole('link', { name: `Jak zaparzyć: ${method.name}` }));
    expect(router.state.location.pathname).toBe(`/parzenie/${method.id}`);
    expect(screen.getByRole('heading', { level: 1, name: method.name })).toBeInTheDocument();
  });
});
