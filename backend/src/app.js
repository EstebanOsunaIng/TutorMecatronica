//ZKP95DCBSLSLN6V91M95P2A4

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth.routes.js';
import passwordRoutes from './routes/password.routes.js';
import usersRoutes from './routes/users.routes.js';
import modulesRoutes from './routes/modules.routes.js';
import progressRoutes from './routes/progress.routes.js';
import gamificationRoutes from './routes/gamification.routes.js';
import newsRoutes from './routes/news.routes.js';
import aiRoutes from './routes/ai.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import presenceRoutes from './routes/presence.routes.js';
import knowledgeRoutes from './routes/knowledge.routes.js';
import debugRoutes from './routes/debug.routes.js';

import { errorHandler } from './middleware/errorHandler.js';

const app = express();

const isProduction = String(process.env.NODE_ENV || 'development').toLowerCase() === 'production';
if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(helmet());

const DEV_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(?::\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?$/,
  /^https?:\/\/192\.168\.\d+\.\d+(?::\d+)?$/,
  /^https?:\/\/10\.\d+\.\d+\.\d+(?::\d+)?$/,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(?::\d+)?$/
];

function parseAllowedOrigins(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const explicitAllowedOrigins = new Set([
  ...parseAllowedOrigins(process.env.CORS_ORIGINS),
  ...parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS),
  ...parseAllowedOrigins(process.env.APP_URL),
  ...parseAllowedOrigins(process.env.FRONTEND_PUBLIC_URL)
]);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (explicitAllowedOrigins.has(origin)) return true;

  const isDevelopment = !isProduction;
  if (!isDevelopment) return false;

  return DEV_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notificaciones', notificationsRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/presence', presenceRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/debug', debugRoutes);

app.use(errorHandler);

export default app;
