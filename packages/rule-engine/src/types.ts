import type { ExecutionPlanNode, TableCatalogMetric, IndexCatalogMetric } from '@querymedic/db-adapters';

export interface DeterministicFinding {
  ruleCode: string;
  findingType:
    | 'SEQUENTIAL_SCAN'
    | 'MISSING_INDEX'
    | 'DUPLICATE_INDEX'
    | 'UNUSED_INDEX'
    | 'TABLE_BLOAT'
    | 'N_PLUS_ONE'
    | 'LOCK_CONTENTION';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  candidateSql?: string;
}

export interface RuleEvaluationContext {
  databaseId: string;
  queryId?: string;
  normalizedSql?: string;
  planTree?: ExecutionPlanNode;
  tables: TableCatalogMetric[];
  indexes: IndexCatalogMetric[];
}

export interface DeterministicRule {
  code: string;
  name: string;
  description: string;
  evaluate(context: RuleEvaluationContext): Promise<DeterministicFinding[]>;
}
