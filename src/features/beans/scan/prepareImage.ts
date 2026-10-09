import { MAX_IMAGE_BASE64, MAX_IMAGE_SIDE } from '../../../../supabase/functions/_shared/labelScan.ts';

/** Zdjęcie dla AI: zmniejszone do 1600 px na dłuższym boku, JPEG w base64 (bez prefiksu data:). */
export interface PreparedImage {
  image: string;
  mediaType: 'image/jpeg';
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).replace(/^data:[^,]*,/, ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function prepareImage(file: Blob): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new Error('Nie udało się przygotować zdjęcia.');
  const image = await toBase64(blob);
  if (image.length > MAX_IMAGE_BASE64) throw new Error('Zdjęcie jest za duże.');
  return { image, mediaType: 'image/jpeg' };
}
