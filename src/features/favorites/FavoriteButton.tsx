import { HeartIcon } from '../../components/icons';
import { favoritesStore, useFavorites } from './store';

/** Przełącznik „Ulubiony” na ekranie napoju. Stan niesie aria-pressed, więc nazwa się nie zmienia. */
export function FavoriteButton({ drinkId }: { drinkId: string }) {
  const favorite = useFavorites().includes(drinkId);
  return (
    <button
      type="button"
      aria-pressed={favorite}
      onClick={() => favoritesStore.toggle(drinkId)}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 font-medium transition-colors hover:bg-surface-muted aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <HeartIcon className="size-5" fill={favorite ? 'currentColor' : 'none'} />
      Ulubiony
    </button>
  );
}
