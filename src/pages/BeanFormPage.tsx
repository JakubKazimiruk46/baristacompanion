import { useNavigate, useParams } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { BeanForm } from '../features/beans/BeanForm';
import { beansStore, useBeans } from '../features/beans/store';
import { NotFoundPage } from './NotFoundPage';

/** Dodawanie (/ziarna/nowe) i edycja (/ziarna/:beanId/edycja) ziaren. */
export function BeanFormPage() {
  const { beanId } = useParams();
  const navigate = useNavigate();
  const beans = useBeans();

  if (!beanId) {
    return (
      <>
        <PageHeader title="Nowe ziarna" back={{ to: '/ziarna', label: 'Moje ziarna' }} />
        <BeanForm
          submitLabel="Zapisz ziarna"
          onSubmit={(input) => {
            const bean = beansStore.add(input);
            // replace: „wstecz” z ekranu ziaren wraca na listę, a nie do formularza.
            navigate(`/ziarna/${bean.id}`, { replace: true });
          }}
        />
      </>
    );
  }

  const bean = beans.find((b) => b.id === beanId);
  if (!bean) return <NotFoundPage />;

  return (
    <>
      <PageHeader title="Edytuj ziarna" back={{ to: `/ziarna/${bean.id}`, label: bean.name }} />
      <BeanForm
        key={bean.id}
        initial={bean}
        submitLabel="Zapisz zmiany"
        onSubmit={(input) => {
          beansStore.update(bean.id, input);
          navigate(`/ziarna/${bean.id}`, { replace: true });
        }}
      />
    </>
  );
}
