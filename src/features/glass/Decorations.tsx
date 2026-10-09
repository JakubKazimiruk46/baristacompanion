import type { ReactNode } from 'react';
import type { Decoration } from '../../data';
import {
  CX,
  halfWidthAt,
  lighten,
  seededRandom,
  type Surface,
  type VesselShape,
} from './geometry';

export type DecorationsProps = {
  shape: VesselShape;
  decorations: Decoration[];
  /** Wierzch napoju: tu leży posypka i owoce. */
  surface: Surface;
  transparent: boolean;
  /** Maska wnętrza naczynia (wzory na ściankach nie wychodzą poza szkło). */
  clip: string;
};

/** Dekoracje z danych napoju: wzory na ściankach, obtoczony brzeg, posypka, owoce. */
export function Decorations({ shape, decorations, surface, transparent, clip }: DecorationsProps) {
  return (
    <>
      {decorations.map((decoration) => {
        let look: string | undefined;
        let content: ReactNode = null;
        if (decoration.kind === 'wall-pattern') {
          // Na nieprzezroczystej filiżance wzoru na ściankach nie widać.
          content = transparent ? <WallPattern shape={shape} color={decoration.color} clip={clip} /> : null;
        } else if (decoration.kind === 'rim') {
          content = <Rim shape={shape} color={decoration.color} seed={decoration.name} />;
        } else {
          look = decoration.look ?? (decoration.kind === 'topping' ? 'dust' : 'slice');
          content =
            look === 'dust' || look === 'pieces' || look === 'drizzle' ? (
              <Topping surface={surface} look={look} color={decoration.color} seed={decoration.name} />
            ) : (
              <Garnish
                shape={shape}
                surface={surface}
                look={look as 'slice' | 'peel' | 'berries' | 'stick' | 'beans'}
                color={decoration.color}
              />
            );
        }
        return (
          content && (
            <g key={decoration.name} data-decoration={decoration.kind} data-look={look}>
              {content}
            </g>
          )
        );
      })}
    </>
  );
}

/** Smugi sosu spływające po wewnętrznej ściance. */
function WallPattern({ shape, color, clip }: { shape: VesselShape; color: string; clip: string }) {
  const h = shape.bottom - shape.top;
  // [położenie w poprzek szklanki, długość smugi (część wysokości), grubość u góry]
  const streaks = [
    [-0.78, 0.42, 4.5],
    [-0.4, 0.7, 5.5],
    [-0.02, 0.36, 4],
    [0.36, 0.6, 5],
    [0.74, 0.48, 4.5],
  ] as const;

  return (
    <g clipPath={clip} opacity={0.78}>
      {streaks.map(([rel, len, width], i) => {
        // Smuga jako wąski kształt: zwęża się ku dołowi i faluje, kończy kroplą.
        const left: string[] = [];
        const right: string[] = [];
        let end = { x: CX, y: shape.top };
        for (let t = 0.02; t <= len + 1e-9; t += 0.03) {
          const progress = t / len;
          const x = CX + rel * shape.hw(t) + Math.sin(t * 9 + i * 1.7) * 3;
          const y = shape.top + t * h;
          const half = (width * (1 - progress * 0.65)) / 2;
          left.push(`${(x - half).toFixed(1)} ${y.toFixed(1)}`);
          right.unshift(`${(x + half).toFixed(1)} ${y.toFixed(1)}`);
          end = { x, y };
        }
        return (
          <g key={i}>
            <path d={`M${[...left, ...right].join(' L')} Z`} fill={color} />
            <circle cx={end.x} cy={end.y + 1.5} r={width * 0.42} fill={color} />
          </g>
        );
      })}
      <path
        d={wave(CX - shape.hw(0), CX + shape.hw(0), shape.top + 7, 2.5, 10)}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </g>
  );
}

