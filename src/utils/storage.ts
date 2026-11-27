export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Compresses an uploaded image file to a clean JPEG/WebP data URL
 * capped at maxDimension px so drafts and published projects persist safely in localStorage.
 */
export function compressImageFile(
  file: File,
  maxDimension = 1280,
  quality = 0.84
): Promise<{ dataUrl: string; aspectHint: 'portrait' | 'landscape' | 'square' }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (PNG, JPG, WebP, or GIF).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Unable to decode image preview.'));
      img.onload = () => {
        const { width, height } = img;
        const ratio = width / height;
        const aspectHint: 'portrait' | 'landscape' | 'square' =
          ratio > 1.15 ? 'landscape' : ratio < 0.88 ? 'portrait' : 'square';

        let targetW = width;
        let targetH = height;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            targetW = maxDimension;
            targetH = Math.round((height / width) * maxDimension);
          } else {
            targetH = maxDimension;
            targetW = Math.round((width / height) * maxDimension);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: reader.result as string, aspectHint });
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve({ dataUrl: compressed, aspectHint });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
