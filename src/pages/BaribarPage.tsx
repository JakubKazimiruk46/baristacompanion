import { Link, useSearchParams } from 'react-router';
import { ChoiceChip } from '../components/ChoiceChip';
import { ChevronRightIcon } from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import { useAllDrinks } from '../features/assistant/myDrinks';
import {
  BAR_SECTION_LABELS,
  BAR_SECTIONS,
  barSectionFrom,
  beanFiltersFrom,
  beanFiltersToParams,
  type BarSection,
  type BeanFilters,
} from '../features/bar/bar';
import { BeansSection } from '../features/bar/BeansSection';
import {
  AlmostSection,
  EquipmentSection,
  ExtrasSection,
  MilksSection,
  readiness,
  shelfCount,
  SyrupsSection,
} from '../features/bar/ShelfSections';
import { useBeans } from '../features/beans/store';
import { useShopping } from '../features/shelf/shopping';
import { useShelf } from '../features/shelf/store';
import { count } from '../lib/format';

const DRINKS: [string, string, string] = ['napój', 'napoje', 'napojów'];
const DRINKS_MORE: [string, string, string] = ['kolejnego', 'kolejnych', 'kolejnych'];

/**
 * Baribar (/baribar): ziarna (grupy według palenia, wyszukiwanie, filtry), mleka, syropy, dodatki
 * i sprzęt. Z zaznaczonych rzeczy liczy, ile napojów zrobisz teraz.
 */
export function BaribarPage() {
  const [params, setParams] = useSearchParams();
  const section = barSectionFrom(params);
  const beanFilters = beanFiltersFrom(params);
  const beans = useBeans();
  const shelf = useShelf();
  const shopping = useShopping().filter((item) => !item.bought);
  const { ready, almost } = readiness(useAllDrinks(), shelf);

  const show = (next: BarSection, filters: BeanFilters = next === 'ziarna' ? beanFilters : {}) =>
    setParams(beanFiltersToParams(filters, next), { replace: true, preventScrollReset: true });

  const counts: Record<BarSection, number | null> = {
    ziarna: beans.length,
    mleka: shelfCount(shelf, 'milk'),
    syropy: shelfCount(shelf, 'syrup'),
    dodatki: shelfCount(shelf, 'extras'),
    sprzet: shelf.methods.length || null,
  };

  return (
    <>
      <PageHeader
        title="Baribar"
        lead="Twój barek: ziarna, mleka, syropy i dodatki. Z tego, co zaznaczysz, podpowiemy napoje."
      />

      <div className="rounded-3xl bg-accent-soft p-4">
        <p role="status" className="font-display text-xl font-semibold">
          Zrobisz teraz: {count(ready, DRINKS)}
        </p>
        {almost > 0 && <p className="text-sm">Do {count(almost, DRINKS_MORE)} brakuje jednej rzeczy.</p>}
        <div className="mt-3 flex gap-2">
          <Link
            to="/napoje?mam=1"
            className="inline-flex h-10 items-center gap-1 rounded-full bg-accent pr-3 pl-4 text-sm font-semibold text-on-accent"
          >
            Pokaż napoje
            <ChevronRightIcon className="size-4" />
          </Link>
          <Link to="/napoje/zakupy" className="inline-flex h-10 items-center rounded-full bg-surface px-4 text-sm font-medium text-accent">
            Zakupy{shopping.length > 0 && ` (${shopping.length})`}
          </Link>
        </div>
      </div>

      <fieldset className="mt-6 min-w-0">
        <legend className="sr-only">Sekcja barku</legend>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {BAR_SECTIONS.map((option) => (
            <span key={option} className="shrink-0 whitespace-nowrap">
              <ChoiceChip type="radio" name="bar-section" checked={section === option} onChange={() => show(option)}>
                {BAR_SECTION_LABELS[option]}
                {counts[option] ? <span className="ml-1.5 tabular-nums opacity-80">{counts[option]}</span> : null}
              </ChoiceChip>
            </span>
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        {section === 'ziarna' && <BeansSection filters={beanFilters} onChange={(filters) => show('ziarna', filters)} />}
        {section === 'mleka' && <MilksSection />}
        {section === 'syropy' && <SyrupsSection />}
        {section === 'dodatki' && <ExtrasSection />}
        {section === 'sprzet' && <EquipmentSection />}
        {section !== 'ziarna' && <AlmostSection />}
      </div>
    </>
  );
}
