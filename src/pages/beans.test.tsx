import { cleanup, screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { beansStore } from '../features/beans/store';
import { renderApp } from '../test/renderApp';

beforeEach(() => {
  localStorage.clear();
  beansStore.reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function addBean(user: UserEvent, name: string) {
  await user.click(screen.getByRole('link', { name: 'Dodaj ziarna' }));
  await user.type(screen.getByLabelText('Nazwa'), name);
  await user.type(screen.getByLabelText(/Palarnia/), 'Palarnia Testowa');
  await user.click(within(screen.getByRole('group', { name: 'Palenie' })).getByLabelText('jasne'));
  const notes = screen.getByRole('group', { name: /Nuty smakowe/ });
  await user.click(within(notes).getByLabelText('kwiatowe'));
  await user.click(within(notes).getByLabelText('owocowe'));
  await user.type(screen.getByLabelText(/Pochodzenie/), 'Etiopia');
  await user.click(within(screen.getByRole('group', { name: 'Rodzaj' })).getByLabelText('single origin'));
  await user.click(screen.getByRole('button', { name: 'Zapisz ziarna' }));
}

describe('Moje ziarna', () => {
  it('pusta lista zachęca do dodania ziaren', () => {
    renderApp('/ziarna');
    expect(screen.getByText('Nie masz jeszcze zapisanych ziaren')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dodaj ziarna' })).toHaveAttribute('href', '/ziarna/nowe');
  });

  it('dodane ziarna zostają po odświeżeniu', async () => {
    const { user, router } = renderApp('/ziarna');
    await addBean(user, 'Yirgacheffe');

    expect(router.state.location.pathname).toMatch(/^\/ziarna\/.+/);
    expect(screen.getByRole('heading', { level: 1, name: 'Yirgacheffe' })).toBeInTheDocument();
    expect(screen.getByText('palenie jasne')).toBeInTheDocument();
    // Nuty w kolejności z listy, a nie kliknięć.
    expect(screen.getByText('owocowe').compareDocumentPosition(screen.getByText('kwiatowe'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    // „Odświeżenie”: nowa aplikacja, pusty stan w pamięci, dane tylko z localStorage.
    cleanup();
    beansStore.reset();
    renderApp('/ziarna');
    expect(screen.getByRole('heading', { level: 2, name: 'Yirgacheffe' })).toBeInTheDocument();
    expect(screen.getByText('Palarnia Testowa')).toBeInTheDocument();
  });

  it('formularz wymaga nazwy i palenia', async () => {
    const { user } = renderApp('/ziarna/nowe');
    await user.click(screen.getByRole('button', { name: 'Zapisz ziarna' }));
    expect(screen.getByText('Podaj nazwę kawy.')).toBeInTheDocument();
    expect(screen.getByText('Wybierz palenie.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nazwa')).toHaveAttribute('aria-invalid', 'true');
    expect(beansStore.getSnapshot()).toEqual([]);
  });

  it('„Jak zaparzyć?” pokazuje ranking metod z uzasadnieniem i linkami', async () => {
    const { user, router } = renderApp('/ziarna');
    await addBean(user, 'Kenia');

    await user.click(screen.getByRole('button', { name: 'Jak zaparzyć?' }));
    const ranking = screen.getByRole('list', { name: 'Ranking metod' });
    const items = within(ranking).getAllByRole('listitem').filter((li) => li.parentElement === ranking);
    expect(items).toHaveLength(7);
    // Jasne, kwiatowe, owocowe, single origin: na górze przelew.
    expect(within(items[0]!).getByRole('link')).toHaveTextContent(/^1\.(Drip \(V60\)|Chemex)$/);
    expect(within(ranking).getByText('Jasne palenie jest kwaśniejsze: w kawiarce może wyjść kwaśno i ostro.')).toBeInTheDocument();

    await user.click(within(items[0]!).getByRole('link'));
    expect(router.state.location.pathname).toMatch(/^\/parzenie\/(drip|chemex)$/);
  });

  it('edycja i usuwanie', async () => {
    const { user, router } = renderApp('/ziarna');
    await addBean(user, 'Brazylia');

    await user.click(screen.getByRole('link', { name: 'Edytuj' }));
    expect(screen.getByLabelText('Nazwa')).toHaveValue('Brazylia');
    await user.clear(screen.getByLabelText('Nazwa'));
    await user.type(screen.getByLabelText('Nazwa'), 'Brazylia Santos');
    await user.click(within(screen.getByRole('group', { name: 'Palenie' })).getByLabelText('ciemne'));
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Brazylia Santos' })).toBeInTheDocument();
    expect(screen.getByText('palenie ciemne')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Usuń' }));
    const dialog = screen.getByRole('dialog', { name: 'Usunąć „Brazylia Santos”?' });
    await user.click(within(dialog).getByRole('button', { name: 'Usuń ziarna' }));
    expect(router.state.location.pathname).toBe('/ziarna');
    expect(screen.getByText('Nie masz jeszcze zapisanych ziaren')).toBeInTheDocument();
  });

  it('bez localStorage aplikacja działa i ostrzega', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });

    const { user } = renderApp('/ziarna');
    expect(screen.getByRole('status')).toHaveTextContent('nie pozwala zapisywać danych');
    await addBean(user, 'Gwatemala');
    expect(screen.getByRole('heading', { level: 1, name: 'Gwatemala' })).toBeInTheDocument();
  });

  it('nieznane ziarna pokazują stronę błędu', () => {
    renderApp('/ziarna/nie-ma');
    expect(screen.getByRole('heading', { level: 1, name: 'Nie ma takiej strony' })).toBeInTheDocument();
  });
});
