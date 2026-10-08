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
  // Cold brew: słoik z płatkiem śniegu.
  'cold-brew': (props) => (
    <Svg {...props}>
      <path d="M7 7h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7Z" />
      <path d="M6.5 3.5h11V7h-11z" />
      <path d="M12 10.5v6M9.4 12l5.2 3M9.4 15l5.2-3" />
    </Svg>
  ),
};

/** Ilustracja metody parzenia (ikona 24×24 w kolorze tekstu). */
export function MethodIcon({ methodId, ...props }: IconProps & { methodId: string }) {
  const Icon = ICONS[methodId] ?? BrewIcon;
  return <Icon {...props} />;
}
