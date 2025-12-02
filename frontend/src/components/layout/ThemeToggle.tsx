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

  const toggleTheme = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Fallback for browsers without View Transitions
    if (!document.startViewTransition) {
      toggleColorScheme();
      return;
    }

    const x = e.clientX;
    const y = e.clientY;

    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      toggleColorScheme();
    });

    await transition.ready;

    // Animate the clip-path
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 500,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
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