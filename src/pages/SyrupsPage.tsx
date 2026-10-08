import { ChevronRightIcon } from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import { syrups } from '../data';
import { SyrupRecipe } from '../features/syrups/SyrupRecipe';

export function SyrupsPage() {
  return (
    <>
      <PageHeader
        title="Syropy domowe"
        lead="Nie chce ci się iść do sklepu? Większość syropów zrobisz w kwadrans z cukru, wody i dodatków."
        back={{ to: '/napoje', label: 'Napoje' }}
      />
      <ul className="space-y-3">
        {syrups.map((syrup) => (
          <li key={syrup.id} id={syrup.id}>
            <details className="group rounded-2xl border border-line bg-surface">
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <span
                  aria-hidden="true"
                  className="size-4 shrink-0 rounded-full"
                  style={{ backgroundColor: syrup.color }}
                />
                <span className="flex-1">
                  <span className="block font-semibold">{syrup.name}</span>
                  <span className="block text-sm text-ink-muted">
                    {syrup.recipe.timeMin} min · {syrup.easyToBuy ? 'łatwo kupić' : 'trudno kupić'}
                  </span>
                </span>
                <ChevronRightIcon className="size-5 shrink-0 text-ink-muted transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t border-line px-4 py-4">
                <SyrupRecipe syrup={syrup} />
              </div>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}
