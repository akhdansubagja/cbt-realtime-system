'use client';

import { MantineProvider } from '@mantine/core';
import { theme } from '../theme';
import { UserPreferencesProvider } from '@/context/UserPreferencesContext';

/**
 * Wrapper Provider utama untuk aplikasi.
 * Memuat MantineProvider (UI) dan UserPreferencesProvider (Context global).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <UserPreferencesProvider>{children}</UserPreferencesProvider>
    </MantineProvider>
  );
}