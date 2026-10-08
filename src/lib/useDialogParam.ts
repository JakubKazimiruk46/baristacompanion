import { useLocation, useNavigate, useSearchParams } from 'react-router';

type DialogState = { dialog?: boolean };

/**
 * Okno zapisane w adresie (?klucz=wartość). Otwarcie dokłada wpis w historii, więc gest
 * „wstecz” na telefonie zamyka okno zamiast wychodzić z ekranu.
 */
export function useDialogParam(key: string) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const value = params.get(key);

  const open = (next: string) => {
    const search = new URLSearchParams(params);
    search.set(key, next);
    navigate(
      { search: search.toString() },
      { state: { ...(location.state ?? {}), dialog: true }, preventScrollReset: true },
    );
  };

  const close = () => {
    if ((location.state as DialogState | null)?.dialog) {
      navigate(-1);
      return;
    }
    // Okno otwarte z linku z zewnątrz: zdejmujemy parametr bez ruszania historii.
    const search = new URLSearchParams(params);
    search.delete(key);
    setParams(search, { replace: true, preventScrollReset: true });
  };

  return { value, open, close };
}
