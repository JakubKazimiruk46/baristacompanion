import { BookmarkIcon } from '../../components/icons';
import { useWishlist, wishlistStore } from './store';

/** Przełącznik „Chcę spróbować” na ekranie napoju. Stan niesie aria-pressed, więc nazwa się nie zmienia. */
export function WishlistButton({ drinkId }: { drinkId: string }) {
  const wanted = useWishlist().includes(drinkId);
  return (
    <button
      type="button"
      aria-pressed={wanted}
      onClick={() => wishlistStore.toggle(drinkId)}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 font-medium transition-colors hover:bg-surface-muted aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <BookmarkIcon className="size-5" fill={wanted ? 'currentColor' : 'none'} />
      Chcę spróbować
    </button>
  );
}
