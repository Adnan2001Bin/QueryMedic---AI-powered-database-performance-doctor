import { Worker } from 'bullmq';
import type Redis from 'ioredis';

export function createAlertWorker(redis: Redis): Worker {
  return new Worker(
    'alert-dispatch',
    async (job) => {
      console.log(`[Worker:Alert] Sending alert to ${job.data.channelType}: ${job.data.destinationUrl}`);
      return { dispatched: true };
    },
    { connection: redis, concurrency: 10 }
  );
}
