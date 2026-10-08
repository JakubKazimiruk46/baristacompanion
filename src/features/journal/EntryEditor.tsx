import { useId, useState } from 'react';
import { useBeans } from '../beans/store';
import { StarRating } from './StarRating';
import { journalStore, type JournalEntry } from './store';

const fieldClass =
  'mt-1 w-full rounded-xl border border-line bg-surface px-4 text-base focus:border-accent focus:outline-2 focus:outline-accent/40';

/** Ocena, ziarna i notatka do wpisu w dzienniku. Każda zmiana zapisuje się od razu. */
export function EntryEditor({ entry }: { entry: JournalEntry }) {
  const beans = useBeans();
  // Notatka w stanie lokalnym: zapis usuwa puste notatki, a pole nie może przez to „skakać”.
  const [note, setNote] = useState(entry.note ?? '');
  const ids = { bean: useId(), note: useId() };

  return (
    <div className="space-y-5">
      <StarRating value={entry.rating} onChange={(rating) => journalStore.update(entry.id, { rating })} />

      {beans.length > 0 && (
        <div>
          <label htmlFor={ids.bean} className="font-medium">
            Ziarna
          </label>
          <select
            id={ids.bean}
            className={`${fieldClass} h-12`}
            value={entry.beanId ?? ''}
            onChange={(event) => {
              const bean = beans.find((b) => b.id === event.target.value);
              journalStore.update(entry.id, { beanId: bean?.id, beanName: bean?.name });
            }}
          >
            <option value="">Nie wybrano</option>
            {beans.map((bean) => (
              <option key={bean.id} value={bean.id}>
                {bean.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor={ids.note} className="font-medium">
          Notatka
        </label>
        <textarea
          id={ids.note}
          rows={3}
          className={`${fieldClass} py-3`}
          placeholder="np. trochę za kwaśna, następnym razem zmielę drobniej"
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            journalStore.update(entry.id, { note: event.target.value });
          }}
        />
      </div>
    </div>
  );
}
