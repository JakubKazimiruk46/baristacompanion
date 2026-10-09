import { describe, expect, it } from 'vitest';
import {
  BEAN_KINDS,
  FLAVOR_NOTES,
  hasContent,
  LABEL_SCHEMA,
  ROASTS,
  validateLabelGuess,
} from '../../../../supabase/functions/_shared/labelScan.ts';
import { FLAVOR_NOTES as APP_NOTES, ROASTS as APP_ROASTS } from '../../../data';

const today = new Date('2026-10-09T12:00:00Z');

describe('odpowiedź AI z etykiety', () => {
  it('poprawna odpowiedź przechodzi, a nule znikają', () => {
    expect(
      validateLabelGuess(
        {
          name: '  Etiopia   Guji  ',
          roaster: 'Palarnia Testowa',
          roast: 'light',
          notes: ['floral', 'citrus'],
          origin: 'Etiopia',
          kind: 'single-origin',
          roastDate: '2026-10-01',
        },
        today,
      ),
    ).toEqual({
      name: 'Etiopia Guji',
      roaster: 'Palarnia Testowa',
      roast: 'light',
      notes: ['floral', 'citrus'],
      origin: 'Etiopia',
      kind: 'single-origin',
      roastDate: '2026-10-01',
    });
    expect(validateLabelGuess({ name: null, roaster: null, roast: null, notes: [], origin: null, kind: null, roastDate: null }, today)).toEqual({
      notes: [],
    });
  });

  it('nieznane nuty i palenia są odrzucane, kolejność nut jak w aplikacji', () => {
    const guess = validateLabelGuess({ roast: 'blonde', notes: ['umami', 'citrus', 'chocolate', 'citrus'], kind: 'mix' }, today)!;
    expect(guess).toEqual({ notes: ['chocolate', 'citrus'] });
  });

  it('długie teksty są przycinane, a złe daty pomijane', () => {
    const guess = validateLabelGuess({ name: 'x'.repeat(200), notes: [], roastDate: '2027-01-01' }, today)!;
    expect(guess.name).toHaveLength(80);
    expect(guess).not.toHaveProperty('roastDate');
    expect(validateLabelGuess({ notes: [], roastDate: '2026-02-30' }, today)).toEqual({ notes: [] });
    expect(validateLabelGuess({ notes: [], roastDate: '1999-12-31' }, today)).toEqual({ notes: [] });
  });

  it('odpowiedź, która nie jest obiektem, jest bezużyteczna', () => {
    expect(validateLabelGuess(null)).toBeNull();
    expect(validateLabelGuess(['light'])).toBeNull();
    expect(validateLabelGuess('Etiopia')).toBeNull();
  });

  it('pusta odpowiedź to „nic nie odczytano”', () => {
    expect(hasContent({ notes: [] })).toBe(false);
    expect(hasContent({ notes: ['nutty'] })).toBe(true);
  });
});

describe('schemat odpowiedzi', () => {
  it('listy zgadzają się z danymi aplikacji', () => {
    expect([...FLAVOR_NOTES]).toEqual([...APP_NOTES]);
    expect([...ROASTS]).toEqual([...APP_ROASTS]);
    expect([...BEAN_KINDS]).toEqual(['single-origin', 'blend']);
  });

  it('structured outputs: każde pole wymagane i bez dodatkowych właściwości', () => {
    expect(LABEL_SCHEMA.additionalProperties).toBe(false);
    expect([...LABEL_SCHEMA.required].sort()).toEqual(Object.keys(LABEL_SCHEMA.properties).sort());
    // Ograniczenia liczbowe i długości tekstu nie są wspierane: nie może ich być w schemacie.
    expect(JSON.stringify(LABEL_SCHEMA)).not.toMatch(/minLength|maxLength|minimum|maximum/);
  });
});
