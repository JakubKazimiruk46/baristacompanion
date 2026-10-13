import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDrink } from '../data';
import { validateDrink } from '../data/validate';
import { myDrinksStore } from '../features/assistant/myDrinks';
import { currentUrl, renderApp } from '../test/renderApp';

beforeEach(() => {
  localStorage.clear();
  myDrinksStore.reset();
});

describe('kreator napoju', () => {
  it('od zera: błędy przy polach, potem zapis w „Moich napojach” jako własny napój', async () => {
    const { user, router } = renderApp('/napoje');
    await user.click(screen.getByRole('link', { name: /Stwórz własny napój/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Nowy napój' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Zapisz napój' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Popraw pola/);
    expect(screen.getByLabelText('Nazwa napoju')).toHaveAccessibleDescription('Nazwij napój.');

    await user.type(screen.getByLabelText('Nazwa napoju'), 'Kawa z miodem po mojemu');
    await user.type(screen.getByLabelText(/Hasło/), 'Słodko i korzennie');
    await user.selectOptions(screen.getByLabelText('Składnik do dodania'), 'miod');
    await user.click(screen.getByRole('button', { name: 'Dodaj' }));
    expect(screen.getByRole('region', { name: 'Dodatki' })).toHaveTextContent('Miód');
    await user.type(screen.getByLabelText('Krok 1'), 'Zaparz kawę i rozpuść w niej miód.');
    await user.click(screen.getByRole('button', { name: 'Zapisz napój' }));

    const [saved] = myDrinksStore.getSnapshot();
    expect(saved?.source).toBe('own');
    expect(validateDrink(saved!.drink)).toEqual([]);
    expect(currentUrl(router)).toBe(`/napoje/${saved!.drink.id}`);
    expect(screen.getByRole('heading', { level: 1, name: 'Kawa z miodem po mojemu' })).toBeInTheDocument();
    expect(screen.getByText('Twój napój')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edytuj' })).toHaveAttribute('href', `/napoje/${saved!.drink.id}/edycja`);
  });

  it('własna wersja napoju z katalogu: dane na start, warstwy i naczynie się zmieniają', async () => {
    const { user } = renderApp('/napoje/espresso-tonic');
    await user.click(screen.getByRole('link', { name: 'Własna wersja' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Własna wersja: Espresso tonic' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nazwa napoju')).toHaveValue('Espresso tonic po mojemu');

    const layers = screen.getByRole('region', { name: 'Warstwy od dołu' });
    const count = getDrink('espresso-tonic')!.layers.length;
    expect(within(layers).getAllByText(/^Warstwa \d/)).toHaveLength(count);
    await user.click(within(layers).getByRole('button', { name: 'Dodaj warstwę na górze' }));
    await user.type(within(layers).getByLabelText(`Nazwa warstwy ${count + 1}`), 'pianka z tonikiem');

    // Mniejsze naczynie: warstwy się nie mieszczą, zapis pokazuje błąd przy warstwach.
    await user.click(screen.getByLabelText(/filiżanka do espresso/));
    expect(screen.getByText(/z 90 ml \(za dużo\)/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Zapisz napój' }));
    expect(layers).toHaveTextContent('nie mieszczą się w naczyniu (90 ml)');

    await user.click(screen.getByLabelText(/wysoka szklanka/));
    await user.click(screen.getByRole('button', { name: 'Zapisz napój' }));
    const [saved] = myDrinksStore.getSnapshot();
    expect(saved?.drink.layers.at(-1)?.name).toBe('pianka z tonikiem');
  });

  it('podpowiedź warstw ze składników i cofnięcie', async () => {
    const { user } = renderApp('/napoje/nowy');
    await user.click(screen.getByLabelText('Napój z mlekiem'));
    await user.click(screen.getByLabelText('Mleko krowie 3,2%'));
    const layers = screen.getByRole('region', { name: 'Warstwy od dołu' });
    await user.click(within(layers).getByRole('button', { name: 'Podpowiedz ze składników' }));
    const names = () => within(layers).getAllByLabelText(/^Nazwa warstwy/).map((input) => (input as HTMLInputElement).value);
    expect(names()).toEqual(['mleko', 'kawa z kawiarki', 'pianka']);
    await user.click(within(layers).getByRole('button', { name: 'Cofnij podpowiedź' }));
    expect(names()).toEqual(['kawa']);
  });

  it('edycja „Mojego napoju” zapisuje zmiany pod tym samym adresem', async () => {
    const drink = myDrinksStore.add({ ...getDrink('mocha')!, id: 'x' }, 1, { source: 'own' });
    const { user, router } = renderApp(`/napoje/${drink.id}/edycja`);
    const name = screen.getByLabelText('Nazwa napoju');
    await user.clear(name);
    await user.type(name, 'Mocha domowa');
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
    expect(currentUrl(router)).toBe(`/napoje/${drink.id}`);
    expect(myDrinksStore.get(drink.id)?.name).toBe('Mocha domowa');
  });

  it('poprawiona propozycja AI staje się własnym napojem; napoju z katalogu nie edytuje się', () => {
    const drink = myDrinksStore.add({ ...getDrink('mocha')!, id: 'x' }, 1);
    expect(myDrinksStore.record(drink.id)?.source).toBe('ai');
    myDrinksStore.update(drink.id, { ...drink, name: 'Inna' });
    expect(myDrinksStore.record(drink.id)?.source).toBe('own');

    renderApp('/napoje/mocha/edycja');
    expect(screen.getByRole('heading', { level: 1, name: 'Nie ma takiej strony' })).toBeInTheDocument();
  });

  it('metody alternatywne i „Wszystkie metody”: zapis i opis bazy na ekranie napoju', async () => {
    const { user, router } = renderApp('/napoje/nowy?z=espresso-tonic');
    const others = () => screen.getByRole('group', { name: 'Też pasuje (opcjonalnie)' });
    expect(within(others()).getByRole('checkbox', { name: 'AeroPress' })).toBeChecked();
    expect(within(others()).queryByRole('checkbox', { name: 'Kawiarka' })).not.toBeInTheDocument();
    await user.click(within(others()).getByRole('checkbox', { name: 'Chemex' }));
    await user.click(screen.getByRole('button', { name: 'Zapisz napój' }));

    const id = myDrinksStore.getSnapshot()[0]!.drink.id;
    expect(myDrinksStore.getSnapshot()[0]!.drink.base.alternativeMethodIds).toEqual(['chemex', 'aeropress']);
    expect(screen.getByRole('link', { name: 'Chemex' })).toHaveAttribute('href', '/parzenie/chemex');

    await router.navigate(`/napoje/${id}/edycja`);
    await screen.findByRole('heading', { level: 1, name: /^Edycja/ });
    await user.click(within(others()).getByRole('checkbox', { name: 'Wszystkie metody' }));
    expect(within(others()).getByRole('checkbox', { name: 'Syfon' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
    expect(myDrinksStore.getSnapshot()[0]!.drink.base).toMatchObject({ methodId: 'kawiarka', anyMethod: true });
    expect(myDrinksStore.getSnapshot()[0]!.drink.base.alternativeMethodIds).toBeUndefined();
    expect(currentUrl(router)).toBe(`/napoje/${id}`);
    expect(screen.getByRole('link', { name: 'dowolnej innej metody' })).toHaveAttribute('href', '/parzenie');
  });
});
