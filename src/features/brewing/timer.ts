/**
 * Stoper liczony od znaczników czasu, a nie przez dodawanie interwałów. Dzięki temu pokazuje
 * poprawny czas po przełączeniu karty albo zablokowaniu ekranu (przeglądarka wtedy dławi
 * setInterval). Czyste funkcje: „teraz” zawsze przychodzi z zewnątrz.
 */
export interface TimerState {
  durationMs: number;
  /** Kiedy stoper ostatnio ruszył; null = zatrzymany. */
  startedAt: number | null;
  /** Czas odliczony przed ostatnią pauzą. */
  elapsedBeforeMs: number;
}

export function createTimer(durationMs: number): TimerState {
  return { durationMs, startedAt: null, elapsedBeforeMs: 0 };
}

export function isRunning(timer: TimerState): boolean {
  return timer.startedAt !== null;
}

export function start(timer: TimerState, now: number): TimerState {
  return isRunning(timer) ? timer : { ...timer, startedAt: now };
}

export function pause(timer: TimerState, now: number): TimerState {
  if (!isRunning(timer)) return timer;
  return { ...timer, startedAt: null, elapsedBeforeMs: elapsed(timer, now) };
}

export function reset(timer: TimerState): TimerState {
  return createTimer(timer.durationMs);
}

export function elapsed(timer: TimerState, now: number): number {
  const running = timer.startedAt === null ? 0 : Math.max(0, now - timer.startedAt);
  return timer.elapsedBeforeMs + running;
}

export function remaining(timer: TimerState, now: number): number {
  return Math.max(0, timer.durationMs - elapsed(timer, now));
}

/** Ile minęło ponad zaplanowany czas. */
export function overtime(timer: TimerState, now: number): number {
  return Math.max(0, elapsed(timer, now) - timer.durationMs);
}

export function isDone(timer: TimerState, now: number): boolean {
  return elapsed(timer, now) >= timer.durationMs;
}

/** Zegar: „4:00”, „0:07”, „16:00:00”. Zaokrąglamy w górę, więc 0:00 widać dopiero na końcu. */
export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
