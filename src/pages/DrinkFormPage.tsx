import { useNavigate, useParams, useSearchParams } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { DRINK_LIMITS } from '../../supabase/functions/_shared/drinkRules.ts';
import { isMyDrinkId, myDrinksStore, useDrink, useMyDrinkRecord } from '../features/assistant/myDrinks';
import { drinkToDraft, emptyDraft } from '../features/drinkEditor/draft';
import { DrinkEditor } from '../features/drinkEditor/DrinkEditor';
import { NotFoundPage } from './NotFoundPage';

/**
 * Kreator napoju: /napoje/nowy (od zera albo ?z=id: własna wersja innego napoju) i
 * /napoje/:drinkId/edycja (tylko „Moje napoje”). Zapis trafia do „Moich napojów”.
 */
export function DrinkFormPage() {
  const { drinkId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const editing = useDrink(drinkId);
  const record = useMyDrinkRecord(drinkId);
  const template = useDrink(params.get('z') ?? undefined);

  if (drinkId) {
    if (!editing || !isMyDrinkId(editing.id) || !record) return <NotFoundPage />;
    return (
      <>
        <PageHeader title={`Edycja: ${editing.name}`} back={{ to: `/napoje/${editing.id}`, label: editing.name }} />
        <DrinkEditor
          key={editing.id}
          initial={drinkToDraft(editing)}
          submitLabel="Zapisz zmiany"
          onSubmit={(drink) => {
            myDrinksStore.update(editing.id, drink);
            navigate(`/napoje/${editing.id}`, { replace: true });
          }}
        />
      </>
    );
  }

  const ownName = template && `${template.name} po mojemu`;
  const initial = template
    ? { ...drinkToDraft(template), name: ownName!.length <= DRINK_LIMITS.name ? ownName! : template.name }
    : emptyDraft();

  return (
    <>
      <PageHeader
        title={template ? `Własna wersja: ${template.name}` : 'Nowy napój'}
        lead="Ułóż składniki, warstwy w szklance i dekoracje. Napój zapisze się w „Moich napojach” na tym urządzeniu."
        back={template ? { to: `/napoje/${template.id}`, label: template.name } : { to: '/napoje', label: 'Napoje' }}
      />
      <DrinkEditor
        key={template?.id ?? 'nowy'}
        initial={initial}
        submitLabel="Zapisz napój"
        onSubmit={(drink) => {
          const saved = myDrinksStore.add(drink, Date.now(), { source: 'own' });
          navigate(`/napoje/${saved.id}`, { replace: true });
        }}
      />
    </>
  );
}
