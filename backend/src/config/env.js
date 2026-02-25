import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function sanitizeApiKey(value) {
  let key = String(value || '').trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  while (key.startsWith('=')) {
    key = key.slice(1).trim();
  }
  return key;
}

export const env = {
  port: Number(process.env.PORT || 3001),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/tutormecatronica',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dataEncryptionKey: process.env.DATA_ENCRYPTION_KEY || process.env.JWT_SECRET || '',
  dataHashKey: process.env.DATA_HASH_KEY || process.env.DATA_ENCRYPTION_KEY || process.env.JWT_SECRET || '',
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
  },
  news: {
    gnewsApiKey: sanitizeApiKey(process.env.GNEWS_API_KEY || process.env.GNEWS_TOKEN || ''),
    gnewsLang: process.env.GNEWS_LANG || 'all',
    newsApiKey: sanitizeApiKey(process.env.NEWSAPI_KEY || ''),
    translateUrl: process.env.NEWS_TRANSLATE_URL || 'https://libretranslate.de/translate',
    translateApiKey: sanitizeApiKey(process.env.NEWS_TRANSLATE_API_KEY || '')
  },
  mail: {
    service: process.env.MAIL_SERVICE || '',
    host: process.env.MAIL_HOST || '',
    port: Number(process.env.MAIL_PORT || 0),
    secure: process.env.MAIL_SECURE === undefined ? null : String(process.env.MAIL_SECURE).toLowerCase() === 'true',
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
    from: process.env.MAIL_FROM || 'no-reply@tutormecatronica.com'
  }
};
