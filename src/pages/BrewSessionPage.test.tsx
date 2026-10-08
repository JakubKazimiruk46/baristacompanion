import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../test/renderApp';

const vibrate = vi.fn();

beforeEach(() => {
  // Tylko timery i Date: reszta (mikrozadania, MessageChannel) musi działać normalnie.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
});

afterEach(() => {
  vi.useRealTimers();
  vibrate.mockReset();
  Reflect.deleteProperty(navigator, 'vibrate');
  Reflect.deleteProperty(navigator, 'wakeLock');
});

// fireEvent zamiast user-event: Testing Library po akcji user-event czeka na setTimeout(0),
// a fałszywych timerów Vitesta nie rozpoznaje, więc test by zawisł.
function start() {
  return renderApp('/parzenie/prasa-francuska/start');
}

const tap = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));

const stepHeading = () => screen.getByRole('heading', { level: 2 }).textContent;
const clock = () => screen.getByLabelText('Pozostały czas').textContent;
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('prowadzone parzenie: prasa francuska', () => {
  it('od początku do końca, z sygnałami między krokami', async () => {
    start();
    const next = () => tap(/^(Dalej|Zakończ)$/);

    // 1. Zagotuj wodę i odczekaj pół minuty: stoper rusza dopiero na „Start”.
    expect(stepHeading()).toBe('Zagotuj wodę i odczekaj pół minuty');
    expect(screen.getByText('Krok 1 z 9')).toBeInTheDocument();
    expect(clock()).toBe('0:30');
    await wait(5_000);
    expect(clock()).toBe('0:30');
    tap('Start');
    await wait(30_000);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Czas minął!Teraz: Wsyp 30 g grubo zmielonej kawy do dzbanka',
    );
    expect(vibrate).toHaveBeenCalledTimes(1);

    // 2–3. Kroki bez czasu.
    next();
    expect(stepHeading()).toBe('Wsyp 30 g grubo zmielonej kawy do dzbanka');
    expect(screen.queryByLabelText('Pozostały czas')).not.toBeInTheDocument();
    next();
    expect(stepHeading()).toBe('Zalej 500 ml wody');

    // 4. Odczekaj 4 minuty: rusza sam i zapowiada następny krok.
    next();
    expect(stepHeading()).toBe('Odczekaj 4 minuty');
    expect(clock()).toBe('4:00');
    expect(screen.getByText(/^Za 4:00:/)).toHaveTextContent('Za 4:00: Zamieszaj skorupkę');
    await wait(60_000);
    expect(clock()).toBe('3:00');
    await wait(180_000);
    expect(screen.getByRole('alert')).toHaveTextContent('Teraz: Zamieszaj skorupkę');
    expect(vibrate).toHaveBeenCalledTimes(2);

    // 5–7. Zamieszaj, zbierz piankę, zamieszaj jeszcze raz.
    next();
    expect(stepHeading()).toBe('Zamieszaj skorupkę');
    next();
    expect(stepHeading()).toBe('Zbierz piankę łyżką');
    next();
    expect(stepHeading()).toBe('Zamieszaj jeszcze raz, delikatnie');

    // 8. Kolejne 5 minut.
    next();
    expect(clock()).toBe('5:00');
    await wait(300_000);
    expect(screen.getByRole('alert')).toHaveTextContent('Teraz: Wciśnij tłok tylko do powierzchni i powoli nalej');
    expect(vibrate).toHaveBeenCalledTimes(3);

    // 9. Ostatni krok i propozycje napojów.
    next();
    expect(screen.getByRole('button', { name: 'Zakończ' })).toBeInTheDocument();
    next();
    expect(screen.getByRole('heading', { level: 1, name: 'Gotowe! Smacznej kawy' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Café au lait' })).toBeInTheDocument();
  });

  it('po 30 s w innej karcie pokazuje poprawny czas', async () => {
    start();
    for (let i = 0; i < 3; i++) tap('Dalej');
    expect(clock()).toBe('4:00');

    // Karta w tle: zegar idzie, ale interwały nie strzelają.
    vi.setSystemTime(Date.now() + 30_000);
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(clock()).toBe('3:30');
  });

  it('pauza, wznowienie i reset', async () => {
    start();
    tap('Start');
    await wait(10_000);
    tap('Pauza');
    await wait(60_000);
    expect(clock()).toBe('0:20');

    tap('Wznów');
    await wait(5_000);
    expect(clock()).toBe('0:15');

    tap('Reset');
    expect(clock()).toBe('0:30');
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
  });

  it('trzyma ekran włączony przez Wake Lock, a bez API działa dalej', async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    const request = vi.fn().mockResolvedValue({ release });
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });

    start();
    await act(async () => {});
    expect(request).toHaveBeenCalledWith('screen');
  });
});
