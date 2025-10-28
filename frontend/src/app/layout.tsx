// src/app/layout.tsx
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css'; // <-- 1. Import CSS Notifikasi
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications'; // <-- 2. Import Komponen Notifikasi
import '@mantine/dates/styles.css';
import 'mantine-datatable/styles.css';
import { theme } from '../theme';

const inter = Inter({ subsets: ["latin"] });

export const metadata = { /* ... */ };

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body className={inter.className}>
        <MantineProvider theme={theme}>
          <Notifications /> {/* <-- 3. Tambahkan Komponen di sini */}
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}