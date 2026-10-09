import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { dosesStore } from '../features/brewing/doseStore';
import { coldBrewStore } from '../features/coldbrew/store';
import { grindersStore } from '../features/grinder/store';
import { journalStore } from '../features/journal/store';
import { currentUrl, mainNav, renderApp } from '../test/renderApp';

const comandante = { modelId: 'comandante-c40', name: 'Comandante C40 MK4', unit: 'click' } as const;
const encore = { modelId: 'baratza-encore', name: 'Baratza Encore', unit: 'mark' } as const;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  grindersStore.reset();
  journalStore.reset();
  dosesStore.reset();
  coldBrewStore.reset();
});

const settingsList = () => screen.getByRole('region', { name: 'Ustawienia dla metod' });

/** Przechodzi wszystkie kroki „Dalej” i kończy parzenie. */
async function brewToEnd(user: UserEvent) {
  while (screen.queryByRole('button', { name: 'Dalej' })) {
    await user.click(screen.getByRole('button', { name: 'Dalej' }));
  }
  await user.click(screen.getByRole('button', { name: 'Zakończ' }));
}

describe('mój młynek', () => {
  it('dodanie modelu z listy z „Moich ziaren” i ustawienie dla metody', async () => {
    const { user, router } = renderApp('/ziarna');
    await user.click(screen.getByRole('link', { name: /Mój młynek/ }));
    expect(currentUrl(router)).toBe('/ziarna/mlynek');
    expect(screen.getByRole('heading', { name: 'Nie masz jeszcze młynka' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Dodaj młynek' }));
    await user.click(screen.getByRole('button', { name: 'Zapisz młynek' }));
    expect(screen.getByText('Wybierz młynek z listy albo „Inny młynek”.')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Comandante C40 MK4'));
    expect(screen.getByText(/licz kliknięcia od zera/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Zapisz młynek' }));

    expect(currentUrl(router)).toBe('/ziarna/mlynek');
    expect(screen.getByRole('heading', { level: 2, name: 'Comandante C40 MK4' })).toBeInTheDocument();
    const drip = within(settingsList()).getByRole('button', { name: /^Drip \(V60\)/ });
    expect(drip).toHaveTextContent('podpowiedź: 18–24 kliknięcia');
    expect(drip).toHaveTextContent('Ustaw');

    // Okno startuje od środka podpowiedzi, a −/+ zmieniają o jedno kliknięcie.
    await user.click(drip);
    expect(currentUrl(router)).toBe('/ziarna/mlynek?mielenie=drip');
    const dialog = screen.getByRole('dialog', { name: 'Drip (V60)' });
    expect(within(dialog).getByLabelText(/Ustawienie/)).toHaveValue('21');
    await user.click(within(dialog).getByRole('button', { name: 'Zwiększ ustawienie' }));
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz' }));

    expect(currentUrl(router)).toBe('/ziarna/mlynek');
    expect(within(settingsList()).getByRole('button', { name: /^Drip \(V60\)/ })).toHaveTextContent('22 kliknięcia');
    expect(grindersStore.getSnapshot().grinders[0]!.settings).toEqual({ drip: 22 });

    // „Moje ziarna” pokazują młynek i liczbę ustawień.
    await user.click(within(mainNav()).getByRole('link', { name: 'Baribar' }));
    expect(screen.getByRole('link', { name: /Mój młynek/ })).toHaveTextContent('Comandante C40 MK4 · 1 ustawienie');
  });

  it('własny młynek: nazwa i jednostka, ustawienia z ułamkiem i walidacja', async () => {
    const { user } = renderApp('/ziarna/mlynek/nowy');
    await user.click(screen.getByLabelText('Inny młynek'));
    await user.click(screen.getByRole('button', { name: 'Zapisz młynek' }));
    expect(screen.getByLabelText('Nazwa')).toHaveAccessibleDescription('Podaj nazwę młynka.');
    await user.type(screen.getByLabelText('Nazwa'), 'Zassenhaus');
    await user.click(screen.getByLabelText('obroty pokrętła'));
    await user.click(screen.getByRole('button', { name: 'Zapisz młynek' }));

    expect(grindersStore.getSnapshot().grinders[0]).toMatchObject({ name: 'Zassenhaus', unit: 'turn' });
    expect(grindersStore.getSnapshot().grinders[0]).not.toHaveProperty('modelId');
    expect(screen.getByText('Własny młynek, ustawienie: obroty pokrętła')).toBeInTheDocument();
    // Bez modelu nie ma podpowiedzi.
    expect(settingsList()).not.toHaveTextContent('podpowiedź');

    await user.click(within(settingsList()).getByRole('button', { name: /^Kawiarka/ }));
    const dialog = screen.getByRole('dialog', { name: 'Kawiarka' });
    const input = within(dialog).getByLabelText(/Ustawienie/);
    expect(input).toHaveValue('');
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz' }));
    expect(input).toHaveAccessibleDescription('Wpisz ustawienie.');
    await user.type(input, 'dużo');
    expect(input).toHaveAccessibleDescription('Wpisz samą liczbę, np. 24 albo 2,5.');
    await user.clear(input);
    await user.type(input, '1000');
    expect(input).toHaveAccessibleDescription('Wpisz liczbę od 0 do 999.');
    await user.clear(input);
    await user.type(input, '1,5');
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz' }));

    expect(within(settingsList()).getByRole('button', { name: /^Kawiarka/ })).toHaveTextContent('1,5 obrotu');
  });

  it('ekran metody: dodanie młynka wraca do metody, a ustawienie jest przy skali mielenia', async () => {
    const { user, router } = renderApp('/parzenie/kawiarka');
    const grind = () => screen.getByRole('region', { name: 'Mielenie' });
    await user.click(within(grind()).getByRole('link', { name: 'Dodaj swój młynek' }));
    expect(currentUrl(router)).toBe('/ziarna/mlynek/nowy');
    await user.click(screen.getByLabelText('Comandante C40 MK4'));
    await user.click(screen.getByRole('button', { name: 'Zapisz młynek' }));

    expect(currentUrl(router)).toBe('/parzenie/kawiarka');
    expect(grind()).toHaveTextContent('Twój młynek: Comandante C40 MK4');
    expect(grind()).toHaveTextContent('Bez zapisanego ustawienia');
    expect(grind()).toHaveTextContent('Podpowiedź: 13–17 kliknięć');

    await user.click(within(grind()).getByRole('button', { name: 'Zapisz ustawienie młynka' }));
    const dialog = screen.getByRole('dialog', { name: 'Kawiarka' });
    const input = within(dialog).getByLabelText(/Ustawienie/);
    expect(input).toHaveValue('15');
    await user.clear(input);
    await user.type(input, '50');
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz' }));
    expect(input).toHaveAccessibleDescription('Wpisz liczbę od 0 do 45.');
    await user.clear(input);
    await user.type(input, '14');
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz' }));

    expect(currentUrl(router)).toBe('/parzenie/kawiarka');
    expect(grind()).toHaveTextContent('14 kliknięć');

    // Usunięcie ustawienia wraca do stanu „bez ustawienia”.
    await user.click(within(grind()).getByRole('button', { name: 'Zmień ustawienie młynka' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Kawiarka' })).getByRole('button', { name: 'Usuń ustawienie' }),
    );
    expect(grind()).toHaveTextContent('Bez zapisanego ustawienia');
  });

  it('młynek, który tak drobno nie zmieli, mówi o tym przy tygielku', async () => {
    grindersStore.add(encore);
    const { user } = renderApp('/parzenie/tygielek');
    const grind = screen.getByRole('region', { name: 'Mielenie' });
    expect(grind).toHaveTextContent('Ten młynek tak drobno nie zmieli.');

    await user.click(within(grind).getByRole('button', { name: 'Zapisz ustawienie młynka' }));
    const dialog = screen.getByRole('dialog', { name: 'Tygielek' });
    expect(dialog).toHaveTextContent('Ten młynek tak drobno nie zmieli.');
    const input = within(dialog).getByLabelText(/Ustawienie/);
    expect(input).toHaveValue('');
    // −/+ przy pustym polu zaczyna od najdrobniejszego ustawienia na skali.
    await user.click(within(dialog).getByRole('button', { name: 'Zmniejsz ustawienie' }));
    expect(input).toHaveValue('1');
  });

  it('kilka młynków: wybór używanego, zmiana nazwy i usuwanie', async () => {
    const first = grindersStore.add(comandante);
    grindersStore.setSetting(first.id, 'drip', 20);
    grindersStore.add({ name: 'Młynek w pracy', unit: 'mark' });
    const { user } = renderApp('/ziarna/mlynek');

    expect(screen.getByRole('heading', { level: 1, name: 'Moje młynki' })).toBeInTheDocument();
    expect(screen.getByLabelText('Młynek w pracy')).toBeChecked();
    await user.click(screen.getByLabelText('Comandante C40 MK4'));
    expect(screen.getByRole('heading', { level: 2, name: 'Comandante C40 MK4' })).toBeInTheDocument();
    expect(within(settingsList()).getByRole('button', { name: /^Drip \(V60\)/ })).toHaveTextContent('20 kliknięć');

    await user.click(screen.getByRole('button', { name: 'Zmień nazwę' }));
    const rename = screen.getByRole('dialog', { name: 'Zmień nazwę' });
    await user.clear(within(rename).getByLabelText('Nazwa'));
    await user.click(within(rename).getByRole('button', { name: 'Zapisz' }));
    expect(within(rename).getByLabelText('Nazwa')).toHaveAccessibleDescription('Podaj nazwę młynka.');
    await user.type(within(rename).getByLabelText('Nazwa'), 'Comandante w domu');
    await user.click(within(rename).getByRole('button', { name: 'Zapisz' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Comandante w domu' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Usuń młynek' }));
    const confirm = screen.getByRole('dialog', { name: 'Usunąć „Comandante w domu”?' });
    await user.click(within(confirm).getByRole('button', { name: 'Usuń młynek' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Mój młynek' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Młynek w pracy' })).toBeInTheDocument();
    expect(grindersStore.getSnapshot().grinders).toHaveLength(1);
  });
});

describe('młynek w parzeniu i dzienniku', () => {
  it('parzenie pokazuje ustawienie przy pierwszym kroku, a wpis w dzienniku je zapisuje', async () => {
    const grinder = grindersStore.add(comandante);
    grindersStore.setSetting(grinder.id, 'aeropress', 19);
    const { user, router } = renderApp('/parzenie/aeropress/start');

    expect(screen.getByText('Krok 1 z', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('19 kliknięć')).toBeInTheDocument();

    // Zmiana w trakcie nie przerywa parzenia.
    await user.click(screen.getByRole('button', { name: 'Zmień ustawienie młynka' }));
    const dialog = screen.getByRole('dialog', { name: 'AeroPress' });
    await user.click(within(dialog).getByRole('button', { name: 'Zmniejsz ustawienie' }));
    await user.click(within(dialog).getByRole('button', { name: 'Zapisz' }));
    expect(currentUrl(router)).toBe('/parzenie/aeropress/start');
    expect(screen.getByText('18 kliknięć')).toBeInTheDocument();

    await brewToEnd(user);
    expect(journalStore.getSnapshot()[0]!.grind).toEqual({
      grinderId: grinder.id,
      grinderName: 'Comandante C40 MK4',
      unit: 'click',
      setting: 18,
    });
    expect(screen.getByRole('region', { name: 'Zapisano w dzienniku' })).toHaveTextContent(
      'Comandante C40 MK4 · 18 kliknięć',
    );

    await user.click(screen.getByRole('link', { name: 'Cały dziennik parzeń' }));
    expect(screen.getByRole('link', { name: /AeroPress/ })).toHaveTextContent('Comandante C40 MK4 · 18 kliknięć');
  });

  it('bez młynka parzenie pokazuje tylko stopień mielenia, a wpis nie ma ustawienia', async () => {
    const { user } = renderApp('/parzenie/aeropress/start');
    expect(screen.getByText(/jak drobny piasek/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ustawienie młynka/ })).not.toBeInTheDocument();
    await brewToEnd(user);
    expect(journalStore.getSnapshot()[0]).not.toHaveProperty('grind');
  });

  it('„Zaparz tak samo” przywraca ustawienie młynka z wpisu', async () => {
    const grinder = grindersStore.add(comandante);
    const other = grindersStore.add({ name: 'Drugi młynek', unit: 'click' });
    const entry = journalStore.add({
      methodId: 'drip',
      coffeeG: 15,
      waterMl: 250,
      grind: { grinderId: grinder.id, grinderName: grinder.name, unit: 'click', setting: 21 },
    });
    grindersStore.setSetting(grinder.id, 'drip', 25);
    expect(grindersStore.getSnapshot().activeId).toBe(other.id);

    const { user, router } = renderApp(`/parzenie/dziennik/${entry.id}`);
    expect(screen.getByText('Comandante C40 MK4 · 21 kliknięć')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Zaparz tak samo' }));

    expect(currentUrl(router)).toBe('/parzenie/drip/start');
    expect(screen.getByText('21 kliknięć')).toBeInTheDocument();
    expect(grindersStore.getSnapshot().activeId).toBe(grinder.id);
  });

  it('wpis zachowuje młynek po jego usunięciu', () => {
    const grinder = grindersStore.add(comandante);
    const entry = journalStore.add({
      methodId: 'drip',
      coffeeG: 15,
      waterMl: 250,
      grind: { grinderId: grinder.id, grinderName: grinder.name, unit: 'click', setting: 21 },
    });
    grindersStore.remove(grinder.id);
    renderApp(`/parzenie/dziennik/${entry.id}`);
    expect(screen.getByText('Comandante C40 MK4 · 21 kliknięć')).toBeInTheDocument();
  });

  it('cold brew zapisuje ustawienie przy zalaniu i przenosi je do dziennika', async () => {
    const grinder = grindersStore.add(encore);
    grindersStore.setSetting(grinder.id, 'cold-brew', 30);
    const { user } = renderApp('/parzenie/cold-brew/start');

    expect(screen.getByText('30 działek')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Zalane, zaczynam macerację' }));
    expect(coldBrewStore.getSnapshot()?.grind).toMatchObject({ grinderName: 'Baratza Encore', setting: 30 });

    // Zmiana ustawienia w trakcie maceracji nie zmienia tego, czym zmielono tę kawę.
    grindersStore.setSetting(grinder.id, 'cold-brew', 32);
    await user.click(screen.getByRole('button', { name: 'Przecedź teraz' }));
    await user.click(screen.getByRole('button', { name: 'Zakończ' }));

    expect(journalStore.getSnapshot()[0]!.grind).toMatchObject({ setting: 30 });
    expect(screen.getByText('Baratza Encore · 30 działek')).toBeInTheDocument();
  });
});
