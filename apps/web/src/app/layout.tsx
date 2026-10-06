import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'QueryMedic — AI-Powered Database Performance Doctor',
  description: 'Continuous, read-only database performance diagnosis and optimization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#090d16', color: '#f3f4f6' }}>
        {children}
      </body>
    </html>
  );
}
