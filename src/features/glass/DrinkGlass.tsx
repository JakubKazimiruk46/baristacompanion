import { useId, type CSSProperties } from 'react';
import { hasIce, vessels, type Decoration, type Drink, type Extra } from '../../data';
import { Decorations } from './Decorations';
import {
  CX,
  fillFraction,
  halfWidthAt,
  iceCubes,
  layoutBands,
  layoutLabels,
  lighten,
  outlinePath,
  scoop,
  VESSEL_SHAPES,
  VESSEL_VIEW_W,
  VIEW_H,
  VIEW_W,
  wrapLabel,
  type LayerBand,
  type Surface,
  type VesselShape,
} from './geometry';

const CERAMIC = '#fbf8f4';
/** Odstęp między kolejnymi warstwami w animacji nalewania. */
const STEP_MS = 450;

type DrinkGlassProps = {
  drink: Drink;
  /** full: z podpisami i animacją; thumb: sama miniatura naczynia. */
  variant?: 'full' | 'thumb';
  /** Dekoracje do narysowania. Domyślnie z drink.serving. */
  decorations?: Decoration[];
  /** Animacja nalewania (domyślnie w wersji full). Karta do udostępnienia jej nie chce. */
  animate?: boolean;
  /** Położenie, gdy rysunek jest częścią większego SVG (karta do udostępnienia). */
  frame?: { x: number; y: number; width: number; height: number };
  className?: string;
};

