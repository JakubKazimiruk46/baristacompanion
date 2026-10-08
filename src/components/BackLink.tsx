import { Link, useLocation, useNavigate } from 'react-router';
import { ChevronLeftIcon } from './icons';

/** Stan przekazywany w linkach, żeby „wstecz” wracało na poprzedni ekran (z filtrami). */
export type FromState = { from?: string };

type BackLinkProps = {
  /** Dokąd prowadzi link, gdy ktoś wszedł prosto na ten adres. */
  to: string;
  label: string;
};

export function BackLink({ to, label }: BackLinkProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as FromState | null)?.from;

  return (
    <Link
      to={from ?? to}
      viewTransition
      onClick={(event) => {
        // Przyszliśmy z ekranu w aplikacji: cofamy się w historii, żeby zachować przewinięcie.
        if (from) {
          event.preventDefault();
          navigate(-1);
        }
      }}
      className="-ml-2 inline-flex h-10 items-center gap-1 rounded-full pr-3 pl-1 text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-accent"
    >
      <ChevronLeftIcon className="size-5" />
      {label}
    </Link>
  );
}
