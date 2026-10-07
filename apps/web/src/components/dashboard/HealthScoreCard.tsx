import React from 'react';

interface HealthScoreCardProps {
  score: number;
  environmentName: string;
}

export function HealthScoreCard({ score, environmentName }: HealthScoreCardProps) {
  return (
    <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.75rem', padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem 0', color: '#60a5fa' }}>Database Health Score</h2>
      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#34d399' }}>{score} / 100</div>
      <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>{environmentName}</p>
    </div>
  );
}
