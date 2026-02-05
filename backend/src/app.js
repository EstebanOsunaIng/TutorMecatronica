import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import modulesRoutes from './routes/modules.routes.js';
import progressRoutes from './routes/progress.routes.js';
import gamificationRoutes from './routes/gamification.routes.js';
import newsRoutes from './routes/news.routes.js';
import aiRoutes from './routes/ai.routes.js';
import adminRoutes from './routes/admin.routes.js';

import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

export default app;
