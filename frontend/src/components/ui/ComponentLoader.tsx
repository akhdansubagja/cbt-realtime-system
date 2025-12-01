import { Center, Loader, Text, Stack, CenterProps } from '@mantine/core';

interface ComponentLoaderProps extends CenterProps {
  label?: string;
  minHeight?: number | string;
}

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
