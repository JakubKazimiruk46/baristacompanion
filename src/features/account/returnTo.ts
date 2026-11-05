import { createLocalStore } from '../../lib/localStore';

/**
 * Dokąd wrócić po zalogowaniu (np. do zakładki Społeczność). Zapis w localStorage, bo link
 * z e-maila otwiera aplikację od nowa (czasem w nowej karcie) i adres /konto?wroc= przepada.
 */
export const RETURN_KEY = 'barista-companion.auth-return.v1';

/** Tylko adresy w aplikacji: „/coś”, bez „//host” i bez pełnych adresów. */
export const safeReturnPath = (value: unknown): string | null =>
  typeof value === 'string' && /^\/(?!\/)[^\s\\]*$/.test(value) && value.length <= 200 && !value.startsWith('/konto')
    ? value
    : null;

export const returnStore = createLocalStore<string | null>(RETURN_KEY, safeReturnPath, null);
