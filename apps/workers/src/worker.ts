import dotenv from 'dotenv';
dotenv.config();

import { getPrismaClient } from '@querymedic/database';
import { createWorkerRedisConnection } from './config/redis.config.js';
import {
  createTelemetryWorker,
  createRuleAnalysisWorker,
  createAISynthesisWorker,
  createBenchmarkWorker,
  createAlertWorker,
} from './processors/index.js';

async function startWorkers() {
  const redis = createWorkerRedisConnection();
  const prisma = getPrismaClient();

  const workers = [
    createTelemetryWorker(redis),
    createRuleAnalysisWorker(redis),
    createAISynthesisWorker(redis),
    createBenchmarkWorker(redis),
    createAlertWorker(redis),
  ];

  console.log('QueryMedic BullMQ worker fleet started successfully (5 processors active).');

  const shutdown = async () => {
    console.log('Shutting down worker fleet...');
    await Promise.all(workers.map((w) => w.close()));
    await redis.quit();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (process.env.NODE_ENV !== 'test') {
  startWorkers();
}
