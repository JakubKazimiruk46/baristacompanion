import { useParams } from 'react-router';
import { getMethod } from '../data';
import { BrewSession } from '../features/brewing/BrewSession';
import { ColdBrewSession } from '../features/coldbrew/ColdBrewSession';
import { NotFoundPage } from './NotFoundPage';

export const isLongBrew = (steps: { durationSec?: number }[]) =>
  steps.some((step) => (step.durationSec ?? 0) >= 3600);

export function BrewSessionPage() {
  const { methodId } = useParams();
  const method = methodId ? getMethod(methodId) : undefined;
  if (!method) return <NotFoundPage />;
  // Maceracja liczona w godzinach (cold brew) ma osobny ekran z zapisanym startem.
  if (isLongBrew(method.steps)) return <ColdBrewSession method={method} />;
  return <BrewSession key={method.id} method={method} />;
}
