import { Link } from 'react-router';
import { PageHeader } from '../components/PageHeader';

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Nie ma takiej strony" lead="Ten adres do niczego nie prowadzi." />
      <Link
        to="/napoje"
        className="inline-flex h-11 items-center rounded-full bg-accent px-5 font-medium text-on-accent"
      >
        Wróć do napojów
      </Link>
    </>
  );
}
