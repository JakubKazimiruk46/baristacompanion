import { downloadBlob } from '../../lib/download';
import { getSupabase } from '../../lib/supabase';
import { errorMessage, type AccountUser, type ActionResult } from './auth';

/** Profil na serwerze (tabela profiles): nick i data założenia. */
export interface Profile {
  nick: string | null;
  createdAt: string;
}

export const NICK_LIMITS = { min: 2, max: 30 };

/** Litery (także polskie), cyfry, spacja, kropka, myślnik i podkreślenie; na początku litera albo cyfra. */
const NICK_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u;

export function nickError(nick: string): string | null {
  const value = nick.trim();
  if (value.length < NICK_LIMITS.min || value.length > NICK_LIMITS.max) {
    return `Nick ma mieć od ${NICK_LIMITS.min} do ${NICK_LIMITS.max} znaków.`;
  }
  if (!NICK_PATTERN.test(value)) return 'Użyj liter, cyfr, spacji, kropki, myślnika albo podkreślenia.';
  return null;
}

export async function loadProfile(userId: string): Promise<Profile | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('profiles').select('nick, created_at').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return { nick: data.nick as string | null, createdAt: data.created_at as string };
}

export async function saveNick(userId: string, nick: string): Promise<ActionResult> {
  const supabase = await getSupabase();
  try {
    const { error } = await supabase.from('profiles').update({ nick: nick.trim() }).eq('id', userId);
    if (!error) return { ok: true };
    // Unikalny indeks: ten nick ma już ktoś inny.
    if (error.code === '23505') return { ok: false, message: 'Ten nick jest zajęty. Wybierz inny.' };
    return { ok: false, message: errorMessage(error) };
  } catch {
    return { ok: false, message: errorMessage({ message: 'network' }) };
  }
}

/** Eksport danych konta (prawo do przenoszenia danych): wszystko, co jest o Tobie na serwerze. */
export function accountExport(user: AccountUser, profile: Profile | null, now = new Date()) {
  return {
    format: 'barista-companion.account',
    version: 1,
    exportedAt: now.toISOString(),
    account: { id: user.id, email: user.email, signIn: user.provider, createdAt: user.createdAt },
    profile: profile && { nick: profile.nick, createdAt: profile.createdAt },
  };
}

export function downloadAccountExport(user: AccountUser, profile: Profile | null) {
  const data = accountExport(user, profile);
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'barista-companion-konto.json');
}
