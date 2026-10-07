import React from 'react';
import { Header } from '../components/layout/Header';
import { HealthScoreCard } from '../components/dashboard/HealthScoreCard';
import { FindingsSummaryCard } from '../components/dashboard/FindingsSummaryCard';
import { MonitoredQueriesCard } from '../components/dashboard/MonitoredQueriesCard';

export default function HomePage() {
  return (
    <main style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Header />

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <HealthScoreCard score={94} environmentName="PostgreSQL Production (Healthy)" />
        <FindingsSummaryCard totalCount={3} criticalCount={0} highCount={1} mediumCount={2} />
        <MonitoredQueriesCard queryCount={18421} subtitle="Normalized AST Fingerprints" />
      </section>
    </main>
  );
}
