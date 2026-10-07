import React from 'react';

export function Header() {
  return (
    <header style={{ marginBottom: '2rem', borderBottom: '1px solid #1f2937', paddingBottom: '1.5rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span>🩺</span> QueryMedic Dashboard
      </h1>
      <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
        AI-Powered Database Performance Doctor (PostgreSQL &amp; MySQL)
      </p>
    </header>
  );
}
