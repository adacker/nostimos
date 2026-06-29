// CONTRACT:C2-API-CLIENT.1.0
// Client-side image compression shared by both Backend implementations. The
// remote client uploads the resulting Blob as multipart/form-data; the
// browser-local store inlines it as a `data:` URL. Resizing/encoding happens
// entirely in the browser (canvas) so cover images stay small — important both
// for upload size and for fitting data URLs inside the localStorage quota.

const MAX_DIM = 1280;
const QUALITY = 0.82;

/** Downscale to at most MAX_DIM on the longest edge and re-encode as JPEG. */
export async function compressImage(file: File): Promise<Blob> {
  const source = await loadImage(file);
  const { width, height } = source;
  const scale = Math.min(1, MAX_DIM / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.drawImage(source, 0, 0, w, h);
  if (source instanceof ImageBitmap) source.close();

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', QUALITY));
  if (!blob) throw new Error('image encoding failed');
  return blob;
}

/** Read a Blob as a `data:` URL (used by the browser-local backend). */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('image read failed'));
    reader.readAsDataURL(blob);
  });
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall back to an <img> below (e.g. unsupported in some browsers) */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('image load failed'));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
