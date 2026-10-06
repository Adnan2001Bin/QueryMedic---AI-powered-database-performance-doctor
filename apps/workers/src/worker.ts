import dotenv from 'dotenv';
dotenv.config();

import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { getPrismaClient } from '@querymedic/database';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function startWorkers() {
  const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const prisma = getPrismaClient();

  // Telemetry Harvesting Worker
  const telemetryWorker = new Worker(
    'telemetry-harvest',
    async (job) => {
      console.log(`[Worker] Processing telemetry harvest for db: ${job.data.databaseId}`);
      return { success: true, processedAt: new Date().toISOString() };
    },
    { connection: redis, concurrency: 5 }
  );

  // Rule Analysis Worker
  const ruleWorker = new Worker(
    'rule-analysis',
    async (job) => {
      console.log(`[Worker] Evaluating rules for snapshot: ${job.data.snapshotId}`);
      return { findingsCount: 0 };
    },
    { connection: redis, concurrency: 10 }
  );

  // AI Synthesis Worker
  const aiWorker = new Worker(
    'ai-synthesis',
    async (job) => {
      console.log(`[Worker] Synthesizing AI explanation for finding: ${job.data.findingId}`);
      return { synthesized: true };
    },
    { connection: redis, concurrency: 3 }
  );

  // Benchmark Sandbox Worker
  const benchmarkWorker = new Worker(
    'benchmark-sandbox',
    async (job) => {
      console.log(`[Worker] Executing sandbox benchmark for recommendation: ${job.data.recommendationId}`);
      return { status: 'VERIFIED', improvementPct: 0 };
    },
    { connection: redis, concurrency: 2 }
  );

  // Alert Dispatcher Worker
  const alertWorker = new Worker(
    'alert-dispatch',
    async (job) => {
      console.log(`[Worker] Dispatching alert to ${job.data.channelType}: ${job.data.destinationUrl}`);
      return { dispatched: true };
    },
    { connection: redis, concurrency: 10 }
  );

  console.log('QueryMedic BullMQ worker fleet started successfully.');

  const shutdown = async () => {
    console.log('Shutting down workers...');
    await Promise.all([
      telemetryWorker.close(),
      ruleWorker.close(),
      aiWorker.close(),
      benchmarkWorker.close(),
      alertWorker.close(),
      redis.quit(),
      prisma.$disconnect(),
    ]);
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (process.env.NODE_ENV !== 'test') {
  startWorkers();
}
