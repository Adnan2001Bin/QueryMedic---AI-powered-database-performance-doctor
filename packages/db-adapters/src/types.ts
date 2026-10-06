export interface ExecutionPlanNode {
  nodeType: string;
  relationName?: string;
  schema?: string;
  alias?: string;
  startupCost: number;
  totalCost: number;
  planRows: number;
  planWidth: number;
  actualStartupTimeMs?: number;
  actualTotalTimeMs?: number;
  actualRows?: number;
  actualLoops?: number;
  filter?: string;
  rowsRemovedByFilter?: number;
  indexName?: string;
  indexCond?: string;
  rowsRemovedByIndexFilter?: number;
  sharedHitBlocks?: number;
  sharedReadBlocks?: number;
  children?: ExecutionPlanNode[];
}

export interface RawQueryStatistic {
  queryId: string;
  query: string;
  calls: number;
  totalExecTimeMs: number;
  meanExecTimeMs: number;
  stddevExecTimeMs: number;
  rows: number;
  sharedBlksHit: number;
  sharedBlksRead: number;
}

export interface TableCatalogMetric {
  schemaName: string;
  tableName: string;
  liveTuples: number;
  deadTuples: number;
  tableSizeBytes: number;
  indexSizeBytes: number;
}

export interface IndexCatalogMetric {
  schemaName: string;
  tableName: string;
  indexName: string;
  columns: string[];
  isUnique: boolean;
  indexSizeBytes: number;
  idxScanCount: number;
}

export interface DatabaseHealthVitals {
  cacheHitRatio: number;
  activeConnections: number;
  maxConnections: number;
  connectionSaturationPct: number;
  longestTxDurationSec: number;
  blockedQueriesCount: number;
}

export interface BenchmarkRunResult {
  latencyMs: number;
  rowsScanned: number;
  planSummary: string;
  planJson: unknown;
}

export interface DatabaseAdapter {
  engine: 'POSTGRESQL' | 'MYSQL';
  testConnection(): Promise<{ ok: boolean; latencyMs: number; version: string }>;
  verifyPermissions(): Promise<{ hasStatStatements: boolean; isReadOnly: boolean; warnings: string[] }>;
  collectQueryStatistics(limit: number): Promise<RawQueryStatistic[]>;
  collectTableCatalogs(): Promise<TableCatalogMetric[]>;
  collectIndexCatalogs(): Promise<IndexCatalogMetric[]>;
  collectHealthVitals(): Promise<DatabaseHealthVitals>;
  explainQuery(sql: string, params?: unknown[]): Promise<ExecutionPlanNode>;
  explainAnalyzeBenchmark(sql: string, params?: unknown[]): Promise<BenchmarkRunResult>;
}
