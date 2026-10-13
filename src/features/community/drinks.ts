import { normalizeDrink } from '../../../supabase/functions/_shared/drinkRules.ts';
import type { Drink } from '../../data';
import { isValidDrink } from '../../data/validate';
import { backendEnabled, getSupabase } from '../../lib/supabase';
import type { MyDrink } from '../assistant/myDrinks';
import { CommunityError, PAGE_SIZE, type CommunitySort, type ReportReason } from './api';

/**
 * Napoje społeczności (tabela public_drinks). Napój z serwera przechodzi te same reguły co katalog
 * i „Moje napoje” (normalizeDrink + validateDrink), zanim cokolwiek go narysuje; teksty zawsze
 * jako tekst. Id napoju w aplikacji jest stałe (spolecznosc-…), bo przy publikacji id „Mojego
 * napoju” zostaje u autora.
 */
export interface CommunityDrink {
  id: string;
  authorId: string;
  author: string;
  drink: Drink;
  savesCount: number;
  status: 'published' | 'reported' | 'hidden';
  createdAt: string;
}

const COLUMNS = 'id, author_id, author_nick, drink, status, saves_count, created_at';

interface Row {
  id: string;
  author_id: string;
  author_nick: string;
  drink: unknown;
  status: CommunityDrink['status'];
  saves_count: number;
  created_at: string;
}

/** Id napoju ze społeczności w aplikacji (slug, poza adresami innych ekranów). */
export const communityDrinkId = (rowId: string) => `spolecznosc-${rowId.replace(/[^a-z0-9]/gi, '').slice(0, 12).toLowerCase()}`;

export const communityDrinkPath = (id: string) => `/spolecznosc/napoje/${id}`;

/** Wiersz z serwera jako napój. null: nie przechodzi reguł aplikacji (pomijamy go). */
export function fromDrinkRow(row: Row): CommunityDrink | null {
  const normalized = normalizeDrink(row.drink);
  if (typeof normalized !== 'object' || normalized === null) return null;
  const drink = { ...(normalized as Drink), id: communityDrinkId(row.id) };
  if (!isValidDrink(drink) || typeof row.author_nick !== 'string') return null;
  return {
    id: row.id,
    authorId: row.author_id,
    author: row.author_nick,
    drink,
    savesCount: row.saves_count,
    status: row.status,
    createdAt: row.created_at,
  };
}

function failure(error: { code?: string }): CommunityError {
  if (!navigator.onLine) return new CommunityError('Brak internetu. Społeczność wymaga połączenia.');
  if (error.code === 'P0001') return new CommunityError('Ustaw nick na ekranie konta, zanim opublikujesz napój.');
  if (error.code === '54000') return new CommunityError('Masz już najwięcej opublikowanych napojów (100).');
  if (error.code === '23514') return new CommunityError('Serwer nie przyjął napoju: sprawdź go w kreatorze.');
  if (error.code === '42501') return new CommunityError('Zaloguj się ponownie.');
  return new CommunityError('Nie udało się połączyć z serwerem. Spróbuj ponownie.');
}

export async function listDrinks(sort: CommunitySort, page = 0): Promise<CommunityDrink[]> {
  const supabase = await getSupabase();
  let query = supabase.from('public_drinks').select(COLUMNS).eq('status', 'published');
  query =
    sort === 'popular'
      ? query.order('saves_count', { ascending: false }).order('created_at', { ascending: false })
      : query.order('created_at', { ascending: false });
  const { data, error } = await query.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  if (error) throw failure(error);
  return ((data ?? []) as Row[]).map(fromDrinkRow).filter((d): d is CommunityDrink => d !== null);
}

export async function getCommunityDrink(id: string): Promise<CommunityDrink | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('public_drinks').select(COLUMNS).eq('id', id).maybeSingle();
  if (error) throw failure(error);
  return data ? fromDrinkRow(data as Row) : null;
}

export type PublishedDrink = { id: string; status: CommunityDrink['status']; savesCount: number; name: string };

/** Moje opublikowane napoje: id na serwerze dla id „Mojego napoju”. */
export async function myPublishedDrinks(userId: string): Promise<Map<string, PublishedDrink>> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('public_drinks')
    .select('id, source_id, status, saves_count, name')
    .eq('author_id', userId);
  if (error) throw failure(error);
  return new Map(
    ((data ?? []) as { id: string; source_id: string; status: CommunityDrink['status']; saves_count: number; name: string }[]).map(
      (row) => [row.source_id, { id: row.id, status: row.status, savesCount: row.saves_count, name: row.name }],
    ),
  );
}

/** Czy „Mój napój” wolno opublikować: tylko własny z kreatora, nie kopia ani propozycja AI. */
export const canPublishDrink = (item: MyDrink) => item.source === 'own' && !item.origin;

/** Okno „Napój zapisany” na ekranie napoju, ostatni krok kreatora: /napoje/:id?opublikuj=1. */
export const PUBLISH_STEP_PARAM = 'opublikuj';

/** Dokąd kreator prowadzi po zapisie: ekran napoju, z krokiem publikacji, gdy jest backend i napój wolno opublikować. */
export const editorDonePath = (id: string, item: MyDrink | undefined) =>
  backendEnabled() && item && canPublishDrink(item) ? `/napoje/${id}?${PUBLISH_STEP_PARAM}=1` : `/napoje/${id}`;

/**
 * Publikuje (albo aktualizuje) własny napój. Nazwę i temperaturę baza bierze z dokumentu.
 * Bez upsert: baza pozwala autorowi zmieniać tylko dokument, a upsert ustawia też author_id i source_id
 * (42501). Już opublikowany napój (duplikat, 23505) dostaje więc nowy dokument przez update.
 */
export async function publishDrink(userId: string, item: MyDrink): Promise<void> {
  if (!canPublishDrink(item)) throw new CommunityError('Opublikować możesz tylko własne napoje z kreatora.');
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('public_drinks')
    .insert({ author_id: userId, source_id: item.drink.id, drink: item.drink });
  if (error?.code !== '23505') {
    if (error) throw failure(error);
    return;
  }
  const { error: updateError } = await supabase
    .from('public_drinks')
    .update({ drink: item.drink })
    .eq('author_id', userId)
    .eq('source_id', item.drink.id);
  if (updateError) throw failure(updateError);
}

export async function withdrawDrink(userId: string, sourceId: string): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.from('public_drinks').delete().eq('author_id', userId).eq('source_id', sourceId);
  if (error) throw failure(error);
}

/** Liczy zapis u siebie (raz na osobę). Zwraca liczbę zapisów. */
export async function countDrinkSave(id: string): Promise<number | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('save_public_drink', { p_drink_id: id });
  if (error) throw failure(error);
  return typeof data === 'number' ? data : null;
}

export async function reportDrink(id: string, reason: ReportReason, comment: string): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc('report_public_drink', {
    p_drink_id: id,
    p_reason: reason,
    p_comment: comment.trim() || null,
  });
  if (error) throw failure(error);
}

export async function moderateDrink(id: string, decision: 'hide' | 'restore'): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc('moderate_public_drink', { p_drink_id: id, p_decision: decision });
  if (error) throw failure(error);
}
