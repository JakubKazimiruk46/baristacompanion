import { useId, useState } from 'react';
import { ShareIcon } from '../../components/icons';
import { Sheet } from '../../components/Sheet';
import type { RecipeInput } from './recipe';
import { shareUrl } from './share';

const primary =
  'flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const secondary =
  'flex h-12 w-full items-center justify-center rounded-full border border-line bg-surface px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

type CopyState = 'idle' | 'copied' | 'error';

/** Okno „Wyślij przepis”: link z przepisem w adresie, do skopiowania albo udostępnienia. */
export function ShareRecipeSheet({ recipe, open, onClose }: { recipe: RecipeInput; open: boolean; onClose: () => void }) {
  return (
    <Sheet title="Wyślij przepis" subtitle={recipe.name} open={open} onClose={onClose}>
      <ShareRecipe recipe={recipe} />
    </Sheet>
  );
}

function ShareRecipe({ recipe }: { recipe: RecipeInput }) {
  const url = shareUrl(recipe);
  const [copy, setCopy] = useState<CopyState>('idle');
  const id = useId();
  const canShare = typeof navigator.share === 'function';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopy('copied');
    } catch {
      setCopy('error');
    }
  };

  return (
    <>
      <p className="text-ink-muted">
        Cały przepis jest w linku, bez konta i serwera. Kto go otworzy, zobaczy przepis i zapisze go u siebie.
        Ustawienie młynka zostaje u Ciebie.
      </p>
      <label htmlFor={id} className="mt-4 block font-medium">
        Link do przepisu
      </label>
      <input
        id={id}
        readOnly
        value={url}
        onFocus={(event) => event.target.select()}
        className="mt-1 h-12 w-full rounded-xl border border-line bg-surface-muted px-4 text-sm text-ink-muted"
      />
      <div className="mt-4 flex flex-col gap-3">
        {canShare && (
          <button
            type="button"
            className={primary}
            onClick={() => navigator.share({ title: recipe.name, text: `Mój przepis: ${recipe.name}`, url }).catch(() => {})}
          >
            <ShareIcon className="size-5" />
            Udostępnij
          </button>
        )}
        <button type="button" className={canShare ? secondary : primary} onClick={copyLink}>
          Kopiuj link
        </button>
      </div>
      <p role="status" className="mt-3 text-sm font-medium">
        {copy === 'copied' && 'Skopiowano link.'}
        {copy === 'error' && 'Nie udało się skopiować. Zaznacz link w polu i skopiuj go ręcznie.'}
      </p>
    </>
  );
}
