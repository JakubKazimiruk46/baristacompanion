import type { BrewMethod } from './types';

export const methods: BrewMethod[] = [
  {
    id: 'kawiarka',
    name: 'Kawiarka',
    brewName: 'kawa z kawiarki',
    inMethod: 'w kawiarce',
    description:
      'Włoska klasyka na kuchenkę. Para wypycha wodę przez kawę, więc napar jest mocny i gęsty: najbliżej espresso, jak się da bez ekspresu. To baza większości drinków w aplikacji.',
    equipment: ['kawiarka (np. na 3 filiżanki)', 'młynek', 'czajnik', 'kuchenka'],
    grind: 'fine',
    dose: { coffeeG: 17, waterMl: 150 },
    waterTempC: { min: 90, max: 100 },
    totalTimeSec: 480,
    difficulty: 'easy',
    suits: {
      roasts: ['medium', 'dark'],
      notes: ['chocolate', 'nutty', 'caramel'],
      why: 'Kawiarka parzy intensywnie i podkreśla goryczkę. Średnie i ciemne palenie wychodzi czekoladowo i słodko, a jasne, kwaśniejsze palenie bywa tu ostre i kwaśne.',
    },
    steps: [
      {
        text: 'Zagotuj wodę w czajniku',
        detail: 'Gorąca woda skraca czas na ogniu, więc kawa się nie przypala.',
        action: true,
      },
      {
        text: 'Wlej wodę do dolnego zbiornika do wysokości zaworu',
        detail:
          'Zawór bezpieczeństwa musi zostać nad wodą. Zbiornik będzie gorący: trzymaj go przez ściereczkę.',
        action: true,
      },
      {
        text: 'Wsyp kawę do sitka i wyrównaj',
        detail:
          'Do pełna, ale bez ubijania. Przetrzyj brzeg sitka, żeby uszczelka dobrze przylegała.',
        action: true,
      },
      {
        text: 'Skręć kawiarkę i postaw na średnim ogniu',
        detail: 'Zostaw otwartą pokrywkę: zobaczysz, kiedy kawa zacznie wypływać.',
        action: true,
      },
      {
        text: 'Poczekaj, aż kawa zacznie wypływać',
        detail: 'Powinna płynąć spokojnym, ciemnym strumieniem. Jeśli pryska, zmniejsz ogień.',
        durationSec: 180,
        action: false,
      },
      {
        text: 'Gdy kawa zjaśnieje i zacznie bulgotać, zdejmij z ognia',
        detail: 'Ochłodź dno pod zimną wodą: to zatrzyma parzenie i gorzki posmak.',
        action: true,
      },
      {
        text: 'Zamieszaj i od razu przelej',
        detail: 'Pierwsze i ostatnie krople różnią się smakiem, a mieszanie je wyrównuje.',
        action: true,
      },
    ],
    needsReview: true,
    reviewNote:
      'Woda gorąca czy zimna? Przyjęto gorącą z czajnika (krócej na ogniu, mniej goryczy); część poradników każe nalewać zimną.',
  },
  {
    id: 'prasa-francuska',
    name: 'Prasa francuska',
    brewName: 'kawa z prasy francuskiej',
    inMethod: 'w prasie francuskiej',
    description:
      'Kawa parzy się zanurzona w wodzie, a metalowe sitko zostawia w naparze olejki. Wychodzi pełna, gęsta i łatwo ją powtórzyć.',
    equipment: ['prasa francuska', 'młynek', 'czajnik', 'łyżka'],
    grind: 'coarse',
    dose: { coffeeG: 30, waterMl: 500 },
    waterTempC: { min: 92, max: 96 },
    totalTimeSec: 600,
    difficulty: 'easy',
    suits: {
      roasts: ['medium', 'dark'],
      notes: ['chocolate', 'nutty', 'caramel', 'spicy'],
      why: 'Prasa daje dużo body. Czekoladowe, orzechowe i korzenne kawy średnio lub ciemno palone wychodzą krągło i słodko. Jasne palenie też się uda, ale napar będzie mniej klarowny niż z dripa.',
    },
    steps: [
      {
        text: 'Zagotuj wodę i odczekaj pół minuty',
        detail: 'Woda powinna mieć ok. 94°C.',
        durationSec: 30,
        action: true,
      },
      { text: 'Wsyp 30 g grubo zmielonej kawy do dzbanka', action: true },
      {
        text: 'Zalej 500 ml wody',
        detail: 'Zalej całą kawę równomiernie. Nie wkładaj jeszcze tłoka.',
        action: true,
      },
      {
        text: 'Odczekaj 4 minuty',
        detail: 'Na wierzchu zbierze się skorupka z kawy.',
        durationSec: 240,
        action: false,
      },
      {
        text: 'Zamieszaj skorupkę',
        detail: 'Łyżką rozbij skorupkę na powierzchni: większość kawy opadnie na dno.',
        action: true,
      },
      {
        text: 'Zbierz piankę łyżką',
        detail: 'Usuń piankę i pływające drobinki. Napar będzie czystszy.',
        action: true,
      },
      { text: 'Zamieszaj jeszcze raz, delikatnie', action: true },
      {
        text: 'Odczekaj kolejne 5 minut',
        detail: 'Drobinki opadną na dno, a kawa lekko przestygnie.',
        durationSec: 300,
        action: false,
      },
      {
        text: 'Wciśnij tłok tylko do powierzchni i powoli nalej',
        detail: 'Tłok ma działać jak sitko. Wciśnięty do dna wzburzy osad.',
        action: true,
      },
    ],
    needsReview: true,
    reviewNote:
      'Drugie mieszanie po zebraniu pianki jest z opisu autora. W metodzie Jamesa Hoffmanna po zebraniu pianki już się nie miesza.',
  },
  {
    id: 'zalewajka',
    name: 'Zalewajka',
    brewName: 'kawa parzona w szklance',
    inMethod: 'w zalewajce',
    description:
      'Kawa „po polsku”: zmielona kawa zalana wodą w szklance. Bez żadnego sprzętu, a z dobrą kawą i przy właściwym mieleniu smakuje zaskakująco dobrze.',
    equipment: ['szklanka lub kubek', 'czajnik', 'spodek do przykrycia', 'łyżeczka'],
    grind: 'medium-fine',
    dose: { coffeeG: 12, waterMl: 200 },
    waterTempC: { min: 90, max: 96 },
    totalTimeSec: 360,
    difficulty: 'easy',
    suits: {
      roasts: ['medium', 'dark'],
      notes: ['chocolate', 'nutty', 'caramel'],
      why: 'Bez filtra napar jest mocny i ma trochę osadu. Czekoladowe i orzechowe kawy wypadają tu najlepiej; jasne palenie bywa płaskie i kwaśne.',
    },
    steps: [
      {
        text: 'Wsyp 2 płaskie łyżki kawy do szklanki',
        detail: 'Ok. 12 g na 200 ml wody.',
        action: true,
      },
      {
        text: 'Zalej gorącą wodą, nie wrzątkiem',
        detail: 'Odczekaj chwilę po zagotowaniu. Wrzątek parzy kawę zbyt gorzko.',
        action: true,
      },
      { text: 'Przykryj spodkiem i odczekaj 4 minuty', durationSec: 240, action: true },
      {
        text: 'Zamieszaj, żeby fusy opadły',
        detail: 'Rozbij skorupkę na powierzchni. Kawa zacznie opadać na dno.',
        action: true,
      },
      {
        text: 'Odczekaj minutę',
        detail: 'Fusy osiądą. Zbierz łyżeczką to, co jeszcze pływa.',
        durationSec: 60,
        action: false,
      },
      { text: 'Pij powoli, zostaw fusy na dnie', action: false },
    ],
    needsReview: true,
    reviewNote:
      'Mielenie: przyjęto średnio-drobno. Tradycyjnie bardzo drobno („po turecku”), ale wtedy w naparze jest więcej fusów.',
  },
  {
    id: 'drip',
    name: 'Drip (V60)',
    brewName: 'kawa z dripa',
    inMethod: 'w dripie',
    description:
      'Przelew przez papierowy filtr. Woda spływa przez kawę, a filtr zatrzymuje olejki i osad, więc napar jest czysty i klarowny. Najlepszy sposób, żeby poczuć owocowe i kwiatowe nuty.',
    equipment: [
      'drip (np. V60)',
      'filtr papierowy',
      'czajnik, najlepiej z wąską wylewką',
      'waga kuchenna',
      'dzbanek lub kubek',
    ],
    grind: 'medium-fine',
    dose: { coffeeG: 15, waterMl: 250 },
    waterTempC: { min: 92, max: 96 },
    totalTimeSec: 300,
    difficulty: 'medium',
    suits: {
      roasts: ['light', 'medium'],
      notes: ['fruity', 'floral', 'citrus'],
      why: 'Jasne palenie jest kwaśniejsze, a w czystym naparze z dripa ta kwasowość zamienia się w owocowość. Kwiatowe i cytrusowe nuty słychać tu najlepiej.',
    },
    steps: [
      {
        text: 'Włóż filtr i przelej go gorącą wodą',
        detail: 'Pozbędziesz się papierowego posmaku i ogrzejesz naczynie. Wylej tę wodę.',
        action: true,
      },
      {
        text: 'Wsyp 15 g kawy i wyrównaj',
        detail: 'Postaw całość na wadze i wytaruj ją.',
        action: true,
      },
      {
        text: 'Zalej 40 ml wody i odczekaj',
        detail: 'Zwilż całą kawę. Napęcznieje i uwolni dwutlenek węgla (to tzw. bloom).',
        durationSec: 40,
        action: true,
      },
      {
        text: 'Dolewaj powoli wodę do 150 ml',
        detail: 'Lej ruchem okrężnym, od środka na zewnątrz, omijając ścianki filtra.',
        durationSec: 30,
        action: true,
      },
      {
        text: 'Dolej resztę do 250 ml',
        detail: 'Na koniec delikatnie zakręć dripem, żeby wyrównać kawę.',
        durationSec: 30,
        action: true,
      },
      {
        text: 'Poczekaj, aż woda przepłynie',
        detail:
          'Całość powinna skończyć się ok. 3 minuty od pierwszego zalania. Szybciej: następnym razem zmiel drobniej. Wolniej: grubiej.',
        durationSec: 80,
        action: false,
      },
      { text: 'Zdejmij drip i zamieszaj kawę', action: true },
    ],
  },
  {
    id: 'chemex',
    name: 'Chemex',
    brewName: 'kawa z Chemexu',
    inMethod: 'w Chemeksie',
    description:
      'Szklany dzbanek z grubym filtrem. Parzy się jak drip, ale gruby filtr daje napar jeszcze czystszy i delikatniejszy. Dobry na kilka filiżanek naraz.',
    equipment: ['Chemex', 'filtr do Chemexu', 'czajnik z wąską wylewką', 'waga kuchenna'],
    grind: 'medium-coarse',
    dose: { coffeeG: 30, waterMl: 500 },
    waterTempC: { min: 92, max: 96 },
    totalTimeSec: 420,
    difficulty: 'medium',
    suits: {
      roasts: ['light', 'medium'],
      notes: ['fruity', 'floral', 'citrus'],
      why: 'Gruby filtr zatrzymuje prawie wszystkie olejki. Zostaje lekki, herbaciany napar, w którym świetnie wybrzmiewają jasno palone, kwiatowe i owocowe kawy.',
    },
    steps: [
      {
        text: 'Włóż filtr i przelej go gorącą wodą',
        detail: 'Potrójna warstwa filtra od strony dzióbka. Wylej wodę dzióbkiem, nie wyjmując filtra.',
        action: true,
      },
      { text: 'Wsyp 30 g kawy i wyrównaj', action: true },
      { text: 'Zalej 60 ml wody i odczekaj', durationSec: 45, action: true },
      {
        text: 'Dolewaj powoli do 300 ml',
        detail: 'Lej spokojnie, ruchem okrężnym.',
        durationSec: 45,
        action: true,
      },
      { text: 'Dolej resztę do 500 ml', durationSec: 45, action: true },
      {
        text: 'Poczekaj, aż woda przepłynie',
        detail:
          'Łącznie ok. 4–5 minut. Jeśli trwa dużo dłużej, następnym razem zmiel grubiej.',
        durationSec: 120,
        action: false,
      },
      { text: 'Wyjmij filtr i zakołysz dzbankiem', action: true },
    ],
  },
  {
    id: 'aeropress',
    name: 'AeroPress',
    brewName: 'kawa z AeroPressa',
    inMethod: 'w AeroPressie',
    description:
      'Plastikowa „strzykawka” do kawy. Krótkie parzenie i lekkie ciśnienie dają czysty napar z dobrym body. Zajmuje mało miejsca, łatwo ją umyć, a z mniejszą ilością wody zrobisz mocny koncentrat do drinków.',
    equipment: ['AeroPress', 'filtr papierowy do AeroPressa', 'czajnik', 'młynek', 'mocny kubek'],
    grind: 'medium-fine',
    dose: { coffeeG: 15, waterMl: 200 },
    waterTempC: { min: 85, max: 95 },
    totalTimeSec: 240,
    difficulty: 'easy',
    suits: {
      roasts: ['light', 'medium', 'dark'],
      notes: ['fruity', 'chocolate', 'caramel', 'nutty'],
      why: 'Najbardziej uniwersalna metoda: pasuje do każdego palenia. Jasne kawy wyjdą czysto i owocowo, ciemne słodko i bez przesadnej goryczy.',
    },
    steps: [
      { text: 'Włóż filtr do sitka i przelej go gorącą wodą', action: true },
      { text: 'Postaw AeroPress na kubku i wsyp 15 g kawy', action: true },
      {
        text: 'Zalej 200 ml wody i zamieszaj',
        detail: 'Kilka energicznych ruchów łyżką, żeby zmoczyć całą kawę.',
        action: true,
      },
      {
        text: 'Włóż tłok na 1 cm i odczekaj',
        detail: 'Podciśnienie zatrzyma kapanie.',
        durationSec: 90,
        action: true,
      },
      {
        text: 'Wyciśnij powoli',
        detail: 'Naciskaj ok. 30 sekund. Gdy usłyszysz syczenie, przestań.',
        durationSec: 30,
        action: true,
      },
    ],
  },
  {
    id: 'cold-brew',
    name: 'Cold brew',
    brewName: 'koncentrat cold brew',
    inMethod: 'w cold brew',
    description:
      'Kawa parzona na zimno przez kilkanaście godzin. Wychodzi łagodna, słodka i prawie bez kwasowości. Robisz ją wieczorem, a rano masz koncentrat do mrożonych drinków na kilka dni.',
    equipment: [
      'słoik lub dzbanek (min. 1 l)',
      'młynek',
      'sitko i filtr papierowy (lub prasa francuska)',
      'lodówka',
    ],
    grind: 'coarse',
    dose: { coffeeG: 100, waterMl: 800 },
    waterTempC: { min: 4, max: 22 },
    totalTimeSec: 16 * 3600,
    difficulty: 'easy',
    suits: {
      roasts: ['medium', 'dark'],
      notes: ['chocolate', 'nutty', 'caramel'],
      why: 'Zimna woda wydobywa mało kwasów, więc cold brew jest słodkie i gładkie. Czekoladowe i orzechowe kawy średnio lub ciemno palone dają klasyczny smak; jasne palenie wyjdzie owocowo, ale mniej wyraziście.',
    },
    steps: [
      { text: 'Zmiel 100 g kawy grubo', action: true },
      {
        text: 'Wsyp kawę do słoika i zalej 800 ml zimnej wody',
        detail: 'Najlepiej przefiltrowanej.',
        action: true,
      },
      { text: 'Zamieszaj, aż cała kawa będzie mokra', action: true },
      {
        text: 'Zamknij i wstaw do lodówki na 12–24 godziny',
        detail: 'Im dłużej, tym mocniej. 16 godzin to dobry początek.',
        durationSec: 16 * 3600,
        action: false,
      },
      {
        text: 'Przecedź przez sitko, a potem przez filtr papierowy',
        detail: 'Dwa etapy: sitko zatrzyma fusy, filtr osad.',
        action: true,
      },
      {
        text: 'Rozcieńcz 1:1 wodą lub mlekiem i podaj z lodem',
        detail: 'Koncentrat przechowuj w lodówce do 7 dni.',
        action: true,
      },
    ],
  },
];
