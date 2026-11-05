import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { beansStore } from '../features/beans/store';
import { flowStore } from '../features/flow/store';
import { renderApp } from '../test/renderApp';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  beansStore.reset();
  flowStore.reset();
});

const h1 = () => screen.getByRole('heading', { level: 1 }).textContent;
const stepLabel = () => screen.getByText(/^Mam kawę · krok/).textContent;

async function describeLightFruity(user: UserEvent) {
  await user.click(screen.getByRole('link', { name: 'Mam kawę. Co z nią zrobić?' }));
  expect(h1()).toBe('Co dziś robimy?');
  await user.click(screen.getByRole('link', { name: /Wybiorę sam/ }));
  expect(h1()).toBe('Jakie masz ziarna?');
  await user.click(within(screen.getByRole('group', { name: 'Palenie' })).getByLabelText('jasne'));
  await user.click(within(screen.getByRole('group', { name: 'Nuty smakowe' })).getByLabelText('owocowe'));
  await user.click(screen.getByRole('link', { name: 'Dalej: polecane metody' }));
}

describe('ścieżka „Mam kawę”', () => {
  it('jasne ziarna → drip → zimny napój → parzenie → złożenie → podanie', async () => {
    const { user, router } = renderApp('/');
    await describeLightFruity(user);

    // 2. Polecane metody: drip wysoko, wybieramy go.
    expect(h1()).toBe('Polecane metody');
    expect(stepLabel()).toBe('Mam kawę · krok 2 z 7');
    await user.click(screen.getByRole('link', { name: /Drip \(V60\)/ }));

    // 3. Metoda i mielenie.
    expect(h1()).toBe('Metoda i mielenie');
    expect(screen.getByText('Średnio-drobno')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Dalej: co z tego zrobić' }));

    // 4. Napoje podzielone na zimne i ciepłe.
    expect(h1()).toBe('Co z tego zrobić?');
    const cold = screen.getByRole('region', { name: 'Na zimno' });
    expect(within(screen.getByRole('region', { name: 'Na ciepło' })).getByRole('link', { name: /Irish coffee/ })).toBeInTheDocument();
    await user.click(within(cold).getByRole('link', { name: /Kawa mrożona z dripa/ }));

    // 5. Prowadzone parzenie: z notatką do napoju, przechodzimy wszystkie kroki.
    expect(h1()).toBe('Parzenie');
    expect(screen.getByText(/Do napoju „Kawa mrożona z dripa”/)).toBeInTheDocument();
    while (screen.queryByRole('button', { name: 'Dalej' })) {
      await user.click(screen.getByRole('button', { name: 'Dalej' }));
    }
    await user.click(screen.getByRole('button', { name: 'Zakończ' }));

    // 6. Złóż napój.
    expect(h1()).toBe('Złóż napój');
    expect(screen.getByRole('img', { name: /^Kawa mrożona z dripa, niska szklanka/ })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Dalej: jak podać' }));

    // 7. Podanie: bez ślepego zaułka.
    expect(h1()).toBe('Podanie');
    expect(router.state.location.pathname).toBe('/mam-kawe/podanie');
    expect(screen.getByRole('region', { name: 'Jak podać' })).toHaveTextContent('Niska szklanka');
    expect(screen.getByRole('link', { name: 'Wróć na start' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Zacznij od nowa' })).toBeInTheDocument();
  });

  it('cofanie nie gubi wyborów', async () => {
    const { user } = renderApp('/');
    await describeLightFruity(user);
    await user.click(screen.getByRole('link', { name: /Chemex/ }));
    await user.click(screen.getByRole('link', { name: 'Dalej: co z tego zrobić' }));
    await user.click(screen.getByRole('link', { name: /Kawa mrożona z dripa/ }));
    expect(h1()).toBe('Parzenie');

    const back = () => user.click(screen.getByRole('link', { name: 'Wstecz' }));
    await back();
    expect(h1()).toBe('Co z tego zrobić?');
    expect(screen.getByRole('link', { name: /Kawa mrożona z dripa/ }).closest('li')).toHaveAttribute(
      'aria-current',
      'true',
    );
    await back();
    expect(screen.getByText('Chemex', { selector: 'p' })).toBeInTheDocument();
    await back();
    const ranking = screen.getByRole('list', { name: 'Ranking metod' });
    expect(within(ranking).getByRole('link', { name: /Chemex/ }).closest('li')).toHaveAttribute(
      'aria-current',
      'true',
    );
    await back();
    expect(within(screen.getByRole('group', { name: 'Palenie' })).getByLabelText('jasne')).toBeChecked();
    expect(within(screen.getByRole('group', { name: 'Nuty smakowe' })).getByLabelText('owocowe')).toBeChecked();
  });

  it('zapisane ziarna można wybrać od razu', async () => {
    beansStore.add({ name: 'Brazylia', profile: { roast: 'dark', notes: ['chocolate'], kind: 'blend' } });
    const { user } = renderApp('/mam-kawe/ziarna');
    await user.click(screen.getByLabelText(/Brazylia/));
    await user.click(screen.getByRole('link', { name: 'Dalej: polecane metody' }));
    const ranking = screen.getByRole('list', { name: 'Ranking metod' });
    expect(within(ranking).getAllByRole('link')[0]).toHaveTextContent(/Kawiarka|Prasa francuska|AeroPress/);
  });

  it('bez palenia nie da się przejść dalej', () => {
    renderApp('/mam-kawe/ziarna');
    expect(screen.getByRole('link', { name: 'Dalej: polecane metody' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('czysta kawa: z parzenia prosto do podania', async () => {
    const { user } = renderApp('/');
    await describeLightFruity(user);
    await user.click(screen.getByRole('link', { name: /Zalewajka/ }));
    await user.click(screen.getByRole('link', { name: 'Dalej: co z tego zrobić' }));
    await user.click(screen.getByRole('link', { name: 'Wypiję czystą kawę, bez dodatków' }));
    await user.click(screen.getByRole('link', { name: 'Pomiń: mam już zaparzoną kawę' }));
    expect(h1()).toBe('Podanie');
    expect(screen.getByText('Czysta kawa w ogrzanej filiżance')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Wstecz' }));
    expect(h1()).toBe('Parzenie');
  });

  it('wejście prosto na późny krok cofa do brakującego wyboru', () => {
    const { router } = renderApp('/mam-kawe/napoje');
    expect(router.state.location.pathname).toBe('/mam-kawe/ziarna');
    expect(h1()).toBe('Jakie masz ziarna?');
  });

  it('nieznany krok to strona błędu', () => {
    renderApp('/mam-kawe/deser');
    expect(h1()).toBe('Nie ma takiej strony');
  });
});
