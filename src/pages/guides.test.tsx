import { act, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { frothingMethods, milks, syrups } from '../data';
import { currentUrl, renderApp } from '../test/renderApp';

describe.each([
  ['kawa-malinowa', 'Syrop malinowy'],
  ['kawa-pomaranczowa', 'Syrop pomarańczowy'],
  ['latte-waniliowe', 'Syrop waniliowy'],
])('%s', (drinkId, syrupName) => {
  it('przepis na syrop: 1 tapnięcie', async () => {
    const { user } = renderApp(`/napoje/${drinkId}`);
    await user.click(screen.getByRole('button', { name: new RegExp(syrupName) }));

    const dialog = screen.getByRole('dialog', { name: syrupName });
    expect(within(dialog).getByRole('heading', { name: 'Kup' })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Zrób sam' })).toBeInTheDocument();
  });

  it('poradnik spieniania: najwyżej 2 tapnięcia', async () => {
    const { user } = renderApp(`/napoje/${drinkId}`);
    let taps = 0;

    const direct = screen.queryByRole('link', { name: 'Jak spienić?' });
    if (direct) {
      await user.click(direct);
      taps = 1;
    } else {
      // Bez spienianego mleka: wstecz do Napojów, a tam skrót do poradnika.
      await user.click(screen.getByRole('link', { name: 'Napoje', current: false }));
      await user.click(screen.getByRole('link', { name: 'Spienianie' }));
      taps = 2;
    }

    expect(screen.getByRole('heading', { level: 1, name: 'Spienianie mleka' })).toBeInTheDocument();
    expect(taps).toBeLessThanOrEqual(2);
  });
});

describe('okno syropu', () => {
  it('zamyka się przyciskiem i zdejmuje parametr z adresu', async () => {
    const { user, router } = renderApp('/napoje/latte-waniliowe');
    await user.click(screen.getByRole('button', { name: /Syrop waniliowy/ }));
    expect(currentUrl(router)).toBe('/napoje/latte-waniliowe?syrop=waniliowy');

    await user.click(screen.getByRole('button', { name: 'Zamknij' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(currentUrl(router)).toBe('/napoje/latte-waniliowe');
  });

  it('gest „wstecz” zamyka okno', async () => {
    const { user, router } = renderApp('/napoje/latte-waniliowe');
    await user.click(screen.getByRole('button', { name: /Syrop waniliowy/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await act(() => router.navigate(-1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Latte waniliowe' })).toBeInTheDocument();
  });

  it('otwiera się z linku z parametrem', () => {
    renderApp('/napoje/kawa-pomaranczowa?syrop=pomaranczowy');
    expect(screen.getByRole('dialog', { name: 'Syrop pomarańczowy' })).toBeInTheDocument();
  });
});

describe('poradniki', () => {
  it('mleko: wszystkie rodzaje i podpowiedź z syropem', () => {
    renderApp('/napoje/mleko');
    for (const milk of milks) expect(screen.getByRole('heading', { name: milk.name })).toBeInTheDocument();
    expect(screen.getByText(/Mleko smakowe\? Zwykłe plus syrop/)).toBeInTheDocument();
  });

  it('spienianie: każda metoda ma kroki, temperaturę i efekt', () => {
    renderApp('/napoje/spienianie');
    for (const method of frothingMethods) {
      const section = screen.getByRole('region', { name: method.name });
      expect(within(section).getAllByRole('listitem').length).toBeGreaterThan(method.steps.length);
      expect(within(section).getByText(`mleko ${method.milkTempC.min}–${method.milkTempC.max}°C`)).toBeInTheDocument();
      expect(within(section).getByText(method.result)).toBeInTheDocument();
    }
    expect(screen.getByText('Czy metoda ma znaczenie?')).toBeInTheDocument();
  });

  it('syropy: każdy z przepisem', () => {
    renderApp('/napoje/syropy');
    for (const syrup of syrups) expect(screen.getByText(syrup.name)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Zrób sam' })).toHaveLength(syrups.length);
  });

  it('napój z miksowanymi dodatkami przypomina o schłodzeniu kawy', () => {
    renderApp('/napoje/kawa-malinowa');
    expect(screen.getByText('Schłodź kawę przed dodaniem.')).toBeInTheDocument();
  });
});
