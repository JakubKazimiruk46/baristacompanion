import { describe, expect, it } from 'vitest';
import { getMethod, methods } from '../../data';
import {
  clampWater,
  doseFor,
  fillAmounts,
  maxPeople,
  peopleFor,
  roundCoffee,
  roundWater,
  scaleMethod,
  waterForPeople,
} from './dose';

const method = (id: string) => getMethod(id)!;
const texts = (id: string, waterMl?: number) =>
  scaleMethod(method(id), waterMl).steps.flatMap((step) => [step.text, step.detail ?? '']);

describe('zaokrąglanie', () => {
  it('kawa: poniżej 10 g co pół grama, wyżej w pełnych gramach', () => {
    expect(roundCoffee(5.67)).toBe(5.5);
    expect(roundCoffee(7.4)).toBe(7.5);
    expect(roundCoffee(18.75)).toBe(19);
  });

  it('woda w krokach co 5 ml', () => {
    expect(roundWater(48)).toBe(50);
    expect(roundWater(40)).toBe(40);
    expect(roundWater(36)).toBe(35);
  });
});

describe('znaczniki ilości', () => {
  it('podstawia kawę, wodę i część wody', () => {
    const dose = { coffeeG: 5.5, waterMl: 300 };
    expect(fillAmounts('Wsyp {coffee} g i zalej {water*0.16} ml, potem do {water} ml', dose)).toBe(
      'Wsyp 5,5 g i zalej 50 ml, potem do 300 ml',
    );
  });

  it.each(methods.map((m) => [m.id] as const))('%s: po przeliczeniu nie zostaje żaden znacznik', (id) => {
    const m = method(id);
    for (const water of [m.dose.waterMl, m.scaling.waterMl.min, m.scaling.waterMl.max]) {
      for (const text of texts(id, water)) expect(text).not.toMatch(/[{}]/);
    }
  });

  it('ilość z przepisu daje liczby z przepisu', () => {
    expect(texts('drip')).toEqual(
      expect.arrayContaining(['Wsyp 15 g kawy i wyrównaj', 'Zalej 40 ml wody i odczekaj', 'Dolej resztę do 250 ml']),
    );
    expect(texts('prasa-francuska')).toContain('Wsyp 30 g grubo zmielonej kawy do dzbanka');
    expect(scaleMethod(method('kawiarka')).dose).toEqual({ coffeeG: 17, waterMl: 150 });
  });

  it('drip na 500 ml: dwa razy więcej kawy i wody w każdym nalaniu', () => {
    expect(texts('drip', 500)).toEqual(
      expect.arrayContaining([
        'Wsyp 30 g kawy i wyrównaj',
        'Zalej 80 ml wody i odczekaj',
        'Dolewaj powoli wodę do 300 ml',
        'Dolej resztę do 500 ml',
      ]),
    );
  });

  it('kroki bez ilości i czasy zostają bez zmian', () => {
    const base = method('prasa-francuska');
    const scaled = scaleMethod(base, 1000);
    expect(scaled.steps.map((s) => s.durationSec)).toEqual(base.steps.map((s) => s.durationSec));
    expect(scaled.steps[4]!.text).toBe(base.steps[4]!.text);
  });
});

describe('dawka i osoby', () => {
  it('kawa z proporcji metody', () => {
    expect(doseFor(method('kawiarka'), 300)).toEqual({ coffeeG: 34, waterMl: 300 });
    expect(doseFor(method('aeropress'), 100)).toEqual({ coffeeG: 7.5, waterMl: 100 });
  });

  it('ilość wody mieści się w sprzęcie', () => {
    expect(clampWater(method('aeropress'), 400)).toBe(250);
    expect(clampWater(method('chemex'), 100)).toBe(300);
    expect(scaleMethod(method('aeropress'), 400).dose.waterMl).toBe(250);
  });

  it('osoby: prasa na 2 osoby to 500 ml, najwyżej 4 osoby', () => {
    const press = method('prasa-francuska');
    expect(peopleFor(press, 500)).toBe(2);
    expect(waterForPeople(press, 3)).toBe(750);
    expect(maxPeople(press)).toBe(4);
    expect(waterForPeople(press, 9)).toBe(1000);
  });

  it('zawsze co najmniej jedna osoba', () => {
    expect(peopleFor(method('aeropress'), 100)).toBe(1);
    expect(maxPeople(method('zalewajka'))).toBe(1);
  });
});
