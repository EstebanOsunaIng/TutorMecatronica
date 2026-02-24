import 'dotenv/config';
import app from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { startNewsScheduler } from './services/news.service.js';

async function start() {
  if (!env.jwtSecret || env.jwtSecret.length < 24) {
    throw new Error('JWT_SECRET is required and must be at least 24 characters');
  }
  await connectDb();
  startNewsScheduler();
  const server = app.listen(env.port, () => {
    console.log(`[backend] listening on http://localhost:${env.port}`);
  });

  server.on('error', (err) => {
    if (err?.code === 'EADDRINUSE') {
      console.error(`[backend] port ${env.port} already in use`);
    } else {
      console.error('[backend] server error', err);
    }
    process.exit(1);
  });
}

start().catch((err) => {
  console.error('[backend] failed to start', err);
  process.exit(1);
});
