import { act, cleanup, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COLD_BREW_KEY, coldBrewStore } from '../features/coldbrew/store';
import { renderApp } from '../test/renderApp';

const START = new Date(2026, 9, 8, 20, 0); // środa, 20:00 czasu lokalnego
const HOUR = 3600_000;

// Fałszujemy tylko Date: timery i user-event działają normalnie.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(START);
  localStorage.clear();
  coldBrewStore.reset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

/** Przesuwa zegar i budzi aplikację tak, jak powrót na kartę. */
async function later(ms: number) {
  vi.setSystemTime(Date.now() + ms);
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

async function startCinnamon12h() {
  const { user, router } = renderApp('/parzenie/cold-brew/start?wariant=cynamon');
  expect(screen.getByLabelText('Z cynamonem')).toBeChecked();
  expect(screen.getByText('Dodaj przyprawę: 1 laska cynamonu (ok. 8 cm) na 800 ml wody')).toBeInTheDocument();
  await user.click(screen.getByLabelText('12 h'));
  expect(screen.getByText('jutro o 8:00')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Zalane, zaczynam macerację' }));
  return { user, router };
}

describe('cold brew', () => {
  it('startuje z wybranym wariantem i pokazuje godzinę gotowości', async () => {
    await startCinnamon12h();
    expect(screen.getByRole('heading', { level: 1, name: 'Cold brew z cynamonem' })).toBeInTheDocument();
    expect(screen.getByText('Gotowe ok. jutro o 8:00')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(COLD_BREW_KEY)!)).toEqual({
      startedAt: START.getTime(),
      hours: 12,
      variantId: 'cynamon',
    });
  });

  it('przetrwa zamknięcie i ponowne otwarcie aplikacji', async () => {
    await startCinnamon12h();

    // Zamknięcie aplikacji, a rano ponowne otwarcie.
    cleanup();
    coldBrewStore.reset();
    vi.setSystemTime(START.getTime() + 6 * HOUR);
    renderApp('/parzenie/cold-brew/start');

    expect(screen.getByText('Gotowe ok. dziś o 8:00')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Postęp maceracji' })).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText(/zostało 6 h/)).toBeInTheDocument();
  });

  it('lista metod pokazuje, że cold brew się maceruje', async () => {
    await startCinnamon12h();
    cleanup();
    renderApp('/parzenie');
    expect(screen.getByText('Cold brew maceruje się, gotowe jutro o 8:00')).toBeInTheDocument();
  });

  it('dodaje przypomnienie do kalendarza jako plik .ics', async () => {
    // jsdom nie ma URL.createObjectURL.
    const createObjectURL = vi.fn((_: Blob) => 'blob:cold-brew');
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const { user } = await startCinnamon12h();
    await user.click(screen.getByRole('button', { name: 'Dodaj przypomnienie do kalendarza' }));

    expect(click).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0]![0];
    expect(blob.type).toBe('text/calendar;charset=utf-8');
    const ics = (await blob.text()).replace(/\r\n /g, '');
    const ready = new Date(START.getTime() + 12 * HOUR).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    expect(ics).toContain(`DTSTART:${ready}`);
    expect(ics).toContain('SUMMARY:Cold brew z cynamonem gotowe: przecedź');
  });

  it('po czasie: przecedź, napoje z tym wariantem i zakończenie', async () => {
    const { user, router } = await startCinnamon12h();
    await later(12 * HOUR + 60_000);

    expect(screen.getByRole('heading', { level: 1, name: 'Cold brew gotowe!' })).toBeInTheDocument();
    expect(screen.getByText('Przecedź przez sitko, a potem przez filtr papierowy')).toBeInTheDocument();
    const drinks = screen.getByRole('region', { name: 'Co z niego zrobić' });
    expect(within(drinks).getByRole('heading', { name: 'Cold brew z cynamonem' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Zakończ' }));
    expect(router.state.location.pathname).toBe('/parzenie/cold-brew');
    expect(localStorage.getItem(COLD_BREW_KEY)).toBe('null');
  });

  it('można przerwać macerację', async () => {
    const { user } = await startCinnamon12h();
    await user.click(screen.getByRole('button', { name: 'Przerwij' }));
    await user.click(screen.getByRole('button', { name: 'Przerwij macerację' }));
    expect(coldBrewStore.getSnapshot()).toBeNull();
  });

  it('napoje na cold brew prowadzą do maceracji z właściwą przyprawą', () => {
    renderApp('/napoje/cold-brew-z-kardamonem');
    expect(screen.getByRole('link', { name: 'Zacznij macerację: z kardamonem' })).toHaveAttribute(
      'href',
      '/parzenie/cold-brew/start?wariant=kardamon',
    );
  });

  it('ekran metody ma warianty z przyprawami i linki do napojów', () => {
    renderApp('/parzenie/cold-brew');
    const section = screen.getByRole('region', { name: 'Warianty z przyprawami' });
    expect(within(section).getByRole('link', { name: 'Cold brew z cynamonem' })).toHaveAttribute(
      'href',
      '/napoje/cold-brew-z-cynamonem',
    );
    expect(within(section).getByRole('link', { name: 'Zacznij: z kardamonem' })).toHaveAttribute(
      'href',
      '/parzenie/cold-brew/start?wariant=kardamon',
    );
  });

  it('uszkodzony zapis nie psuje ekranu', () => {
    localStorage.setItem(COLD_BREW_KEY, JSON.stringify({ startedAt: 'wczoraj', hours: 7 }));
    renderApp('/parzenie/cold-brew/start');
    expect(screen.getByRole('button', { name: 'Zalane, zaczynam macerację' })).toBeInTheDocument();
  });
});
