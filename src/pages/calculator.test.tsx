import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DOSES_KEY, dosesStore } from '../features/brewing/doseStore';
import { currentUrl, renderApp } from '../test/renderApp';

beforeEach(() => {
  localStorage.clear();
  dosesStore.reset();
});

const calculator = () => screen.getByRole('region', { name: 'Ile zaparzyć' });
const result = (label: 'Kawa' | 'Woda') =>
  within(calculator()).getByText(label, { selector: 'dt' }).nextElementSibling?.textContent;

describe('kalkulator ilości na ekranie metody', () => {
  it('liczba osób przelicza kawę, wodę i kroki', async () => {
    const { user } = renderApp('/parzenie/prasa-francuska');
    expect(within(calculator()).getByRole('status')).toHaveTextContent('2 osoby');
    expect(result('Kawa')).toBe('30 g');

    await user.click(screen.getByRole('button', { name: 'Więcej osób' }));
    expect(within(calculator()).getByRole('status')).toHaveTextContent('3 osoby');
    expect(result('Kawa')).toBe('45 g');
    expect(result('Woda')).toBe('750 ml');

    const steps = screen.getByRole('region', { name: 'Kroki' });
    expect(within(steps).getByText('Wsyp 45 g grubo zmielonej kawy do dzbanka')).toBeInTheDocument();
    expect(within(steps).getByText('Zalej 750 ml wody')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(DOSES_KEY)!)).toEqual({ 'prasa-francuska': 750 });
  });

  it('mililitry co krok sprzętu, w jego granicach, i powrót do przepisu', async () => {
    const { user } = renderApp('/parzenie/aeropress');
    await user.click(screen.getByLabelText('mililitrów'));
    expect(within(calculator()).getByRole('status')).toHaveTextContent('200 ml');

    await user.click(screen.getByRole('button', { name: 'Więcej wody' }));
    expect(result('Woda')).toBe('225 ml');
    await user.click(screen.getByRole('button', { name: 'Więcej wody' }));
    expect(result('Woda')).toBe('250 ml');
    expect(screen.getByRole('button', { name: 'Więcej wody' })).toBeDisabled();
    expect(result('Kawa')).toBe('19 g');

    await user.click(screen.getByRole('button', { name: 'Wróć do przepisu (200 ml)' }));
    expect(result('Woda')).toBe('200 ml');
    expect(result('Kawa')).toBe('15 g');
  });

  it('kawiarka: zamiast osób wybiera się rozmiar', async () => {
    const { user } = renderApp('/parzenie/kawiarka');
    const sizes = screen.getByRole('group', { name: 'Rozmiar kawiarki' });
    expect(within(sizes).getByLabelText('na 3 filiżanki')).toBeChecked();

    await user.click(within(sizes).getByLabelText('na 6 filiżanek'));
    expect(result('Kawa')).toBe('34 g');
    expect(result('Woda')).toBe('300 ml');
    expect(screen.getByText(/Ok\. 34 g: do pełna/)).toBeInTheDocument();
  });

  it('prowadzone parzenie używa wybranej ilości', async () => {
    dosesStore.set('drip', 500);
    const { user } = renderApp('/parzenie/drip/start');
    expect(screen.getByText('30 g kawy · 500 ml wody')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dalej' }));
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Wsyp 30 g kawy i wyrównaj');
    await user.click(screen.getByRole('button', { name: 'Dalej' }));
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Zalej 80 ml wody i odczekaj');
  });
});

describe('porcje napoju', () => {
  it('mnożą bazę, mleko, syropy i dodatki, z odmianą jednostek', async () => {
    const { user, router } = renderApp('/napoje/espresso-tonic');
    const ingredients = screen.getByRole('region', { name: 'Składniki' });
    expect(within(ingredients).getByText('50 ml')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Więcej porcji' }));
    expect(within(ingredients).getByRole('status')).toHaveTextContent('2 porcje');
    expect(within(ingredients).getByText('100 ml')).toBeInTheDocument();
    expect(within(ingredients).getByText('300 ml')).toBeInTheDocument();
    expect(within(ingredients).getByText('8–10 kostek')).toBeInTheDocument();
    expect(currentUrl(router)).toBe('/napoje/espresso-tonic?porcje=2');
    expect(screen.getByText(/Kroki opisują jedną porcję/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mniej porcji' }));
    expect(currentUrl(router)).toBe('/napoje/espresso-tonic');
    expect(screen.queryByText(/Kroki opisują jedną porcję/)).not.toBeInTheDocument();
  });

  it('porcje z adresu: mleko i syrop', () => {
    renderApp('/napoje/latte-waniliowe?porcje=3');
    const ingredients = screen.getByRole('region', { name: 'Składniki' });
    expect(within(ingredients).getByText('660 ml')).toBeInTheDocument(); // mleko 220 × 3
    expect(within(ingredients).getByText('45 ml')).toBeInTheDocument(); // syrop 15 × 3
  });

  it('błędna liczba porcji w adresie to 1 porcja', () => {
    renderApp('/napoje/espresso-tonic?porcje=99');
    expect(screen.getByRole('status')).toHaveTextContent('1 porcja');
  });
});
