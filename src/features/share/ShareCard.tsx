import { useId, type CSSProperties, type Ref } from 'react';
import type { Drink } from '../../data';
import { DrinkGlass } from '../glass/DrinkGlass';
import {
  CARD_HEIGHT,
  CARD_MARGIN,
  CARD_TEXT,
  CARD_WIDTH,
  cardColors,
  FONT,
  FOOTER_Y,
  layoutCard,
  PANEL,
  PANEL_INK,
  PANEL_INK_MUTED,
} from './card';

const RIGHT = CARD_WIDTH - CARD_MARGIN;

// Rysunek szklanki koloruje podpisy tokenami motywu. Na jasnym panelu karty muszą być ciemne
// w obu motywach, więc nadpisujemy tokeny dla tej części rysunku.
const panelInk = { '--ink': PANEL_INK, '--ink-muted': PANEL_INK_MUTED } as CSSProperties;

/**
 * Karta napoju do udostępnienia (1080×1920), w stylu karty ze Spotify: tło w kolorze napoju,
 * rysunek jak okładka, nazwa, hasło i najważniejsze informacje. Kolory są stałe, niezależne
 * od motywu, bo obrazek wychodzi poza aplikację.
 */
export function ShareCard({
  drink,
  className,
  ref,
}: {
  drink: Drink;
  className?: string;
  ref?: Ref<SVGSVGElement>;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const colors = cardColors(drink);
  const layout = layoutCard(drink);

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
      role="img"
      aria-label={`Karta napoju: ${drink.name}`}
      className={className}
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.top} />
          <stop offset="1" stopColor={colors.bottom} />
        </linearGradient>
      </defs>
      <rect width={CARD_WIDTH} height={CARD_HEIGHT} fill={`url(#${uid}-bg)`} />

      <rect x={PANEL.x} y={layout.panelY} width={PANEL.size} height={PANEL.size} rx={48} fill={colors.panel} />
      <g style={panelInk}>
        <DrinkGlass
          drink={drink}
          animate={false}
          frame={{ x: PANEL.x + 30, y: layout.panelY + 40, width: PANEL.size - 60, height: PANEL.size - 80 }}
        />
      </g>

      <g fill={CARD_TEXT}>
        <text className="font-display" fontSize={FONT.title} fontWeight={700}>
          {layout.title.map((line) => (
            <tspan key={line.y} x={CARD_MARGIN} y={line.y}>
              {line.text}
            </tspan>
          ))}
        </text>
        <text className="font-sans" fontSize={FONT.tagline} fillOpacity={0.9}>
          {layout.tagline.map((line) => (
            <tspan key={line.y} x={CARD_MARGIN} y={line.y}>
              {line.text}
            </tspan>
          ))}
        </text>
        <text className="font-sans" x={CARD_MARGIN} y={layout.meta.y} fontSize={FONT.meta} fontWeight={600}>
          {layout.meta.text}
        </text>

        <g className="font-sans" fontSize={FONT.row}>
          {layout.rows.map((row) => (
            <g key={row.y}>
              <text x={CARD_MARGIN} y={row.y}>
                {row.name}
              </text>
              {row.amount && (
                <text x={RIGHT} y={row.y} textAnchor="end" fontWeight={600} className="tabular-nums">
                  {row.amount}
                </text>
              )}
            </g>
          ))}
        </g>
        <line
          x1={CARD_MARGIN}
          x2={RIGHT}
          y1={layout.serving[0]!.y - 50}
          y2={layout.serving[0]!.y - 50}
          stroke={CARD_TEXT}
          strokeOpacity={0.3}
          strokeWidth={2}
        />
        <text className="font-sans" fontSize={FONT.serving} fillOpacity={0.9}>
          {layout.serving.map((line) => (
            <tspan key={line.y} x={CARD_MARGIN} y={line.y}>
              {line.text}
            </tspan>
          ))}
        </text>

        {/* Stopka jak logo na karcie Spotify: znak aplikacji i nazwa. */}
        <g transform={`translate(${CARD_MARGIN} ${FOOTER_Y - 44}) scale(2.4)`} fill="none" stroke={CARD_TEXT} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5.5 3h13l-1.6 16.2a2 2 0 0 1-2 1.8H9.1a2 2 0 0 1-2-1.8L5.5 3Z" />
          <path d="M6.2 10h11.6M6.7 15h10.6" />
        </g>
        <text className="font-display" x={CARD_MARGIN + 76} y={FOOTER_Y} fontSize={40} fontWeight={700}>
          Barista Companion
        </text>
      </g>
    </svg>
  );
}
