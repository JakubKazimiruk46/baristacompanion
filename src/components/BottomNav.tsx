import { Link, useLocation } from 'react-router';
import { BeanIcon, BrewIcon, DrinkIcon, HomeIcon, type IconComponent } from './icons';

type Tab = {
  to: string;
  label: string;
  Icon: IconComponent;
  /** Inne adresy, na których zakładka jest aktywna (np. ścieżka „Mam kawę” należy do Startu). */
  also?: string[];
};

const tabs: Tab[] = [
  { to: '/', label: 'Start', Icon: HomeIcon, also: ['/mam-kawe', '/konto', '/prywatnosc', '/moderacja'] },
  { to: '/napoje', label: 'Napoje', Icon: DrinkIcon },
  { to: '/parzenie', label: 'Parzenie', Icon: BrewIcon, also: ['/przepis'] },
  { to: '/ziarna', label: 'Moje ziarna', Icon: BeanIcon },
];

const isUnder = (pathname: string, base: string) =>
  base === '/' ? pathname === '/' : pathname === base || pathname.startsWith(`${base}/`);

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Główna nawigacja"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md [view-transition-name:bottom-nav]"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map(({ to, label, Icon, also = [] }) => {
          // Aktywna także na podstronach, np. /parzenie/kawiarka.
          const active = [to, ...also].some((base) => isUnder(pathname, base));
          return (
            <li key={to}>
              <Link
                to={to}
                viewTransition
                aria-current={active ? 'page' : undefined}
                className="group flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-ink-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset aria-[current=page]:text-accent"
              >
                <span className="flex h-8 w-14 items-center justify-center rounded-full transition-colors group-aria-[current=page]:bg-accent-soft">
                  <Icon className="size-6" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
