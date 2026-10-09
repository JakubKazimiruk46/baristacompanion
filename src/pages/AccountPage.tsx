import { useEffect, useId, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import { UserIcon } from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import { Section } from '../components/Section';
import { Sheet } from '../components/Sheet';
import {
  deleteAccount,
  sendLoginEmail,
  signInWithGoogle,
  signOut,
  useAuth,
  verifyLoginCode,
  type AccountUser,
} from '../features/account/auth';
import { downloadAccountExport, loadProfile, NICK_LIMITS, nickError, saveNick, type Profile } from '../features/account/profile';
import { returnStore, safeReturnPath } from '../features/account/returnTo';
import { isModerator } from '../features/community/api';
import { dayAndTime } from '../features/coldbrew/time';
import { downloadBackup, importBackup } from '../features/sync/backup';
import { syncNow, useSyncStatus } from '../features/sync/engine';
import { COLLECTION_LABELS, COLLECTIONS } from '../features/sync/records';
import { count } from '../lib/format';
import { isNativeApp } from '../lib/notifications';
import { useNow } from '../lib/useNow';
import { useOnline } from '../lib/useOnline';

const inputClass =
  'mt-1 h-12 w-full rounded-xl border border-line bg-surface px-4 text-base focus:border-accent focus:outline-2 focus:outline-accent/40';
const primary =
  'flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';
const secondary =
  'flex h-12 w-full items-center justify-center rounded-full border border-line bg-surface px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';

/** Konto (/konto): logowanie linkiem albo kodem z e-maila i przez Google, nick, eksport, usunięcie. */
export function AccountPage() {
  const auth = useAuth({ load: true });
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<string | null>(null);
  const redirectError = params.get('error_description') ?? params.get('error');

  // Wejście z zachęty do logowania (?wroc=/spolecznosc): po zalogowaniu wracamy tam. Adres
  // zapisujemy, bo link z e-maila otwiera aplikację od nowa i ?wroc= przepada.
  const requested = safeReturnPath(params.get('wroc'));
  useEffect(() => {
    if (requested) returnStore.set(requested);
  }, [requested]);

  // Po powrocie z linku albo z Google adres ma ?code=: po zalogowaniu go sprzątamy.
  useEffect(() => {
    if (auth.status !== 'signed-in') return;
    const target = returnStore.getSnapshot();
    if (target) {
      returnStore.set(null);
      navigate(target, { replace: true });
    } else if (params.has('code')) navigate('/konto', { replace: true });
  }, [auth.status, params, navigate]);

  return (
    <>
      <PageHeader
        title="Konto"
        lead="Konto jest dodatkiem. Wszystko, co działa dziś, działa też bez niego, a dane zostają w tej przeglądarce."
      />
      {notice && (
        <p role="status" className="mb-4 rounded-2xl bg-accent-soft p-4 text-sm font-medium">
          {notice}
        </p>
      )}
      {redirectError && auth.status !== 'signed-in' && (
        <p role="alert" className="mb-4 rounded-2xl border border-red-700/40 bg-red-700/10 p-4 text-sm">
          Logowanie się nie udało: link wygasł albo został już użyty. Wyślij nowy.
        </p>
      )}
      {auth.status === 'disabled' && (
        <EmptyState icon={UserIcon} title="Konto nie jest dostępne w tej wersji">
          Ta wersja aplikacji nie łączy się z serwerem. Wszystko działa bez konta, a dane zapisują się w tej
          przeglądarce.
        </EmptyState>
      )}
      {auth.status === 'loading' && (
        <p role="status" className="text-ink-muted">
          Sprawdzam logowanie…
        </p>
      )}
      {auth.status === 'signed-out' && <SignIn />}
      {auth.status === 'signed-in' && <AccountDetails user={auth.user} onDeleted={() => setNotice('Konto zostało usunięte razem z danymi na serwerze.')} />}
      <BackupSection />
      <p className="mt-8 text-sm text-ink-muted">
        <Link to="/prywatnosc" className="font-medium text-accent underline">
          Polityka prywatności
        </Link>
        : jakie dane zbieramy, gdzie są i jak je usunąć.
      </p>
    </>
  );
}

function SignIn() {
  const online = useOnline();
  const native = isNativeApp();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ids = { email: useId(), code: useId(), error: useId() };

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Wpisz adres e-mail, np. ania@example.com.');
      return;
    }
    setBusy(true);
    const result = await sendLoginEmail(value);
    setBusy(false);
    if (result.ok) {
      setSentTo(value);
      setError(null);
    } else setError(result.message);
  };

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{6,10}$/.test(code.trim())) {
      setError('Wpisz kod z e-maila (same cyfry).');
      return;
    }
    setBusy(true);
    const result = await verifyLoginCode(sentTo!, code.trim());
    setBusy(false);
    if (!result.ok) setError(result.message);
  };

  return (
    <>
      <Section title="Po co konto">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>te same ziarna, dziennik, przepisy i młynki na telefonie i komputerze,</li>
          <li>publikowanie własnych przepisów,</li>
          <li>dokładniejsze rozpoznawanie etykiet i asystent drinków.</li>
        </ul>
        <p className="mt-2 text-sm text-ink-muted">Bez hasła: logujesz się linkiem albo kodem z e-maila.</p>
      </Section>

      {!online && (
        <p role="status" className="mt-6 rounded-2xl bg-surface-muted p-4 text-sm">
          Logowanie wymaga internetu. Reszta aplikacji działa bez niego.
        </p>
      )}

      {sentTo ? (
        <form onSubmit={verify} noValidate className="mt-6 space-y-4">
          <p className="rounded-2xl bg-accent-soft p-4 text-sm">
            Wysłaliśmy wiadomość na <strong>{sentTo}</strong>. Kliknij link w wiadomości albo wpisz kod z e-maila.
            {native && ' W aplikacji na Androida wpisz kod: link otworzy się w przeglądarce.'}
          </p>
          <div>
            <label htmlFor={ids.code} className="font-medium">
              Kod z e-maila
            </label>
            <input
              id={ids.code}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              className={`${inputClass} tracking-widest tabular-nums`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? ids.error : undefined}
            />
          </div>
          {error && <ErrorText id={ids.error}>{error}</ErrorText>}
          <button type="submit" className={primary} disabled={busy || !online}>
            Zaloguj
          </button>
          <button
            type="button"
            className={secondary}
            onClick={() => {
              setSentTo(null);
              setCode('');
              setError(null);
            }}
          >
            Zmień adres albo wyślij ponownie
          </button>
        </form>
      ) : (
        <form onSubmit={send} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor={ids.email} className="font-medium">
              Adres e-mail
            </label>
            <input
              id={ids.email}
              type="email"
              autoComplete="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? ids.error : undefined}
            />
          </div>
          {error && <ErrorText id={ids.error}>{error}</ErrorText>}
          <button type="submit" className={primary} disabled={busy || !online}>
            Wyślij link do logowania
          </button>
          {native ? (
            <p className="text-sm text-ink-muted">W aplikacji na Androida logowanie przez Google będzie później.</p>
          ) : (
            <>
              <p aria-hidden="true" className="text-center text-sm text-ink-muted">
                albo
              </p>
              <button
                type="button"
                className={secondary}
                disabled={!online}
                onClick={async () => {
                  const result = await signInWithGoogle();
                  if (!result.ok) setError(result.message);
                }}
              >
                Zaloguj przez Google
              </button>
            </>
          )}
          <p className="text-sm text-ink-muted">
            Logując się, akceptujesz{' '}
            <Link to="/prywatnosc" className="font-medium text-accent underline">
              politykę prywatności
            </Link>
            .
          </p>
        </form>
      )}
    </>
  );
}

