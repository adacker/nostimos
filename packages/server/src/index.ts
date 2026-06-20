// CONTRACT:S1-API.1.0
// Process entrypoint: opens the file-backed store and starts listening.
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { buildApp } from './app.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '127.0.0.1';
const DB_PATH = resolve(process.env.NOSTIMOS_DB ?? 'data/nostimos.db');

mkdirSync(dirname(DB_PATH), { recursive: true });

const app = buildApp({ dbPath: DB_PATH, logger: true });

app
  .listen({ port: PORT, host: HOST })
  .then(() => {
    app.log.info(`nostimos server on http://${HOST}:${PORT} (db: ${DB_PATH})`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
