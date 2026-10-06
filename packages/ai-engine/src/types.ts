import type { StructuredDiagnosis } from './schemas.js';

export interface FindingDiagnosticInput {
  normalizedSql: string;
  tableStats: {
    tableName: string;
    liveTuples: number;
    deadTuples: number;
    tableSizeBytes: number;
  };
  existingIndexes: Array<{
    indexName: string;
    columns: string[];
    isUnique: boolean;
  }>;
  planTreeJson: unknown;
  triggeredRules: Array<{
    ruleCode: string;
    findingType: string;
    evidence: Record<string, unknown>;
  }>;
}

export interface AIProvider {
  name: 'anthropic' | 'gemini' | 'openai' | 'local';
  diagnoseFinding(input: FindingDiagnosticInput): Promise<StructuredDiagnosis>;
}