function AccountDetails({ user, onDeleted }: { user: AccountUser; onDeleted: () => void }) {
  const online = useOnline();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadProfile(user.id).then((loaded) => {
      if (!cancelled) setProfile(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  return (
    <>
      <div className="rounded-3xl bg-surface p-5">
        <p className="text-sm text-ink-muted">Zalogowano jako</p>
        <p className="mt-0.5 text-lg font-semibold break-all">{user.email ?? 'konto bez adresu e-mail'}</p>
        <p className="mt-1 text-sm text-ink-muted">
          {user.provider === 'google' ? 'Przez Google' : 'Linkiem albo kodem z e-maila'} · konto od{' '}
          {new Date(user.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <SyncSection />
      <ModerationLink />

      <Section title="Nick">
        {profile === undefined ? (
          <p role="status" className="text-sm text-ink-muted">
            Wczytuję profil…
          </p>
        ) : (
          <NickForm
            userId={user.id}
            initial={profile?.nick ?? ''}
            onSaved={(nick) => setProfile((current) => ({ nick, createdAt: current?.createdAt ?? user.createdAt }))}
          />
        )}
      </Section>

      <Section title="Twoje dane">
        <p className="text-sm text-ink-muted">
          Pobierz wszystko, co jest o Tobie na serwerze, w pliku JSON. Dane w tej przeglądarce (ziarna, dziennik,
          przepisy) zostają na urządzeniu.
        </p>
        <button
          type="button"
          className={`mt-3 ${secondary}`}
          disabled={profile === undefined}
          onClick={() => downloadAccountExport(user, profile ?? null)}
        >
          Pobierz dane konta
        </button>
      </Section>

      {error && (
        <p role="alert" className="mt-6 rounded-2xl border border-red-700/40 bg-red-700/10 p-4 text-sm">
          {error}
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          className={secondary}
          onClick={async () => {
            const result = await signOut();
            if (!result.ok) setError(result.message);
          }}
        >
          Wyloguj
        </button>
        <button type="button" className={secondary} disabled={!online} onClick={() => setConfirmDelete(true)}>
          Usuń konto
        </button>
      </div>

      <Sheet title="Usunąć konto?" open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <p className="text-ink-muted">
          Usuniemy konto i wszystkie dane zapisane na serwerze. Dane w tej przeglądarce zostaną. Tej operacji nie da się
          cofnąć.
        </p>
        <div className="mt-5 flex gap-3">
          <button type="button" className={secondary} onClick={() => setConfirmDelete(false)}>
            Anuluj
          </button>
          <button
            type="button"
            disabled={busy}
            className="flex h-12 w-full items-center justify-center rounded-full bg-red-700 font-semibold text-white disabled:opacity-50"
            onClick={async () => {
              setBusy(true);
              const result = await deleteAccount();
              setBusy(false);
              setConfirmDelete(false);
              if (result.ok) onDeleted();
              else setError(result.message);
            }}
          >
            Usuń konto
          </button>
        </div>
      </Sheet>
    </>
  );
}

/** Wejście do moderacji przepisów, tylko dla moderatora. */
function ModerationLink() {
  const [moderator, setModerator] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void isModerator().then((value) => {
      if (!cancelled) setModerator(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (!moderator) return null;
  return (
    <Link to="/moderacja" className={`mt-6 ${secondary}`}>
      Moderacja przepisów społeczności
    </Link>
  );
}

/** Stan synchronizacji: kiedy ostatnio, błąd i „Synchronizuj teraz”. */
function SyncSection() {
  const status = useSyncStatus();
  const online = useOnline();
  const now = useNow(60_000);
  const labels = COLLECTIONS.map((name) => COLLECTION_LABELS[name]);

  return (
    <Section title="Synchronizacja">
      <p className="text-sm text-ink-muted">
        Na każdym urządzeniu, na którym się zalogujesz, masz te same dane: {labels.join(', ')}. Bez internetu wszystko
        działa, a zmiany wyślą się później.
      </p>
      <p role="status" className="mt-3 font-medium">
        {status.state === 'syncing'
          ? 'Synchronizuję…'
          : status.lastSyncAt !== null
            ? `Ostatnia synchronizacja: ${dayAndTime(status.lastSyncAt, now)}`
            : 'Jeszcze nie synchronizowano.'}
      </p>
      {status.state === 'error' && (
        <p role="alert" className="mt-2 rounded-2xl border border-red-700/40 bg-red-700/10 p-3 text-sm">
          {status.message}
        </p>
      )}
      <button
        type="button"
        className={`mt-3 ${secondary}`}
        disabled={!online || status.state === 'syncing'}
        onClick={() => void syncNow()}
      >
        Synchronizuj teraz
      </button>
    </Section>
  );
}

const ADDED: [string, string, string] = ['nowy rekord', 'nowe rekordy', 'nowych rekordów'];
const UPDATED: [string, string, string] = ['zaktualizowany', 'zaktualizowane', 'zaktualizowanych'];
const SKIPPED: [string, string, string] = ['pominięty', 'pominięte', 'pominiętych'];

/** Kopia zapasowa w pliku JSON: działa też bez konta i bez backendu. */
function BackupSection() {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Ten sam plik można wczytać jeszcze raz.
    event.target.value = '';
    if (!file) return;
    let summary = null;
    try {
      summary = importBackup(JSON.parse(await file.text()));
    } catch {
      summary = null;
    }
    if (!summary) {
      setMessage({ ok: false, text: 'To nie jest kopia Barista Companion albo plik jest uszkodzony.' });
      return;
    }
    const parts = [count(summary.added, ADDED), count(summary.updated, UPDATED)];
    if (summary.skipped > 0) parts.push(count(summary.skipped, SKIPPED));
    setMessage({ ok: true, text: `Wczytano kopię: ${parts.join(', ')}.` });
  };

  return (
    <Section title="Kopia zapasowa">
      <p className="text-sm text-ink-muted">
        Wszystkie dane z tej przeglądarki w jednym pliku: zachowasz je przy zmianie telefonu, także bez konta. Wczytanie
        kopii łączy ją z danymi tutaj: dla każdego rekordu zostaje nowsza wersja.
      </p>
      <div className="mt-3 flex flex-col gap-3">
        <button type="button" className={secondary} onClick={() => downloadBackup()}>
          Zapisz kopię
        </button>
        <label className={`${secondary} cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent`}>
          Wczytaj kopię
          <input type="file" accept="application/json,.json" className="sr-only" onChange={load} />
        </label>
      </div>
      {message && (
        <p
          role={message.ok ? 'status' : 'alert'}
          className={`mt-3 rounded-2xl p-3 text-sm ${message.ok ? 'bg-accent-soft' : 'border border-red-700/40 bg-red-700/10'}`}
        >
          {message.text}
        </p>
      )}
    </Section>
  );
}

function NickForm({ userId, initial, onSaved }: { userId: string; initial: string; onSaved: (nick: string) => void }) {
  const [nick, setNick] = useState(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const ids = { input: useId(), hint: useId(), message: useId() };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const error = nickError(nick);
    if (error) {
      setMessage({ ok: false, text: error });
      return;
    }
    const result = await saveNick(userId, nick);
    if (result.ok) {
      setMessage({ ok: true, text: 'Zapisano.' });
      onSaved(nick.trim());
    } else setMessage({ ok: false, text: result.message });
  };

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={ids.input} className="font-medium">
        Nick
      </label>
      <input
        id={ids.input}
        className={inputClass}
        value={nick}
        maxLength={NICK_LIMITS.max}
        autoComplete="nickname"
        onChange={(e) => {
          setNick(e.target.value);
          setMessage(null);
        }}
        aria-invalid={message && !message.ok ? true : undefined}
        aria-describedby={message && !message.ok ? `${ids.message} ${ids.hint}` : ids.hint}
      />
      <p id={ids.hint} className="mt-1 text-sm text-ink-muted">
        Widoczny przy przepisach, które opublikujesz. Od {NICK_LIMITS.min} do {NICK_LIMITS.max} znaków.
      </p>
      {message && (
        <p
          id={ids.message}
          role={message.ok ? 'status' : undefined}
          className={`mt-1 text-sm font-medium ${message.ok ? 'text-accent' : 'text-red-700 dark:text-red-300'}`}
        >
          {message.text}
        </p>
      )}
      <button type="submit" className={`mt-3 ${secondary}`}>
        Zapisz nick
      </button>
    </form>
  );
}

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-sm font-medium text-red-700 dark:text-red-300">
      {children}
    </p>
  );
}
