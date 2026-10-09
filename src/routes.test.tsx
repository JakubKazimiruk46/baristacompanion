import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mainNav, renderApp } from './test/renderApp';

describe('dolna nawigacja', () => {
  it('pod / jest ekran startowy z jednym głównym przyciskiem', () => {
    renderApp('/');

    expect(screen.getByRole('heading', { level: 1, name: 'Barista Companion' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mam kawę. Co z nią zrobić?' })).toHaveAttribute(
      'href',
      '/mam-kawe',
    );
    expect(within(mainNav()).getByRole('link', { name: 'Start' })).toHaveAttribute('aria-current', 'page');
    expect(within(mainNav()).getByRole('link', { name: 'Napoje' })).not.toHaveAttribute('aria-current');
  });

  it('przełącza zakładki', async () => {
    const { user } = renderApp('/');

    await user.click(within(mainNav()).getByRole('link', { name: 'Napoje' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Napoje' })).toBeInTheDocument();
    expect(within(mainNav()).getByRole('link', { name: 'Start' })).not.toHaveAttribute('aria-current');

    await user.click(within(mainNav()).getByRole('link', { name: 'Parzenie' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Parzenie' })).toBeInTheDocument();
    expect(within(mainNav()).getByRole('link', { name: 'Parzenie' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(mainNav()).getByRole('link', { name: 'Napoje' })).not.toHaveAttribute(
      'aria-current',
    );

    await user.click(within(mainNav()).getByRole('link', { name: 'Baribar' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Baribar' })).toBeInTheDocument();
  });

  it('podstrona zostawia podświetloną zakładkę', () => {
    renderApp('/napoje/espresso-tonic');
    expect(within(mainNav()).getByRole('link', { name: 'Napoje' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('po zmianie ekranu fokus trafia na nagłówek (dla czytnika ekranu i klawiatury)', async () => {
    const { user } = renderApp('/');
    await user.click(within(mainNav()).getByRole('link', { name: 'Parzenie' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Parzenie' }));
  });

  it('ziarna należą do Baribaru, a stare adresy tam prowadzą', () => {
    const { router } = renderApp('/ziarna');
    expect(router.state.location.pathname).toBe('/baribar');
    expect(within(mainNav()).getByRole('link', { name: 'Baribar' })).toHaveAttribute('aria-current', 'page');
    router.dispose();
  });

  it('ścieżka „Mam kawę” należy do zakładki Start', () => {
    renderApp('/mam-kawe');
    expect(within(mainNav()).getByRole('link', { name: 'Start' })).toHaveAttribute('aria-current', 'page');
  });

  it('nieznany adres pokazuje stronę z powrotem do napojów', async () => {
    const { user } = renderApp('/nie-ma-takiej');

    expect(screen.getByRole('heading', { level: 1, name: 'Nie ma takiej strony' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Wróć do napojów' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Napoje' })).toBeInTheDocument();
  });
});
