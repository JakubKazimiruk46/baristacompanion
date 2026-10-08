import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/renderApp';

describe('zamienniki składników', () => {
  it('przy dodatku: czym zastąpić i co się zmieni', () => {
    renderApp('/napoje/espresso-tonic');
    const ingredients = screen.getByRole('region', { name: 'Składniki' });
    const tonic = within(ingredients).getByText('Tonik, dobrze schłodzony').closest('li')!;
    expect(tonic).toHaveTextContent('Zamiennik: woda gazowana. Bez goryczki toniku wyjdzie łagodniej.');
  });

  it('kilka dodatków z zamiennikami w jednym napoju', () => {
    renderApp('/napoje/bicerin');
    const ingredients = screen.getByRole('region', { name: 'Składniki' });
    expect(within(ingredients).getByText(/Zamiennik: kakao\./)).toBeInTheDocument();
    // Śmietanka nie ma zamiennika (napój nie ma wersji roślinnej).
    const cream = within(ingredients).getByText(/^Śmietanka 30%/).closest('li')!;
    expect(cream).not.toHaveTextContent('Zamiennik');
  });

  it('okno syropu podpowiada zamiennik zamiast kupowania i robienia', async () => {
    const { user } = renderApp('/napoje/mocha');
    await user.click(screen.getByRole('button', { name: /Sos czekoladowy/ }));
    const dialog = screen.getByRole('dialog', { name: 'Sos czekoladowy' });
    const section = within(dialog).getByRole('heading', { name: 'Albo zamień' }).closest('section')!;
    expect(section).toHaveTextContent('Kakao:');
    expect(section).toHaveTextContent('Gorzka czekolada: Rozpuść 20 g czekolady w gorącej kawie.');
  });
});
