import { useParams } from 'react-router';
import { getMethod, type BrewMethod } from '../data';
import { BrewSession } from '../features/brewing/BrewSession';
import { scaleMethod } from '../features/brewing/dose';
import { useWaterMl } from '../features/brewing/doseStore';
import { ColdBrewSession } from '../features/coldbrew/ColdBrewSession';
import { NotFoundPage } from './NotFoundPage';

export const isLongBrew = (steps: { durationSec?: number }[]) =>
  steps.some((step) => (step.durationSec ?? 0) >= 3600);

export function BrewSessionPage() {
  const { methodId } = useParams();
  const method = methodId ? getMethod(methodId) : undefined;
  if (!method) return <NotFoundPage />;
  return <ScaledSession key={method.id} method={method} />;
}

/** Parzenie z ilościami z kalkulatora na ekranie metody. */
function ScaledSession({ method: base }: { method: BrewMethod }) {
  const method = scaleMethod(base, useWaterMl(base));
  // Maceracja liczona w godzinach (cold brew) ma osobny ekran z zapisanym startem.
  if (isLongBrew(method.steps)) return <ColdBrewSession method={method} />;
  return <BrewSession method={method} />;
}
