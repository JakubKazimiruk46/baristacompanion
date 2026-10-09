import { beanMethods, NOTE_LABELS, type BeanProfile, type BrewMethod, type FlavorNote, type Roast } from '../../data';
import { capitalize } from '../../lib/format';

export type Verdict = 'great' | 'good' | 'poor';

export interface MethodMatch {
  method: BrewMethod;
  score: number;
  verdict: Verdict;
  /** Krótkie uzasadnienia po polsku, najważniejsze pierwsze. */
  reasons: string[];
}

export const VERDICT_LABELS: Record<Verdict, string> = {
  great: 'Świetny wybór',
  good: 'Dobry wybór',
  poor: 'Lepiej inną metodą',
};

// Czysty napar (przelew, AeroPress) pokazuje charakter kawy; mocne metody dają bazę do mleka.
// Wyprowadzamy to z danych: metoda dla jasnych paleń jest „czysta”, metoda tylko dla
// średnich i ciemnych jest „mocna”.
const isClean = (m: BrewMethod) => m.suits.roasts.includes('light');
const isStrong = (m: BrewMethod) => m.suits.roasts.includes('dark') && !isClean(m);

/** Ranking metod dla profilu ziaren: od najlepiej pasującej. Kawy rozpuszczalnej w nim nie ma. */
export function rankMethods(profile: BeanProfile, methods: BrewMethod[] = beanMethods): MethodMatch[] {
  return methods
    .map((method) => scoreMethod(profile, method))
    .sort((a, b) => b.score - a.score);
}

export function scoreMethod(profile: BeanProfile, method: BrewMethod): MethodMatch {
  let score = 0;
  const reasons: string[] = [];

  // 1. Palenie: najważniejsze, bo decyduje o kwasowości i goryczy.
  const roastFits = method.suits.roasts.includes(profile.roast);
  score += roastFits ? 3 : -2;
  reasons.push(roastReason(profile.roast, roastFits, method));

  // 2. Nuty smakowe.
  const matched = profile.notes.filter((note) => method.suits.notes.includes(note));
  const missed = profile.notes.filter((note) => !method.suits.notes.includes(note));
  if (matched.length > 0) {
    score += Math.min(2, matched.length);
    reasons.push(`${capitalize(notesList(matched))} nuty ${method.inMethod} dobrze wybrzmią.`);
  } else if (missed.length > 0) {
    score -= 1;
    reasons.push(`${capitalize(notesList(missed))} nuty lepiej wybrzmią w innej metodzie.`);
  }

  // 3. Single origin czy mieszanka.
  if (profile.kind === 'single-origin' && isClean(method)) {
    score += 0.5;
    reasons.push('Single origin warto pić czysto, żeby poczuć jego charakter.');
  }
  if (profile.kind === 'blend' && isStrong(method)) {
    score += 0.5;
    reasons.push('Mieszanki zwykle komponuje się pod mocne napary i kawę z mlekiem.');
  }

  const verdict: Verdict = score >= 4 ? 'great' : score >= 2 ? 'good' : 'poor';
  return { method, score, verdict, reasons };
}

function roastReason(roast: Roast, fits: boolean, method: BrewMethod): string {
  const where = method.inMethod;
  switch (roast) {
    case 'light':
      return fits
        ? `Jasne palenie jest kwaśniejsze, a ${where} ta kwasowość zamienia się w owocowość.`
        : `Jasne palenie jest kwaśniejsze: ${where} może wyjść kwaśno i ostro.`;
    case 'medium':
      return fits
        ? `Średnie palenie to bezpieczny środek: ${where} wychodzi zbalansowane i słodkie.`
        : `Średnie palenie ${where} wypada poprawnie, ale bez wyrazu.`;
    case 'dark':
      return fits
        ? `Ciemne palenie daje czekoladę i goryczkę, a ${where} wychodzi pełne i słodkie.`
        : `Ciemne palenie ${where} bywa płaskie i gorzkie.`;
  }
}

/** „owocowe, kwiatowe i cytrusowe” */
function notesList(notes: FlavorNote[]): string {
  const labels = notes.map((note) => NOTE_LABELS[note]);
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} i ${labels[labels.length - 1]}`;
}
