import { useEffect } from 'react';
import { getColdBrewVariant, variantTitle } from '../../data';
import {
  cancelNotification,
  NOTIFICATION_IDS,
  scheduleNotification,
  useNotificationsState,
} from '../../lib/notifications';
import { useColdBrew } from './store';
import { readyAt } from './time';

/**
 * Powiadomienie na godzinę gotowości cold brew (aplikacja na Androida). Rozpoczęcie maceracji
 * je planuje, a przerwanie albo zakończenie odwołuje. Planujemy od nowa po każdym starcie
 * aplikacji i po udzieleniu zgody: to samo id zastępuje poprzednie powiadomienie.
 */
export function useColdBrewNotification() {
  const run = useColdBrew();
  const { asked } = useNotificationsState();
  const at = run ? readyAt(run.startedAt, run.hours) : null;
  const title = run ? `${variantTitle(getColdBrewVariant(run.variantId)!)} gotowe` : '';

  useEffect(() => {
    if (at === null) {
      void cancelNotification(NOTIFICATION_IDS.coldBrew);
      return;
    }
    void scheduleNotification({
      id: NOTIFICATION_IDS.coldBrew,
      at,
      title,
      body: 'Przecedź koncentrat: najpierw przez sitko, potem przez filtr papierowy.',
    });
  }, [at, title, asked]);
}
