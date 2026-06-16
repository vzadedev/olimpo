export async function compressImageToBase64(
  file: File,
  maxBytes = 1024 * 1024,
  quality = 0.7,
): Promise<{ base64: string; mediaType: string }> {
  const mediaType = file.type || 'image/jpeg';

  const loadImage = () =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

  const img = await loadImage();
  URL.revokeObjectURL(img.src);

  let width = img.width;
  let height = img.height;
  let q = quality;
  let base64 = '';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas não suportado');

  for (let attempt = 0; attempt < 8; attempt++) {
    const scale = attempt === 0 ? 1 : Math.max(0.3, 1 - attempt * 0.12);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    base64 = canvas.toDataURL(mediaType, q).split(',')[1] ?? '';
    const approxBytes = (base64.length * 3) / 4;
    if (approxBytes <= maxBytes) break;
    q = Math.max(0.4, q - 0.08);
  }

  return { base64, mediaType };
}
