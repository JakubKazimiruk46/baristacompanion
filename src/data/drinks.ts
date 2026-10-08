import type { Drink } from './types';

// Użytkownicy nie mają ekspresu: tam, gdzie przepis wymaga espresso, bazą jest kawa z kawiarki.
const MOKA_AS_ESPRESSO = 'Kawa z kawiarki zamiast espresso. Z mlekiem smakuje bardzo podobnie.';

const COFFEE = '#4a2a1a';
const COFFEE_LIGHTER = '#5a3424';

export const drinks: Drink[] = [
  {
    id: 'espresso-tonic',
    name: 'Espresso tonic',
    tagline: 'Gorzko-cytrusowe orzeźwienie z bąbelkami',
    description:
      'Mocna kawa wlana na tonik z lodem. Kawa unosi się na toniku, a na granicy warstw efektownie się pieni. Idealne na upał.',
    temperature: 'cold',
    prepTimeMin: 10,
    base: {
      methodId: 'kawiarka',
      amountMl: 50,
      alternativeMethodIds: ['aeropress'],
      note: 'Kawa z kawiarki zamiast espresso. Pasują owocowe, średnio palone ziarna.',
    },
    extras: [
      { kind: 'mixer', name: 'tonik, dobrze schłodzony', amount: '150 ml' },
      { kind: 'ice', name: 'lód', amount: '4–5 kostek' },
    ],
    equipment: ['wysoka szklanka', 'łyżka'],
    layers: [
      { name: 'tonik z lodem', volumeMl: 150, color: '#e4ecee', kind: 'liquid' },
      { name: 'kawa', volumeMl: 50, color: COFFEE, kind: 'liquid' },
    ],
    steps: [
      'Zaparz kawę w kawiarce i odstaw na 2–3 minuty, żeby lekko przestygła.',
      'Wsyp lód do szklanki i wlej schłodzony tonik do ok. 2/3 wysokości.',
      'Wlewaj kawę bardzo powoli po grzbiecie łyżki, tuż nad powierzchnią toniku.',
      'Podawaj od razu, zanim warstwy się wymieszają.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'Przezroczysta, wysoka szklanka pokazuje warstwy i pianę na ich granicy.',
      decorations: [
        {
          kind: 'garnish',
          name: 'skórka pomarańczy',
          look: 'peel',
          color: '#f08a24',
          instruction:
            'Wytnij obieraczką pasek skórki, skręć go nad szklanką, żeby uwolnić olejki, i połóż na brzegu.',
          optional: true,
        },
      ],
    },
  },
  {
    id: 'kawa-pomaranczowa',
    name: 'Kawa pomarańczowa',
    tagline: 'Syrop, sok pomarańczowy i kawa w trzech warstwach',
    description:
      'Słodko-gorzkie połączenie pomarańczy i kawy na zimno: syrop na dnie, sok z lodem, kawa na górze. Brzeg szklanki obtoczony cukrem z pomarańczową skórką.',
    temperature: 'cold',
    prepTimeMin: 12,
    base: {
      methodId: 'kawiarka',
      amountMl: 50,
      alternativeMethodIds: ['aeropress'],
      note: 'Kawa z kawiarki zamiast espresso.',
    },
    extras: [
      { kind: 'syrup', syrupId: 'pomaranczowy', amountMl: 15 },
      {
        kind: 'mixer',
        name: 'sok pomarańczowy, najlepiej świeżo wyciśnięty',
        amount: '100 ml',
      },
      { kind: 'ice', name: 'lód', amount: '3–4 kostki' },
    ],
    equipment: ['niska szklanka', 'łyżka', 'talerzyk na cukier'],
    layers: [
      { name: 'syrop pomarańczowy', volumeMl: 15, color: '#e0701c', kind: 'liquid' },
      { name: 'sok pomarańczowy', volumeMl: 100, color: '#f6a531', kind: 'liquid' },
      { name: 'kawa', volumeMl: 50, color: COFFEE, kind: 'liquid' },
    ],
    steps: [
      'Obtocz brzeg szklanki w cukrze z pomarańczową skórką (zobacz: jak podać).',
      'Wlej syrop na dno szklanki.',
      'Wsyp lód i powoli wlej sok pomarańczowy.',
      'Zaparz kawę i wlewaj ją powoli po grzbiecie łyżki na sok.',
      'Nasuń plaster pomarańczy na brzeg i podawaj z mieszadełkiem.',
    ],
    serving: {
      vessel: 'low-glass',
      why: 'Niska, szeroka szklanka mieści lód i pokazuje trzy kolory warstw.',
      decorations: [
        {
          kind: 'rim',
          name: 'cukier ze skórką pomarańczy',
          color: '#f3d9a4',
          instruction:
            'Wymieszaj 2 łyżki cukru z otartą skórką pomarańczy. Przetrzyj brzeg szklanki kawałkiem pomarańczy i zanurz go w cukrze.',
        },
        {
          kind: 'garnish',
          name: 'plaster pomarańczy',
          look: 'slice',
          color: '#f39a2b',
          instruction: 'Natnij plaster do połowy i nasuń go na brzeg szklanki.',
        },
      ],
    },
    needsReview: true,
    reviewNote: 'Proporcje soku, syropu i kawy do sprawdzenia w praktyce.',
  },
  {
    id: 'latte-macchiato',
    name: 'Latte macchiato',
    tagline: 'Mleko, kawa i pianka w trzech warstwach',
    description:
      'Klasyk w wysokiej szklance: na dole gorące mleko, w środku kawa, na górze gęsta pianka. Kawa „plami” mleko, stąd nazwa.',
    temperature: 'hot',
    prepTimeMin: 12,
    base: {
      methodId: 'kawiarka',
      amountMl: 40,
      alternativeMethodIds: ['aeropress'],
      note: MOKA_AS_ESPRESSO,
    },
    milk: { options: ['krowie', 'owsiane-barista', 'sojowe'], amountMl: 200, prep: 'froth' },
    extras: [],
    equipment: ['wysoka szklanka', 'spieniacz lub prasa francuska'],
    layers: [
      { name: 'gorące mleko', volumeMl: 150, color: '#f5ecdd', kind: 'liquid' },
      { name: 'kawa', volumeMl: 40, color: '#a86f45', kind: 'liquid' },
      { name: 'pianka', volumeMl: 60, color: '#fdf8f0', kind: 'foam' },
    ],
    steps: [
      'Zaparz kawę w kawiarce.',
      'Spień mleko (ok. 60°C) i odstaw na pół minuty, żeby pianka się oddzieliła.',
      'Wlej mleko do szklanki, przytrzymując piankę łyżką, a na koniec nałóż piankę.',
      'Wlewaj kawę bardzo powoli przez środek pianki: osiądzie między mlekiem a pianką.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'Tylko w przezroczystej szklance widać trzy warstwy, dla których robi się ten napój.',
      decorations: [],
    },
  },
  {
    id: 'cafe-bombon',
    name: 'Café bombón',
    tagline: 'Kawa po hiszpańsku na słodkim mleku skondensowanym',
    description:
      'Hiszpański deser w szklaneczce: gęste mleko skondensowane na dnie, mocna kawa na wierzchu. Przed piciem miesza się łyżeczką.',
    temperature: 'hot',
    prepTimeMin: 10,
    base: {
      methodId: 'kawiarka',
      amountMl: 40,
      alternativeMethodIds: ['aeropress'],
      note: 'Kawa z kawiarki zamiast espresso.',
    },
    milk: { options: ['skondensowane', 'skondensowane-kokosowe'], amountMl: 30, prep: 'plain' },
    extras: [],
    equipment: ['mała szklanka', 'łyżeczka'],
    layers: [
      { name: 'mleko skondensowane', volumeMl: 30, color: '#f1e2bd', kind: 'liquid' },
      { name: 'kawa', volumeMl: 40, color: '#3f2416', kind: 'liquid' },
    ],
    steps: [
      'Wlej mleko skondensowane na dno szklanki.',
      'Zaparz kawę w kawiarce.',
      'Wlewaj kawę powoli po grzbiecie łyżeczki, żeby nie wymieszała się z mlekiem.',
      'Podaj z łyżeczką: każdy miesza sam, kiedy chce.',
    ],
    serving: {
      vessel: 'small-glass',
      why: 'Mała przezroczysta szklanka pokazuje ostrą granicę między białym mlekiem a czarną kawą.',
      decorations: [],
    },
  },
  {
    id: 'kawa-malinowa',
    name: 'Kawa malinowa',
    tagline: 'Różowe mleko z malinami i kawa na zimno',
    description:
      'Mleko zmiksowane z malinami na dole, schłodzona kawa na górze. Owocowa, lekko kwaskowa i bardzo fotogeniczna.',
    temperature: 'cold',
    prepTimeMin: 15,
    base: {
      methodId: 'kawiarka',
      amountMl: 50,
      alternativeMethodIds: ['aeropress'],
      note: 'Kawa z kawiarki zamiast espresso, schłodzona przed dodaniem.',
    },
    milk: { options: ['krowie', 'owsiane-barista', 'migdalowe'], amountMl: 150, prep: 'blend' },
    extras: [
      { kind: 'fruit', name: 'maliny (mogą być mrożone)', amount: '60 g', blended: true },
      { kind: 'syrup', syrupId: 'malinowy', amountMl: 10, optional: true },
      { kind: 'ice', name: 'lód', amount: '3–4 kostki' },
    ],
    equipment: ['wysoka szklanka', 'blender'],
    layers: [
      { name: 'mleko malinowe', volumeMl: 170, color: '#e7a1b0', kind: 'liquid' },
      { name: 'kawa', volumeMl: 50, color: COFFEE_LIGHTER, kind: 'liquid' },
    ],
    steps: [
      'Zaparz kawę i schłódź ją przed dodaniem: wstaw naczynie z kawą do miski z lodem na 5 minut.',
      'Zmiksuj mleko z malinami na gładko. Jeśli lubisz słodziej, dodaj syrop malinowy.',
      'Wsyp lód do szklanki i wlej mleko malinowe.',
      'Wlewaj schłodzoną kawę powoli po grzbiecie łyżki.',
      'Połóż na wierzchu kilka malin.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'Przezroczysta szklanka pokazuje różowo-brązowe warstwy.',
      decorations: [
        {
          kind: 'garnish',
          name: 'świeże maliny',
          look: 'berries',
          color: '#c7283f',
          instruction: 'Połóż 2–3 maliny na wierzchu albo nabij je na wykałaczkę opartą o brzeg.',
        },
      ],
    },
    needsReview: true,
    reviewNote:
      'Czy gorąca kawa zwarzy mleko z malinami? Na wszelki wypadek przepis każe ją schłodzić.',
  },
  {
    id: 'shake-kawowy',
    name: 'Shake kawowy',
    tagline: 'Mleko z lodami, a na koniec schłodzona kawa',
    description:
      'Gęsty shake z mleka i lodów waniliowych, a na wierzchu schłodzona kawa. Deser i kawa w jednej szklance.',
    temperature: 'cold',
    prepTimeMin: 15,
    base: {
      methodId: 'kawiarka',
      amountMl: 50,
      alternativeMethodIds: ['aeropress'],
      note: 'Kawa z kawiarki, schłodzona przed dodaniem.',
    },
    milk: { options: ['krowie', 'owsiane-barista', 'sojowe'], amountMl: 100, prep: 'blend' },
    extras: [
      {
        kind: 'ice-cream',
        name: 'lody waniliowe (mogą być roślinne)',
        amount: '2 gałki',
        blended: true,
      },
    ],
    equipment: ['wysoka szklanka', 'blender', 'słomka'],
    layers: [
      { name: 'shake waniliowy', volumeMl: 200, color: '#f3e7cf', kind: 'liquid' },
      { name: 'kawa', volumeMl: 50, color: COFFEE_LIGHTER, kind: 'liquid' },
    ],
    steps: [
      'Zaparz kawę i schłódź ją przed dodaniem: gorąca roztopi lody, a shake straci gęstość.',
      'Obtocz brzeg szklanki w pokruszonych ciasteczkach (zobacz: jak podać).',
      'Zmiksuj mleko z lodami na gęsty shake i przelej do szklanki.',
      'Na koniec powoli wlej schłodzoną kawę.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'Wysoka szklanka mieści gęsty shake i pokazuje kawę na wierzchu.',
      decorations: [
        {
          kind: 'rim',
          name: 'pokruszone ciasteczka',
          color: '#b07a4a',
          instruction:
            'Posmaruj brzeg szklanki odrobiną miodu albo sosu czekoladowego i zanurz go w pokruszonych herbatnikach.',
          optional: true,
        },
        {
          kind: 'topping',
          name: 'starta czekolada',
          look: 'pieces',
          color: '#4a2a1c',
          instruction: 'Posyp wierzch startą czekoladą tuż przed podaniem.',
        },
      ],
    },
  },
  {
    id: 'latte-waniliowe',
    name: 'Latte waniliowe',
    tagline: 'Latte z syropem waniliowym i kakao na piance',
    description:
      'Łagodna kawa z dużą ilością mleka, osłodzona syropem waniliowym. Zamiast waniliowego pasuje każdy inny syrop: karmelowy, cynamonowy, pomarańczowy.',
    temperature: 'hot',
    prepTimeMin: 12,
    base: {
      methodId: 'kawiarka',
      amountMl: 40,
      alternativeMethodIds: ['aeropress'],
      note: MOKA_AS_ESPRESSO,
    },
    milk: {
      options: ['krowie', 'owsiane-barista', 'sojowe', 'owsiane-smakowe'],
      amountMl: 220,
      prep: 'froth',
    },
    extras: [{ kind: 'syrup', syrupId: 'waniliowy', amountMl: 15 }],
    equipment: ['wysoka szklanka lub duży kubek', 'spieniacz lub prasa francuska'],
    layers: [
      { name: 'syrop waniliowy', volumeMl: 15, color: '#e3c88f', kind: 'liquid' },
      { name: 'kawa z mlekiem', volumeMl: 200, color: '#c9a07a', kind: 'liquid' },
      { name: 'pianka', volumeMl: 40, color: '#f9f2e7', kind: 'foam' },
    ],
    steps: [
      'Wlej syrop na dno szklanki.',
      'Zaparz kawę i wlej ją na syrop.',
      'Spień mleko i wlej je do kawy, a na koniec nałóż piankę.',
      'Oprósz piankę kakao przez sitko.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'W szklance widać jasną warstwę syropu na dnie i grubą piankę.',
      decorations: [
        {
          kind: 'topping',
          name: 'kakao',
          look: 'dust',
          color: '#6b3e26',
          instruction:
            'Przesiej szczyptę kakao przez małe sitko nad pianką. Możesz przyłożyć szablon, np. serce wycięte z papieru.',
        },
      ],
    },
  },
  {
    id: 'mocha',
    name: 'Mocha',
    tagline: 'Kawa, czekolada i mleko w szklance z czekoladowymi wzorami',
    description:
      'Połączenie kawy z gorącą czekoladą. Ścianki szklanki zdobią smugi sosu czekoladowego, a wierzch starta czekolada.',
    temperature: 'hot',
    prepTimeMin: 15,
    base: {
      methodId: 'kawiarka',
      amountMl: 40,
      alternativeMethodIds: ['aeropress'],
      note: MOKA_AS_ESPRESSO,
    },
    milk: { options: ['krowie', 'owsiane-barista', 'sojowe'], amountMl: 200, prep: 'froth' },
    extras: [{ kind: 'syrup', syrupId: 'czekoladowy', amountMl: 30 }],
    equipment: ['wysoka szklanka', 'spieniacz lub prasa francuska', 'łyżeczka'],
    layers: [
      { name: 'sos czekoladowy', volumeMl: 20, color: '#3b1f14', kind: 'liquid' },
      { name: 'kawa z mlekiem i czekoladą', volumeMl: 190, color: '#8a5a3d', kind: 'liquid' },
      { name: 'pianka', volumeMl: 40, color: '#f3e6d6', kind: 'foam' },
    ],
    steps: [
      'Udekoruj ścianki szklanki sosem czekoladowym (zobacz: jak podać).',
      'Wlej resztę sosu na dno, dodaj gorącą kawę i wymieszaj.',
      'Spień mleko i wlej je powoli do kawy.',
      'Nałóż piankę i posyp startą czekoladą.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'Wzory z czekolady widać tylko na przezroczystej szklance.',
      decorations: [
        {
          kind: 'wall-pattern',
          name: 'smugi sosu czekoladowego',
          color: '#3b1f14',
          instruction:
            'Przechyl pustą szklankę i wlewaj sos cienką strużką przy brzegu, obracając ją: sos spłynie po ściankach. Wstaw szklankę na 5 minut do lodówki, żeby smugi zastygły.',
        },
        {
          kind: 'topping',
          name: 'starta czekolada',
          look: 'pieces',
          color: '#4a2a1c',
          instruction: 'Zetrzyj gorzką czekoladę na drobnych oczkach tarki prosto na piankę.',
        },
      ],
    },
  },
  {
    id: 'cold-brew-z-cynamonem',
    name: 'Cold brew z cynamonem',
    tagline: 'Gładkie cold brew z korzenną nutą',
    description:
      'Cold brew macerowane z laską cynamonu. Słodkawe, bez goryczy, z ciepłym korzennym aromatem. Podawane z dużą ilością lodu.',
    temperature: 'cold',
    prepTimeMin: 16 * 60 + 5,
    base: {
      methodId: 'cold-brew',
      amountMl: 100,
      note: 'Koncentrat cold brew, w którym macerował się cynamon.',
    },
    extras: [
      { kind: 'spice', name: 'laska cynamonu do maceracji', amount: '1 laska na 800 ml wody' },
      { kind: 'mixer', name: 'zimna woda', amount: '100 ml' },
      { kind: 'syrup', syrupId: 'cynamonowy', amountMl: 10, optional: true },
      { kind: 'ice', name: 'lód', amount: '4–5 kostek' },
    ],
    equipment: ['niska szklanka'],
    layers: [{ name: 'cold brew', volumeMl: 200, color: '#3d2416', kind: 'liquid' }],
    steps: [
      'Dodaj połamaną laskę cynamonu do kawy przed zalaniem wodą i maceruj razem (przepis w metodzie cold brew).',
      'Przecedź koncentrat.',
      'Wsyp lód do szklanki, wlej 100 ml koncentratu i 100 ml zimnej wody.',
      'Jeśli lubisz słodziej, dodaj syrop cynamonowy.',
    ],
    serving: {
      vessel: 'low-glass',
      why: 'Niska szklanka z dużą ilością lodu, jak do whisky: cold brew pije się powoli.',
      decorations: [
        {
          kind: 'garnish',
          name: 'laska cynamonu',
          look: 'stick',
          color: '#8b4a2b',
          instruction: 'Włóż laskę cynamonu do szklanki jako mieszadełko.',
        },
      ],
    },
    needsReview: true,
    reviewNote: 'Ilość cynamonu i moment dodania do sprawdzenia (krok 10 planu).',
  },
  {
    id: 'cold-brew-z-kardamonem',
    name: 'Cold brew z kardamonem',
    tagline: 'Cold brew z kardamonem na mleku owsianym',
    description:
      'Cold brew macerowane z kardamonem, podane na zimnym mleku owsianym. Aromatyczne, lekko cytrusowe i kremowe.',
    temperature: 'cold',
    prepTimeMin: 16 * 60 + 5,
    base: {
      methodId: 'cold-brew',
      amountMl: 100,
      note: 'Koncentrat cold brew, w którym macerował się kardamon.',
    },
    milk: { options: ['owsiane-barista', 'krowie', 'migdalowe'], amountMl: 100, prep: 'plain' },
    extras: [
      {
        kind: 'spice',
        name: 'zielony kardamon, lekko zgnieciony, do maceracji',
        amount: '4–5 strąków na 800 ml wody',
      },
      { kind: 'ice', name: 'lód', amount: '4–5 kostek' },
    ],
    equipment: ['wysoka szklanka', 'łyżka'],
    layers: [
      { name: 'mleko owsiane', volumeMl: 100, color: '#efe3cc', kind: 'liquid' },
      { name: 'cold brew', volumeMl: 100, color: '#3d2416', kind: 'liquid' },
    ],
    steps: [
      'Dodaj zgniecione strąki kardamonu do kawy przed zalaniem wodą i maceruj razem (przepis w metodzie cold brew).',
      'Przecedź koncentrat.',
      'Wsyp lód do szklanki i wlej zimne mleko.',
      'Wlewaj koncentrat powoli po grzbiecie łyżki, żeby powstały dwie warstwy.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'Wysoka szklanka pokazuje, jak ciemna kawa powoli przenika do mleka.',
      decorations: [
        {
          kind: 'topping',
          name: 'mielony kardamon',
          look: 'dust',
          color: '#8f8a5a',
          instruction: 'Posyp wierzch szczyptą mielonego kardamonu.',
          optional: true,
        },
      ],
    },
    needsReview: true,
    reviewNote: 'Ilość kardamonu do sprawdzenia (krok 10 planu).',
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    tagline: 'Kawa, mleko i gruba pianka w filiżance',
    description:
      'Włoski klasyk: mocna kawa, gorące mleko i dużo pianki, mniej więcej po równo. Mniejsze i mocniejsze niż latte.',
    temperature: 'hot',
    prepTimeMin: 10,
    base: {
      methodId: 'kawiarka',
      amountMl: 50,
      alternativeMethodIds: ['aeropress'],
      note: MOKA_AS_ESPRESSO,
    },
    milk: { options: ['krowie', 'owsiane-barista', 'sojowe'], amountMl: 120, prep: 'froth' },
    extras: [],
    equipment: ['filiżanka', 'spieniacz lub prasa francuska'],
    layers: [
      { name: 'kawa z mlekiem', volumeMl: 110, color: '#a9784f', kind: 'liquid' },
      { name: 'pianka', volumeMl: 70, color: '#f6ecdd', kind: 'foam' },
    ],
    steps: [
      'Zaparz kawę i wlej ją do ogrzanej filiżanki.',
      'Spień mleko na gęstą piankę.',
      'Wlewaj mleko z wysokości, a pod koniec obniż dzbanek, żeby pianka wypłynęła na wierzch.',
      'Posyp kakao lub cynamonem.',
    ],
    serving: {
      vessel: 'cup',
      why: 'Gruba porcelanowa filiżanka trzyma ciepło. Warstw nie widać, liczy się pianka na wierzchu.',
      decorations: [
        {
          kind: 'topping',
          name: 'kakao lub cynamon',
          look: 'dust',
          color: '#6b3e26',
          instruction: 'Przesiej szczyptę przez sitko nad pianką.',
          optional: true,
        },
      ],
    },
  },
  {
    id: 'mrozona-latte-karmelowa',
    name: 'Mrożona latte karmelowa',
    tagline: 'Karmel, zimne mleko i kawa z lodem',
    description:
      'Mrożona latte w warstwach: karmel na dnie, zimne mleko z lodem i kawa na wierzchu. Szklankę zdobią karmelowe smugi.',
    temperature: 'cold',
    prepTimeMin: 12,
    base: {
      methodId: 'kawiarka',
      amountMl: 50,
      alternativeMethodIds: ['aeropress'],
      note: MOKA_AS_ESPRESSO,
    },
    milk: {
      options: ['krowie', 'owsiane-barista', 'migdalowe', 'sojowe'],
      amountMl: 150,
      prep: 'plain',
    },
    extras: [
      { kind: 'syrup', syrupId: 'karmelowy', amountMl: 20 },
      { kind: 'ice', name: 'lód', amount: 'pełna szklanka' },
    ],
    equipment: ['wysoka szklanka', 'łyżka'],
    layers: [
      { name: 'syrop karmelowy', volumeMl: 20, color: '#b8692a', kind: 'liquid' },
      { name: 'zimne mleko', volumeMl: 150, color: '#f5eee2', kind: 'liquid' },
      { name: 'kawa', volumeMl: 50, color: COFFEE_LIGHTER, kind: 'liquid' },
    ],
    steps: [
      'Zrób karmelowe smugi na ściankach szklanki (zobacz: jak podać).',
      'Wlej resztę syropu na dno i wsyp lód.',
      'Wlej zimne mleko.',
      'Zaparz kawę i wlewaj ją powoli po grzbiecie łyżki na mleko.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'Przezroczysta szklanka pokazuje karmel, mleko i kawę w osobnych warstwach.',
      decorations: [
        {
          kind: 'wall-pattern',
          name: 'smugi karmelu',
          color: '#b8692a',
          instruction:
            'Gęstym syropem lub sosem karmelowym zrób kilka pionowych smug po wewnętrznej stronie szklanki, obracając ją.',
        },
      ],
    },
  },
  {
    id: 'affogato',
    name: 'Affogato',
    tagline: 'Gałka lodów zalana gorącą kawą',
    description:
      'Włoski deser w kilka minut: gorąca, mocna kawa wylana na gałkę lodów waniliowych. „Affogato” znaczy „utopiony”.',
    temperature: 'cold',
    prepTimeMin: 10,
    base: {
      methodId: 'kawiarka',
      amountMl: 40,
      alternativeMethodIds: ['aeropress'],
      note: 'Kawa z kawiarki zamiast espresso, podana gorąca.',
    },
    extras: [
      { kind: 'ice-cream', name: 'lody waniliowe (mogą być roślinne)', amount: '1–2 gałki' },
    ],
    equipment: ['pucharek lub niska szklanka', 'łyżeczka'],
    layers: [
      { name: 'kawa', volumeMl: 40, color: COFFEE, kind: 'liquid' },
      { name: 'lody waniliowe', volumeMl: 100, color: '#f7efd9', kind: 'solid' },
    ],
    steps: [
      'Schłodź pucharek przez kilka minut w zamrażarce.',
      'Nałóż gałkę lodów.',
      'Zaparz kawę i od razu wylej ją na lody.',
      'Jedz łyżeczką, zanim lody się roztopią.',
    ],
    serving: {
      vessel: 'dessert-glass',
      why: 'To deser, je się go łyżeczką. Pucharek albo niska szklanka.',
      decorations: [
        {
          kind: 'topping',
          name: 'posiekane orzechy laskowe',
          look: 'pieces',
          color: '#a8743f',
          instruction: 'Posyp lody garścią posiekanych, uprażonych orzechów.',
          optional: true,
        },
      ],
    },
    needsReview: true,
    reviewNote: 'Na ciepło czy na zimno? Przyjęto „na zimno” (deser z lodami), choć kawa jest gorąca.',
  },
  {
    id: 'americano',
    name: 'Americano z kawiarki',
    tagline: 'Mocna kawa dolana gorącą wodą',
    description:
      'Kawa z kawiarki rozcieńczona gorącą wodą. Łagodniejsza niż sama kawiarka, a pełniejsza niż przelew. Dobra, gdy masz ochotę na dużą czarną kawę.',
    temperature: 'hot',
    prepTimeMin: 10,
    base: { methodId: 'kawiarka', amountMl: 60, alternativeMethodIds: ['aeropress'] },
    extras: [{ kind: 'mixer', name: 'gorąca woda', amount: '120 ml' }],
    equipment: ['filiżanka lub kubek', 'czajnik'],
    layers: [{ name: 'kawa', volumeMl: 180, color: '#3f2416', kind: 'liquid' }],
    steps: [
      'Zagotuj wodę i odczekaj chwilę.',
      'Wlej gorącą wodę do filiżanki.',
      'Zaparz kawę w kawiarce i wlej ją na wodę: tak na wierzchu zostanie odrobina pianki.',
    ],
    serving: {
      vessel: 'cup',
      why: 'Duża porcelanowa filiżanka trzyma ciepło.',
      decorations: [],
    },
  },
  {
    id: 'kawa-mrozona-z-dripa',
    name: 'Kawa mrożona z dripa',
    tagline: 'Przelew parzony prosto na lód',
    description:
      'Metoda japońska: część wody zastępujesz lodem i parzysz drip prosto na niego. Kawa chłodzi się od razu i zachowuje owocowy aromat. Najlepsza z jasno palonych ziaren.',
    temperature: 'cold',
    prepTimeMin: 8,
    base: {
      methodId: 'drip',
      amountMl: 150,
      alternativeMethodIds: ['chemex'],
      note: 'Zaparz mocniej niż zwykle: 15 g kawy na 150 ml gorącej wody i 100 g lodu w dzbanku.',
    },
    extras: [
      { kind: 'ice', name: 'lód do dzbanka', amount: '100 g' },
      { kind: 'ice', name: 'lód do szklanki', amount: '3–4 kostki' },
    ],
    equipment: ['dzbanek', 'niska szklanka'],
    layers: [{ name: 'kawa mrożona', volumeMl: 220, color: '#6b3a1f', kind: 'liquid' }],
    steps: [
      'Wsyp 100 g lodu do dzbanka i postaw na nim drip z filtrem.',
      'Zmiel 15 g kawy nieco drobniej niż zwykle.',
      'Parz jak zwykły drip, ale tylko 150 ml gorącej wody.',
      'Zamieszaj, aż lód się roztopi, i przelej kawę do szklanki z lodem.',
    ],
    serving: {
      vessel: 'low-glass',
      why: 'Niska szklanka z lodem. Klarowna, rubinowa kawa ładnie wygląda pod światło.',
      decorations: [
        {
          kind: 'garnish',
          name: 'skórka cytryny',
          look: 'peel',
          color: '#f2cf3a',
          instruction: 'Skręć cienki pasek skórki cytryny nad szklanką i połóż go na lodzie.',
          optional: true,
        },
      ],
    },
  },
  {
    id: 'cafe-au-lait',
    name: 'Café au lait',
    tagline: 'Kawa z prasy i gorące mleko po równo',
    description:
      'Francuskie śniadanie: mocna kawa z prasy, wymieszana pół na pół z gorącym mlekiem. Bez pianki, w dużej filiżance albo miseczce.',
    temperature: 'hot',
    prepTimeMin: 12,
    base: { methodId: 'prasa-francuska', amountMl: 120 },
    milk: {
      options: ['krowie', 'owsiane-barista', 'sojowe', 'owsiane-smakowe'],
      amountMl: 120,
      prep: 'warm',
    },
    extras: [],
    equipment: ['duża filiżanka lub miseczka', 'garnek do mleka'],
    layers: [{ name: 'kawa z mlekiem', volumeMl: 240, color: '#b48a63', kind: 'liquid' }],
    steps: [
      'Zaparz kawę w prasie francuskiej.',
      'Podgrzej mleko do ok. 65°C, nie gotuj go.',
      'Wlej kawę i mleko do filiżanki jednocześnie, z dwóch naczyń naraz.',
    ],
    serving: {
      vessel: 'cup',
      why: 'We Francji pije się ją z miseczki, do maczania rogalika.',
      decorations: [],
    },
  },
  {
    id: 'kawa-po-wiedensku',
    name: 'Kawa po wiedeńsku',
    tagline: 'Mocna kawa pod czapą bitej śmietany',
    description:
      'Wiedeński klasyk: mocna, gorąca kawa w szklance, a na niej gruba warstwa bitej śmietany oprószonej kakao. Pije się gorącą kawę przez zimną śmietanę.',
    temperature: 'hot',
    prepTimeMin: 12,
    base: {
      methodId: 'kawiarka',
      amountMl: 100,
      alternativeMethodIds: ['aeropress'],
      note: 'Mocna kawa z kawiarki. Jeśli wolisz łagodniej, dolej trochę gorącej wody.',
    },
    extras: [
      { kind: 'cream', name: 'śmietanka 30%, ubita', amount: '100 ml', dairy: true },
      { kind: 'other', name: 'cukier puder', amount: '1 łyżeczka' },
    ],
    equipment: ['wysoka szklanka', 'mikser lub trzepaczka'],
    layers: [
      { name: 'kawa', volumeMl: 150, color: '#3f2416', kind: 'liquid' },
      { name: 'bita śmietana', volumeMl: 100, color: '#fffaf2', kind: 'foam' },
    ],
    steps: [
      'Ubij schłodzoną śmietankę z cukrem pudrem na sztywno.',
      'Zaparz mocną kawę i wlej ją do szklanki. Jeśli lubisz, osłódź ją.',
      'Nałóż bitą śmietanę łyżką albo wyciśnij ją rękawem cukierniczym.',
      'Oprósz kakao.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'Szklanka pokazuje ostrą granicę między czarną kawą a białą śmietaną.',
      decorations: [
        {
          kind: 'topping',
          name: 'kakao',
          look: 'dust',
          color: '#6b3e26',
          instruction: 'Przesiej odrobinę kakao przez sitko nad śmietaną.',
        },
      ],
    },
  },
  {
    id: 'bicerin',
    name: 'Bicerin',
    tagline: 'Czekolada, kawa i śmietanka w trzech warstwach',
    description:
      'Turyński klasyk w małej szklance: gęsta gorąca czekolada na dnie, kawa w środku i lekko ubita śmietanka na górze. Pije się bez mieszania, warstwa po warstwie.',
    temperature: 'hot',
    prepTimeMin: 15,
    base: {
      methodId: 'kawiarka',
      amountMl: 40,
      alternativeMethodIds: ['aeropress'],
      note: MOKA_AS_ESPRESSO,
    },
    milk: { options: ['krowie'], amountMl: 50, prep: 'warm' },
    extras: [
      { kind: 'other', name: 'gorzka czekolada', amount: '30 g' },
      { kind: 'cream', name: 'śmietanka 30%, lekko ubita', amount: '40 ml', dairy: true },
    ],
    equipment: ['mała szklanka', 'rondelek', 'trzepaczka', 'łyżeczka'],
    layers: [
      { name: 'gorąca czekolada', volumeMl: 50, color: '#3a1d12', kind: 'liquid' },
      { name: 'kawa', volumeMl: 40, color: '#5a3424', kind: 'liquid' },
      { name: 'śmietanka', volumeMl: 30, color: '#fbf5ea', kind: 'foam' },
    ],
    steps: [
      'Rozpuść czekoladę w gorącym mleku i mieszaj, aż zgęstnieje.',
      'Wlej czekoladę do ogrzanej szklanki.',
      'Zaparz kawę i wlewaj ją powoli po grzbiecie łyżeczki na czekoladę.',
      'Ubij śmietankę tylko lekko, żeby była jeszcze płynna, i połóż ją łyżką na wierzch.',
    ],
    serving: {
      vessel: 'small-glass',
      why: 'Mała przezroczysta szklanka: trzy warstwy to cały urok tego napoju.',
      decorations: [],
    },
  },
  {
    id: 'kawa-mrozona-z-lodami',
    name: 'Kawa mrożona z lodami',
    tagline: 'Kawiarniany klasyk: zimna kawa, lody i bita śmietana',
    description:
      'Kawa mrożona jak w polskiej kawiarni: schłodzona kawa wylana na lody waniliowe, z czapą bitej śmietany i polewą czekoladową.',
    temperature: 'cold',
    prepTimeMin: 25,
    base: {
      methodId: 'kawiarka',
      amountMl: 120,
      alternativeMethodIds: ['aeropress'],
      note: 'Mocna kawa z kawiarki, schłodzona przed dodaniem.',
    },
    extras: [
      { kind: 'ice-cream', name: 'lody waniliowe', amount: '2 gałki' },
      { kind: 'cream', name: 'śmietanka 30%, ubita', amount: '80 ml', dairy: true },
      { kind: 'syrup', syrupId: 'czekoladowy', amountMl: 10, optional: true },
    ],
    equipment: ['wysoka szklanka', 'mikser lub trzepaczka', 'długa łyżeczka', 'słomka'],
    layers: [
      { name: 'lody waniliowe', volumeMl: 100, color: '#f7efd9', kind: 'solid' },
      { name: 'kawa', volumeMl: 120, color: COFFEE_LIGHTER, kind: 'liquid' },
      { name: 'bita śmietana', volumeMl: 80, color: '#fffaf2', kind: 'foam' },
    ],
    steps: [
      'Zaparz kawę i schłódź ją: przelej do słoika i wstaw na 15 minut do lodówki albo do miski z lodem.',
      'Ubij śmietankę na sztywno.',
      'Nałóż lody do szklanki i zalej je zimną kawą.',
      'Wyłóż na wierzch bitą śmietanę i polej ją sosem czekoladowym.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'Wysoka szklanka z długą łyżeczką i słomką: najpierw lody, potem kawa.',
      decorations: [
        {
          kind: 'topping',
          name: 'polewa czekoladowa',
          look: 'drizzle',
          color: '#3b1f14',
          instruction: 'Polej bitą śmietanę cienką strużką sosu czekoladowego.',
          optional: true,
        },
      ],
    },
  },
];
