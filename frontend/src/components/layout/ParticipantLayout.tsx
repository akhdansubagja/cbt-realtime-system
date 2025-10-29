// frontend/src/components/layout/ParticipantLayout.tsx
'use client';

import { Box } from '@mantine/core';
import { ThemeToggle } from './ThemeToggle';

export function ParticipantLayout({ children }: { children: React.ReactNode }) {
  return (
    // Box utama yang memberikan background abu-abu
    <Box style={{ background: 'var(--mantine-color-gray-0)', minHeight: '100vh' }}>
      
      {/* Tombol tema yang selalu ada di pojok kanan atas */}
      <Box style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <ThemeToggle />
      </Box>

      {/* Di sinilah konten dari setiap halaman (page.tsx, session, result) akan ditampilkan */}
      {children}

    </Box>
  );
}