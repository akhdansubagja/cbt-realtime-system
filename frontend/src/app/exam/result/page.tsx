// src/app/exam/result/page.tsx
'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Center,
  Alert,
} from '@mantine/core';
import { IconCircleCheck, IconInfoCircle } from '@tabler/icons-react';

// Komponen ini akan menangani logika utama
function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const score = searchParams.get('score');
  const finished = searchParams.get('finished');

  return (
    <Container size="sm" my={40}>
      <Paper withBorder shadow="md" p={30} radius="md">
        <Center>
          <IconCircleCheck size={80} color="var(--mantine-color-teal-5)" />
        </Center>

        <Title order={2} ta="center" mt="md">
          Ujian Telah Selesai
        </Title>

        {/* Tampilkan pesan berbeda tergantung kondisi */}
        {finished ? (
          <Alert color="blue" title="Informasi" icon={<IconInfoCircle />} mt="lg" ta="center">
            Anda mengakses sesi ujian yang telah selesai atau waktunya telah habis.
          </Alert>
        ) : (
          <>
            <Text c="dimmed" size="lg" ta="center" mt={5}>
              Terima kasih telah menyelesaikan ujian.
            </Text>
            <Text size="4rem" fw={700} ta="center" mt="xl">
              {score || 'N/A'}
            </Text>
            <Text c="dimmed" size="lg" ta="center">
              Skor Akhir Anda
            </Text>
          </>
        )}

        <Button fullWidth mt="xl" size="md" onClick={() => router.push('/')}>
          Kembali ke Halaman Utama
        </Button>
      </Paper>
    </Container>
  );
}

// Komponen utama yang menggunakan Suspense
export default function ResultPage() {
  return (
    <Suspense fallback={<Center style={{ height: '100vh' }}>Memuat hasil...</Center>}>
      <ResultContent />
    </Suspense>
  );
}