import React from 'react';

export default function HomePage() {
  return (
    <main style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #1f2937', paddingBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>🩺</span> QueryMedic Dashboard
        </h1>
        <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
          AI-Powered Database Performance Doctor (PostgreSQL &amp; MySQL)
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem 0', color: '#60a5fa' }}>Database Health Score</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#34d399' }}>94 / 100</div>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>PostgreSQL Production (Healthy)</p>
        </div>

        <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem 0', color: '#f59e0b' }}>Open Findings</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f59e0b' }}>3 Issues</div>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>1 High, 2 Medium, 0 Critical</p>
        </div>

        <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem 0', color: '#a78bfa' }}>Monitored Queries</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#a78bfa' }}>18,421</div>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>Normalized AST Fingerprints</p>
        </div>
      </section>
    </main>
  );
}
