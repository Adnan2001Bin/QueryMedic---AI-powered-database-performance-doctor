import { z } from 'zod';

export const StructuredDiagnosisSchema = z.object({
  title: z.string().min(5),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  rootCause: z.string().min(15),
  explanation: z.string().min(25),
  remediationType: z.enum(['CREATE_INDEX', 'DROP_INDEX', 'REWRITE_QUERY', 'VACUUM', 'CONFIG_CHANGE']),
  recommendedSql: z.string(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  riskExplanation: z.string(),
  estimatedImprovementPct: z.object({
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
  }),
  confidenceScore: z.number().min(0).max(1),
});

export type StructuredDiagnosis = z.infer<typeof StructuredDiagnosisSchema>;
