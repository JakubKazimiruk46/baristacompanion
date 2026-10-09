/**
 * Losowanie napoju (lub czegokolwiek z listy). Gdy jest z czego wybierać, nie powtarza tego, co
 * jest na ekranie, żeby „Losuj jeszcze raz” zawsze coś zmieniało. random: dla testów.
 */
export function pickRandom<T extends { id: string }>(
  list: readonly T[],
  exceptId?: string,
  random: () => number = Math.random,
): T | undefined {
  const pool = list.length > 1 ? list.filter((item) => item.id !== exceptId) : list;
  if (pool.length === 0) return undefined;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}
