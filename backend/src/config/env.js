import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dotenvPath = path.resolve(__dirname, '../../.env');
const dotenvResult = dotenv.config({ path: dotenvPath });

const mailPass = process.env.MAIL_PASS || process.env.MAILPASS || '';
const appUrl = process.env.APP_URL || process.env.FRONTEND_PUBLIC_URL || '';
const sendgridApiKey = process.env.SENDGRID_API_KEY || '';
const sendgridDataResidency = String(process.env.SENDGRID_DATA_RESIDENCY || '').trim().toLowerCase();
const mailProvider = String(process.env.MAIL_PROVIDER || (sendgridApiKey ? 'sendgrid' : 'smtp')).toLowerCase();

const envDiagnostics = {
  source: dotenvResult.error ? 'process.env' : `.env (${dotenvPath}) + process.env`,
  keyPresence: {
    MAIL_PROVIDER: Boolean(mailProvider),
    SENDGRID_API_KEY: Boolean(sendgridApiKey),
    SENDGRID_DATA_RESIDENCY: Boolean(sendgridDataResidency),
    MAIL_HOST: Boolean(process.env.MAIL_HOST),
    MAIL_PORT: Boolean(process.env.MAIL_PORT),
    MAIL_USER: Boolean(process.env.MAIL_USER),
    MAIL_PASS: Boolean(mailPass),
    MAIL_FROM: Boolean(process.env.MAIL_FROM),
    APP_URL: Boolean(appUrl)
  }
};

const configuredKeyCount = Object.values(envDiagnostics.keyPresence).filter(Boolean).length;
console.log(
  `[env] loaded from ${envDiagnostics.source}. mail/app keys configured: ${configuredKeyCount}/${Object.keys(envDiagnostics.keyPresence).length}`
);

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
  appUrl,
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
    provider: mailProvider,
    sendgridApiKey,
    sendgridDataResidency,
    service: process.env.MAIL_SERVICE || '',
    host: process.env.MAIL_HOST || '',
    port: Number(process.env.MAIL_PORT || 0),
    secure: process.env.MAIL_SECURE === undefined ? null : String(process.env.MAIL_SECURE).toLowerCase() === 'true',
    user: process.env.MAIL_USER || '',
    pass: mailPass,
    from: process.env.MAIL_FROM || process.env.MAIL_USER || 'no-reply@tutormecatronica.com',
    testTo: process.env.MAIL_TEST_TO || '',
    debugToken: process.env.MAIL_DEBUG_TOKEN || '',
    debugEnabled: String(process.env.MAIL_DEBUG_ENABLED || '').toLowerCase() === 'true',
    tlsRejectUnauthorized: process.env.MAIL_TLS_REJECT_UNAUTHORIZED !== 'false'
  }
};
