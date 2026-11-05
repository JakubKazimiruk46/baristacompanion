import type { Drink } from './types';

// Użytkownicy nie mają ekspresu: tam, gdzie przepis wymaga espresso, bazą jest kawa z kawiarki.
export const MOKA_AS_ESPRESSO = 'Kawa z kawiarki zamiast espresso. Z mlekiem smakuje bardzo podobnie.';

export const COFFEE = '#4a2a1a';
export const COFFEE_LIGHTER = '#5a3424';

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
      {
        kind: 'mixer',
        ingredientId: 'tonik',
        name: 'tonik, dobrze schłodzony',
        amount: { value: 150, unit: 'ml' },
      },
      { kind: 'ice', ingredientId: 'lod', name: 'lód', amount: { value: 4, max: 5, unit: 'cube' } },
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
        ingredientId: 'sok-pomaranczowy',
        name: 'sok pomarańczowy, najlepiej świeżo wyciśnięty',
        amount: { value: 100, unit: 'ml' },
      },
      { kind: 'ice', ingredientId: 'lod', name: 'lód', amount: { value: 3, max: 4, unit: 'cube' } },
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
      alternativeMethodIds: ['aeropress', 'phin'],
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
      {
        kind: 'fruit',
        ingredientId: 'maliny',
        name: 'maliny (mogą być mrożone)',
        amount: { value: 60, unit: 'g' },
        blended: true,
      },
      { kind: 'syrup', syrupId: 'malinowy', amountMl: 10, optional: true },
      { kind: 'ice', ingredientId: 'lod', name: 'lód', amount: { value: 3, max: 4, unit: 'cube' } },
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
        ingredientId: 'lody-waniliowe',
        name: 'lody waniliowe (mogą być roślinne)',
        amount: { value: 2, unit: 'scoop' },
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
      {
        kind: 'spice',
        ingredientId: 'laska-cynamonu',
        name: 'laska cynamonu do maceracji',
        amount: '1 laska na 800 ml wody',
      },
      {
        kind: 'mixer',
        ingredientId: 'woda',
        name: 'zimna woda',
        amount: { value: 100, unit: 'ml' },
      },
      { kind: 'syrup', syrupId: 'cynamonowy', amountMl: 10, optional: true },
      { kind: 'ice', ingredientId: 'lod', name: 'lód', amount: { value: 4, max: 5, unit: 'cube' } },
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
        ingredientId: 'kardamon',
        name: 'zielony kardamon, lekko zgnieciony, do maceracji',
        amount: '4–5 strąków na 800 ml wody',
      },
      { kind: 'ice', ingredientId: 'lod', name: 'lód', amount: { value: 4, max: 5, unit: 'cube' } },
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
      { kind: 'ice', ingredientId: 'lod', name: 'lód', amount: 'pełna szklanka' },
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
      {
        kind: 'ice-cream',
        ingredientId: 'lody-waniliowe',
        name: 'lody waniliowe (mogą być roślinne)',
        amount: { value: 1, max: 2, unit: 'scoop' },
      },
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
    extras: [
      {
        kind: 'mixer',
        ingredientId: 'woda',
        name: 'gorąca woda',
        amount: { value: 120, unit: 'ml' },
      },
    ],
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
      {
        kind: 'ice',
        ingredientId: 'lod',
        name: 'lód do dzbanka',
        amount: { value: 100, unit: 'g' },
      },
      {
        kind: 'ice',
        ingredientId: 'lod',
        name: 'lód do szklanki',
        amount: { value: 3, max: 4, unit: 'cube' },
      },
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
      {
        kind: 'cream',
        ingredientId: 'smietanka-30',
        name: 'śmietanka 30%, ubita',
        amount: { value: 100, unit: 'ml' },
        dairy: true,
      },
      {
        kind: 'other',
        ingredientId: 'cukier-puder',
        name: 'cukier puder',
        amount: { value: 1, unit: 'tsp' },
      },
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
      {
        kind: 'other',
        ingredientId: 'gorzka-czekolada',
        name: 'gorzka czekolada',
        amount: { value: 30, unit: 'g' },
      },
      {
        kind: 'cream',
        ingredientId: 'smietanka-30',
        name: 'śmietanka 30%, lekko ubita',
        amount: { value: 40, unit: 'ml' },
        dairy: true,
      },
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
      {
        kind: 'ice-cream',
        ingredientId: 'lody-waniliowe',
        name: 'lody waniliowe',
        amount: { value: 2, unit: 'scoop' },
      },
      {
        kind: 'cream',
        ingredientId: 'smietanka-30',
        name: 'śmietanka 30%, ubita',
        amount: { value: 80, unit: 'ml' },
        dairy: true,
      },
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
  {
    id: 'kawa-po-turecku',
    name: 'Kawa po turecku',
    tagline: 'Gęsta kawa z tygielka, z pianką i kardamonem',
    description:
      'Mocna, gęsta kawa parzona w tygielku, często z cukrem i szczyptą kardamonu. Podawana w małej filiżance ze szklanką zimnej wody i czymś słodkim. Fusy zostają na dnie.',
    temperature: 'hot',
    prepTimeMin: 8,
    base: {
      methodId: 'tygielek',
      amountMl: 60,
      note: 'Cukier i kardamon wsypuje się do tygielka razem z kawą, przed podgrzewaniem.',
    },
    extras: [
      {
        kind: 'other',
        ingredientId: 'cukier',
        name: 'cukier, do tygielka',
        amount: { value: 1, unit: 'tsp' },
        optional: true,
      },
      {
        kind: 'spice',
        ingredientId: 'kardamon-mielony',
        name: 'mielony kardamon, do tygielka',
        amount: 'szczypta',
        optional: true,
      },
      {
        kind: 'mixer',
        ingredientId: 'woda',
        name: 'zimna woda do popicia',
        amount: { value: 150, unit: 'ml' },
      },
    ],
    equipment: ['tygielek (cezve)', 'mała filiżanka', 'szklanka na wodę'],
    layers: [
      { name: 'kawa z fusami', volumeMl: 50, color: '#3a2014', kind: 'liquid' },
      { name: 'pianka', volumeMl: 10, color: '#8a5a3a', kind: 'foam' },
    ],
    steps: [
      'Wsyp do tygielka kawę, a jeśli lubisz, także cukier i szczyptę kardamonu.',
      'Zaparz kawę w tygielku (przepis w metodzie).',
      'Rozłóż piankę łyżeczką do filiżanki, a potem powoli dolej kawę.',
      'Podaj ze szklanką zimnej wody i odczekaj minutę, aż fusy opadną.',
    ],
    serving: {
      vessel: 'espresso-cup',
      why: 'Mała filiżanka, bo kawa jest gęsta i mocna. Obok szklanka zimnej wody i coś słodkiego, np. lokum.',
      decorations: [],
    },
    needsReview: true,
    reviewNote: 'Ilość cukru i kardamonu do sprawdzenia.',
  },
  {
    id: 'kawa-po-wietnamsku',
    name: 'Kawa po wietnamsku',
    tagline: 'Kawa z phin na mleku skondensowanym, z lodem',
    description:
      'Cà phê sữa đá: mocna kawa kapie z phin prosto na słodkie mleko skondensowane, a po zamieszaniu trafia na lód. Słodka, gęsta i bardzo orzeźwiająca.',
    temperature: 'cold',
    prepTimeMin: 10,
    base: {
      methodId: 'phin',
      amountMl: 70,
      alternativeMethodIds: ['kawiarka', 'aeropress'],
      note: 'Bez phin zrób mocną kawę w kawiarce albo w AeroPressie.',
    },
    milk: { options: ['skondensowane', 'skondensowane-kokosowe'], amountMl: 30, prep: 'plain' },
    extras: [
      {
        kind: 'ice',
        ingredientId: 'lod',
        name: 'lód',
        amount: { value: 5, max: 6, unit: 'cube' },
      },
    ],
    equipment: ['phin', 'niska szklanka', 'długa łyżeczka'],
    layers: [
      { name: 'mleko skondensowane', volumeMl: 30, color: '#f1e2bd', kind: 'liquid' },
      { name: 'kawa', volumeMl: 70, color: '#2f1a10', kind: 'liquid' },
    ],
    steps: [
      'Wlej mleko skondensowane na dno szklanki.',
      'Postaw phin na szklance i zaparz kawę prosto na mleko. Zanim zamieszasz, pokaż gościom dwie warstwy.',
      'Zamieszaj, aż kawa połączy się z mlekiem i nabierze karmelowego koloru.',
      'Wsyp lód i zamieszaj jeszcze raz.',
    ],
    serving: {
      vessel: 'low-glass',
      why: 'Niska szklanka mieści lód. Przed zamieszaniem widać białą i czarną warstwę, a potem karmelowy kolor.',
      decorations: [],
    },
    needsReview: true,
    reviewNote: 'Proporcja mleka skondensowanego do kawy do sprawdzenia: w Wietnamie bywa nawet 1:2.',
  },
  {
    id: 'cortado',
    name: 'Cortado',
    tagline: 'Mocna kawa „przecięta” odrobiną ciepłego mleka',
    description:
      'Hiszpańska kawa pół na pół: mocna kawa i tyle samo ciepłego, lekko spienionego mleka. Mniej mleka niż w cappuccino, więcej kawy w smaku.',
    temperature: 'hot',
    prepTimeMin: 8,
    base: {
      methodId: 'kawiarka',
      amountMl: 40,
      alternativeMethodIds: ['aeropress'],
      note: MOKA_AS_ESPRESSO,
    },
    milk: { options: ['krowie', 'owsiane-barista', 'sojowe'], amountMl: 40, prep: 'froth' },
    extras: [],
    equipment: ['mała szklanka', 'spieniacz lub prasa francuska'],
    layers: [
      { name: 'kawa z mlekiem', volumeMl: 70, color: '#9a6a45', kind: 'liquid' },
      { name: 'cienka pianka', volumeMl: 15, color: '#efe2cf', kind: 'foam' },
    ],
    steps: [
      'Zaparz kawę i wlej ją do małej szklanki.',
      'Podgrzej mleko do ok. 60°C i spień je tylko lekko: pianki ma być mało.',
      'Wlej mleko do kawy, mniej więcej pół na pół.',
    ],
    serving: {
      vessel: 'small-glass',
      why: 'W Hiszpanii cortado podaje się w małej szklance. Widać w niej, ile jest kawy, a ile mleka.',
      decorations: [],
    },
  },
  {
    id: 'kawa-z-miodem-i-cynamonem',
    name: 'Kawa z miodem i cynamonem',
    tagline: 'Rozgrzewająca kawa z mlekiem, miodem i cynamonem',
    description:
      'Kawa z prasy z ciepłym mlekiem, osłodzona miodem i doprawiona cynamonem. Na zimowe popołudnie, bez syropów ze sklepu.',
    temperature: 'hot',
    prepTimeMin: 12,
    base: {
      methodId: 'prasa-francuska',
      amountMl: 150,
      alternativeMethodIds: ['kawiarka', 'drip', 'aeropress'],
      note: 'Pasuje każda mocniejsza kawa. Szczyptę cynamonu możesz wsypać już do zmielonej kawy.',
    },
    milk: { options: ['krowie', 'owsiane-barista', 'sojowe', 'migdalowe'], amountMl: 80, prep: 'warm' },
    extras: [
      { kind: 'other', ingredientId: 'miod', name: 'miód', amount: { value: 1, max: 2, unit: 'tsp' } },
      { kind: 'spice', ingredientId: 'cynamon-mielony', name: 'cynamon mielony', amount: 'szczypta' },
    ],
    equipment: ['kubek', 'garnek do mleka', 'łyżeczka'],
    layers: [{ name: 'kawa z mlekiem i miodem', volumeMl: 230, color: '#a97b52', kind: 'liquid' }],
    steps: [
      'Zaparz kawę i wlej ją do kubka.',
      'Odczekaj minutę i rozmieszaj w kawie miód: we wrzątku traci aromat.',
      'Podgrzej mleko z cynamonem, nie gotuj go.',
      'Wlej mleko do kawy i posyp szczyptą cynamonu.',
    ],
    serving: {
      vessel: 'cup',
      why: 'Duża filiżanka albo kubek trzyma ciepło.',
      decorations: [
        {
          kind: 'topping',
          name: 'cynamon',
          look: 'dust',
          color: '#8b4a2b',
          instruction: 'Oprósz wierzch szczyptą cynamonu przez sitko.',
        },
      ],
    },
  },
  {
    id: 'latte-piernikowa',
    name: 'Latte piernikowa',
    tagline: 'Świąteczna latte z syropem piernikowym',
    description:
      'Latte z domowym syropem z przyprawą do piernika: cynamon, imbir, goździki i gałka. Smakuje jak świąteczne pierniki.',
    temperature: 'hot',
    prepTimeMin: 12,
    base: {
      methodId: 'kawiarka',
      amountMl: 40,
      alternativeMethodIds: ['aeropress'],
      note: MOKA_AS_ESPRESSO,
    },
    milk: { options: ['krowie', 'owsiane-barista', 'sojowe'], amountMl: 200, prep: 'froth' },
    extras: [{ kind: 'syrup', syrupId: 'piernikowy', amountMl: 20 }],
    equipment: ['wysoka szklanka lub duży kubek', 'spieniacz lub prasa francuska'],
    layers: [
      { name: 'syrop piernikowy', volumeMl: 20, color: '#7a3f1d', kind: 'liquid' },
      { name: 'kawa z mlekiem', volumeMl: 180, color: '#b98a5f', kind: 'liquid' },
      { name: 'pianka', volumeMl: 50, color: '#f6ebdc', kind: 'foam' },
    ],
    steps: [
      'Wlej syrop piernikowy na dno szklanki.',
      'Zaparz kawę i wlej ją na syrop.',
      'Spień mleko i wlej je powoli do kawy, a na koniec nałóż piankę.',
      'Oprósz piankę przyprawą do piernika.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'W szklance widać ciemny syrop na dnie i grubą piankę z przyprawą.',
      decorations: [
        {
          kind: 'topping',
          name: 'przyprawa do piernika',
          look: 'dust',
          color: '#7a4a2a',
          instruction: 'Przesiej szczyptę przyprawy do piernika (albo cynamonu) przez sitko nad pianką.',
        },
      ],
    },
  },
  {
    id: 'latte-dyniowa',
    name: 'Latte dyniowa',
    tagline: 'Jesienna latte z dynią i korzennymi przyprawami',
    description:
      'Domowa wersja pumpkin spice latte: syrop z puree z dyni i przypraw, kawa i spienione mleko oprószone cynamonem.',
    temperature: 'hot',
    prepTimeMin: 12,
    base: {
      methodId: 'kawiarka',
      amountMl: 40,
      alternativeMethodIds: ['aeropress'],
      note: MOKA_AS_ESPRESSO,
    },
    milk: { options: ['krowie', 'owsiane-barista', 'sojowe'], amountMl: 180, prep: 'froth' },
    extras: [{ kind: 'syrup', syrupId: 'dyniowy', amountMl: 25 }],
    equipment: ['duża filiżanka lub kubek', 'spieniacz lub prasa francuska'],
    layers: [
      { name: 'kawa z mlekiem i dynią', volumeMl: 190, color: '#c58d58', kind: 'liquid' },
      { name: 'pianka', volumeMl: 45, color: '#f7ecdb', kind: 'foam' },
    ],
    steps: [
      'Wlej syrop dyniowy do filiżanki.',
      'Zaparz kawę, wlej ją na syrop i wymieszaj.',
      'Spień mleko i wlej je do kawy, a na koniec nałóż piankę.',
      'Oprósz cynamonem.',
    ],
    serving: {
      vessel: 'cup',
      why: 'Duża filiżanka albo kubek: jesienna kawa do trzymania w dłoniach.',
      decorations: [
        {
          kind: 'topping',
          name: 'cynamon',
          look: 'dust',
          color: '#8b4a2b',
          instruction: 'Oprósz piankę szczyptą cynamonu przez sitko.',
        },
      ],
    },
  },
  {
    id: 'latte-lawendowa',
    name: 'Latte lawendowa',
    tagline: 'Kwiatowa latte z syropem lawendowym',
    description:
      'Delikatna latte z syropem z suszonej lawendy: kwiatowa, lekko ziołowa i bardzo elegancka. Pasuje do niej jasno palona, kwiatowa kawa.',
    temperature: 'hot',
    prepTimeMin: 12,
    base: {
      methodId: 'kawiarka',
      amountMl: 40,
      alternativeMethodIds: ['aeropress'],
      note: MOKA_AS_ESPRESSO,
    },
    milk: { options: ['owsiane-barista', 'krowie', 'sojowe'], amountMl: 200, prep: 'froth' },
    extras: [{ kind: 'syrup', syrupId: 'lawendowy', amountMl: 15 }],
    equipment: ['wysoka szklanka', 'spieniacz lub prasa francuska'],
    layers: [
      { name: 'syrop lawendowy', volumeMl: 15, color: '#8e72b0', kind: 'liquid' },
      { name: 'kawa z mlekiem', volumeMl: 185, color: '#c7a585', kind: 'liquid' },
      { name: 'pianka', volumeMl: 50, color: '#f6eef0', kind: 'foam' },
    ],
    steps: [
      'Wlej syrop lawendowy na dno szklanki.',
      'Zaparz kawę i wlej ją na syrop.',
      'Spień mleko i wlej je powoli do kawy, a na koniec nałóż piankę.',
      'Posyp piankę kilkoma kwiatkami lawendy.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'W szklance widać fioletowy syrop na dnie, który powoli miesza się z kawą.',
      decorations: [
        {
          kind: 'topping',
          name: 'suszona lawenda',
          look: 'pieces',
          color: '#7d63a8',
          instruction: 'Posyp piankę szczyptą suszonej lawendy spożywczej. Wystarczy kilka kwiatków.',
          optional: true,
        },
      ],
    },
  },
  {
    id: 'biala-mocha',
    name: 'Biała mocha',
    tagline: 'Latte z roztopioną białą czekoladą',
    description:
      'Słodka, kremowa kawa z białą czekoladą rozpuszczoną w gorącej kawie i spienionym mlekiem. Dla tych, którzy lubią kawę deserową.',
    temperature: 'hot',
    prepTimeMin: 12,
    base: {
      methodId: 'kawiarka',
      amountMl: 40,
      alternativeMethodIds: ['aeropress'],
      note: MOKA_AS_ESPRESSO,
    },
    milk: { options: ['krowie', 'owsiane-barista', 'sojowe'], amountMl: 200, prep: 'froth' },
    extras: [
      {
        kind: 'other',
        ingredientId: 'biala-czekolada',
        name: 'biała czekolada, posiekana',
        amount: { value: 30, unit: 'g' },
        // Biała czekolada ma mleko w proszku.
        dairy: true,
      },
    ],
    equipment: ['wysoka szklanka', 'spieniacz lub prasa francuska', 'łyżeczka'],
    layers: [
      { name: 'kawa z białą czekoladą', volumeMl: 60, color: '#a77a52', kind: 'liquid' },
      { name: 'mleko', volumeMl: 150, color: '#e8d5b9', kind: 'liquid' },
      { name: 'pianka', volumeMl: 40, color: '#fbf5ec', kind: 'foam' },
    ],
    steps: [
      'Wsyp posiekaną czekoladę do szklanki.',
      'Zaparz kawę, wlej ją na czekoladę i mieszaj, aż czekolada się rozpuści.',
      'Spień mleko i wlej je powoli do kawy, a na koniec nałóż piankę.',
      'Posyp startą białą czekoladą.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'W szklance widać, jak mleko powoli łączy się z kawą.',
      decorations: [
        {
          kind: 'topping',
          name: 'starta biała czekolada',
          look: 'pieces',
          color: '#d9c09a',
          instruction: 'Zetrzyj odrobinę białej czekolady na drobnych oczkach tarki prosto na piankę.',
          optional: true,
        },
      ],
    },
  },
  {
    id: 'kawa-z-jajkiem',
    name: 'Kawa z jajkiem po wietnamsku',
    tagline: 'Kawa z phin pod kremem z żółtka',
    description:
      'Specjalność Hanoi (cà phê trứng): mocna kawa z phin, a na niej gęsty, słodki krem z żółtka ubitego z mlekiem skondensowanym. Smakuje jak płynne tiramisu.',
    temperature: 'hot',
    prepTimeMin: 15,
    base: {
      methodId: 'phin',
      amountMl: 50,
      alternativeMethodIds: ['kawiarka', 'aeropress'],
      note: 'Bez phin zrób mocną kawę w kawiarce.',
    },
    milk: { options: ['skondensowane'], amountMl: 30, prep: 'plain' },
    extras: [
      {
        kind: 'other',
        ingredientId: 'jajka',
        name: 'żółtko z bardzo świeżego jajka (najlepiej pasteryzowanego)',
        amount: { value: 1, unit: 'piece' },
        dairy: true,
      },
    ],
    equipment: ['phin', 'mała szklanka', 'mikser lub trzepaczka', 'miska z gorącą wodą'],
    layers: [
      { name: 'kawa', volumeMl: 50, color: '#2f1a10', kind: 'liquid' },
      { name: 'krem z żółtka', volumeMl: 50, color: '#f1d79a', kind: 'foam' },
    ],
    steps: [
      'Wstaw szklankę do miski z gorącą wodą, żeby kawa nie wystygła.',
      'Zaparz kawę z phin prosto do szklanki.',
      'Ubij żółtko z mlekiem skondensowanym mikserem na jasny, gęsty krem (ok. 3 minuty).',
      'Nałóż krem łyżką na kawę. Pije się łyżeczką: najpierw krem, potem kawa.',
    ],
    serving: {
      vessel: 'small-glass',
      why: 'Mała szklanka pokazuje czarną kawę pod złotym kremem.',
      decorations: [
        {
          kind: 'topping',
          name: 'kakao',
          look: 'dust',
          color: '#6b3e26',
          instruction: 'Oprósz krem odrobiną kakao.',
          optional: true,
        },
      ],
    },
    needsReview: true,
    reviewNote:
      'Surowe żółtko: przepis każe użyć świeżego, najlepiej pasteryzowanego jajka. Czy dodać ostrzeżenie dla kobiet w ciąży i małych dzieci?',
  },
  {
    id: 'frappe',
    name: 'Frappé',
    tagline: 'Zmiksowana mrożona kawa z mlekiem i lodem',
    description:
      'Kawa zmiksowana z lodem i mlekiem na gęsty, spieniony napój. Kawiarniany klasyk na upał, który w domu zrobisz w blenderze w dwie minuty.',
    temperature: 'cold',
    prepTimeMin: 15,
    base: {
      methodId: 'kawiarka',
      amountMl: 60,
      alternativeMethodIds: ['aeropress', 'cold-brew'],
      note: 'Kawa z kawiarki, schłodzona. Z gotowym koncentratem cold brew nie trzeba czekać.',
    },
    milk: { options: ['krowie', 'owsiane-barista', 'sojowe', 'migdalowe'], amountMl: 100, prep: 'blend' },
    extras: [
      {
        kind: 'ice',
        ingredientId: 'lod',
        name: 'lód do blendera',
        amount: { value: 6, max: 8, unit: 'cube' },
        blended: true,
      },
      { kind: 'syrup', syrupId: 'karmelowy', amountMl: 15, optional: true },
    ],
    equipment: ['blender', 'wysoka szklanka', 'słomka'],
    layers: [
      { name: 'frappé', volumeMl: 220, color: '#b8875c', kind: 'liquid' },
      { name: 'pianka', volumeMl: 50, color: '#e9d5bb', kind: 'foam' },
    ],
    steps: [
      'Zaparz kawę i schłódź ją: przelej do słoika i wstaw na 10 minut do zamrażarki.',
      'Wrzuć do blendera kawę, mleko, lód i syrop, jeśli lubisz słodko.',
      'Miksuj 30–40 sekund, aż lód się rozkruszy, a napój się spieni.',
      'Przelej do szklanki i od razu podawaj ze słomką.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'Wysoka szklanka mieści gęsty, spieniony napój.',
      decorations: [
        {
          kind: 'topping',
          name: 'polewa karmelowa',
          look: 'drizzle',
          color: '#b8692a',
          instruction: 'Polej piankę cienką strużką syropu karmelowego.',
          optional: true,
        },
      ],
    },
    needsReview: true,
    reviewNote: 'Proporcje kawy, mleka i lodu do sprawdzenia w blenderze.',
  },
  {
    id: 'smoothie-kawowe-z-bananem',
    name: 'Smoothie kawowe z bananem',
    tagline: 'Banan, mleko i kawa: śniadanie w szklance',
    description:
      'Gęste smoothie z dojrzałego banana, mleka i schłodzonej kawy. Słodkie bez cukru, sycące i dobre na szybkie śniadanie.',
    temperature: 'cold',
    prepTimeMin: 15,
    base: {
      methodId: 'kawiarka',
      amountMl: 50,
      alternativeMethodIds: ['aeropress', 'cold-brew'],
      note: 'Kawa schłodzona przed dodaniem. Z koncentratem cold brew smoothie wychodzi łagodniejsze.',
    },
    milk: { options: ['krowie', 'owsiane-barista', 'migdalowe', 'sojowe'], amountMl: 150, prep: 'blend' },
    extras: [
      {
        kind: 'fruit',
        ingredientId: 'banany',
        name: 'dojrzały banan (może być mrożony)',
        amount: { value: 1, unit: 'piece' },
        blended: true,
      },
      {
        kind: 'other',
        ingredientId: 'miod',
        name: 'miód',
        amount: { value: 1, unit: 'tsp' },
        blended: true,
        optional: true,
      },
      {
        kind: 'ice',
        ingredientId: 'lod',
        name: 'lód do blendera',
        amount: { value: 3, max: 4, unit: 'cube' },
        blended: true,
      },
    ],
    equipment: ['blender', 'wysoka szklanka'],
    layers: [{ name: 'smoothie bananowo-kawowe', volumeMl: 280, color: '#d4b07f', kind: 'liquid' }],
    steps: [
      'Zaparz kawę i schłódź ją.',
      'Pokrój banana na kawałki. Z mrożonym smoothie będzie gęstsze, a lód nie będzie potrzebny.',
      'Zmiksuj banana z mlekiem, kawą, lodem i miodem na gładko.',
      'Przelej do szklanki i oprósz cynamonem.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'Wysoka szklanka na gęsty, sycący napój. Do picia przez grubą słomkę.',
      decorations: [
        {
          kind: 'topping',
          name: 'cynamon',
          look: 'dust',
          color: '#8b4a2b',
          instruction: 'Oprósz wierzch szczyptą cynamonu.',
          optional: true,
        },
        {
          kind: 'garnish',
          name: 'plasterek banana',
          look: 'slice',
          color: '#e8c95a',
          instruction: 'Natnij gruby plaster banana do połowy i nasuń go na brzeg szklanki.',
          optional: true,
        },
      ],
    },
    needsReview: true,
    reviewNote: 'Proporcje do sprawdzenia: czy 50 ml kawy wystarczy na smak kawy przy całym bananie.',
  },
  {
    id: 'shake-z-maslem-orzechowym',
    name: 'Shake z masłem orzechowym',
    tagline: 'Lody, masło orzechowe i kawa na deser',
    description:
      'Gęsty shake z lodów waniliowych, mleka i łyżki masła orzechowego, zmiksowany z mocną kawą. Smakuje jak orzechowy deser z kawiarni.',
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
        ingredientId: 'lody-waniliowe',
        name: 'lody waniliowe (mogą być roślinne)',
        amount: { value: 2, unit: 'scoop' },
        blended: true,
      },
      {
        kind: 'other',
        ingredientId: 'maslo-orzechowe',
        name: 'masło orzechowe (ok. łyżka)',
        amount: { value: 20, unit: 'g' },
        blended: true,
      },
      { kind: 'syrup', syrupId: 'czekoladowy', amountMl: 15, optional: true },
    ],
    equipment: ['blender', 'wysoka szklanka', 'słomka'],
    layers: [{ name: 'shake orzechowy z kawą', volumeMl: 270, color: '#c49a6c', kind: 'liquid' }],
    steps: [
      'Zaparz kawę i schłódź ją: gorąca roztopi lody.',
      'Jeśli lubisz, zrób na ściankach szklanki smugi z sosu czekoladowego (zobacz: jak podać).',
      'Zmiksuj lody, mleko, masło orzechowe i kawę na gęsty shake.',
      'Przelej do szklanki i posyp posiekanymi orzeszkami.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'Wysoka szklanka mieści gęsty shake, a na ściankach widać czekoladowe smugi.',
      decorations: [
        {
          kind: 'wall-pattern',
          name: 'smugi sosu czekoladowego',
          color: '#3b1f14',
          instruction:
            'Przechyl pustą szklankę i wlewaj sos cienką strużką przy brzegu, obracając ją. Wstaw szklankę na 5 minut do lodówki, żeby smugi zastygły.',
          optional: true,
        },
        {
          kind: 'topping',
          name: 'posiekane orzeszki ziemne',
          look: 'pieces',
          color: '#b07d48',
          instruction: 'Posyp wierzch garścią posiekanych, prażonych orzeszków.',
        },
      ],
    },
  },
  {
    id: 'mazagran',
    name: 'Mazagran',
    tagline: 'Kawa z cytryną i lodem po portugalsku',
    description:
      'Orzeźwiająca kawa z Portugalii: mocna kawa, sok z cytryny, odrobina cukru i dużo lodu. Kwaskowa, lekko słodka, idealna na upał.',
    temperature: 'cold',
    prepTimeMin: 10,
    base: {
      methodId: 'kawiarka',
      amountMl: 60,
      alternativeMethodIds: ['aeropress', 'cold-brew'],
      note: 'Kawa z kawiarki zamiast espresso. Dobrze pasują owocowe ziarna.',
    },
    extras: [
      {
        kind: 'fruit',
        ingredientId: 'cytryny',
        name: 'sok z cytryny (ok. pół cytryny)',
        amount: { value: 20, unit: 'ml' },
      },
      { kind: 'other', ingredientId: 'cukier', name: 'cukier', amount: { value: 2, unit: 'tsp' } },
      { kind: 'ice', ingredientId: 'lod', name: 'lód', amount: 'pełna szklanka' },
      {
        kind: 'mixer',
        ingredientId: 'woda-gazowana',
        name: 'woda gazowana, jeśli lubisz z bąbelkami',
        amount: { value: 60, unit: 'ml' },
        optional: true,
      },
    ],
    equipment: ['niska szklanka', 'shaker albo słoik z zakrętką'],
    layers: [{ name: 'kawa z cytryną', volumeMl: 140, color: '#5a3422', kind: 'liquid' }],
    steps: [
      'Zaparz kawę i rozpuść w niej cukier, póki jest gorąca.',
      'Wsyp do słoika garść lodu, wlej kawę i sok z cytryny. Zakręć i potrząsaj 15 sekund.',
      'Przelej razem z lodem do szklanki pełnej lodu. Jeśli lubisz, dolej wody gazowanej.',
      'Nasuń plaster cytryny na brzeg szklanki.',
    ],
    serving: {
      vessel: 'low-glass',
      why: 'Niska szklanka z dużą ilością lodu: mazagran pije się małymi łykami.',
      decorations: [
        {
          kind: 'garnish',
          name: 'plaster cytryny',
          look: 'slice',
          color: '#f2cf3a',
          instruction: 'Natnij plaster cytryny do połowy i nasuń go na brzeg szklanki.',
        },
      ],
    },
    needsReview: true,
    reviewNote: 'Proporcja soku z cytryny do kawy do sprawdzenia: przepisy podają od łyżeczki do pół cytryny.',
  },
  {
    id: 'dalgona',
    name: 'Kawa dalgona',
    tagline: 'Ubita kawa rozpuszczalna na zimnym mleku',
    description:
      'Internetowy hit z Korei: kawa rozpuszczalna ubita z cukrem i gorącą wodą na gęsty, karmelowy krem, nałożony na zimne mleko z lodem.',
    temperature: 'cold',
    prepTimeMin: 10,
    base: {
      methodId: 'kawa-rozpuszczalna',
      amountMl: 30,
      note: 'Do dalgony: ok. 10 g kawy rozpuszczalnej (2 łyżki) na 30 ml gorącej wody, ubite z cukrem.',
    },
    milk: { options: ['krowie', 'owsiane-barista', 'migdalowe', 'sojowe'], amountMl: 200, prep: 'plain' },
    extras: [
      { kind: 'other', ingredientId: 'cukier', name: 'cukier', amount: { value: 2, unit: 'tsp' } },
      { kind: 'ice', ingredientId: 'lod', name: 'lód', amount: { value: 3, max: 4, unit: 'cube' } },
    ],
    equipment: ['mikser albo trzepaczka', 'miska', 'wysoka szklanka'],
    layers: [
      { name: 'zimne mleko', volumeMl: 200, color: '#f5eee2', kind: 'liquid' },
      { name: 'krem kawowy', volumeMl: 60, color: '#c98a4b', kind: 'foam' },
    ],
    steps: [
      'Wsyp do miski kawę rozpuszczalną i cukier, zalej gorącą wodą.',
      'Ubijaj mikserem 2–3 minuty (trzepaczką ok. 5 minut), aż krem zjaśnieje i będzie trzymał kształt.',
      'Wsyp lód do szklanki i wlej zimne mleko.',
      'Nałóż krem łyżką na mleko. Przed piciem zamieszaj.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'Przezroczysta szklanka pokazuje karmelowy krem na białym mleku.',
      decorations: [
        {
          kind: 'topping',
          name: 'kakao',
          look: 'dust',
          color: '#6b3e26',
          instruction: 'Oprósz krem odrobiną kakao albo kawy rozpuszczalnej.',
          optional: true,
        },
      ],
    },
  },
  {
    id: 'frappe-po-grecku',
    name: 'Frappé po grecku',
    tagline: 'Wstrząśnięta kawa rozpuszczalna z gęstą pianką',
    description:
      'Greckie frappé: kawa rozpuszczalna wstrząśnięta z odrobiną zimnej wody i cukrem, aż powstanie gęsta, trwała pianka. Potem lód, zimna woda i trochę mleka.',
    temperature: 'cold',
    prepTimeMin: 5,
    base: {
      methodId: 'kawa-rozpuszczalna',
      amountMl: 40,
      note: 'Do frappé: ok. 4 g kawy rozpuszczalnej (2 łyżeczki) wstrząśnięte z 40 ml zimnej wody, bez czajnika.',
    },
    milk: { options: ['krowie', 'owsiane-barista', 'migdalowe'], amountMl: 50, prep: 'plain' },
    extras: [
      {
        kind: 'other',
        ingredientId: 'cukier',
        name: 'cukier (bez niego pianka jest rzadsza)',
        amount: { value: 2, unit: 'tsp' },
        optional: true,
      },
      { kind: 'mixer', ingredientId: 'woda', name: 'zimna woda', amount: { value: 100, unit: 'ml' } },
      { kind: 'ice', ingredientId: 'lod', name: 'lód', amount: { value: 3, max: 4, unit: 'cube' } },
    ],
    equipment: ['shaker albo słoik z zakrętką', 'wysoka szklanka', 'słomka'],
    layers: [
      { name: 'kawa z wodą i mlekiem', volumeMl: 190, color: '#9a6a45', kind: 'liquid' },
      { name: 'pianka', volumeMl: 60, color: '#c9a27a', kind: 'foam' },
    ],
    steps: [
      'Wsyp do shakera kawę rozpuszczalną i cukier, wlej 40 ml zimnej wody.',
      'Wstrząsaj mocno przez 20–30 sekund, aż powstanie gęsta, jasna pianka.',
      'Przelej piankę do szklanki z lodem.',
      'Dolewaj powoli zimną wodę i mleko: pianka uniesie się do góry. Podawaj ze słomką.',
    ],
    serving: {
      vessel: 'tall-glass',
      why: 'Wysoka szklanka pokazuje grubą warstwę pianki nad kawą.',
      decorations: [],
    },
    needsReview: true,
    reviewNote: 'Ilość kawy zależy od marki: w Grecji zwykle 1–2 łyżeczki Nescafé Classic.',
  },
  {
    id: 'irish-coffee',
    name: 'Irish coffee',
    tagline: 'Gorąca kawa z whiskey pod warstwą śmietanki',
    description:
      'Irlandzki klasyk: gorąca, osłodzona kawa z whiskey, a na niej warstwa lekko ubitej śmietanki. Pije się przez zimną śmietankę, bez mieszania.',
    temperature: 'hot',
    prepTimeMin: 12,
    base: {
      methodId: 'drip',
      amountMl: 120,
      alternativeMethodIds: ['prasa-francuska', 'aeropress', 'kawiarka'],
      note: 'Mocna kawa z przelewu albo prasy. Kawę z kawiarki rozcieńcz odrobiną gorącej wody.',
    },
    extras: [
      {
        kind: 'alcohol',
        ingredientId: 'whiskey',
        name: 'whiskey irlandzka',
        amount: { value: 40, unit: 'ml' },
      },
      { kind: 'other', ingredientId: 'cukier', name: 'brązowy cukier', amount: { value: 2, unit: 'tsp' } },
      {
        kind: 'cream',
        ingredientId: 'smietanka-30',
        name: 'śmietanka 30%, lekko ubita',
        amount: { value: 50, unit: 'ml' },
        dairy: true,
      },
    ],
    equipment: ['szklanka do irish coffee', 'czajnik', 'trzepaczka', 'łyżka'],
    layers: [
      { name: 'kawa z whiskey', volumeMl: 160, color: '#3b2214', kind: 'liquid' },
      { name: 'śmietanka', volumeMl: 50, color: '#fbf4e6', kind: 'foam' },
    ],
    steps: [
      'Ogrzej szklankę: zalej ją wrzątkiem i po minucie wylej wodę.',
      'Wsyp cukier, wlej gorącą kawę i mieszaj, aż cukier się rozpuści.',
      'Dolej whiskey i zamieszaj.',
      'Ubij śmietankę tylko lekko, żeby była gęsta, ale jeszcze płynna.',
      'Wlewaj śmietankę po grzbiecie łyżki, żeby położyła się na kawie. Nie mieszaj.',
    ],
    serving: {
      vessel: 'irish-glass',
      why: 'Szklanka na nóżce z uchem trzyma ciepło i pokazuje białą śmietankę nad czarną kawą.',
      decorations: [
        {
          kind: 'garnish',
          name: 'ziarna kawy',
          look: 'beans',
          color: '#3a2114',
          instruction: 'Połóż na śmietance trzy ziarna kawy.',
          optional: true,
        },
      ],
    },
    needsReview: true,
    reviewNote: 'Proporcje klasyczne: ok. 120 ml kawy, 40 ml whiskey, 2 łyżeczki cukru. Do sprawdzenia.',
  },
  {
    id: 'espresso-martini',
    name: 'Espresso martini',
    tagline: 'Koktajl z kawy z kawiarki, wódki i likieru kawowego',
    description:
      'Klasyczny koktajl z lat 80.: kawę wstrząsa się z wódką, likierem kawowym i lodem, aż powstanie gęsta pianka. Na wierzchu trzy ziarna kawy.',
    temperature: 'cold',
    prepTimeMin: 12,
    base: {
      methodId: 'kawiarka',
      amountMl: 40,
      alternativeMethodIds: ['aeropress'],
      note: 'Kawa z kawiarki zamiast espresso. Świeża i jeszcze ciepła da najlepszą piankę.',
    },
    extras: [
      { kind: 'alcohol', ingredientId: 'wodka', name: 'wódka', amount: { value: 40, unit: 'ml' } },
      {
        kind: 'alcohol',
        ingredientId: 'likier-kawowy',
        name: 'likier kawowy',
        amount: { value: 20, unit: 'ml' },
      },
      // Lód tylko do shakera: w kieliszku go nie ma.
      {
        kind: 'other',
        ingredientId: 'lod',
        name: 'lód do shakera',
        amount: { value: 6, max: 8, unit: 'cube' },
      },
    ],
    equipment: ['shaker albo słoik z zakrętką', 'kieliszek do martini', 'sitko'],
    layers: [
      { name: 'koktajl kawowy', volumeMl: 90, color: '#2e1a10', kind: 'liquid' },
      { name: 'pianka', volumeMl: 25, color: '#c69c6d', kind: 'foam' },
    ],
    steps: [
      'Schłodź kieliszek w zamrażarce przez kilka minut.',
      'Zaparz kawę i odstaw na 2 minuty.',
      'Wsyp lód do shakera, wlej wódkę, likier i kawę.',
      'Wstrząsaj mocno przez 15–20 sekund: od tego zależy pianka.',
      'Przecedź przez sitko do kieliszka i połóż na piance trzy ziarna kawy.',
    ],
    serving: {
      vessel: 'martini-glass',
      why: 'Kieliszek na wysokiej nóżce: koktajl nie ogrzewa się w dłoni, a pianka jest dobrze widoczna.',
      decorations: [
        {
          kind: 'garnish',
          name: 'trzy ziarna kawy',
          look: 'beans',
          color: '#3a2114',
          instruction: 'Połóż delikatnie trzy ziarna kawy na środku pianki.',
        },
      ],
    },
    needsReview: true,
    reviewNote: 'Proporcje klasyczne (40 ml wódki, 20 ml likieru, 40 ml kawy) do sprawdzenia.',
  },
];
