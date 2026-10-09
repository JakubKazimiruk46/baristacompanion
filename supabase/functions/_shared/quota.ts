// Dzienne limity funkcji AI na użytkownika (decyzja P8). Zmienne środowiskowe pozwalają je
// zmienić bez wdrażania kodu: npx supabase secrets set AI_DAILY_LABEL_SCANS=30
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export type AiKind = 'label_scan' | 'drink_assistant';

const DEFAULT_LIMITS: Record<AiKind, number> = { label_scan: 20, drink_assistant: 10 };
const ENV: Record<AiKind, string> = { label_scan: 'AI_DAILY_LABEL_SCANS', drink_assistant: 'AI_DAILY_DRINKS' };

export function dailyLimit(kind: AiKind): number {
  const value = Number(Deno.env.get(ENV[kind]));
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_LIMITS[kind];
}

/** Zużywa jedno użycie. Zwraca, ile zostało na dziś, albo null, gdy limit się wyczerpał. */
export async function consumeQuota(admin: SupabaseClient, userId: string, kind: AiKind): Promise<number | null> {
  const { data, error } = await admin.rpc('consume_ai_quota', { p_user: userId, p_kind: kind, p_limit: dailyLimit(kind) });
  if (error) throw new Error(`quota: ${error.message}`);
  return typeof data === 'number' && data >= 0 ? data : null;
}

/** Oddaje użycie po nieudanej próbie (błąd albo odmowa modelu). */
export async function releaseQuota(admin: SupabaseClient, userId: string, kind: AiKind): Promise<void> {
  await admin.rpc('release_ai_quota', { p_user: userId, p_kind: kind });
}
