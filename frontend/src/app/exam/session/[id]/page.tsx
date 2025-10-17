'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Loader,
  Center,
  Alert,
  List,
  ThemeIcon,
} from '@mantine/core';
import { IconCircleCheck, IconInfoCircle } from '@tabler/icons-react';
import axios from 'axios';

// --- PERBAIKAN TIPE DATA DI SINI ---
interface ExamData {
  id: number;
  examinee: {
    id: number;
    name: string;
  };
  exam: {
    id: number;
    title: string;
    duration_minutes: number;
    exam_questions: any[];
  };
}

export default function ExamSessionPage() {
  const router = useRouter();
  const params = useParams();
  const participantId = params.id;

  const [examData, setExamData] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!participantId) return;

    const fetchExamData = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/participants/${participantId}/start`
        );
        setExamData(response.data);
      } catch (err) {
        setError('Gagal memuat data ujian. Sesi tidak valid atau server bermasalah.');
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [participantId]);

  const handleStartExam = async () => {
    try {
      // Panggil endpoint baru untuk memulai timer di backend
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/participants/${participantId}/begin`);
      // Setelah berhasil, baru arahkan ke halaman pengerjaan soal
      router.push(`/exam/live/${participantId}`);
    } catch (err) {
      setError('Gagal memulai ujian. Coba kembali ke halaman utama.');
    }
  };

  if (loading) {
    return (
      <Center style={{ height: '100vh' }}>
        <Loader />
        <Text ml="md">Memuat detail ujian...</Text>
      </Center>
    );
  }

  if (error) {
    return (
      <Container size="sm" my={40}>
        <Alert color="red" title="Error" icon={<IconInfoCircle />}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="md" my={40}>
      <Paper withBorder shadow="md" p={30} radius="md">
        <Title order={2} ta="center">
          Konfirmasi Ujian
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={5} mb={30}>
          Anda akan memulai ujian berikut:
        </Text>

        {examData && (
          <>
            <Title order={3}>{examData.exam.title}</Title>
            <List
              spacing="xs"
              size="sm"
              center
              mt="md"
              icon={
                <ThemeIcon color="teal" size={24} radius="xl">
                  <IconCircleCheck style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
              }
            >
              <List.Item>
                <b>Durasi:</b> {examData.exam.duration_minutes} Menit
              </List.Item>
              <List.Item>
                <b>Jumlah Soal:</b> {examData.exam.exam_questions.length} Soal
              </List.Item>
              {/* --- PERBAIKAN TAMPILAN DI SINI --- */}
              <List.Item>
                <b>Peserta:</b> {examData.examinee.name}
              </List.Item>
            </List>

            <Button fullWidth mt="xl" size="lg" onClick={handleStartExam}>
              Mulai Kerjakan
            </Button>
          </>
        )}
      </Paper>
    </Container>
  );
}