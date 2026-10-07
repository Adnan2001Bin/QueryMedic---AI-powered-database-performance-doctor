import { Queue } from 'bullmq';
import Redis from 'ioredis';
import type {
  AppQueues,
  TelemetryHarvestJobData,
  RuleAnalysisJobData,
  AISynthesisJobData,
  BenchmarkSandboxJobData,
  AlertDispatchJobData,
} from './queue.types.js';

export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisConnection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!redisConnection) {
    redisConnection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return redisConnection;
}

export function createQueues(redis: Redis): AppQueues {
  const defaultOpts = {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  };

  return {
    telemetryHarvest: new Queue<TelemetryHarvestJobData>('telemetry-harvest', defaultOpts),
    ruleAnalysis: new Queue<RuleAnalysisJobData>('rule-analysis', defaultOpts),
    aiSynthesis: new Queue<AISynthesisJobData>('ai-synthesis', defaultOpts),
    benchmarkSandbox: new Queue<BenchmarkSandboxJobData>('benchmark-sandbox', defaultOpts),
    alertDispatch: new Queue<AlertDispatchJobData>('alert-dispatch', defaultOpts),
  };
}
