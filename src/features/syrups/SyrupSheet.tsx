import { Link } from 'react-router';
import { ChevronRightIcon } from '../../components/icons';
import { Sheet } from '../../components/Sheet';
import { getSyrup } from '../../data';
import { useDialogParam } from '../../lib/useDialogParam';
import { SyrupRecipe } from './SyrupRecipe';

/** Okno „Kup albo zrób sam” sterowane parametrem ?syrop= w adresie. */
export function useSyrupDialog() {
  const dialog = useDialogParam('syrop');
  const syrup = dialog.value ? getSyrup(dialog.value) : undefined;

  const sheet = (
    <Sheet title={syrup?.name ?? ''} subtitle="Kup albo zrób sam" open={syrup !== undefined} onClose={dialog.close}>
      {syrup && <SyrupRecipe syrup={syrup} />}
      <Link to="/napoje/syropy" className="mt-5 inline-flex h-10 items-center gap-1 font-medium text-accent">
        Wszystkie syropy domowe
        <ChevronRightIcon className="size-5" />
      </Link>
    </Sheet>
  );

  return { open: dialog.open, sheet };
}
