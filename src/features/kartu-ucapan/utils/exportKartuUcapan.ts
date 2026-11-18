const fileName = 'kartu-ucapan-kalender-bali.png';

// Ekspor piksel dari kanvas pratinjau agar komposisi PNG selalu sama.
export function createCardPng(canvas: HTMLCanvasElement): Promise<File> {
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

export function canShareCard(file = new File([], fileName, { type: 'image/png' })): boolean {
  return typeof navigator.share === 'function'
    && typeof navigator.canShare === 'function'
    && navigator.canShare({ files: [file] });
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
