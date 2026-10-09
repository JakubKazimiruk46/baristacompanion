import { useId, useState, type FormEvent } from 'react';
import { ChoiceChip } from '../../components/ChoiceChip';
import { REPORT_REASONS, type ReportReason } from './api';

const primary =
  'flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';

type ReportFormProps = {
  /** „przepis” albo „napój”: do tekstu nad formularzem. */
  what: string;
  onReport: (reason: ReportReason, comment: string) => Promise<void>;
  onDone: () => void;
};

/** Zgłoszenie przepisu albo napoju społeczności: powód i komentarz (zawsze jako tekst). */
export function ReportForm({ what, onReport, onDone }: ReportFormProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ids = { comment: useId(), error: useId() };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!reason) {
      setError('Wybierz powód.');
      return;
    }
    setBusy(true);
    try {
      await onReport(reason, comment);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się wysłać zgłoszenia.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <p className="text-ink-muted">Zgłoszony {what} znika z listy, dopóki moderator go nie sprawdzi.</p>
      <fieldset className="mt-4" aria-describedby={error ? ids.error : undefined}>
        <legend className="font-medium">Powód</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(REPORT_REASONS) as ReportReason[]).map((key) => (
            <ChoiceChip key={key} type="radio" name="reason" checked={reason === key} onChange={() => setReason(key)}>
              {REPORT_REASONS[key]}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>
      <label htmlFor={ids.comment} className="mt-4 block font-medium">
        Komentarz <span className="font-normal text-ink-muted">(opcjonalnie)</span>
      </label>
      <textarea
        id={ids.comment}
        rows={3}
        maxLength={300}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mt-1 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base focus:border-accent focus:outline-2 focus:outline-accent/40"
      />
      {error && (
        <p id={ids.error} role="alert" className="mt-2 text-sm font-medium text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={`mt-5 ${primary}`}>
        Wyślij zgłoszenie
      </button>
    </form>
  );
}
