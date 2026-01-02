// frontend/src/components/layout/ThemeToggle.tsx
'use client';

import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

/**
 * Tombol toggle untuk mengganti tema aplikasi (gelap/terang).
 * Mendukung animasi View Transitions API jika didukung browser.
 */
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

  const toggleTheme = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Fallback for browsers without View Transitions
    if (!document.startViewTransition) {
      toggleColorScheme();
      return;
    }

    const transition = document.startViewTransition(() => {
      toggleColorScheme();
    });

    await transition.ready;

    // Animate the root element to fade in
    document.documentElement.animate(
      {
        opacity: [0, 1],
      },
      {
        duration: 300,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );

    document.documentElement.animate(
      {
        opacity: [1, 0],
      },
      {
        duration: 300,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-old(root)",
      }
    );
  };

  return (
    <ActionIcon 
      variant="gradient" 
      gradient={{ from: 'violet', to: 'indigo', deg: 135 }}
      onClick={toggleTheme} 
      size="lg"
      radius="xl"
      style={{
        transition: 'transform 0.2s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
    >
      {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
    </ActionIcon>
  );
}