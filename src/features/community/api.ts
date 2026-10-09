import { getSupabase } from '../../lib/supabase';
import { parseRecipeInput, type RecipeInput, type UserRecipe } from '../recipes/recipe';

/**
 * Przepisy społeczności (tabela public_recipes i funkcje save/report/moderate). Teksty od
 * użytkowników wyświetlamy zawsze jako tekst, a przepis z serwera przechodzi tę samą walidację
 * co własny przepis (parseRecipeInput), zanim cokolwiek go narysuje.
 */
export interface CommunityRecipe {
  id: string;
  authorId: string;
  author: string;
  recipe: RecipeInput;
  savesCount: number;
  status: 'published' | 'reported' | 'hidden';
  createdAt: string;
}

export type CommunitySort = 'newest' | 'popular';

export const PAGE_SIZE = 20;

const COLUMNS =
  'id, author_id, author_nick, method_id, name, description, dose, water_temp, grind, steps, status, saves_count, created_at';

interface Row {
  id: string;
  author_id: string;
  author_nick: string;
  method_id: string;
  name: string;
  description: string | null;
  dose: unknown;
  water_temp: unknown;
  grind: string;
  steps: unknown;
  status: CommunityRecipe['status'];
  saves_count: number;
  created_at: string;
}

/** Wiersz z serwera jako przepis. null: nie przechodzi walidacji aplikacji (pomijamy go). */
export function fromRow(row: Row): CommunityRecipe | null {
  const recipe = parseRecipeInput({
    methodId: row.method_id,
    name: row.name,
    dose: row.dose,
    waterTempC: row.water_temp,
    grind: row.grind,
    steps: row.steps,
    ...(row.description && { note: row.description }),
  });
  if (!recipe || typeof row.author_nick !== 'string') return null;
  return {
    id: row.id,
    authorId: row.author_id,
    author: row.author_nick,
    recipe,
    savesCount: row.saves_count,
    status: row.status,
    createdAt: row.created_at,
  };
}

export class CommunityError extends Error {}

/** Błąd z serwera po polsku. */
function failure(error: { message?: string; code?: string }): CommunityError {
  if (!navigator.onLine) return new CommunityError('Brak internetu. Przepisy społeczności wymagają połączenia.');
  if (error.code === 'P0001') return new CommunityError('Ustaw nick na ekranie konta, zanim opublikujesz przepis.');
  if (error.code === '54000') return new CommunityError('Masz już najwięcej opublikowanych przepisów (100).');
  if (error.code === '42501') return new CommunityError('Zaloguj się ponownie.');
  return new CommunityError('Nie udało się połączyć z serwerem. Spróbuj ponownie.');
}

export async function listRecipes(methodId: string, sort: CommunitySort, page = 0): Promise<CommunityRecipe[]> {
  const supabase = await getSupabase();
  let query = supabase.from('public_recipes').select(COLUMNS).eq('method_id', methodId).eq('status', 'published');
  query =
    sort === 'popular'
      ? query.order('saves_count', { ascending: false }).order('created_at', { ascending: false })
      : query.order('created_at', { ascending: false });
  const { data, error } = await query.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  if (error) throw failure(error);
  return ((data ?? []) as Row[]).map(fromRow).filter((r): r is CommunityRecipe => r !== null);
}

export async function getRecipe(id: string): Promise<CommunityRecipe | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('public_recipes').select(COLUMNS).eq('id', id).maybeSingle();
  if (error) throw failure(error);
  return data ? fromRow(data as Row) : null;
}

/** Moje opublikowane przepisy: id na serwerze dla id przepisu na urządzeniu. */
export async function myPublished(userId: string): Promise<Map<string, { id: string; status: CommunityRecipe['status']; savesCount: number }>> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('public_recipes')
    .select('id, source_id, status, saves_count')
    .eq('author_id', userId);
  if (error) throw failure(error);
  return new Map(
    ((data ?? []) as { id: string; source_id: string; status: CommunityRecipe['status']; saves_count: number }[]).map(
      (row) => [row.source_id, { id: row.id, status: row.status, savesCount: row.saves_count }],
    ),
  );
}

/** Publikuje (albo aktualizuje) własny przepis. Bez ustawienia młynka: każdy ma inny młynek. */
export async function publishRecipe(userId: string, recipe: UserRecipe): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.from('public_recipes').upsert(
    {
      author_id: userId,
      source_id: recipe.id,
      method_id: recipe.methodId,
      name: recipe.name,
      description: recipe.note ?? null,
      dose: recipe.dose,
      water_temp: recipe.waterTempC,
      grind: recipe.grind,
      steps: recipe.steps,
    },
    { onConflict: 'author_id,source_id' },
  );
  if (error) throw failure(error);
}

/** „Wycofaj”: usuwa przepis ze społeczności (kopie zapisane przez innych zostają u nich). */
export async function withdrawRecipe(userId: string, sourceId: string): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.from('public_recipes').delete().eq('author_id', userId).eq('source_id', sourceId);
  if (error) throw failure(error);
}

/** Liczy zapis u siebie (raz na osobę). Zwraca liczbę zapisów. */
export async function countSave(recipeId: string): Promise<number | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('save_public_recipe', { p_recipe_id: recipeId });
  if (error) throw failure(error);
  return typeof data === 'number' ? data : null;
}

export const REPORT_REASONS = {
  spam: 'spam albo reklama',
  offensive: 'obraźliwe treści',
  dangerous: 'niebezpieczny przepis',
  other: 'inny powód',
} as const;
export type ReportReason = keyof typeof REPORT_REASONS;

export async function reportRecipe(recipeId: string, reason: ReportReason, comment: string): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc('report_public_recipe', {
    p_recipe_id: recipeId,
    p_reason: reason,
    p_comment: comment.trim() || null,
  });
  if (error) throw failure(error);
}

// ── Moderacja ───────────────────────────────────────────────────────────

export interface QueueItem {
  id: string;
  methodId: string;
  name: string;
  author: string;
  status: CommunityRecipe['status'];
  approved: boolean;
  reports: { reason: ReportReason; comment: string | null; createdAt: string }[];
}

export async function isModerator(): Promise<boolean> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('is_moderator');
  return !error && data === true;
}

export async function moderationQueue(): Promise<QueueItem[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('moderation_queue');
  if (error) throw failure(error);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    methodId: row.method_id as string,
    name: row.name as string,
    author: row.author_nick as string,
    status: row.status as CommunityRecipe['status'],
    approved: row.approved as boolean,
    reports: (row.reports as QueueItem['reports']) ?? [],
  }));
}

export async function moderateRecipe(recipeId: string, decision: 'hide' | 'restore'): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc('moderate_public_recipe', { p_recipe_id: recipeId, p_decision: decision });
  if (error) throw failure(error);
}

/** Kopia przepisu ze społeczności do własnych przepisów (z informacją, od kogo jest). */
export function toUserRecipeInput(item: CommunityRecipe): RecipeInput {
  return { ...item.recipe, origin: { communityId: item.id, author: item.author } };
}
