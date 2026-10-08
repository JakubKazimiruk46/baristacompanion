import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { drinks, getDrink, type VesselId } from '../../data';
import { DrinkGlass } from './DrinkGlass';

function renderGlass(id: string) {
  const drink = getDrink(id)!;
  const { container } = render(<DrinkGlass drink={drink} />);
  const svg = container.querySelector('svg')!;
  const layers = [...svg.querySelectorAll('[data-layer]')].map((g) => ({
    name: g.getAttribute('data-layer'),
    kind: g.getAttribute('data-kind'),
  }));
  return { svg, layers, ice: svg.querySelectorAll('[data-ice]').length };
}

describe('<DrinkGlass>', () => {
  it('latte macchiato: mleko, kawa, pianka w wysokiej szklance', () => {
    const { svg, layers, ice } = renderGlass('latte-macchiato');
    expect(svg).toHaveAttribute('data-vessel', 'tall-glass');
    expect(layers).toEqual([
      { name: 'gorące mleko', kind: 'liquid' },
      { name: 'kawa', kind: 'liquid' },
      { name: 'pianka', kind: 'foam' },
    ]);
    expect(ice).toBe(0);
  });

  it('café bombón: mleko skondensowane i kawa w małej szklance', () => {
    const { svg, layers } = renderGlass('cafe-bombon');
    expect(svg).toHaveAttribute('data-vessel', 'small-glass');
    expect(layers.map((l) => l.name)).toEqual(['mleko skondensowane', 'kawa']);
  });

  it('espresso tonic: tonik z lodem i kawa, kostki lodu osobno', () => {
    const { svg, layers, ice } = renderGlass('espresso-tonic');
    expect(svg).toHaveAttribute('data-vessel', 'tall-glass');
    expect(layers.map((l) => l.name)).toEqual(['tonik z lodem', 'kawa']);
    expect(ice).toBeGreaterThan(0);
  });

  it('ma dostępny opis z warstwami od dołu', () => {
    render(<DrinkGlass drink={getDrink('latte-macchiato')!} />);
    expect(
      screen.getByRole('img', {
        name: 'Latte macchiato, wysoka szklanka. Warstwy od dołu: gorące mleko 150 ml, kawa 40 ml, pianka 60 ml.',
      }),
    ).toBeInTheDocument();
  });

  it('podpisuje każdą warstwę nazwą i objętością', () => {
    const { svg } = renderGlass('mocha');
    const labels = [...svg.querySelectorAll('text')].map((t) =>
      [...t.querySelectorAll('tspan')].map((s) => s.textContent).join(' '),
    );
    expect(labels).toEqual([
      'sos czekoladowy 20 ml',
      'kawa z mlekiem i czekoladą 190 ml',
      'pianka 40 ml',
    ]);
  });

  describe('dekoracje', () => {
    const decorationsOf = (id: string) =>
      [...renderGlass(id).svg.querySelectorAll('[data-decoration]')].map(
        (g) => [g.getAttribute('data-decoration'), g.getAttribute('data-look')].filter(Boolean).join(':'),
      );

    it('mocha: czekoladowe wzory na ściankach i starta czekolada', () => {
      expect(decorationsOf('mocha')).toEqual(['wall-pattern', 'topping:pieces']);
    });

    it('kawa pomarańczowa: obtoczony brzeg i plaster pomarańczy', () => {
      expect(decorationsOf('kawa-pomaranczowa')).toEqual(['rim', 'garnish:slice']);
    });

    it('latte waniliowe: posypka z kakao', () => {
      expect(decorationsOf('latte-waniliowe')).toEqual(['topping:dust']);
    });

    it('wzór na ściankach rysuje smugi, a plaster ma cząstki', () => {
      const mocha = renderGlass('mocha').svg.querySelector('[data-decoration="wall-pattern"]')!;
      expect(mocha.querySelectorAll('path').length).toBeGreaterThan(5);
      const orange = renderGlass('kawa-pomaranczowa').svg.querySelector('[data-decoration="garnish"]')!;
      expect(orange.querySelectorAll('line')).toHaveLength(8);
    });
  });

  it('miniatura jest ukryta przed czytnikiem ekranu i nie ma podpisów', () => {
    const { container } = render(<DrinkGlass drink={getDrink('mocha')!} variant="thumb" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg.querySelector('text')).toBeNull();
  });

  it.each(drinks.map((d) => [d.id, d.serving.vessel] as [string, VesselId]))(
    '%s rysuje się we właściwym naczyniu (%s)',
    (id, vessel) => {
      const { svg, layers } = renderGlass(id);
      expect(svg).toHaveAttribute('data-vessel', vessel);
      expect(layers).toHaveLength(getDrink(id)!.layers.length);
    },
  );
});
