import { HeartIcon } from '../../components/icons';
import { methodFavoritesStore, useMethodFavorites } from './methods';

/** Przełącznik „Ulubiona” na ekranie metody. Stan niesie aria-pressed, więc nazwa się nie zmienia. */
export function MethodFavoriteButton({ methodId }: { methodId: string }) {
  const favorite = useMethodFavorites().includes(methodId);
  return (
    <button
      type="button"
      aria-pressed={favorite}
      onClick={() => methodFavoritesStore.toggle(methodId)}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 font-medium transition-colors hover:bg-surface-muted aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <HeartIcon className="size-5" fill={favorite ? 'currentColor' : 'none'} />
      Ulubiona
    </button>
  );
}
