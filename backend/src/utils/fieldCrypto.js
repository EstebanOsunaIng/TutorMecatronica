import crypto from 'node:crypto';

const ENCRYPTED_PREFIX = 'enc:v1:';

function getEncryptionKey() {
  const source = String(process.env.DATA_ENCRYPTION_KEY || process.env.JWT_SECRET || '').trim();
  if (!source) throw new Error('DATA_ENCRYPTION_KEY is required (or JWT_SECRET as fallback).');
  return crypto.createHash('sha256').update(source).digest();
}

function getHashKey() {
  const source = String(process.env.DATA_HASH_KEY || process.env.DATA_ENCRYPTION_KEY || process.env.JWT_SECRET || '').trim();
  if (!source) throw new Error('DATA_HASH_KEY is required (or DATA_ENCRYPTION_KEY/JWT_SECRET as fallback).');
  return crypto.createHash('sha256').update(`lookup:${source}`).digest();
}

export function normalizeEmailForLookup(value) {
  return String(value || '').trim().toLowerCase();
}

export function normalizeDocumentForLookup(value) {
  return String(value || '').trim();
}

export function hashLookupValue(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  return crypto.createHmac('sha256', getHashKey()).update(normalized).digest('hex');
}

export function isEncryptedValue(value) {
  return typeof value === 'string' && value.startsWith(ENCRYPTED_PREFIX);
}

export function encryptFieldValue(value) {
  const plain = String(value ?? '');
  if (!plain) return '';
  if (isEncryptedValue(plain)) return plain;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENCRYPTED_PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptFieldValue(value) {
  const raw = String(value ?? '');
  if (!raw) return '';
  if (!isEncryptedValue(raw)) return raw;

  const payload = raw.slice(ENCRYPTED_PREFIX.length);
  const [ivB64, tagB64, dataB64] = payload.split(':');
  if (!ivB64 || !tagB64 || !dataB64) return '';

  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}
