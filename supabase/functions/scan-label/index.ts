// Rozpoznawanie etykiety ziaren przez Claude. Wymaga zalogowania, pilnuje dziennego limitu (P8),
// wysyła zmniejszone zdjęcie do Claude z wymaganym schematem odpowiedzi (structured outputs),
// sprawdza wynik i go zwraca. Zdjęcie nie jest nigdzie zapisywane, a logi nie zawierają ani zdjęcia,
// ani odczytanego tekstu.
//
// Sekret: npx supabase secrets set ANTHROPIC_API_KEY=… (klucz nigdy nie trafia do przeglądarki).
import Anthropic from 'npm:@anthropic-ai/sdk@0.128.0';
import { adminClient, fail, json, preflight, requestUser } from '../_shared/http.ts';
import {
  IMAGE_TYPES,
  LABEL_INSTRUCTION,
  LABEL_SCHEMA,
  LABEL_SYSTEM,
  MAX_IMAGE_BASE64,
  validateLabelGuess,
} from '../_shared/labelScan.ts';
import { consumeQuota, releaseQuota } from '../_shared/quota.ts';

const anthropic = new Anthropic();

Deno.serve(async (request) => {
  const early = preflight(request);
  if (early) return early;

  const user = await requestUser(request);
  if (!user) return fail(401, 'unauthorized', 'Zaloguj się, żeby rozpoznawać etykiety przez AI.');

  let body: { image?: unknown; mediaType?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail(400, 'bad_request', 'Niepoprawne zapytanie.');
  }
  const { image, mediaType } = body;
  if (
    typeof image !== 'string' ||
    image.length === 0 ||
    image.length > MAX_IMAGE_BASE64 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(image) ||
    !(IMAGE_TYPES as readonly unknown[]).includes(mediaType)
  ) {
    return fail(400, 'bad_image', 'Zdjęcie jest uszkodzone albo za duże.');
  }

  const admin = adminClient();
  const remaining = await consumeQuota(admin, user.id, 'label_scan');
  if (remaining === null) {
    return fail(429, 'limit', 'Dzisiejszy limit rozpoznawania przez AI się wyczerpał.');
  }

  try {
    const response = await anthropic.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      // Odczyt etykiety to prosta ekstrakcja: niski wysiłek wystarcza i odpowiada szybciej.
      output_config: { effort: 'low', format: { type: 'json_schema', schema: LABEL_SCHEMA } },
      // Gdy model odmówi, API samo powtarza zapytanie na zalecanym modelu zapasowym.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: LABEL_SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType as (typeof IMAGE_TYPES)[number], data: image },
            },
            { type: 'text', text: LABEL_INSTRUCTION },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
      await releaseQuota(admin, user.id, 'label_scan');
      console.warn('scan-label', user.id, response.stop_reason);
      return fail(422, 'unreadable', 'AI nie odczytało tej etykiety.');
    }

    const text = response.content.find((block) => block.type === 'text');
    const guess = text && text.type === 'text' ? validateLabelGuess(JSON.parse(text.text)) : null;
    if (!guess) {
      await releaseQuota(admin, user.id, 'label_scan');
      return fail(422, 'unreadable', 'AI nie odczytało tej etykiety.');
    }

    // W logach tylko liczby, bez zdjęcia i bez odczytanego tekstu.
    console.log('scan-label', user.id, response.usage.input_tokens, response.usage.output_tokens);
    return json({ guess, remaining });
  } catch (error) {
    await releaseQuota(admin, user.id, 'label_scan');
    if (error instanceof Anthropic.RateLimitError) {
      return fail(503, 'busy', 'AI jest teraz zajęte. Spróbuj za chwilę.');
    }
    console.error('scan-label', user.id, error instanceof Anthropic.APIError ? error.status : 'error');
    return fail(502, 'ai_failed', 'Nie udało się połączyć z AI.');
  }
});
