import 'dotenv/config';
import app from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

async function start() {
  await connectDb();
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
