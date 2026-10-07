import React from 'react';

interface MonitoredQueriesCardProps {
  queryCount: number;
  subtitle: string;
}

export function MonitoredQueriesCard({ queryCount, subtitle }: MonitoredQueriesCardProps) {
  return (
    <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.75rem', padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem 0', color: '#a78bfa' }}>Monitored Queries</h2>
      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#a78bfa' }}>{queryCount.toLocaleString()}</div>
      <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>{subtitle}</p>
    </div>
  );
}
