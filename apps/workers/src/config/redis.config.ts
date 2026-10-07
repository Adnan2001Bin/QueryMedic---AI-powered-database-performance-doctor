import Redis from 'ioredis';

export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export function createWorkerRedisConnection(): Redis {
  return new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}
