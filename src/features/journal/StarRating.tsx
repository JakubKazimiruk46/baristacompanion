import { useId } from 'react';
import { StarIcon } from '../../components/icons';
import { count } from '../../lib/format';
import { RATINGS, type Rating } from './store';

const STARS: [string, string, string] = ['gwiazdka', 'gwiazdki', 'gwiazdek'];

/** Ocena 1–5 jako grupa pól radio, wyglądająca jak gwiazdki. */
export function StarRating({
  value,
  onChange,
  legend = 'Jak wyszło?',
}: {
  value?: Rating;
  onChange: (rating: Rating) => void;
  legend?: string;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="font-medium">{legend}</legend>
      <div className="mt-1 -ml-2 flex">
        {RATINGS.map((rating) => (
          <label
            key={rating}
            className="flex size-12 cursor-pointer items-center justify-center rounded-full text-accent has-focus-visible:outline-2 has-focus-visible:outline-accent"
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={value === rating}
              onChange={() => onChange(rating)}
            />
            <StarIcon className="size-8" fill={value !== undefined && rating <= value ? 'currentColor' : 'none'} />
            <span className="sr-only">{count(rating, STARS)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Ocena do odczytu, np. na liście wpisów. */
export function Stars({ rating }: { rating: Rating }) {
  return (
    <span className="inline-flex text-accent" role="img" aria-label={`Ocena: ${rating} z 5`}>
      {RATINGS.map((n) => (
        <StarIcon key={n} className="size-4" fill={n <= rating ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}
