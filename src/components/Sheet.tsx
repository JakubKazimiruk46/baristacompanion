import { useEffect, useId, useRef, type ReactNode } from 'react';
import { CloseIcon } from './icons';

type SheetProps = {
  title: string;
  subtitle?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Wysuwany od dołu panel na natywnym <dialog>: blokuje tło, łapie fokus, zamyka się Esc
 * i tapnięciem w tło.
 */
export function Sheet({ title, subtitle, open, onClose, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const openRef = useRef(open);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Zdarzenie close przychodzi też wtedy, gdy zamykamy przez zmianę propsa (np. „wstecz”).
    // Wtedy onClose nie może się wywołać drugi raz.
    openRef.current = open;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => {
        if (openRef.current) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) ref.current?.close();
      }}
      className="mx-auto mt-auto mb-0 max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-0 text-ink backdrop:bg-black/50 backdrop:backdrop-blur-[2px]"
    >
      {open && (
        <div className="px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <div aria-hidden="true" className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
          <div className="flex items-start justify-between gap-3">
            <div>
              {subtitle && (
                <p className="text-xs font-semibold tracking-wide text-accent uppercase">{subtitle}</p>
              )}
              <h2 id={titleId} className="font-display text-2xl font-semibold">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted"
            >
              <CloseIcon className="size-6" />
              <span className="sr-only">Zamknij</span>
            </button>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
