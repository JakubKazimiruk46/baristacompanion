// Wspólne dla funkcji serwerowych (Deno, Supabase Edge Functions): CORS, odpowiedzi JSON
// i zalogowany użytkownik z nagłówka Authorization.
import { createClient, type SupabaseClient, type User } from 'jsr:@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Błąd dla aplikacji: kod do rozpoznania w kodzie i komunikat po polsku. */
export const fail = (status: number, code: string, message: string) => json({ error: { code, message } }, status);

const env = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Brak zmiennej środowiskowej ${name}`);
  return value;
};

/** Klient z uprawnieniami serwera (klucz service_role tylko w sekretach funkcji, nigdy w przeglądarce). */
export function adminClient(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Zalogowany użytkownik z tokenu w nagłówku. null: brak albo nieważny token. */
export async function requestUser(request: Request): Promise<User | null> {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  const { data, error } = await adminClient().auth.getUser(authorization.slice('Bearer '.length));
  return error ? null : data.user;
}

/** Obsługa zapytania wstępnego CORS i metody innej niż POST. */
export function preflight(request: Request): Response | null {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return fail(405, 'method_not_allowed', 'Dozwolona jest tylko metoda POST.');
  return null;
}
