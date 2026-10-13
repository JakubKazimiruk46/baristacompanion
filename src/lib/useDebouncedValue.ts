import { useEffect, useState } from 'react';

/** Wartość, która dogania `value` dopiero po `delayMs` bez zmian (np. wyszukiwanie na serwerze przy pisaniu). */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
