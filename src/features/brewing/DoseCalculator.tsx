import { useState } from 'react';
import { ChoiceChip } from '../../components/ChoiceChip';
import { Stepper } from '../../components/Stepper';
import type { BrewMethod } from '../../data';
import { count } from '../../lib/format';
import { clampWater, doseFor, formatGrams, maxPeople, peopleFor, waterForPeople } from './dose';
import { dosesStore, useWaterMl } from './doseStore';

type Mode = 'people' | 'ml';

const PEOPLE: [string, string, string] = ['osoba', 'osoby', 'osób'];

/**
 * Ile zaparzyć: liczba osób albo mililitry wody (w kawiarce rozmiar). Wybór zapisuje się dla
 * metody (albo własnego przepisu: doseKey), więc prowadzone parzenie pokazuje te same ilości.
 */
export function DoseCalculator({ method, doseKey = method.id }: { method: BrewMethod; doseKey?: string }) {
  const waterMl = useWaterMl(method, doseKey);
  const [mode, setMode] = useState<Mode>('people');
  const { scaling } = method;
  const dose = doseFor(method, waterMl);
  const set = (ml: number) => dosesStore.set(doseKey, clampWater(method, ml));

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      {scaling.sizes ? (
        <fieldset>
          <legend className="text-sm font-medium text-ink-muted">Rozmiar kawiarki</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {scaling.sizes.map((size) => (
              <ChoiceChip
                key={size.waterMl}
                type="radio"
                name={`${doseKey}-size`}
                checked={waterMl === size.waterMl}
                onChange={() => set(size.waterMl)}
              >
                {size.label}
              </ChoiceChip>
            ))}
          </div>
        </fieldset>
      ) : (
        <>
          <fieldset>
            <legend className="text-sm font-medium text-ink-muted">Licz według</legend>
            <div className="mt-2 flex gap-2">
              <ChoiceChip type="radio" name={`${doseKey}-mode`} checked={mode === 'people'} onChange={() => setMode('people')}>
                liczby osób
              </ChoiceChip>
              <ChoiceChip type="radio" name={`${doseKey}-mode`} checked={mode === 'ml'} onChange={() => setMode('ml')}>
                mililitrów
              </ChoiceChip>
            </div>
          </fieldset>
          <div className="mt-4 flex justify-center">
            {mode === 'people' ? <PeopleStepper method={method} waterMl={waterMl} onChange={set} /> : (
              <Stepper
                label="Ilość wody"
                value={`${waterMl} ml`}
                onDecrement={() => set(waterMl - scaling.stepMl)}
                onIncrement={() => set(waterMl + scaling.stepMl)}
                canDecrement={waterMl > scaling.waterMl.min}
                canIncrement={waterMl < scaling.waterMl.max}
                decrementLabel="Mniej wody"
                incrementLabel="Więcej wody"
              />
            )}
          </div>
        </>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl bg-accent-soft p-3">
          <dt className="text-xs font-medium">Kawa</dt>
          <dd className="font-sans text-2xl font-semibold tabular-nums">{formatGrams(dose.coffeeG)} g</dd>
        </div>
        <div className="rounded-xl bg-accent-soft p-3">
          <dt className="text-xs font-medium">Woda</dt>
          <dd className="font-sans text-2xl font-semibold tabular-nums">{dose.waterMl} ml</dd>
        </div>
      </dl>

      {scaling.note && <p className="mt-3 text-sm text-ink-muted">{scaling.note}</p>}

      {waterMl !== method.dose.waterMl && (
        <button
          type="button"
          onClick={() => dosesStore.clear(doseKey)}
          className="mt-2 inline-flex h-10 items-center text-sm font-medium text-accent"
        >
          Wróć do przepisu ({method.dose.waterMl} ml)
        </button>
      )}
    </div>
  );
}

function PeopleStepper({
  method,
  waterMl,
  onChange,
}: {
  method: BrewMethod;
  waterMl: number;
  onChange: (waterMl: number) => void;
}) {
  const people = peopleFor(method, waterMl);
  const max = maxPeople(method);
  // Ilość ustawiona w mililitrach nie musi równo dzielić się na osoby.
  const exact = waterForPeople(method, people) === waterMl;
  return (
    <Stepper
      label="Liczba osób"
      value={`${exact ? '' : 'ok. '}${count(people, PEOPLE)}`}
      onDecrement={() => onChange(waterForPeople(method, people - 1))}
      onIncrement={() => onChange(waterForPeople(method, people + 1))}
      canDecrement={people > 1}
      canIncrement={people < max}
      decrementLabel="Mniej osób"
      incrementLabel="Więcej osób"
    />
  );
}
