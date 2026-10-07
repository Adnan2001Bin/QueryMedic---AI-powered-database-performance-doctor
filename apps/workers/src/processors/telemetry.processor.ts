import { Worker } from 'bullmq';
import type Redis from 'ioredis';

export function createTelemetryWorker(redis: Redis): Worker {
  return new Worker(
    'telemetry-harvest',
    async (job) => {
      console.log(`[Worker:Telemetry] Harvesting statistics for db: ${job.data.databaseId}`);
      return { success: true, processedAt: new Date().toISOString() };
    },
    { connection: redis, concurrency: 5 }
  );
}
