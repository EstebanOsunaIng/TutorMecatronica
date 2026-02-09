export const env = {
  port: Number(process.env.PORT || 3001),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/tutormecatronica',
  jwtSecret: process.env.JWT_SECRET || 'change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini'
  },
  news: {
    gnewsApiKey: process.env.GNEWS_API_KEY || '',
    gnewsLang: process.env.GNEWS_LANG || 'all',
    translateUrl: process.env.NEWS_TRANSLATE_URL || 'https://libretranslate.de/translate',
    translateApiKey: process.env.NEWS_TRANSLATE_API_KEY || ''
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
