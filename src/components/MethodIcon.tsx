import type { ReactNode } from 'react';
import { BrewIcon, type IconProps } from './icons';

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

const ICONS: Record<string, (props: IconProps) => ReactNode> = {
  // Kawiarka: dwa zbiorniki w kształcie klepsydry, rączka i gałka pokrywki.
  kawiarka: (props) => (
    <Svg {...props}>
      <path d="M7 3.5h10l-1.6 7.5H8.6L7 3.5Z" />
      <path d="M8.6 11h6.8l2.1 9.5h-11L8.6 11Z" />
      <path d="M16.8 5h1.7a1 1 0 0 1 1 1v2.5a1 1 0 0 1-1 1h-2.6" />
      <path d="M12 3.5V2M7 3.5 5.5 5" />
    </Svg>
  ),
  // Prasa francuska: dzbanek, tłok z gałką i rączka.
  'prasa-francuska': (props) => (
    <Svg {...props}>
      <rect x="6" y="7.5" width="10" height="13.5" rx="1.5" />
      <path d="M5 7.5h12M11 7.5V3M9.5 3h3M6 13h10" />
      <path d="M16 10h1.5a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5H16" />
    </Svg>
  ),
  // Zalewajka: szklanka z fusami na dnie.
  zalewajka: (props) => (
    <Svg {...props}>
      <path d="M6 4h12l-1.5 16a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1L6 4Z" />
      <path d="M7.2 16.5h9.6" />
      <path d="M9 18.6h.01M12 18.4h.01M15 18.7h.01" strokeWidth={2.2} />
    </Svg>
  ),
  drip: (props) => <BrewIcon {...props} />,
  // Chemex: szklana klepsydra z drewnianym kołnierzem.
  chemex: (props) => (
    <Svg {...props}>
      <path d="M6 3h12l-4.6 8.5c3 2 4.6 5 4.6 8.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1c0-3.5 1.6-6.5 4.6-8.5L6 3Z" />
      <path d="M9.6 9.5h4.8l-.6 3.5h-3.6l-.6-3.5Z" />
    </Svg>
  ),
  // AeroPress: komora, tłok i nakrętka z filtrem na kubku.
  aeropress: (props) => (
    <Svg {...props}>
      <rect x="8" y="8" width="8" height="10" rx="1" />
      <path d="M9.5 8V3.5h5V8M8.5 3.5h7M7 18h10" />
      <path d="M6 21h12" />
    </Svg>
  ),
  // Tygielek: pękaty dzbanuszek z wąską szyjką i długą rączką.
  tygielek: (props) => (
    <Svg {...props}>
      <path d="M6.5 8h8l-.8 2.2c1.6 1.4 2.3 3.6 2.3 6.3a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4c0-2.7.7-4.9 2.3-6.3L6.5 8Z" />
      <path d="M14.8 9.5 21 6.5" />
      <path d="M5.5 8h1" />
    </Svg>
  ),
  // Kalita Wave: drip z płaskim dnem i falowanym filtrem na kubku.
  kalita: (props) => (
    <Svg {...props}>
      <path d="M4 4h16l-3.5 7.5h-9L4 4Z" />
      <path d="M8 4.5l1.5 6.5M12 4.5v6.5M16 4.5 14.5 11" />
      <path d="M9.5 11.5h5V13h-5z" />
      <path d="M6.5 15h11v2a4 4 0 0 1-4 4h-3a4 4 0 0 1-4-4v-2Z" />
    </Svg>
  ),
  // Clever Dripper: stożek z zaworem w dnie, na kubku.
  clever: (props) => (
    <Svg {...props}>
      <path d="M4.5 3.5h15l-4 8.5h-7l-4-8.5Z" />
      <path d="M10 12h4v2h-4z" />
      <path d="M12 14v1" />
      <path d="M6.5 16h11v1a4 4 0 0 1-4 4h-3a4 4 0 0 1-4-4v-1Z" />
    </Svg>
  ),
  // Phin: metalowy filtr z pokrywką na szklance, kapiąca kawa.
  phin: (props) => (
    <Svg {...props}>
      <path d="M8.5 2.5h7M9 4.5h6V9H9z" />
      <path d="M6 9.5h12" />
      <path d="M12 11v.01" strokeWidth={2.2} />
      <path d="M7.5 12.5h9l-.9 7.6a1 1 0 0 1-1 .9H9.4a1 1 0 0 1-1-.9l-.9-7.6Z" />
    </Svg>
  ),
  // Syfon: górna bańka z rurką nad kulistą dolną bańką i palnik.
  syfon: (props) => (
    <Svg {...props}>
      <path d="M9 2.5h6v4a3 3 0 0 1-6 0v-4Z" />
      <path d="M12 9.5V12" />
      <circle cx="12" cy="15.5" r="4" />
      <path d="M9.5 21.5h5" />
    </Svg>
  ),
  // Cold brew: słoik z płatkiem śniegu.
  'cold-brew': (props) => (
    <Svg {...props}>
      <path d="M7 7h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7Z" />
      <path d="M6.5 3.5h11V7h-11z" />
      <path d="M12 10.5v6M9.4 12l5.2 3M9.4 15l5.2-3" />
    </Svg>
  ),
  // Kawa rozpuszczalna: słoik z etykietą i łyżeczka.
  'kawa-rozpuszczalna': (props) => (
    <Svg {...props}>
      <path d="M6 8.5h10v11a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 6 19.5v-11Z" />
      <path d="M5.5 5.5h11v3h-11z" />
      <path d="M8 12.5h6v4H8z" />
      <path d="M18 3l-2.5 9" />
      <path d="M18.6 1.8a1.2 1.2 0 1 1-1.2 2" />
    </Svg>
  ),
};

/** Ilustracja metody parzenia (ikona 24×24 w kolorze tekstu). */
export function MethodIcon({ methodId, ...props }: IconProps & { methodId: string }) {
  const Icon = ICONS[methodId] ?? BrewIcon;
  return <Icon {...props} />;
}
