import type { ComponentType, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;
export type IconComponent = ComponentType<IconProps>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
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

/** Dom (zakładka Start). */
export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </Icon>
  );
}

/** Wysoka szklanka z warstwami (zakładka Napoje). */
export function DrinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 3h13l-1.6 16.2a2 2 0 0 1-2 1.8H9.1a2 2 0 0 1-2-1.8L5.5 3Z" />
      <path d="M6.2 10h11.6" />
      <path d="M6.7 15h10.6" />
    </Icon>
  );
}

/** Drip z uchwytem na kubku (zakładka Parzenie). */
export function BrewIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 4h15l-4.5 8h-6L3 4Z" />
      <path d="M17.2 5.5h1.8a1.75 1.75 0 0 1 0 3.5h-3.6" />
      <path d="M8.5 14h4" />
      <path d="M4.5 16h12v1a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4v-1Z" />
      <path d="M16.5 16.5h1a1.75 1.75 0 0 1 0 3.5h-1.6" />
    </Icon>
  );
}

/** Parujący kubek (napój na ciepło). */
export function HotIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 10h11v4.5a5.5 5.5 0 0 1-5.5 5.5A5.5 5.5 0 0 1 5 14.5V10Z" />
      <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 3.5c-.8 1 .8 2 0 3M11 3.5c-.8 1 .8 2 0 3M14 3.5c-.8 1 .8 2 0 3" />
    </Icon>
  );
}

/** Płatek śniegu (napój na zimno). */
export function ColdIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
      <path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  );
}

/** Liść (wersja roślinna). */
export function LeafIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15Z" />
      <path d="M5 19c3-4 6-7 9-9" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

/** Karton mleka. */
export function MilkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 3h8v3l2 3.5V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9.5L8 6V3Z" />
      <path d="M6 10h12M8 6h8" />
    </Icon>
  );
}

/** Trzepaczka (spienianie). */
export function FrothIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2v6" />
      <path d="M12 8c-3 0-4.5 4-4.5 7.5a4.5 4.5 0 0 0 9 0C16.5 12 15 8 12 8Z" />
      <path d="M12 8v12M9.5 9.5c.8 3 .8 7 0 10M14.5 9.5c-.8 3-.8 7 0 10" />
    </Icon>
  );
}

/** Butelka syropu. */
export function SyrupIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 2h4v4l2 3v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9l2-3V2Z" />
      <path d="M8 12h8v5H8z" />
    </Icon>
  );
}

/** Ziarno kawy (zakładka Moje ziarna). */
export function BeanIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <g transform="rotate(-35 12 12)">
        <ellipse cx="12" cy="12" rx="6.5" ry="9" />
        <path d="M12 3.5C9.5 6.5 9.5 9 12 12s2.5 5.5 0 8.5" />
      </g>
    </Icon>
  );
}

/** Ręczny młynek z korbką (Mój młynek). */
export function GrinderIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 10h8v9.5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 19.5V10Z" />
      <path d="M6.5 10h11M8 15h8M12 10V5.5h6V3" />
    </Icon>
  );
}

/** Serce (ulubione). Wypełnione: fill="currentColor". */
export function HeartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3Z" />
    </Icon>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

/** Gwiazdka oceny. Wypełniona: fill="currentColor". */
export function StarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3.8 2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8L12 3.8Z" />
    </Icon>
  );
}

/** Notes z zakładką (dziennik parzeń). */
export function JournalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3.5h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1.5 1.5 0 0 1-1.5-1.5v-14A1.5 1.5 0 0 1 6 3.5Z" />
      <path d="M8.5 8h6M8.5 11.5h6M8.5 15h3.5" />
    </Icon>
  );
}

/** Półka ze słoikami (co mam w domu). */
export function PantryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 20.5h18M3 11h18" />
      <path d="M5.5 11V6.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V11M7 5.5V4h2v1.5" />
      <path d="M13.5 11V8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3" />
      <path d="M5 20.5V16a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4.5M14 20.5v-6l2-1.5 2 1.5v6" />
    </Icon>
  );
}

/** Koszyk (lista zakupów). */
export function CartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 4h2.2l2.3 11h10.2l2-8H6.3" />
      <circle cx="9" cy="19" r="1.4" />
      <circle cx="16.5" cy="19" r="1.4" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Icon>
  );
}

/** Strzałka z pudełka (udostępnij). */
export function ShareIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 15V3.5M8 7.5l4-4 4 4" />
      <path d="M7 10.5H6a1.5 1.5 0 0 0-1.5 1.5v7.5A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5h-1" />
    </Icon>
  );
}

/** Aparat (skan etykiety). */
export function CameraIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.4-2h5.6l1.4 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </Icon>
  );
}

export function ChevronUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 15 6-6 6 6" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

/** Kosz (usuń). */
export function TrashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 7h15M10 4h4M6.5 7l.9 12.1a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9L17.5 7" />
      <path d="M10 11v6M14 11v6" />
    </Icon>
  );
}

/** Ołówek (edytuj). */
export function PencilIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </Icon>
  );
}

/** Postać (konto). */
export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" />
    </Icon>
  );
}

/** Tarcza (prywatność). */
export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  );
}

/** Zakładka w książce (chcę spróbować). Wypełniona: fill="currentColor". */
export function BookmarkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 3.5h11a1 1 0 0 1 1 1V21l-6.5-4.5L5.5 21V4.5a1 1 0 0 1 1-1Z" />
    </Icon>
  );
}

/** Kostka do gry (losowanie). */
export function DiceIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/** Lupa (szukaj). */
export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5 5" />
    </Icon>
  );
}

/** Suwaki (filtry). */
export function SlidersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </Icon>
  );
}

/** Drogowskaz (wybiorę sam). */
export function SignpostIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3v18M8.5 21h7" />
      <path d="M12 5.5h6.5l2 2-2 2H12M12 11.5H5.5l-2 2 2 2H12" />
    </Icon>
  );
}

/** Iskry (zaskocz mnie). */
export function SparklesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 3.5 11.6 8a2 2 0 0 0 1.3 1.3l4.6 1.7-4.6 1.6a2 2 0 0 0-1.3 1.3L10 18.5l-1.6-4.6a2 2 0 0 0-1.3-1.3L2.5 11l4.6-1.7A2 2 0 0 0 8.4 8L10 3.5Z" />
      <path d="M18 14.5v5M15.5 17h5M17.5 3v3.5M15.75 4.75h3.5" />
    </Icon>
  );
}

/** Butelka i ziarno (zakładka Baribar). */
export function BarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 2.5h3v3.2c0 .6.3 1.1.8 1.5l.7.6c.6.5 1 1.2 1 2V20a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4.5 20V9.8c0-.8.4-1.5 1-2l.7-.6c.5-.4.8-.9.8-1.5V2.5Z" />
      <path d="M4.5 12.5h8" />
      <ellipse cx="17.5" cy="16.5" rx="3" ry="4" transform="rotate(25 17.5 16.5)" />
      <path d="M16.2 13.2c1 1.2 1.4 2.4 1 3.6s-.2 2.3.8 3" />
    </Icon>
  );
}

/** Dwie osoby (zakładka Społeczność). */
export function PeopleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.9-3.4 3.4-5 6.5-5s5.6 1.6 6.5 5" />
      <path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4M17.5 15.2c2 .6 3.4 2.2 4 4.8" />
    </Icon>
  );
}

/** Flaga (zgłoś). */
export function FlagIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 21V4M5 4.5h11.5l-2 4 2 4H5" />
    </Icon>
  );
}

/** Ogniwa łańcucha (link). */
export function LinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </Icon>
  );
}
