import { cleanup, screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { getMethod } from '../data';
import { dosesStore, recipeDoseKey } from '../features/brewing/doseStore';
import { coldBrewStore } from '../features/coldbrew/store';
import { grindersStore } from '../features/grinder/store';
import { journalStore } from '../features/journal/store';
import { methodAsRecipe } from '../features/recipes/draft';
import type { RecipeInput } from '../features/recipes/recipe';
import { encodeRecipe } from '../features/recipes/share';
import { recipesStore } from '../features/recipes/store';
import { currentUrl, mainNav, renderApp } from '../test/renderApp';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  recipesStore.reset();
  journalStore.reset();
  dosesStore.reset();
  grindersStore.reset();
  coldBrewStore.reset();
});

const drip = getMethod('drip')!;

const myRecipe: RecipeInput = {
  ...methodAsRecipe(drip),
  name: 'Poranny V60',
  dose: { coffeeG: 18, waterMl: 300 },
  steps: [
    { text: 'Wsyp {coffee} g kawy', action: true },
    { text: 'Zalej {water*0.2} ml i odczekaj', durationSec: 45, action: true },
    { text: 'Dolej do {water} ml', action: true },
  ],
  note: 'Do jasnych ziaren',
};

const step = (n: number) => screen.getByRole('group', { name: `Krok ${n}` });
const stepTexts = () =>
  within(screen.getByRole('region', { name: 'Kroki' }))
    .getAllByRole('listitem')
    .map((li) => li.querySelector('p')!.firstChild!.textContent);

async function brewToEnd(user: UserEvent) {
  while (screen.queryByRole('button', { name: 'Dalej' })) {
    await user.click(screen.getByRole('button', { name: 'Dalej' }));
  }
  await user.click(screen.getByRole('button', { name: 'Zakończ' }));
}

