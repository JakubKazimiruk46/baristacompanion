import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { beanMethods, drinks, drinksForMethod, getMethod, GRIND_LABELS, methods } from '../data';
import { methodFavoritesStore } from '../features/favorites/methods';
import { formatRatio, formatWaterTemp } from '../features/brewing/format';
import { journalStore } from '../features/journal/store';
import { capitalize } from '../lib/format';
import { currentUrl, renderApp } from '../test/renderApp';

beforeEach(() => {
  localStorage.clear();
  methodFavoritesStore.reset();
  journalStore.reset();
});

const tileNames = () =>
  within(screen.getByRole('list', { name: 'Metody parzenia' }))
    .getAllByRole('link')
    .map((link) => getMethodName(link.getAttribute('href')!));
const getMethodName = (href: string) => getMethod(href.replace('/parzenie/', ''))!.name;

describe('lista metod', () => {
  it('kafelki ze wszystkimi metodami, alfabetycznie', () => {
    renderApp('/parzenie');
    const names = tileNames();
    expect(names).toHaveLength(methods.length);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'pl')));
    expect(screen.getByRole('radio', { name: 'A–Z' })).toBeChecked();
  });

  it('ostatnio parzone: metody z dziennika na początku, z datą', async () => {
    journalStore.add({ methodId: 'syfon', coffeeG: 20, waterMl: 300 });
    const { user, router } = renderApp('/parzenie');
    await user.click(screen.getByRole('radio', { name: 'Ostatnio parzone' }));
    expect(currentUrl(router)).toBe('/parzenie?widok=ostatnie');
    expect(tileNames()[0]).toBe('Syfon');
    expect(screen.getByRole('link', { name: /^Syfon/ })).toHaveTextContent('dziś');
  });

  it('ulubione: serce na ekranie metody, potem tylko ulubione na liście', async () => {
    const { user, router } = renderApp('/parzenie?widok=ulubione');
    expect(screen.getByRole('heading', { name: 'Nie masz jeszcze ulubionych metod' })).toBeInTheDocument();

    await router.navigate('/parzenie/chemex');
    await user.click(await screen.findByRole('button', { name: 'Ulubiona' }));
    expect(screen.getByRole('button', { name: 'Ulubiona' })).toHaveAttribute('aria-pressed', 'true');

    await router.navigate('/parzenie?widok=ulubione');
    expect(await screen.findByRole('link', { name: /^Chemex.*Ulubiona/ })).toBeInTheDocument();
    expect(tileNames()).toEqual(['Chemex']);
  });
});

describe('ekran metody', () => {
  it.each(beanMethods.map((m) => [m.name, m] as const))('%s', (_, method) => {
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

  it('kawa rozpuszczalna: bez mielenia i bez dopasowania do ziaren', () => {
    renderApp('/parzenie/kawa-rozpuszczalna');
    expect(screen.getByRole('heading', { level: 1, name: 'Kawa rozpuszczalna' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Mielenie' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Do jakich ziaren' })).not.toBeInTheDocument();
    expect(screen.getByText(/nie zależy od ziaren/)).toBeInTheDocument();
    const related = screen.getByRole('region', { name: 'Co z tego zrobić' });
    expect(within(related).getByRole('heading', { name: 'Kawa dalgona' })).toBeInTheDocument();
    expect(within(related).getByRole('heading', { name: 'Frappé po grecku' })).toBeInTheDocument();
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
