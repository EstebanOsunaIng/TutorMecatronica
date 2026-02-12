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
import teacherRoutes from './routes/teacher.routes.js';

import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());

const allowedOriginPatterns = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const ok = allowedOriginPatterns.some((re) => re.test(origin));
      if (ok) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '10kb' }));

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
app.use('/api/teacher', teacherRoutes);

app.use(errorHandler);

export default app;
