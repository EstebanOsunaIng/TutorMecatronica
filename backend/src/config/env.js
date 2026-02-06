export const env = {
  port: Number(process.env.PORT || 3001),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/tutormecatronica',
  jwtSecret: process.env.JWT_SECRET || 'change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini'
  },
  mail: {
    host: process.env.MAIL_HOST || '',
    port: Number(process.env.MAIL_PORT || 0),
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
    from: process.env.MAIL_FROM || 'no-reply@tutormecatronica.com'
  }
};
