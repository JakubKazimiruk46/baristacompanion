import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { beansStore } from '../features/beans/store';
import { dosesStore } from '../features/brewing/doseStore';
import { flowStore } from '../features/flow/store';
import { journalStore } from '../features/journal/store';
import { currentUrl, renderApp } from '../test/renderApp';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  journalStore.reset();
  beansStore.reset();
  dosesStore.reset();
  flowStore.reset();
});

/** Przechodzi wszystkie kroki AeroPressa „Dalej” i kończy parzenie. */
async function brewAeroPress(user: UserEvent) {
  while (screen.queryByRole('button', { name: 'Dalej' })) {
    await user.click(screen.getByRole('button', { name: 'Dalej' }));
  }
  await user.click(screen.getByRole('button', { name: 'Zakończ' }));
}

describe('dziennik parzeń', () => {
  it('wpis tworzy się sam po „Zakończ”, a ocenę i notatkę dopisuje się od razu', async () => {
    const { user, router } = renderApp('/parzenie/aeropress/start');
    await brewAeroPress(user);

    expect(screen.getByRole('heading', { level: 1, name: 'Gotowe! Smacznej kawy' })).toBeInTheDocument();
    const saved = screen.getByRole('region', { name: 'Zapisano w dzienniku' });
    expect(journalStore.getSnapshot()).toHaveLength(1);
    expect(journalStore.getSnapshot()[0]).toMatchObject({ methodId: 'aeropress', coffeeG: 15, waterMl: 200 });

    await user.click(within(saved).getByLabelText('4 gwiazdki'));
    await user.type(within(saved).getByLabelText('Notatka'), 'Mielić drobniej');
    expect(journalStore.getSnapshot()[0]).toMatchObject({ rating: 4, note: 'Mielić drobniej' });

    await user.click(within(saved).getByRole('link', { name: 'Cały dziennik parzeń' }));
    expect(currentUrl(router)).toBe('/parzenie/dziennik');
    expect(screen.getByRole('status')).toHaveTextContent('1 wpis');
    const card = screen.getByRole('link', { name: /AeroPress/ });
    expect(within(card).getByRole('img', { name: 'Ocena: 4 z 5' })).toBeInTheDocument();
    expect(card).toHaveTextContent('15 g kawy · 200 ml wody');
    expect(card).toHaveTextContent('Mielić drobniej');
  });

  it('powrót z ekranu końcowego i ponowne „Zakończ” nie dubluje wpisu', async () => {
    const { user } = renderApp('/parzenie/aeropress/start');
    await brewAeroPress(user);
    await user.click(screen.getByRole('button', { name: 'Zaparz jeszcze raz' }));
    await brewAeroPress(user);
    expect(journalStore.getSnapshot()).toHaveLength(2);
  });

  it('zapisuje ilość z kalkulatora, a „Zaparz tak samo” ją przywraca', async () => {
    dosesStore.set('drip', 400);
    const entry = journalStore.add({ methodId: 'drip', coffeeG: 24, waterMl: 400, rating: 5 });
    dosesStore.clear('drip');

    const { user, router } = renderApp(`/parzenie/dziennik/${entry.id}`);
    expect(screen.getByRole('heading', { level: 1, name: 'Drip (V60)' })).toBeInTheDocument();
    expect(screen.getByLabelText('5 gwiazdek')).toBeChecked();

    await user.click(screen.getByRole('link', { name: 'Zaparz tak samo' }));
    expect(currentUrl(router)).toBe('/parzenie/drip/start');
    expect(screen.getByText('24 g kawy · 400 ml wody')).toBeInTheDocument();
  });

  it('ekran metody pokazuje ostatnie parzenie', () => {
    journalStore.add({ methodId: 'chemex', coffeeG: 30, waterMl: 500, note: 'za długo' }, Date.now() - 1000);
    renderApp('/parzenie/chemex');
    const last = screen.getByRole('region', { name: 'Ostatnio' });
    expect(within(last).getByRole('heading', { level: 3, name: 'Chemex' })).toBeInTheDocument();
    expect(last).toHaveTextContent('za długo');
  });

  it('ziarna wybrane we wpisie widać na ekranie ziaren', async () => {
    const bean = beansStore.add({ name: 'Kenia AA', profile: { roast: 'light', notes: [], kind: 'single-origin' } });
    const entry = journalStore.add({ methodId: 'drip', coffeeG: 15, waterMl: 250 });

    const { user } = renderApp(`/parzenie/dziennik/${entry.id}`);
    await user.selectOptions(screen.getByLabelText('Ziarna'), 'Kenia AA');
    expect(journalStore.get(entry.id)).toMatchObject({ beanId: bean.id, beanName: 'Kenia AA' });

    await user.click(screen.getByRole('link', { name: 'Dziennik' }));
    expect(screen.getByRole('link', { name: /Drip \(V60\)/ })).toHaveTextContent('Kenia AA');
  });

  it('wpis na ekranie ziaren', () => {
    const bean = beansStore.add({ name: 'Brazylia', profile: { roast: 'dark', notes: [], kind: 'blend' } });
    journalStore.add({ methodId: 'kawiarka', coffeeG: 17, waterMl: 150, beanId: bean.id, beanName: bean.name });
    renderApp(`/ziarna/${bean.id}`);
    const brews = screen.getByRole('region', { name: 'Z dziennika parzeń' });
    expect(within(brews).getByRole('heading', { name: 'Kawiarka' })).toBeInTheDocument();
  });

  it('usuwanie wpisu z potwierdzeniem', async () => {
    const entry = journalStore.add({ methodId: 'drip', coffeeG: 15, waterMl: 250 });
    const { user, router } = renderApp(`/parzenie/dziennik/${entry.id}`);
    await user.click(screen.getByRole('button', { name: 'Usuń wpis' }));
    await user.click(screen.getByRole('button', { name: 'Usuń' }));
    expect(currentUrl(router)).toBe('/parzenie/dziennik');
    expect(screen.getByRole('heading', { name: 'Dziennik jest pusty' })).toBeInTheDocument();
  });

  it('lista metod prowadzi do dziennika', async () => {
    journalStore.add({ methodId: 'drip', coffeeG: 15, waterMl: 250 });
    const { user } = renderApp('/parzenie');
    const link = screen.getByRole('link', { name: /Dziennik parzeń/ });
    expect(link).toHaveTextContent('1 wpis · ostatnio dziś o');
    await user.click(link);
    expect(screen.getByRole('heading', { level: 1, name: 'Dziennik parzeń' })).toBeInTheDocument();
  });

  it('ścieżka „Mam kawę”: ocena na ostatnim kroku', async () => {
    const entry = journalStore.add({ methodId: 'drip', coffeeG: 15, waterMl: 250, drinkId: 'kawa-mrozona-z-dripa' });
    flowStore.set({
      described: { roast: 'light', notes: [], kind: 'blend' },
      methodId: 'drip',
      drinkId: 'kawa-mrozona-z-dripa',
      entryId: entry.id,
    });
    const { user } = renderApp('/mam-kawe/podanie');
    await user.click(screen.getByLabelText('5 gwiazdek'));
    expect(journalStore.get(entry.id)!.rating).toBe(5);
  });
});