describe('własny przepis: edytor', () => {
  it('„Zrób własną wersję” kopiuje przepis metody, a zmiany trafiają do przepisu', async () => {
    const { user, router } = renderApp('/parzenie/drip');
    const section = screen.getByRole('region', { name: 'Twoje przepisy' });
    expect(section).toHaveTextContent('Zmień ilości, czasy albo kroki');
    await user.click(within(section).getByRole('link', { name: 'Zrób własną wersję' }));

    expect(currentUrl(router)).toBe('/parzenie/drip/przepisy/nowy');
    expect(screen.getByRole('heading', { level: 1, name: 'Własna wersja' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nazwa')).toHaveValue('Drip (V60): moja wersja');
    expect(screen.getByLabelText('Kawa (g)')).toHaveValue('15');
    expect(screen.getByLabelText('Woda (ml)')).toHaveValue('250');
    expect(screen.getAllByRole('group', { name: /^Krok \d+$/ })).toHaveLength(drip.steps.length);
    expect(within(step(2)).getByLabelText('Polecenie')).toHaveValue('Wsyp {coffee} g kawy i wyrównaj');
    expect(step(2)).toHaveTextContent('Z ilościami: Wsyp 15 g kawy i wyrównaj');
    expect(within(step(3)).getByLabelText('Sekundy, krok 3')).toHaveValue('40');

    await user.clear(screen.getByLabelText('Nazwa'));
    await user.type(screen.getByLabelText('Nazwa'), 'Mój słodszy V60');
    await user.clear(screen.getByLabelText('Kawa (g)'));
    await user.type(screen.getByLabelText('Kawa (g)'), '16,5');

    // Krok 2 w górę: fokus zostaje na przesuniętym kroku, a czytnik słyszy, gdzie trafił.
    await user.click(within(step(2)).getByRole('button', { name: 'Przesuń krok 2 w górę' }));
    expect(within(step(1)).getByLabelText('Polecenie')).toHaveValue('Wsyp {coffee} g kawy i wyrównaj');
    expect(screen.getByText('Krok 2 jest teraz krokiem 1.')).toBeInTheDocument();
    expect(document.activeElement).toBe(within(step(1)).getByRole('button', { name: 'Przesuń krok 1 w dół' }));

    // Ostatni krok usunięty, nowy dodany na końcu.
    const last = drip.steps.length;
    await user.click(within(step(last)).getByRole('button', { name: `Usuń krok ${last}` }));
    expect(screen.getAllByRole('group', { name: /^Krok \d+$/ })).toHaveLength(last - 1);
    await user.click(screen.getByRole('button', { name: 'Dodaj krok' }));
    const added = step(last);
    expect(document.activeElement).toBe(within(added).getByLabelText('Polecenie'));
    await user.type(within(added).getByLabelText('Polecenie'), 'Zamieszaj i wylej');
    await user.click(within(added).getByRole('button', { name: `Wstaw ilość wody do kroku ${last}` }));
    expect(within(added).getByLabelText('Polecenie')).toHaveValue('Zamieszaj i wylej {water}');
    await user.type(within(added).getByLabelText(`Minuty, krok ${last}`), '1');
    await user.click(within(added).getByLabelText('czekanie'));

    await user.click(screen.getByRole('button', { name: 'Zapisz przepis' }));

    const saved = recipesStore.getSnapshot()[0]!;
    expect(currentUrl(router)).toBe(`/parzenie/drip/przepisy/${saved.id}`);
    expect(saved).toMatchObject({ name: 'Mój słodszy V60', dose: { coffeeG: 16.5, waterMl: 250 } });
    expect(saved.steps[0]!.text).toBe('Wsyp {coffee} g kawy i wyrównaj');
    expect(saved.steps.at(-1)).toEqual({ text: 'Zamieszaj i wylej {water}', durationSec: 60, action: false });

    expect(screen.getByRole('heading', { level: 1, name: 'Mój słodszy V60' })).toBeInTheDocument();
    expect(stepTexts()[0]).toBe('Wsyp 16,5 g kawy i wyrównaj');
    expect(stepTexts().at(-1)).toBe('Zamieszaj i wylej 250');

    // Wstecz wraca na ekran metody (formularza nie ma w historii), a przepis jest na liście.
    await user.click(screen.getByRole('link', { name: 'Drip (V60)' }));
    expect(currentUrl(router)).toBe('/parzenie/drip');
    expect(screen.getByRole('region', { name: 'Twoje przepisy' })).toHaveTextContent(
      'Mój słodszy V60' + '16,5 g kawy · 250 ml wody · 1:15,2 · średnio-drobno',
    );
  });

  it('walidacja: komunikaty przy polach i fokus na pierwszym błędnym', async () => {
    const { user, router } = renderApp('/parzenie/drip/przepisy/nowy');
    await user.clear(screen.getByLabelText('Nazwa'));
    await user.clear(within(step(1)).getByLabelText('Polecenie'));
    await user.type(within(step(2)).getByLabelText('Polecenie'), ' {{kawa}');
    await user.type(screen.getByLabelText('Woda (ml)'), '0');
    await user.click(screen.getByRole('button', { name: 'Zapisz przepis' }));

    expect(currentUrl(router)).toBe('/parzenie/drip/przepisy/nowy');
    expect(screen.getByRole('alert')).toHaveTextContent('Popraw zaznaczone pola');
    expect(screen.getByLabelText('Nazwa')).toHaveAccessibleDescription('Podaj nazwę przepisu.');
    expect(document.activeElement).toBe(screen.getByLabelText('Nazwa'));
    expect(screen.getByLabelText('Woda (ml)')).toHaveAccessibleDescription('Ten sprzęt mieści od 150 do 500 ml.');
    expect(within(step(1)).getByLabelText('Polecenie')).toHaveAccessibleDescription('Wpisz polecenie.');
    expect(within(step(2)).getByLabelText('Polecenie')).toHaveAccessibleDescription(
      'Nieznany znacznik {kawa}. Ilości wstawiaj przyciskami.',
    );
    expect(recipesStore.getSnapshot()).toHaveLength(0);
  });

  it('edycja zmienia przepis i wraca na jego ekran', async () => {
    const recipe = recipesStore.add(myRecipe);
    const { user, router } = renderApp(`/parzenie/drip/przepisy/${recipe.id}`);
    await user.click(screen.getByRole('link', { name: 'Edytuj' }));
    expect(currentUrl(router)).toBe(`/parzenie/drip/przepisy/${recipe.id}/edycja`);
    expect(screen.getByLabelText(/Notatka/)).toHaveValue('Do jasnych ziaren');
    await user.clear(screen.getByLabelText(/Notatka/));
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));

    expect(currentUrl(router)).toBe(`/parzenie/drip/przepisy/${recipe.id}`);
    expect(recipesStore.get(recipe.id)).not.toHaveProperty('note');
    expect(recipesStore.get(recipe.id)!.createdAt).toBe(recipe.createdAt);
  });

  it('nieznany przepis albo przepis innej metody: strona błędu', () => {
    const recipe = recipesStore.add(myRecipe);
    renderApp(`/parzenie/chemex/przepisy/${recipe.id}`);
    expect(screen.getByRole('heading', { level: 1, name: 'Nie ma takiej strony' })).toBeInTheDocument();
  });
});

describe('własny przepis: parzenie i dziennik', () => {
  it('kalkulator przelicza przepis, parzenie idzie według niego, a dziennik zapisuje przepis', async () => {
    const recipe = recipesStore.add(myRecipe);
    const { user, router } = renderApp(`/parzenie/drip/przepisy/${recipe.id}`);
    expect(screen.getByText('Do jasnych ziaren')).toBeInTheDocument();
    expect(stepTexts()).toEqual(['Wsyp 18 g kawy', 'Zalej 60 ml i odczekaj', 'Dolej do 300 ml']);

    // Ilość przepisu jest osobna od ilości metody.
    await user.click(screen.getByRole('button', { name: 'Więcej osób' }));
    expect(stepTexts()).toEqual(['Wsyp 30 g kawy', 'Zalej 100 ml i odczekaj', 'Dolej do 500 ml']);
    expect(dosesStore.getSnapshot()).toEqual({ [recipeDoseKey(recipe.id)]: 500 });

    await user.click(screen.getAllByRole('link', { name: 'Parz według przepisu' })[0]!);
    expect(currentUrl(router)).toBe(`/parzenie/drip/start?przepis=${recipe.id}`);
    expect(screen.getByRole('heading', { level: 1, name: 'Poranny V60' })).toBeInTheDocument();
    expect(screen.getByText('30 g kawy · 500 ml wody')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Wsyp 30 g kawy' })).toBeInTheDocument();
    await brewToEnd(user);

    expect(journalStore.getSnapshot()[0]).toMatchObject({
      methodId: 'drip',
      coffeeG: 30,
      waterMl: 500,
      recipeId: recipe.id,
      recipeName: 'Poranny V60',
    });
    expect(screen.getByText(/Kawa według przepisu „Poranny V60” czeka/)).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Cały dziennik parzeń' }));
    await user.click(screen.getByRole('link', { name: /Drip \(V60\)/ }));
    expect(screen.getByRole('link', { name: 'Poranny V60' })).toHaveAttribute('href', `/parzenie/drip/przepisy/${recipe.id}`);

    // „Zaparz tak samo” wraca do przepisu i jego ilości.
    dosesStore.clear(recipeDoseKey(recipe.id));
    await user.click(screen.getByRole('link', { name: 'Zaparz tak samo' }));
    expect(currentUrl(router)).toBe(`/parzenie/drip/start?przepis=${recipe.id}`);
    expect(screen.getByText('30 g kawy · 500 ml wody')).toBeInTheDocument();
  });

  it('ustawienie młynka: edytor zaczyna od ustawienia metody, a parzenie pokazuje ustawienie z przepisu', async () => {
    const grinder = grindersStore.add({ modelId: 'comandante-c40', name: 'Comandante C40 MK4', unit: 'click' });
    grindersStore.setSetting(grinder.id, 'drip', 22);
    const { user, router } = renderApp('/parzenie/drip/przepisy/nowy');

    const setting = screen.getByLabelText(/Ustawienie młynka Comandante C40 MK4/);
    expect(setting).toHaveValue('22');
    expect(screen.getByText(/Podpowiedź dla tego mielenia: 18–24 kliknięcia/)).toBeInTheDocument();
    await user.click(screen.getByLabelText('grubo'));
    expect(screen.getByText(/Podpowiedź dla tego mielenia: 30–36 kliknięć/)).toBeInTheDocument();
    await user.clear(setting);
    await user.type(setting, '30');
    await user.click(screen.getByRole('button', { name: 'Zapisz przepis' }));

    const recipe = recipesStore.getSnapshot()[0]!;
    expect(recipe.grinder).toMatchObject({ grinderName: 'Comandante C40 MK4', setting: 30 });
    expect(screen.getByRole('region', { name: 'Mielenie' })).toHaveTextContent('Ustawienie z przepisu: Comandante C40 MK4');

    await user.click(screen.getAllByRole('link', { name: 'Parz według przepisu' })[0]!);
    expect(currentUrl(router)).toBe(`/parzenie/drip/start?przepis=${recipe.id}`);
    expect(screen.getByText('30 kliknięć')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ustawienie młynka/ })).not.toBeInTheDocument();
    await brewToEnd(user);
    expect(journalStore.getSnapshot()[0]!.grind).toMatchObject({ setting: 30 });
    // Ustawienie metody się nie zmieniło.
    expect(grindersStore.getSnapshot().grinders[0]!.settings).toEqual({ drip: 22 });
  });

  it('cold brew według przepisu: przepis trafia do dziennika po maceracji', async () => {
    const coldBrew = getMethod('cold-brew')!;
    const recipe = recipesStore.add({ ...methodAsRecipe(coldBrew), name: 'Mocne cold brew', dose: { coffeeG: 120, waterMl: 800 } });
    const { user } = renderApp(`/parzenie/cold-brew/start?przepis=${recipe.id}`);
    expect(screen.getByText(/Według przepisu „Mocne cold brew”/)).toBeInTheDocument();
    expect(screen.getByText('120 g, grubo')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Zalane, zaczynam macerację' }));
    expect(coldBrewStore.getSnapshot()).toMatchObject({ recipeId: recipe.id, coffeeG: 120 });
    await user.click(screen.getByRole('button', { name: 'Przecedź teraz' }));
    await user.click(screen.getByRole('button', { name: 'Zakończ' }));
    expect(journalStore.getSnapshot()[0]).toMatchObject({ recipeName: 'Mocne cold brew', coffeeG: 120 });
  });

  it('nieznany przepis w parzeniu: strona błędu', () => {
    renderApp('/parzenie/drip/start?przepis=nie-ma');
    expect(screen.getByRole('heading', { level: 1, name: 'Nie ma takiej strony' })).toBeInTheDocument();
  });

  it('usunięcie z potwierdzeniem; dziennik zachowuje nazwę przepisu', async () => {
    const recipe = recipesStore.add(myRecipe);
    const entry = journalStore.add({ methodId: 'drip', coffeeG: 18, waterMl: 300, recipeId: recipe.id, recipeName: recipe.name });
    const { user, router } = renderApp(`/parzenie/drip/przepisy/${recipe.id}`);
    await user.click(screen.getByRole('button', { name: 'Usuń przepis' }));
    const dialog = screen.getByRole('dialog', { name: 'Usunąć „Poranny V60”?' });
    await user.click(within(dialog).getByRole('button', { name: 'Usuń' }));

    expect(currentUrl(router)).toBe('/parzenie/drip');
    expect(recipesStore.getSnapshot()).toHaveLength(0);
    await router.navigate(`/parzenie/dziennik/${entry.id}`);
    expect(await screen.findByText('Poranny V60 (usunięty)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Zaparz tak samo' })).toHaveAttribute('href', '/parzenie/drip/start');
  });
});

