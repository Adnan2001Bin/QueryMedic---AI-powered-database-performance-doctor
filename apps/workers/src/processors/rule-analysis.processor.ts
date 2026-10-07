import { Worker } from 'bullmq';
import type Redis from 'ioredis';

export function createRuleAnalysisWorker(redis: Redis): Worker {
  return new Worker(
    'rule-analysis',
    async (job) => {
      console.log(`[Worker:RuleAnalysis] Evaluating rules for snapshot: ${job.data.snapshotId}`);
      return { findingsCount: 0 };
    },
    { connection: redis, concurrency: 10 }
  );
}
