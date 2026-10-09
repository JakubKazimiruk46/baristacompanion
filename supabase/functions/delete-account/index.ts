// Usunięcie konta: usuwa użytkownika z auth.users. Wszystkie jego dane (profil i kolejne tabele)
// znikają razem z nim, bo każda tabela odwołuje się do auth.users z „on delete cascade”.
import { adminClient, fail, json, preflight, requestUser } from '../_shared/http.ts';

Deno.serve(async (request) => {
  const early = preflight(request);
  if (early) return early;

  const user = await requestUser(request);
  if (!user) return fail(401, 'unauthorized', 'Zaloguj się ponownie.');

  const { error } = await adminClient().auth.admin.deleteUser(user.id);
  if (error) {
    // W logach tylko identyfikator, bez adresu e-mail.
    console.error('delete-account', user.id, error.message);
    return fail(500, 'delete_failed', 'Nie udało się usunąć konta. Spróbuj za chwilę.');
  }
  return json({ deleted: true });
});
