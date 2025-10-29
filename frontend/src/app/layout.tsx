import '@mantine/core/styles.css';
import 'mantine-datatable/styles.css';
import React from 'react';
import { ColorSchemeScript } from '@mantine/core';
import { Providers } from './Providers';

export const metadata = {
  title: 'CBT Realtime System',
  description: 'Aplikasi Ujian Online Real-time',
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}