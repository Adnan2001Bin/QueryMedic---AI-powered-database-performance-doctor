import { Worker } from 'bullmq';
import type Redis from 'ioredis';

export function createAISynthesisWorker(redis: Redis): Worker {
  return new Worker(
    'ai-synthesis',
    async (job) => {
      console.log(`[Worker:AISynthesis] Generating explanation for finding: ${job.data.findingId}`);
      return { synthesized: true };
    },
    { connection: redis, concurrency: 3 }
  );
}
