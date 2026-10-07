import React from 'react';

interface FindingsSummaryCardProps {
  totalCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
}

export function FindingsSummaryCard({
  totalCount,
  criticalCount,
  highCount,
  mediumCount,
}: FindingsSummaryCardProps) {
  return (
    <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.75rem', padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem 0', color: '#f59e0b' }}>Open Findings</h2>
      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f59e0b' }}>{totalCount} Issues</div>
      <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
        {criticalCount} Critical, {highCount} High, {mediumCount} Medium
      </p>
    </div>
  );
}
