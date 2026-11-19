// Ekspor piksel dari kanvas pratinjau agar komposisi PNG selalu sama.
export function createCardPng(canvas: HTMLCanvasElement, fileName: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG gagal dibuat.'));
        return;
      }
      resolve(new File([blob], fileName, { type: 'image/png' }));
    }, 'image/png');
  });
}

export function canShareCard(file?: File): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    return false;
  }
  return navigator.canShare({ files: [file ?? new File([], 'kartu.png', { type: 'image/png' })] });
}

export function canShareText(text: string): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
    && (typeof navigator.canShare !== 'function' || navigator.canShare({ text }));
}

export async function copyShareText(text: string) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Jika Clipboard API tidak diizinkan, coba salin pilihan teks di dialog.
  }
  const focused = document.activeElement;
  const container = focused?.closest('[role="dialog"]') ?? document.body;
  const input = document.createElement('textarea');
  input.value = text;
  input.readOnly = true;
  input.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  container.append(input);
  try {
    input.select();
    if (!document.execCommand('copy')) throw new Error('Teks gagal disalin.');
  } finally {
    input.remove();
    if (focused instanceof HTMLElement) focused.focus();
  }
}

// Browser yang tidak bisa berbagi file tetap bisa menyimpan PNG yang sama.
export function downloadCard(file: File) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  anchor.hidden = true;
  document.body.append(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