function wave(x0: number, x1: number, y: number, amplitude: number, step: number): string {
  const points: string[] = [];
  for (let x = x0, i = 0; x <= x1; x += step, i++) {
    points.push(`${x.toFixed(1)} ${(y + (i % 2 ? amplitude : -amplitude)).toFixed(1)}`);
  }
  return `M${points.join(' L')}`;
}

/** Brzeg obtoczony w cukrze, kakao lub okruchach: chropowaty pas wokół krawędzi. */
function Rim({ shape, color, seed }: { shape: VesselShape; color: string; seed: string }) {
  const y0 = shape.top - 2;
  const depth = 8;
  const edge = (y: number) => halfWidthAt(shape, y) + shape.wall + 1;
  const random = seededRandom(seed);

  // Pas wokół brzegu z poszarpaną dolną krawędzią: tak wygląda obtoczenie z przodu.
  const left = `${(CX - edge(y0)).toFixed(1)} ${y0}`;
  const right = `${(CX + edge(y0)).toFixed(1)} ${y0}`;
  const bottom: string[] = [];
  for (let i = 0; i <= 16; i++) {
    const y = y0 + depth + (random() - 0.5) * 5;
    const w = edge(y);
    bottom.push(`${(CX + w - (i / 16) * 2 * w).toFixed(1)} ${y.toFixed(1)}`);
  }
  const specks = Array.from({ length: 60 }, () => {
    const y = y0 + random() * depth;
    const w = edge(y);
    return { x: CX - w + random() * 2 * w, y, r: 0.5 + random() * 0.9, light: random() > 0.5 };
  });

  return (
    <>
      <path d={`M${left} L${right} L${bottom.join(' L')} Z`} fill={color} fillOpacity={0.85} />
      <ellipse cx={CX} cy={shape.top} rx={shape.hw(0) + shape.wall / 2} ry={4} fill="none" stroke={color} strokeWidth={4.5} />
      {specks.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.light ? '#fff' : '#000'} fillOpacity={s.light ? 0.5 : 0.12} />
      ))}
    </>
  );
}

/** Posypka na wierzchu: pył (kakao), kawałki (czekolada, orzechy) albo polewa. */
function Topping({
  surface,
  look,
  color,
  seed,
}: {
  surface: Surface;
  look: 'dust' | 'pieces' | 'drizzle';
  color: string;
  seed: string;
}) {
  const random = seededRandom(seed);
  const y = surface.y - 1;
  // Punkt w elipsie powierzchni (z marginesem przy brzegu).
  const spot = () => {
    const angle = random() * Math.PI * 2;
    const dist = Math.sqrt(random()) * 0.85;
    return { x: surface.cx + Math.cos(angle) * dist * surface.rx, y: y + Math.sin(angle) * dist * surface.ry };
  };

  if (look === 'drizzle') {
    const points: string[] = [];
    for (let i = 0; i <= 8; i++) {
      const x = surface.cx - surface.rx * 0.75 + (i / 8) * surface.rx * 1.5;
      points.push(`${x.toFixed(1)} ${(y + (i % 2 ? surface.ry * 0.7 : -surface.ry * 0.7) - 1).toFixed(1)}`);
    }
    return (
      <path d={`M${points.join(' L')}`} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    );
  }

  if (look === 'pieces') {
    return (
      <>
        {Array.from({ length: 18 }, (_, i) => {
          const p = spot();
          const w = 2.5 + random() * 2;
          return (
            <rect
              key={i}
              x={p.x - w / 2}
              y={p.y - 1}
              width={w}
              height={1.8}
              rx={0.6}
              transform={`rotate(${(random() * 80 - 40).toFixed(0)} ${p.x} ${p.y})`}
              fill={i % 4 === 0 ? lighten(color, 0.3) : color}
            />
          );
        })}
      </>
    );
  }

  return (
    <>
      <ellipse cx={surface.cx} cy={y} rx={surface.rx * 0.8} ry={surface.ry * 0.8} fill={color} fillOpacity={0.35} />
      {Array.from({ length: 50 }, (_, i) => {
        const p = spot();
        return <circle key={i} cx={p.x} cy={p.y} r={0.5 + random() * 0.9} fill={color} />;
      })}
    </>
  );
}

