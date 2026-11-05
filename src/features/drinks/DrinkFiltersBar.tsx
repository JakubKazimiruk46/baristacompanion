import { useState, type ReactNode } from 'react';
import { Chip } from '../../components/Chip';
import { BookmarkIcon, CloseIcon, ColdIcon, HeartIcon, HotIcon, LeafIcon, PantryIcon } from '../../components/icons';
import { count } from '../../lib/format';
import { TIME_LIMITS, type DrinkFilters } from './filters';

type Toggle = <K extends keyof DrinkFilters>(filters: DrinkFilters, key: K, value: DrinkFilters[K]) => DrinkFilters;

/** Drugi tap w aktywny chip go wyłącza; w grupie (temperatura, mleko, czas) działa jeden wybór. */
const toggle: Toggle = (filters, key, value) => ({ ...filters, [key]: filters[key] === value ? undefined : value });

const chip = 'shrink-0 whitespace-nowrap';

type QuickFiltersProps = {
  filters: DrinkFilters;
  onChange: (filters: DrinkFilters) => void;
  /** Filtr „Moje napoje” tylko wtedy, gdy jakieś są. */
  showMine?: boolean;
};

/** Najczęstsze filtry w jednym rzędzie, przewijanym w bok (nie zajmują pół ekranu). */
export function QuickFilters({ filters, onChange, showMine = false }: QuickFiltersProps) {
  const set = <K extends keyof DrinkFilters>(key: K, value: DrinkFilters[K]) => onChange(toggle(filters, key, value));
  return (
    <div
      role="group"
      aria-label="Szybkie filtry"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <Chip className={chip} pressed={filters.available === true} onClick={() => set('available', true)}>
        <PantryIcon className="size-4" />
        Mogę zrobić
      </Chip>
      <div role="group" aria-label="Temperatura" className="flex shrink-0 gap-2">
        <Chip className={chip} pressed={filters.temperature === 'hot'} onClick={() => set('temperature', 'hot')}>
          <HotIcon className="size-4" />
          Na ciepło
        </Chip>
        <Chip className={chip} pressed={filters.temperature === 'cold'} onClick={() => set('temperature', 'cold')}>
          <ColdIcon className="size-4" />
          Na zimno
        </Chip>
      </div>
      <Chip className={chip} pressed={filters.favorites === true} onClick={() => set('favorites', true)}>
        <HeartIcon className="size-4" fill={filters.favorites ? 'currentColor' : 'none'} />
        Ulubione
      </Chip>
      <Chip className={chip} pressed={filters.toTry === true} onClick={() => set('toTry', true)}>
        <BookmarkIcon className="size-4" fill={filters.toTry ? 'currentColor' : 'none'} />
        Do spróbowania
      </Chip>
      {(showMine || filters.mine) && (
        <Chip className={chip} pressed={filters.mine === true} onClick={() => set('mine', true)}>
          Moje napoje
        </Chip>
      )}
    </div>
  );
}

/** Nazwy filtrów z okna, np. do pigułek „Bez mleka ×” nad listą. */
export function sheetFilterLabels(filters: DrinkFilters): { label: string; clear: DrinkFilters }[] {
  const labels: { label: string; clear: DrinkFilters }[] = [];
  if (filters.milk) labels.push({ label: filters.milk === 'with' ? 'Z mlekiem' : 'Bez mleka', clear: { ...filters, milk: undefined } });
  if (filters.plantBased) labels.push({ label: 'Wersja roślinna', clear: { ...filters, plantBased: undefined } });
  if (filters.noAlcohol) labels.push({ label: 'Bez alkoholu', clear: { ...filters, noAlcohol: undefined } });
  if (filters.maxTimeMin) labels.push({ label: `Do ${filters.maxTimeMin} min`, clear: { ...filters, maxTimeMin: undefined } });
  return labels;
}

/** Włączone filtry z okna jako pigułki: widać je bez otwierania okna, a tap je zdejmuje. */
export function ActiveFilterPills({ filters, onChange }: { filters: DrinkFilters; onChange: (filters: DrinkFilters) => void }) {
  const labels = sheetFilterLabels(filters);
  if (labels.length === 0) return null;
  return (
    <ul aria-label="Włączone filtry" className="flex flex-wrap gap-2">
      {labels.map(({ label, clear }) => (
        <li key={label}>
          <button
            type="button"
            onClick={() => onChange(clear)}
            className="inline-flex h-10 items-center gap-1 rounded-full bg-accent-soft pr-2 pl-4 text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {label}
            <CloseIcon className="size-4" />
            <span className="sr-only">: usuń filtr</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

type FilterSheetBodyProps = {
  initial: DrinkFilters;
  /** Ile napojów zostanie przy tych filtrach (na przycisku). */
  countFor: (filters: DrinkFilters) => number;
  onApply: (filters: DrinkFilters) => void;
};

/**
 * Treść okna „Filtry”. Zmiany są szkicem do „Pokaż”: gest „wstecz” zamyka okno bez zmian,
 * a przycisk mówi, ile napojów zostanie.
 */
export function FilterSheetBody({ initial, countFor, onApply }: FilterSheetBodyProps) {
  const [draft, setDraft] = useState(initial);
  const set = <K extends keyof DrinkFilters>(key: K, value: DrinkFilters[K]) => setDraft((d) => toggle(d, key, value));
  const results = countFor(draft);

  return (
    <div className="space-y-6">
      <Group label="Mleko">
        <Chip pressed={draft.milk === 'with'} onClick={() => set('milk', 'with')}>
          Z mlekiem
        </Chip>
        <Chip pressed={draft.milk === 'without'} onClick={() => set('milk', 'without')}>
          Bez mleka
        </Chip>
      </Group>
      <Group label="Dieta">
        <Chip pressed={draft.plantBased === true} onClick={() => set('plantBased', true)}>
          <LeafIcon className="size-4" />
          Wersja roślinna
        </Chip>
        <Chip pressed={draft.noAlcohol === true} onClick={() => set('noAlcohol', true)}>
          Bez alkoholu
        </Chip>
      </Group>
      <Group label="Czas przygotowania">
        {TIME_LIMITS.map((limit) => (
          <Chip key={limit} pressed={draft.maxTimeMin === limit} onClick={() => set('maxTimeMin', limit)}>
            do {limit} min
          </Chip>
        ))}
      </Group>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => setDraft((d) => ({ ...d, milk: undefined, plantBased: undefined, noAlcohol: undefined, maxTimeMin: undefined }))}
          className="flex h-12 items-center justify-center rounded-full border border-line bg-surface px-5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Wyczyść
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-accent px-5 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Pokaż {count(results, ['napój', 'napoje', 'napojów'])}
        </button>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <p aria-hidden="true" className="mb-2 font-medium">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
