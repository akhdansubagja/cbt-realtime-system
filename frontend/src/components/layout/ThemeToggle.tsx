// frontend/src/components/layout/ThemeToggle.tsx
'use client';

import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render placeholder dengan ukuran yang sama untuk mencegah layout shift
    return <ActionIcon variant="default" size="lg" loading />;
  }

  return (
    <ActionIcon variant="default" onClick={() => toggleColorScheme()} size="lg">
      {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
    </ActionIcon>
  );
}