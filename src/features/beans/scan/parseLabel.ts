import { NOTE_LABELS, ROAST_LABELS, type BeanProfile, type FlavorNote, type Roast } from '../../../data';

/** Co udało się odczytać z etykiety. Pola bez pewności zostają puste. */
export interface LabelGuess {
  name?: string;
  roaster?: string;
  roast?: Roast;
  notes: FlavorNote[];
  origin?: string;
  kind?: BeanProfile['kind'];
}

/** Małe litery bez polskich znaków: OCR często je gubi, a etykiety bywają po angielsku. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// Wyrażenia działają na tekście po normalize(). Samo „dark” czy „medium” to za mało:
// na etykietach są też „dark chocolate” i „body: medium”.
const ROAST_PATTERNS: [Roast, RegExp][] = [
  ['light', /\bjasn\w*\s+palon|\bpalen\w*:?\s+jasn|light\s*roast|roast:?\s*light|\bnordic\b/],
  ['medium', /\bsredn\w*\s+palon|\bpalen\w*:?\s+sredn|medium\s*(dark\s*)?roast|roast:?\s*medium|\bomni/],
  ['dark', /\bciemn\w*\s+palon|\bpalen\w*:?\s+ciemn|dark\s*roast|roast:?\s*dark|italian\s+roast|french\s+roast/],
];

// Bez wprost podanego palenia: kawa „do filtra” bywa jasna, „do espresso” średnia.
const ROAST_HINTS: [Roast, RegExp][] = [
  ['light', /\bfiltr|\bfilter\b|\bdrip\b|\bprzelew/],
  ['medium', /\bespresso\b|\bkawiark|\bmoka\b/],
];

const NOTE_PATTERNS: Record<FlavorNote, RegExp> = {
  chocolate: /czekolad|kakao|\bcocoa|chocolate|brownie/,
  nutty: /orzech|migdal|marcepan|pralin|pistacj|hazelnut|almond|\bnuts?\b|\bnutty\b|pecan/,
  caramel: /karmel|tof+i\b|toffee|\bmiod|honey|krowk|trzcin|brown sugar|syrop klon|maple|melas|molasses|dulce/,
  fruity:
    /owoc|wisni|czeresn|jagod|malin|truskaw|sliw|brzoskwin|morel|porzeczk|jezyn|ananas|mango|winogron|rodzyn|\bfig|daktyl|jablk|gruszk|marakuj|berr(y|ies)|cherr|\bplum|peach|apricot|currant|grape|raisin|apple|\bpear|tropical|fruit|passion/,
  floral: /kwiat|kwiecist|jasmin|lawend|hibisk|czarny bez|\brozan|floral|flower|lavender|hibiscus|elderflower|\brose\b/,
  citrus: /cytrus|cytryn|limonk|pomarancz|mandaryn|grejpfrut|bergamot|citrus|lemon|\blime\b|orange|grapefruit|tangerine|yuzu/,
  spicy: /przypraw|cynamon|gozdzik|pieprz|korzen|kardamon|anyz|imbir|muszkat|spic(e|y)|cinnamon|clove|pepper|cardamom|ginger|nutmeg/,
};

const ORIGINS: [string, RegExp][] = [
  ['Etiopia', /\betiopi|\bethiopi/],
  ['Kenia', /\bkeni[ai]|\bkenya/],
  ['Kolumbia', /\bkolumbi|\bcolombi/],
  ['Brazylia', /\bbrazyli|\bbrazil/],
  ['Gwatemala', /\bgwatemal|\bguatemal/],
  ['Kostaryka', /\bkostaryk|\bcosta rica/],
  ['Honduras', /\bhondura/],
  ['Salwador', /\bsalwador|\bel salvador/],
  ['Nikaragua', /\bnikaragu|\bnicaragu/],
  ['Peru', /\bperu\b/],
  ['Boliwia', /\bboliwi|\bbolivi/],
  ['Ekwador', /\bekwador|\becuador/],
  ['Meksyk', /\bmeksyk|\bmexic/],
  ['Panama', /\bpanam[ay]\b/],
  ['Rwanda', /\brwand/],
  ['Burundi', /\bburundi/],
  ['Uganda', /\bugand/],
  ['Tanzania', /\btanzani/],
  ['Jemen', /\bjemen|\byemen/],
  ['Indie', /\bindie\b|\bindia\b/],
  ['Indonezja', /\bindonez|\bindonesi|\bsumatr|\bjawa\b|\bjava\b|\bsulawesi/],
  ['Papua-Nowa Gwinea', /\bpapua|nowa gwinea|new guinea/],
  ['Wietnam', /\bwietnam|\bvietnam/],
  ['Chiny', /\bchiny\b|\bchina\b|\byunnan/],
  ['Kongo', /\bkongo|\bcongo/],
  ['Malawi', /\bmalawi/],
  ['Zambia', /\bzambi/],
  ['Dominikana', /\bdominikan|\bdominican/],
  ['Jamajka', /\bjamajk|\bjamaica/],
  ['Hawaje', /\bhawaj|\bhawaii|\bkona\b/],
];

const BLEND = /\bblend|mieszank/;
const SINGLE = /single\s*origin|single\s*estate|jednorodn|mikrolot|micro\s*lot/;
const ROASTER = /palarni|roaster|roastery|coffee roasters/;

// Linie, które nie są nazwą kawy: waga, daty, opisy, nagłówki sekcji.
const NOT_A_NAME =
  /\d+\s*(g|kg|gr)\b|\d{1,2}[./-]\d{1,2}|palon|palenie|roast|nuty|notes|smak|taste|proces|process|wysokosc|altitude|odmiana|variet|data|date|kawa ziarnista|whole bean|100\s*%|arabica|arabika|robusta|www\.|@/;

/** Tekst z wielkich liter zamieniamy na zwykły zapis: „ETIOPIA GUJI” → „Etiopia Guji”. */
function tidy(line: string): string {
  const cleaned = line.replace(/[|_~*#•©®]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleaned !== cleaned.toUpperCase()) return cleaned;
  return cleaned
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function nameCandidates(lines: string[]): string[] {
  return lines.filter((line) => {
    const letters = line.replace(/[^\p{L}]/gu, '').length;
    return (
      line.length >= 3 &&
      line.length <= 40 &&
      letters >= 3 &&
      letters / line.replace(/\s/g, '').length >= 0.7 &&
      !NOT_A_NAME.test(normalize(line)) &&
      !ROASTER.test(normalize(line))
    );
  });
}

/** Zgaduje profil ziaren z tekstu rozpoznanego na etykiecie. */
export function parseLabel(text: string): LabelGuess {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const all = normalize(lines.join('\n'));

  const roast =
    ROAST_PATTERNS.find(([, pattern]) => pattern.test(all))?.[0] ??
    ROAST_HINTS.find(([, pattern]) => pattern.test(all))?.[0];
  const notes = (Object.keys(NOTE_PATTERNS) as FlavorNote[]).filter((note) => NOTE_PATTERNS[note].test(all));
  // Kraje w kolejności z etykiety.
  const origins = ORIGINS.map(([name, pattern]) => ({ name, at: all.search(pattern) }))
    .filter(({ at }) => at >= 0)
    .sort((a, b) => a.at - b.at)
    .map(({ name }) => name);
  const kind: BeanProfile['kind'] | undefined = BLEND.test(all)
    ? 'blend'
    : SINGLE.test(all) || origins.length === 1
      ? 'single-origin'
      : origins.length > 1
        ? 'blend'
        : undefined;

  // Nazwa kawy stoi zwykle najwyżej i największymi literami: pierwsza linia, która nie jest
  // palarnią, wagą, datą ani opisem.
  const name = nameCandidates(lines)[0];
  const roaster = lines.find((line) => ROASTER.test(normalize(line)));

  return {
    ...(name && { name: tidy(name) }),
    ...(roaster && { roaster: tidy(roaster) }),
    ...(roast && { roast }),
    notes,
    ...(origins.length > 0 && { origin: origins.join(', ') }),
    ...(kind && { kind }),
  };
}

/** Podsumowanie po polsku, co odczytano, albo null, gdy nic. */
export function describeGuess(guess: LabelGuess): string | null {
  const parts = [
    guess.name && `nazwa „${guess.name}”`,
    guess.roast && `palenie ${ROAST_LABELS[guess.roast]}`,
    guess.notes.length > 0 && `nuty: ${guess.notes.map((n) => NOTE_LABELS[n]).join(', ')}`,
    guess.origin && `pochodzenie: ${guess.origin}`,
  ].filter(Boolean);
  return parts.length > 0 ? `Z etykiety: ${parts.join('; ')}.` : null;
}
