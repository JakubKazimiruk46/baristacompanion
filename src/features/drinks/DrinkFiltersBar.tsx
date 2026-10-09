import { Chip } from '../../components/Chip';
import { ColdIcon, HeartIcon, HotIcon, LeafIcon, PantryIcon } from '../../components/icons';
import { TIME_LIMITS, type DrinkFilters } from './filters';

type DrinkFiltersBarProps = {
  filters: DrinkFilters;
  onChange: (filters: DrinkFilters) => void;
  /** Filtr „Moje napoje” tylko wtedy, gdy jakieś są. */
  showMine?: boolean;
};

/** Każda grupa działa jak przełącznik: drugi tap w aktywny chip go wyłącza. */
export function DrinkFiltersBar({ filters, onChange, showMine = false }: DrinkFiltersBarProps) {
  const toggle = <K extends keyof DrinkFilters>(key: K, value: DrinkFilters[K]) =>
    onChange({ ...filters, [key]: filters[key] === value ? undefined : value });

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      <div className="flex gap-2">
        <Chip pressed={filters.available === true} onClick={() => toggle('available', true)}>
          <PantryIcon className="size-4" />
          Mogę zrobić
        </Chip>
        <Chip pressed={filters.favorites === true} onClick={() => toggle('favorites', true)}>
          <HeartIcon className="size-4" fill={filters.favorites ? 'currentColor' : 'none'} />
          Ulubione
        </Chip>
        {(showMine || filters.mine) && (
          <Chip pressed={filters.mine === true} onClick={() => toggle('mine', true)}>
            Moje napoje
          </Chip>
        )}
      </div>
      <div role="group" aria-label="Temperatura" className="flex gap-2">
        <Chip pressed={filters.temperature === 'hot'} onClick={() => toggle('temperature', 'hot')}>
          <HotIcon className="size-4" />
          Na ciepło
        </Chip>
        <Chip pressed={filters.temperature === 'cold'} onClick={() => toggle('temperature', 'cold')}>
          <ColdIcon className="size-4" />
          Na zimno
        </Chip>
      </div>
      <div role="group" aria-label="Mleko" className="flex gap-2">
        <Chip pressed={filters.milk === 'with'} onClick={() => toggle('milk', 'with')}>
          Z mlekiem
        </Chip>
        <Chip pressed={filters.milk === 'without'} onClick={() => toggle('milk', 'without')}>
          Bez mleka
        </Chip>
      </div>
      <div className="flex gap-2">
        <Chip pressed={filters.plantBased === true} onClick={() => toggle('plantBased', true)}>
          <LeafIcon className="size-4" />
          Wersja roślinna
        </Chip>
        <Chip pressed={filters.noAlcohol === true} onClick={() => toggle('noAlcohol', true)}>
          Bez alkoholu
        </Chip>
      </div>
      <div role="group" aria-label="Czas przygotowania" className="flex gap-2">
        {TIME_LIMITS.map((limit) => (
          <Chip
            key={limit}
            pressed={filters.maxTimeMin === limit}
            onClick={() => toggle('maxTimeMin', limit)}
          >
            do {limit} min
          </Chip>
        ))}
      </div>
    </div>
  );
}
