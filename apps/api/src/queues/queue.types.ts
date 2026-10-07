import type { Queue } from 'bullmq';

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
