import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readLabel } from '../features/beans/scan/ocr';
import { beansStore } from '../features/beans/store';
import { flowStore } from '../features/flow/store';
import { renderApp } from '../test/renderApp';

// Prawdziwe rozpoznawanie tekstu (WASM, modele z CDN) nie działa w jsdom.
vi.mock('../features/beans/scan/ocr', () => ({ readLabel: vi.fn() }));
const read = vi.mocked(readLabel);

const photo = () => new File(['jpeg'], 'etykieta.jpg', { type: 'image/jpeg' });

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  beansStore.reset();
  flowStore.reset();
});

afterEach(() => {
  read.mockReset();
});

describe('skan etykiety w formularzu ziaren', () => {
  it('wypełnia formularz tym, co odczytano, i pokazuje postęp', async () => {
    read.mockImplementation(async (_, onProgress) => {
      onProgress?.('reading', 0.5);
      return 'ETIOPIA GUJI\nPalarnia Testowa\njasno palona\nnuty: jaśmin, brzoskwinia, cytryna';
    });
    const { user } = renderApp('/ziarna/nowe');
    await user.upload(screen.getByLabelText('Zeskanuj etykietę'), photo());

    expect(read).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(/Z etykiety: nazwa „Etiopia Guji”; palenie jasne; nuty: owocowe, kwiatowe, cytrusowe/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Nazwa')).toHaveValue('Etiopia Guji');
    expect(screen.getByLabelText(/Palarnia/)).toHaveValue('Palarnia Testowa');
    expect(screen.getByLabelText(/Pochodzenie/)).toHaveValue('Etiopia');
    expect(within(screen.getByRole('group', { name: 'Palenie' })).getByLabelText('jasne')).toBeChecked();
    const notes = screen.getByRole('group', { name: /Nuty smakowe/ });
    for (const note of ['owocowe', 'kwiatowe', 'cytrusowe']) expect(within(notes).getByLabelText(note)).toBeChecked();
    expect(within(screen.getByRole('group', { name: 'Rodzaj' })).getByLabelText('single origin')).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Zapisz ziarna' }));
    expect(beansStore.getSnapshot()[0]).toMatchObject({
      name: 'Etiopia Guji',
      profile: { roast: 'light', notes: ['fruity', 'floral', 'citrus'], origin: 'Etiopia', kind: 'single-origin' },
    });
  });

  it('nie nadpisuje tego, co już wpisano', async () => {
    read.mockResolvedValue('KENIA NYERI\nciemno palona');
    const { user } = renderApp('/ziarna/nowe');
    await user.type(screen.getByLabelText('Nazwa'), 'Moja kawa');
    await user.click(within(screen.getByRole('group', { name: 'Palenie' })).getByLabelText('średnie'));

    await user.upload(screen.getByLabelText('Zeskanuj etykietę'), photo());
    await screen.findByText(/Z etykiety/);
    expect(screen.getByLabelText('Nazwa')).toHaveValue('Moja kawa');
    expect(within(screen.getByRole('group', { name: 'Palenie' })).getByLabelText('średnie')).toBeChecked();
    expect(screen.getByLabelText(/Pochodzenie/)).toHaveValue('Kenia');
  });

  it('nic nie odczytano: podpowiedź, jak zrobić lepsze zdjęcie', async () => {
    read.mockResolvedValue('~~ || 250g');
    const { user } = renderApp('/ziarna/nowe');
    await user.upload(screen.getByLabelText('Zeskanuj etykietę'), photo());
    expect(await screen.findByText(/Nie udało się nic odczytać/)).toBeInTheDocument();
    expect(screen.getByLabelText('Nazwa')).toHaveValue('');
  });

  it('ścieżka „Mam kawę”: skan opisuje ziarna i odblokowuje następny krok', async () => {
    read.mockResolvedValue('BRAZYLIA SANTOS\nśrednio palona\nnuty: czekolada, orzech laskowy');
    const { user } = renderApp('/mam-kawe');
    const next = screen.getByRole('link', { name: 'Dalej: polecane metody' });
    expect(next).toHaveAttribute('aria-disabled', 'true');

    await user.upload(screen.getByLabelText('Zeskanuj etykietę'), photo());
    await screen.findByText(/Z etykiety/);
    expect(within(screen.getByRole('group', { name: 'Palenie' })).getByLabelText('średnie')).toBeChecked();
    const notes = screen.getByRole('group', { name: 'Nuty smakowe' });
    expect(within(notes).getByLabelText('czekoladowe')).toBeChecked();
    expect(within(notes).getByLabelText('orzechowe')).toBeChecked();
    expect(next).not.toHaveAttribute('aria-disabled');
  });

  it('błąd (np. brak internetu przy pierwszym skanie)', async () => {
    read.mockRejectedValue(new TypeError('Failed to fetch'));
    const { user } = renderApp('/ziarna/nowe');
    await user.upload(screen.getByLabelText('Zeskanuj etykietę'), photo());
    expect(await screen.findByRole('alert')).toHaveTextContent('Pierwszy skan potrzebuje internetu');
  });
});
