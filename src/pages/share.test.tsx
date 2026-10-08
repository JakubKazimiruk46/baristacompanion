import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cardToPng } from '../features/share/exportCard';
import { currentUrl, renderApp } from '../test/renderApp';

// jsdom nie rysuje na kanwie: podmieniamy eksport obrazka.
vi.mock('../features/share/exportCard', () => ({ cardToPng: vi.fn() }));
const toPng = vi.mocked(cardToPng);

beforeEach(() => {
  toPng.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
});

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'share');
  Reflect.deleteProperty(navigator, 'canShare');
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

async function openCard() {
  const app = renderApp('/napoje/espresso-tonic');
  await app.user.click(screen.getByRole('button', { name: 'Udostępnij' }));
  const dialog = screen.getByRole('dialog', { name: 'Karta do udostępnienia' });
  return { ...app, dialog };
}

describe('karta napoju do udostępnienia', () => {
  it('otwiera podgląd karty i zapisuje okno w adresie', async () => {
    const { dialog, router } = await openCard();
    expect(currentUrl(router)).toBe('/napoje/espresso-tonic?karta=1');
    const card = within(dialog).getByRole('img', { name: 'Karta napoju: Espresso tonic' });
    expect(card).toHaveTextContent('Espresso tonic');
    expect(card).toHaveTextContent('Na zimno · 10 min · Kawiarka');
    expect(card).toHaveTextContent('4–5 kostek');
    expect(toPng).toHaveBeenCalledWith(card);
  });

  it('udostępnia gotowy plik PNG przez Web Share', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });

    const { user, dialog } = await openCard();
    await user.click(await within(dialog).findByRole('button', { name: 'Udostępnij' }));
    const [data] = share.mock.calls[0]!;
    expect(data.title).toBe('Espresso tonic');
    expect(data.files[0]).toBeInstanceOf(File);
    expect(data.files[0].name).toBe('espresso-tonic.png');
    expect(data.files[0].type).toBe('image/png');
  });

  it('bez udostępniania plików: zapis obrazka', async () => {
    const createObjectURL = vi.fn(() => 'blob:karta');
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const { user, dialog } = await openCard();
    const save = within(dialog).getByRole('button', { name: /Przygotowuję|Zapisz obrazek/ });
    await waitFor(() => expect(save).toHaveTextContent('Zapisz obrazek'));
    expect(within(dialog).queryByRole('button', { name: 'Udostępnij' })).not.toBeInTheDocument();

    await user.click(save);
    expect(click).toHaveBeenCalledTimes(1);
    expect((createObjectURL.mock.calls[0] as unknown as [File])[0].name).toBe('espresso-tonic.png');
  });

  it('błąd przygotowania obrazka jest pokazany', async () => {
    toPng.mockRejectedValue(new Error('brak kanwy'));
    const { dialog } = await openCard();
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Nie udało się przygotować obrazka');
  });

  it('„wstecz” zamyka okno', async () => {
    const { router } = await openCard();
    await router.navigate(-1);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(currentUrl(router)).toBe('/napoje/espresso-tonic');
  });
});
