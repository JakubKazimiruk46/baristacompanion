// Sygnał końca kroku: krótki dźwięk z Web Audio (bez plików) i wibracja tam, gdzie działa.
// iPhone nie obsługuje wibracji, a dźwięk odblokowuje dopiero gest użytkownika,
// dlatego unlockAudio() wołamy przy tapnięciu „Start” albo „Dalej”.

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

let audio: AudioContext | null = null;

export function unlockAudio(): void {
  try {
    const Ctx = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!Ctx) return;
    audio ??= new Ctx();
    void audio.resume();
  } catch {
    // Brak dźwięku nie może zatrzymać parzenia.
  }
}

function playChime(): void {
  if (!audio) return;
  try {
    const t0 = audio.currentTime;
    [880, 1175, 1568].forEach((frequency, i) => {
      const osc = audio!.createOscillator();
      const gain = audio!.createGain();
      const at = t0 + i * 0.22;
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.35, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.6);
      osc.connect(gain).connect(audio!.destination);
      osc.start(at);
      osc.stop(at + 0.65);
    });
  } catch {
    // jw.
  }
}

export function signalStepDone(): void {
  playChime();
  navigator.vibrate?.([300, 120, 300]);
}
