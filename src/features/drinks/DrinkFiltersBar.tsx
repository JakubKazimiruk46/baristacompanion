import { Chip } from '../../components/Chip';
import { ColdIcon, HotIcon, LeafIcon } from '../../components/icons';
import { TIME_LIMITS, type DrinkFilters } from './filters';

type DrinkFiltersBarProps = {
  filters: DrinkFilters;
  onChange: (filters: DrinkFilters) => void;
};

/** Każda grupa działa jak przełącznik: drugi tap w aktywny chip go wyłącza. */
export function DrinkFiltersBar({ filters, onChange }: DrinkFiltersBarProps) {
  const toggle = <K extends keyof DrinkFilters>(key: K, value: DrinkFilters[K]) =>
    onChange({ ...filters, [key]: filters[key] === value ? undefined : value });

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
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
      <Chip pressed={filters.plantBased === true} onClick={() => toggle('plantBased', true)}>
        <LeafIcon className="size-4" />
        Wersja roślinna
      </Chip>
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
