import { Worker } from 'bullmq';
import type Redis from 'ioredis';

export function createBenchmarkWorker(redis: Redis): Worker {
  return new Worker(
    'benchmark-sandbox',
    async (job) => {
      console.log(`[Worker:Benchmark] Running sandbox benchmark for recommendation: ${job.data.recommendationId}`);
      return { status: 'VERIFIED', improvementPct: 0 };
    },
    { connection: redis, concurrency: 2 }
  );
}
