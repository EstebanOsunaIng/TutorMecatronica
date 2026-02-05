import 'dotenv/config';
import app from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

async function start() {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`[backend] listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error('[backend] failed to start', err);
  process.exit(1);
});
