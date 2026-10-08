import { useLocation, useNavigate } from 'react-router';
import type { FromState } from '../components/BackLink';
import { PageHeader } from '../components/PageHeader';
import { GrinderForm } from '../features/grinder/GrinderForm';
import { grindersStore } from '../features/grinder/store';

/** Nowy młynek (/ziarna/mlynek/nowy). Po zapisie wraca tam, skąd przyszedł (np. na ekran metody). */
export function GrinderFormPage() {
  const navigate = useNavigate();
  const from = (useLocation().state as FromState | null)?.from;

  return (
    <>
      <PageHeader
        title="Nowy młynek"
        lead="Przy znanych modelach podpowiemy, od jakiego ustawienia zacząć dla każdej metody."
        back={{ to: '/ziarna/mlynek', label: 'Mój młynek' }}
      />
      <GrinderForm
        onSubmit={(input) => {
          grindersStore.add(input);
          // Z ekranu w aplikacji cofamy się do niego. Inaczej: lista młynków zamiast formularza w historii.
          if (from) navigate(-1);
          else navigate('/ziarna/mlynek', { replace: true });
        }}
      />
    </>
  );
}