describe('przepis wysłany linkiem', () => {
  it('link z okna „Wyślij” otwiera podgląd, a „Zapisz u siebie” zapisuje przepis', async () => {
    const recipe = recipesStore.add(myRecipe);
    const first = renderApp(`/parzenie/drip/przepisy/${recipe.id}`);
    await first.user.click(screen.getByRole('button', { name: 'Wyślij' }));
    const dialog = screen.getByRole('dialog', { name: 'Wyślij przepis' });
    const link = (within(dialog).getByLabelText('Link do przepisu') as HTMLInputElement).value;
    expect(link).toBe(`${window.location.origin}/przepis#${encodeRecipe(myRecipe)}`);
    first.router.dispose();
    cleanup();

    // Ktoś inny otwiera link: u niego nie ma jeszcze tego przepisu.
    localStorage.clear();
    recipesStore.reset();
    const { user, router } = renderApp(link.slice(window.location.origin.length));
    expect(screen.getByRole('heading', { level: 1, name: 'Poranny V60' })).toBeInTheDocument();
    expect(within(mainNav()).getByRole('link', { name: 'Parzenie' })).toHaveAttribute('aria-current', 'page');
    expect(stepTexts()).toEqual(['Wsyp 18 g kawy', 'Zalej 60 ml i odczekaj', 'Dolej do 300 ml']);
    await user.click(screen.getByRole('button', { name: 'Zapisz u siebie' }));

    const saved = recipesStore.getSnapshot()[0]!;
    expect(saved).toMatchObject({ name: 'Poranny V60', note: 'Do jasnych ziaren' });
    expect(currentUrl(router)).toBe(`/parzenie/drip/przepisy/${saved.id}`);

    await router.navigate(link.slice(window.location.origin.length));
    expect(await screen.findByText('Masz już ten przepis')).toBeInTheDocument();
  });

  it('uszkodzony link pokazuje komunikat zamiast błędu', () => {
    renderApp('/przepis#1.eyJtIjoiZHJpcCJ9');
    expect(screen.getByRole('heading', { level: 1, name: 'Nie da się otworzyć przepisu' })).toBeInTheDocument();
    expect(screen.getByText('Link jest niepełny albo uszkodzony')).toBeInTheDocument();
  });
});
