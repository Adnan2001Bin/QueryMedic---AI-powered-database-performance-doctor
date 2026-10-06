import { Queue } from 'bullmq';
import Redis from 'ioredis';

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

export interface TelemetryHarvestJobData {
  databaseId: string;
  organizationId: string;
  triggerSource: 'SCHEDULED' | 'MANUAL';
}

export interface RuleAnalysisJobData {
  snapshotId: string;
  databaseId: string;
  organizationId: string;
}

export interface AISynthesisJobData {
  findingId: string;
  databaseId: string;
  organizationId: string;
}

export interface BenchmarkSandboxJobData {
  recommendationId: string;
  databaseId: string;
  organizationId: string;
}

export interface AlertDispatchJobData {
  alertEventId: string;
  databaseId: string;
  channelType: string;
  destinationUrl: string;
}

export interface AppQueues {
  telemetryHarvest: Queue<TelemetryHarvestJobData>;
  ruleAnalysis: Queue<RuleAnalysisJobData>;
  aiSynthesis: Queue<AISynthesisJobData>;
  benchmarkSandbox: Queue<BenchmarkSandboxJobData>;
  alertDispatch: Queue<AlertDispatchJobData>;
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
