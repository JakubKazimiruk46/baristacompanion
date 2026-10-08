// Rozpoznawanie tekstu ze zdjęcia etykiety, w całości w przeglądarce (tesseract.js).
// Bibliotekę ładujemy dopiero przy pierwszym skanie, więc nie obciąża startu aplikacji.
// Pierwszy skan pobiera z CDN rdzeń WASM i modele językowe (kilka MB); modele zostają potem
// w IndexedDB, a service worker trzyma resztę w pamięci podręcznej (vite.config.ts).

export type ScanStage = 'loading' | 'reading';
export type ScanProgress = (stage: ScanStage, fraction: number) => void;

/** Najdłuższy bok zdjęcia: tyle wystarczy do odczytu, a 12 Mpx z telefonu czytałoby się długo. */
const MAX_SIDE = 1800;

async function shrink(image: Blob): Promise<Blob> {
  if (typeof createImageBitmap !== 'function') return image;
  try {
    const bitmap = await createImageBitmap(image);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1) return image;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise<Blob>((resolve) =>
      canvas.toBlob((blob) => resolve(blob ?? image), 'image/jpeg', 0.92),
    );
  } catch {
    return image;
  }
}

/** Tekst z etykiety (po polsku i angielsku). */
export async function readLabel(image: Blob, onProgress?: ScanProgress): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(['pol', 'eng'], 1, {
    logger: (message) => {
      if (message.status === 'recognizing text') onProgress?.('reading', message.progress);
      else if (message.status.startsWith('loading')) onProgress?.('loading', message.progress);
    },
  });
  try {
    const { data } = await worker.recognize(await shrink(image));
    return data.text;
  } finally {
    await worker.terminate();
  }
}
