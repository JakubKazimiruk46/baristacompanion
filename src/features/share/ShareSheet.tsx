import { useEffect, useRef, useState } from 'react';
import { ShareIcon } from '../../components/icons';
import { Sheet } from '../../components/Sheet';
import type { Drink } from '../../data';
import { downloadBlob } from '../../lib/download';
import { useDialogParam } from '../../lib/useDialogParam';
import { cardToPng } from './exportCard';
import { ShareCard } from './ShareCard';

const primary =
  'flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40';
const secondary =
  'flex h-12 flex-1 items-center justify-center rounded-full border border-line bg-surface px-5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40';

/** Okno z kartą napoju do udostępnienia, sterowane parametrem ?karta=1 w adresie. */
export function useShareCard(drink: Drink) {
  const dialog = useDialogParam('karta');
  const open = dialog.value !== null;
  const sheet = (
    <Sheet title="Karta do udostępnienia" subtitle={drink.name} open={open} onClose={dialog.close}>
      {open && <SharePanel drink={drink} />}
    </Sheet>
  );
  return { open: () => dialog.open('1'), sheet };
}

type CardFile = { status: 'pending' } | { status: 'ready'; file: File } | { status: 'error' };

function SharePanel({ drink }: { drink: Drink }) {
  const ref = useRef<SVGSVGElement>(null);
  const [card, setCard] = useState<CardFile>({ status: 'pending' });

  // PNG powstaje od razu po otwarciu okna. Safari pozwala udostępnić plik tylko tuż po
  // tapnięciu, więc w chwili tapnięcia obrazek musi już być gotowy.
  useEffect(() => {
    let cancelled = false;
    cardToPng(ref.current!).then(
      (blob) => {
        if (!cancelled) setCard({ status: 'ready', file: new File([blob], `${drink.id}.png`, { type: 'image/png' }) });
      },
      () => {
        if (!cancelled) setCard({ status: 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [drink.id]);

  const file = card.status === 'ready' ? card.file : null;
  const canShare = file !== null && navigator.canShare?.({ files: [file] }) === true;

  const share = async () => {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: drink.name, text: `${drink.name}: ${drink.tagline}` });
    } catch {
      // Użytkownik zamknął okno udostępniania.
    }
  };

  return (
    <>
      <ShareCard
        ref={ref}
        drink={drink}
        className="mx-auto block h-[min(58dvh,560px)] w-auto max-w-full rounded-2xl shadow-lg"
      />
      <p className="mt-3 text-center text-sm text-ink-muted">
        Obrazek w formacie relacji. Udostępnij go albo zapisz w galerii.
      </p>
      {card.status === 'error' && (
        <p role="alert" className="mt-2 text-center text-sm font-medium">
          Nie udało się przygotować obrazka w tej przeglądarce.
        </p>
      )}
      <div className="mt-4 flex gap-3">
        {canShare && (
          <button type="button" className={primary} onClick={share}>
            <ShareIcon className="size-5" />
            Udostępnij
          </button>
        )}
        <button
          type="button"
          className={canShare ? secondary : primary}
          disabled={!file}
          onClick={() => file && downloadBlob(file, file.name)}
        >
          {card.status === 'pending' ? 'Przygotowuję…' : 'Zapisz obrazek'}
        </button>
      </div>
    </>
  );
}