export function DrinkGlass({
  drink,
  variant = 'full',
  decorations = drink.serving.decorations,
  animate,
  frame,
  className,
}: DrinkGlassProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const vessel = vessels[drink.serving.vessel];
  const shape = VESSEL_SHAPES[vessel.id];
  const ice = hasIce(drink);
  const total = drink.layers.reduce((sum, layer) => sum + layer.volumeMl, 0);
  const { bands, liquidTop } = layoutBands(
    drink.layers,
    shape,
    fillFraction(total, vessel.capacityMl, ice),
  );
  const full = variant === 'full';
  const inner = outlinePath(shape);
  const clip = `url(#${uid}-inner)`;
  const topBand = bands[bands.length - 1]!;
  const doneDelay = bands.length * STEP_MS;
  // Przycinamy rysunek nad naczyniem (zapas na dekoracje na brzegu). Skala zostaje ta sama,
  // więc mała szklanka wygląda na małą.
  const viewTop = Math.max(0, shape.top - (full ? 40 : 14));

  const animated = animate ?? full;
  const anim = (className: string, delayMs: number) =>
    animated ? { className, style: { animationDelay: `${delayMs}ms` } as CSSProperties } : {};

  const description = `${drink.name}, ${vessel.name}. Warstwy od dołu: ${drink.layers
    .map((layer) => `${layer.name} ${layer.volumeMl} ml`)
    .join(', ')}${ice ? '. Z lodem' : ''}.`;

  return (
    <svg
      viewBox={`0 ${viewTop} ${full ? VIEW_W : VESSEL_VIEW_W} ${VIEW_H - viewTop}`}
      preserveAspectRatio={frame ? 'xMidYMid meet' : 'xMidYMax meet'}
      className={className}
      {...frame}
      data-vessel={vessel.id}
      {...(full
        ? { role: 'img', 'aria-labelledby': `${uid}-title` }
        : { 'aria-hidden': true, focusable: false })}
    >
      {full && <title id={`${uid}-title`}>{description}</title>}
      <defs>
        <clipPath id={`${uid}-inner`}>
          <path d={inner} />
        </clipPath>
        <pattern id={`${uid}-foam`} width="9" height="7" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1.6" fill="#fff" fillOpacity="0.6" />
          <circle cx="7" cy="5.5" r="1.1" fill="#000" fillOpacity="0.07" />
        </pattern>
        {bands.slice(1).map((band, i) => (
          <linearGradient key={i} id={`${uid}-mix-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={band.layer.color} />
            <stop offset="1" stopColor={bands[i]!.layer.color} />
          </linearGradient>
        ))}
      </defs>

      <VesselBack shape={shape} transparent={vessel.transparent} inner={inner} />

      <g clipPath={clip}>
        {bands.map((band, i) => (
          <g
            key={band.layer.name}
            data-layer={band.layer.name}
            data-kind={band.layer.kind}
            {...anim('pour-layer', i * STEP_MS)}
          >
            <Band band={band} above={bands[i + 1]} shape={shape} foamFill={`url(#${uid}-foam)`} />
          </g>
        ))}
        {/* Płynne przejście między warstwami płynu. */}
        {bands.slice(1).map((band, i) =>
          band.layer.kind === 'liquid' && bands[i]!.layer.kind === 'liquid' ? (
            <rect
              key={band.layer.name}
              x={CX - 90}
              y={band.bottom - 3}
              width={180}
              height={6}
              fill={`url(#${uid}-mix-${i})`}
              {...anim('pour-fade', (i + 1) * STEP_MS + 200)}
            />
          ) : null,
        )}
        {ice && (
          <g {...anim('pour-fade', doneDelay)}>
            {iceCubes(shape, liquidTop, iceCount(drink.extras)).map((cube, i) => (
              <rect
                key={i}
                data-ice=""
                x={cube.x}
                y={cube.y}
                width={cube.size}
                height={cube.size}
                rx={3.5}
                transform={`rotate(${cube.rotate} ${cube.x + cube.size / 2} ${cube.y + cube.size / 2})`}
                fill="#fff"
                fillOpacity={0.38}
                stroke="#fff"
                strokeOpacity={0.8}
                strokeWidth={1.2}
              />
            ))}
          </g>
        )}
      </g>

      {vessel.transparent && topBand.layer.kind !== 'solid' && (
        <ellipse
          cx={CX}
          cy={liquidTop}
          rx={halfWidthAt(shape, liquidTop)}
          ry={Math.max(2.5, halfWidthAt(shape, liquidTop) * 0.09)}
          fill={lighten(topBand.layer.color, 0.12)}
          {...anim('pour-fade', doneDelay - STEP_MS / 2)}
        />
      )}

      {vessel.transparent ? (
        <GlassFront shape={shape} inner={inner} clip={clip} />
      ) : (
        <CupFront shape={shape} top={topBand} foamFill={`url(#${uid}-foam)`} />
      )}

      <g {...anim('pour-fade', doneDelay + 150)}>
        <Decorations
          shape={shape}
          decorations={decorations}
          surface={drinkSurface(shape, topBand, liquidTop, vessel.transparent)}
          transparent={vessel.transparent}
          clip={clip}
        />
      </g>

      {full && (
        <Labels
          bands={bands}
          shape={shape}
          minY={viewTop + 8}
          delay={animated ? (i) => i * STEP_MS + 300 : undefined}
        />
      )}
    </svg>
  );
}

/** Gdzie leży posypka: na gałce lodów, na napoju w filiżance albo na powierzchni w szklance. */
function drinkSurface(
  shape: VesselShape,
  top: LayerBand,
  liquidTop: number,
  transparent: boolean,
): Surface {
  if (top.layer.kind === 'solid') {
    const s = scoop(top, shape);
    return { cx: s.cx, y: s.cy - s.r * 0.72, rx: s.r * 0.6, ry: s.r * 0.22 };
  }
  if (!transparent) {
    return { cx: CX, y: shape.top + 1, rx: shape.hw(0) - 1, ry: 7.5 };
  }
  const rx = halfWidthAt(shape, liquidTop);
  const foamLift = top.layer.kind === 'foam' ? 2 : 0;
  return { cx: CX, y: liquidTop - foamLift, rx, ry: Math.max(2.5, rx * 0.09) };
}

function iceCount(extras: Extra[]): number {
  return extras.some((e) => e.kind === 'ice' && typeof e.amount === 'string' && e.amount.includes('pełna'))
    ? 6
    : 4;
}

function Band({
  band,
  above,
  shape,
  foamFill,
}: {
  band: LayerBand;
  above?: LayerBand;
  shape: VesselShape;
  foamFill: string;
}) {
  const height = band.bottom - band.top;
  const rect = (fill: string) => (
    <rect x={CX - 90} y={band.top} width={180} height={height + 0.5} fill={fill} />
  );

  if (band.layer.kind === 'foam') {
    // Pianka: jaśniejsza warstwa z bąbelkami i nierówną górą.
    const bumps = Array.from({ length: 20 }, () => 'a4.5 3 0 0 1 9 0').join(' ');
    return (
      <>
        {rect(band.layer.color)}
        <path d={`M${CX - 90} ${band.top + 1} ${bumps}`} fill={band.layer.color} />
        {rect(foamFill)}
      </>
    );
  }

  if (band.layer.kind === 'solid') {
    // Gałka lodów: koło na tle płynu z warstwy powyżej (np. kawy, którą zalano lody).
    const { cx, cy, r } = scoop(band, shape);
    return (
      <>
        {above && above.layer.kind === 'liquid' && rect(above.layer.color)}
        <circle cx={cx} cy={cy} r={r} fill={band.layer.color} />
        <circle cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.35} fill="#fff" fillOpacity={0.35} />
      </>
    );
  }

  return rect(band.layer.color);
}

/** Tło za napojem: spodek, stopka pucharka, lekki odcień szkła. */
function VesselBack({ shape, transparent, inner }: { shape: VesselShape; transparent: boolean; inner: string }) {
  const bottomW = shape.hw(1);
  return (
    <>
      {shape.kind === 'cup' && (
        <ellipse
          cx={CX}
          cy={shape.bottom + shape.wall + 3}
          rx={bottomW + shape.wall + 44}
          ry={8}
          fill={CERAMIC}
          className="stroke-ink/25"
          strokeWidth={1.2}
        />
      )}
      {shape.kind === 'stemmed' && (
        <>
          <ellipse cx={CX} cy={shape.bottom + 42} rx={38} ry={6} className="fill-ink/[0.06] stroke-ink/30" strokeWidth={1.2} />
          <rect x={CX - 4} y={shape.bottom + 2} width={8} height={40} className="fill-ink/[0.08] stroke-ink/30" strokeWidth={1.2} />
        </>
      )}
      {transparent && <path d={inner} className="fill-ink/[0.04]" />}
    </>
  );
}

/** Szkło z przodu: ścianki, grube dno, brzeg i odblaski. */
function GlassFront({ shape, inner, clip }: { shape: VesselShape; inner: string; clip: string }) {
  const bottomW = shape.hw(1);
  const topW = shape.hw(0);
  const h = shape.bottom - shape.top;
  return (
    <>
      <g clipPath={clip}>
        <rect x={CX - topW * 0.72} y={shape.top + 8} width={5} height={h - 16} rx={2.5} fill="#fff" fillOpacity={0.3} />
        <rect x={CX + topW * 0.6} y={shape.top + 14} width={2.5} height={h - 28} rx={1.25} fill="#fff" fillOpacity={0.2} />
      </g>
      {shape.base > 0 && (
        <path
          d={`M${CX - bottomW} ${shape.bottom} L${CX - bottomW - shape.wall} ${shape.bottom + shape.base} L${CX + bottomW + shape.wall} ${shape.bottom + shape.base} L${CX + bottomW} ${shape.bottom} Z`}
          className="fill-ink/[0.07]"
        />
      )}
      <path d={inner} fill="none" className="stroke-ink/15" strokeWidth={1} />
      <path
        d={outlinePath(shape, shape.wall, shape.base)}
        fill="none"
        className="stroke-ink/35"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <ellipse cx={CX} cy={shape.top} rx={topW + shape.wall / 2} ry={4} fill="none" className="stroke-ink/30" strokeWidth={1.2} />
    </>
  );
}

/** Nieprzezroczysta filiżanka: ucho, korpus i napój widoczny z góry przez brzeg. */
function CupFront({ shape, top, foamFill }: { shape: VesselShape; top: LayerBand; foamFill: string }) {
  const h = shape.bottom - shape.top;
  const y1 = shape.top + h * 0.18;
  const y2 = shape.top + h * 0.62;
  const x1 = CX + halfWidthAt(shape, y1) + shape.wall - 3;
  const x2 = CX + halfWidthAt(shape, y2) + shape.wall - 3;
  const handle = `M${x1} ${y1} C${x1 + 32} ${y1 - 2} ${x2 + 30} ${y2 + 4} ${x2} ${y2}`;
  const rimRx = shape.hw(0) + shape.wall;

  return (
    <>
      <path d={handle} fill="none" className="stroke-ink/25" strokeWidth={11} strokeLinecap="round" />
      <path d={handle} fill="none" stroke={CERAMIC} strokeWidth={8} strokeLinecap="round" />
      <path
        d={outlinePath(shape, shape.wall, shape.wall)}
        fill={CERAMIC}
        className="stroke-ink/25"
        strokeWidth={1.2}
      />
      <ellipse cx={CX} cy={shape.top} rx={rimRx} ry={10} fill={CERAMIC} className="stroke-ink/25" strokeWidth={1.2} />
      <ellipse cx={CX} cy={shape.top + 1} rx={rimRx - shape.wall} ry={7.5} fill={top.layer.color} />
      {top.layer.kind === 'foam' && (
        <ellipse cx={CX} cy={shape.top + 1} rx={rimRx - shape.wall} ry={7.5} fill={foamFill} />
      )}
    </>
  );
}

function Labels({
  bands,
  shape,
  minY,
  delay,
}: {
  bands: LayerBand[];
  shape: VesselShape;
  minY: number;
  /** Opóźnienie pojawienia się podpisu; bez niego podpisy są od razu. */
  delay?: (index: number) => number;
}) {
  const LINE = 13;
  const TEXT_X = 206;
  const blocks = bands.map((band) => {
    const lines = wrapLabel(band.layer.name);
    return { lines, center: (band.top + band.bottom) / 2, height: (lines.length + 1) * LINE };
  });
  const tops = layoutLabels(blocks, minY, VIEW_H - 6);

  return (
    <g>
      {blocks.map((block, i) => {
        const top = tops[i]!;
        const labelMid = top + block.height / 2;
        const edge = CX + halfWidthAt(shape, block.center) + shape.wall + 3;
        return (
          <g
            key={bands[i]!.layer.name}
            {...(delay && { className: 'pour-fade', style: { animationDelay: `${delay(i)}ms` } })}
          >
            <circle cx={edge} cy={block.center} r={2} className="fill-ink/50" />
            <path
              d={`M${edge} ${block.center} C${edge + 20} ${block.center} ${TEXT_X - 26} ${labelMid} ${TEXT_X - 6} ${labelMid}`}
              fill="none"
              className="stroke-ink/30"
              strokeWidth={1}
            />
            <text x={TEXT_X} y={top + LINE - 3} fontSize={12} className="fill-ink" fontWeight={600}>
              {block.lines.map((line, j) => (
                <tspan key={j} x={TEXT_X} dy={j === 0 ? 0 : LINE}>
                  {line}
                </tspan>
              ))}
              <tspan x={TEXT_X} dy={LINE} fontSize={11} fontWeight={400} className="fill-ink-muted">
                {bands[i]!.layer.volumeMl} ml
              </tspan>
            </text>
          </g>
        );
      })}
    </g>
  );
}
