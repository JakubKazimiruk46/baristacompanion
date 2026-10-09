import { createLocalStore, useLocalStore } from '../../../lib/localStore';
import { getSupabase } from '../../../lib/supabase';
import { hasContent, validateLabelGuess } from '../../../../supabase/functions/_shared/labelScan.ts';
import type { LabelGuess } from './parseLabel';
import { prepareImage } from './prepareImage';

/**
 * Rozpoznawanie etykiety przez AI (funkcja serwerowa scan-label, Claude). Tylko dla zalogowanych,
 * online i za zgodą: inaczej zostaje rozpoznawanie w telefonie (ocr.ts).
 */
export type AiScanResult =
  | { ok: true; guess: LabelGuess; remaining: number | null }
  | { ok: false; reason: 'limit' | 'unreadable' | 'error' };

/** Dzienny limit z decyzji P8 (serwer pilnuje go sam; tu tylko do wyjaśnienia w zgodzie). */
export const DAILY_LABEL_SCANS = 20;

async function errorCode(error: unknown): Promise<string | null> {
  const context = (error as { context?: unknown } | null)?.context;
  if (!(context instanceof Response)) return null;
  try {
    const body = (await context.json()) as { error?: { code?: unknown } };
    return typeof body.error?.code === 'string' ? body.error.code : null;
  } catch {
    return null;
  }
}

export async function scanWithAi(file: Blob): Promise<AiScanResult> {
  try {
    const prepared = await prepareImage(file);
    const supabase = await getSupabase();
    const { data, error } = await supabase.functions.invoke('scan-label', { body: prepared });
    if (error) {
      const code = await errorCode(error);
      return { ok: false, reason: code === 'limit' ? 'limit' : code === 'unreadable' ? 'unreadable' : 'error' };
    }
    // Serwer już sprawdził odpowiedź, ale aplikacja nie ufa niczemu, co przyszło z sieci.
    const guess = validateLabelGuess((data as { guess?: unknown } | null)?.guess);
    if (!guess || !hasContent(guess)) return { ok: false, reason: 'unreadable' };
    const remaining = (data as { remaining?: unknown }).remaining;
    return { ok: true, guess, remaining: typeof remaining === 'number' ? remaining : null };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

// ── Zgoda na wysyłanie zdjęć do AI ──────────────────────────────────────

/** true: zgoda; false: „rozpoznawaj w telefonie”; brak: jeszcze nie pytano. */
interface AiConsent {
  labelScan?: boolean;
}

export const AI_CONSENT_KEY = 'barista-companion.ai-consent.v1';

export const aiConsentStore = createLocalStore<AiConsent>(
  AI_CONSENT_KEY,
  (value) => {
    const v = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
    return typeof v.labelScan === 'boolean' ? { labelScan: v.labelScan } : {};
  },
  {},
);

export function setLabelScanConsent(value: boolean | undefined) {
  const { labelScan: _, ...rest } = aiConsentStore.getSnapshot();
  aiConsentStore.set(value === undefined ? rest : { ...rest, labelScan: value });
}

export function useLabelScanConsent(): boolean | undefined {
  return useLocalStore(aiConsentStore).labelScan;
}
