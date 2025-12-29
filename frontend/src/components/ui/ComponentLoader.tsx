import { Center, Loader, Text, Stack, CenterProps } from '@mantine/core';

/**
 * Props untuk ComponentLoader.
 */
interface ComponentLoaderProps extends CenterProps {
  /** Label opsional yang ditampilkan di bawah spinner */
  label?: string;
  /** Tinggi minimum container (default: 200) */
  minHeight?: number | string;
}

/**
 * Komponen loader sederhana untuk bagan atau container kecil.
 * Menampilkan spinner dots di tengah.
 */
export function ComponentLoader({ label, minHeight = 200, ...props }: ComponentLoaderProps) {
  return (
    <Center h={minHeight} {...props}>
      <Stack align="center" gap="xs">
        <Loader type="dots" />
        {label && <Text size="xs" c="dimmed">{label}</Text>}
      </Stack>
    </Center>
  );
}
