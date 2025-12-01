import { Center, Loader, Text, Stack } from '@mantine/core';

interface FullPageLoaderProps {
  label?: string;
}

export function FullPageLoader({ label }: FullPageLoaderProps) {
  return (
    <Center h="100vh" w="100vw" style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, backgroundColor: 'var(--mantine-color-body)' }}>
      <Stack align="center" gap="md">
        <Loader size="xl" type="dots" />
        {label && <Text size="sm" c="dimmed">{label}</Text>}
      </Stack>
    </Center>
  );
}
