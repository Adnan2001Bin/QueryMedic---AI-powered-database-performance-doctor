import dotenv from 'dotenv';
dotenv.config();

import { buildApp } from './app.js';
import { getPrismaClient } from '@querymedic/database';
import { getRedisConnection, createQueues } from './queues/index.js';

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  const prisma = getPrismaClient();
  const redis = getRedisConnection();
  const queues = createQueues(redis);

  const app = await buildApp({
    prisma,
    queues,
  });

  try {
    const address = await app.listen({ port: PORT, host: HOST });
    app.log.info(`QueryMedic API server running at ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}