/** Dekoracja na górze: plaster owocu, skórka, maliny, laska cynamonu, ziarna kawy. */
function Garnish({
  shape,
  surface,
  look,
  color,
}: {
  shape: VesselShape;
  surface: Surface;
  look: 'slice' | 'peel' | 'berries' | 'stick' | 'beans';
  color: string;
}) {
  const topW = shape.hw(0);

  if (look === 'beans') {
    // Trzy ziarna kawy na piance, z bruzdą przez środek.
    const beans = [
      [-0.3, 0.1, -25],
      [0.02, -0.35, 15],
      [0.32, 0.15, 40],
    ] as const;
    return (
      <g>
        {beans.map(([rx, ry, rotate], i) => {
          const x = surface.cx + rx * surface.rx;
          const y = surface.y - 2 + ry * surface.ry;
          return (
            <g key={i} transform={`rotate(${rotate} ${x} ${y})`} data-bean="">
              <ellipse cx={x} cy={y} rx={5} ry={3.4} fill={color} />
              <path d={`M${x - 3.6} ${y} q1.8 -1.4 3.6 0 t3.6 0`} fill="none" stroke={lighten(color, 0.45)} strokeWidth={0.9} strokeLinecap="round" />
            </g>
          );
        })}
      </g>
    );
  }

  if (look === 'slice') {
    // Plaster nacięty do połowy i nasunięty na brzeg szklanki.
    const cx = CX + topW * 0.72;
    const cy = shape.top - 1;
    return (
      <g>
        <circle cx={cx} cy={cy} r={17} fill={color} />
        <circle cx={cx} cy={cy} r={14.5} fill={lighten(color, 0.4)} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + Math.cos(a) * 13.5}
              y2={cy + Math.sin(a) * 13.5}
              stroke={lighten(color, 0.75)}
              strokeWidth={1.2}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={2} fill={lighten(color, 0.75)} />
      </g>
    );
  }

  if (look === 'peel') {
    // Skręcony pasek skórki oparty o brzeg.
    const x = CX - topW * 0.55;
    const y = shape.top - 3;
    return (
      <g>
        <path
          d={`M${x} ${y + 4} c4 -12 16 -12 16 -2 s-12 8 -10 -1 s12 -10 18 -3`}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
        />
        <path
          d={`M${x} ${y + 4} c4 -12 16 -12 16 -2 s-12 8 -10 -1 s12 -10 18 -3`}
          fill="none"
          stroke={lighten(color, 0.5)}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (look === 'berries') {
    const berries = [
      [-0.35, 0],
      [0.05, -0.6],
      [0.38, 0.2],
    ] as const;
    const cells = [
      [0, 0],
      [-2.8, -1.5],
      [2.8, -1.5],
      [-2.8, 1.5],
      [2.8, 1.5],
      [0, -3],
      [0, 3],
    ] as const;
    return (
      <g>
        {berries.map(([rx, ry], i) => {
          const bx = surface.cx + rx * surface.rx;
          const by = surface.y - 5 + ry * surface.ry;
          return (
            <g key={i}>
              {cells.map(([dx, dy], j) => (
                <circle key={j} cx={bx + dx} cy={by + dy} r={2.3} fill={color} stroke={lighten(color, 0.25)} strokeWidth={0.6} />
              ))}
              <circle cx={bx - 1.5} cy={by - 2} r={0.9} fill="#fff" fillOpacity={0.7} />
            </g>
          );
        })}
      </g>
    );
  }

  // Laska cynamonu wystająca z napoju ponad brzeg.
  const x0 = CX + topW * 0.2;
  const y0 = surface.y + 30;
  const x1 = CX + topW * 0.7;
  const y1 = shape.top - 28;
  return (
    <g>
      <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={color} strokeWidth={7} strokeLinecap="round" />
      <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={lighten(color, 0.3)} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}
