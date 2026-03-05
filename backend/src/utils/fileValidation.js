import fs from 'node:fs/promises';

async function readHead(filePath, size = 16) {
  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(size);
    const { bytesRead } = await handle.read(buffer, 0, size, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

export function isPdfBuffer(buffer) {
  if (!buffer || buffer.length < 5) return false;
  return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46 && buffer[4] === 0x2d;
}

export function detectImageMimeFromBuffer(buffer) {
  if (!buffer || buffer.length < 12) return '';

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';

  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WEBP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return '';
}

export async function assertPdfFile(filePath) {
  const head = await readHead(filePath, 8);
  if (!isPdfBuffer(head)) {
    throw Object.assign(new Error('Archivo PDF invalido'), { status: 400, code: 'INVALID_FILE_SIGNATURE' });
  }
}

export async function assertImageFile(filePath, allowedMimes = ['image/jpeg', 'image/png', 'image/webp']) {
  const head = await readHead(filePath, 16);
  const mime = detectImageMimeFromBuffer(head);
  if (!mime || !allowedMimes.includes(mime)) {
    throw Object.assign(new Error('Formato de imagen invalido'), { status: 400, code: 'INVALID_FILE_SIGNATURE' });
  }
  return mime;
}
