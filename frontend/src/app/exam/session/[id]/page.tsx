"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "@mantine/core";
import { IconCircleCheck, IconInfoCircle } from "@tabler/icons-react";
import axios from "axios";
import api from "@/lib/axios";
import { Stack, Grid, Box, Group } from "@mantine/core";
import { IconClock, IconListNumbers } from "@tabler/icons-react";

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
  const [error, setError] = useState("");

  useEffect(() => {
    if (!participantId) return;

    const fetchExamData = async () => {
      try {
        const response = await api.get(`/participants/${participantId}/start`);
        setExamData(response.data);
      } catch (err: any) {
        if (
          err.response &&
          (err.response.status === 401 || err.response.status === 403)
        ) {
          // Jika ditolak (401 atau 403), tampilkan pesan error dari backend
          setError(err.response.data.message || "Akses ditolak.");
        } else {
          // Untuk error lain (seperti 500), tampilkan pesan umum
          setError("Gagal memuat data ujian. Server bermasalah.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [participantId]);

  const handleStartExam = async () => {
    try {
      // Panggil endpoint baru untuk memulai timer di backend
      await api.post(
        `${process.env.NEXT_PUBLIC_API_URL}/participants/${participantId}/begin`
      );
      // Setelah berhasil, baru arahkan ke halaman pengerjaan soal
      router.push(`/exam/live/${participantId}`);
    } catch (err) {
      setError("Gagal memulai ujian. Coba kembali ke halaman utama.");
    }
  };

  if (loading) {
    return (
      <Center style={{ height: "100vh" }}>
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
    <Container
      fluid
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--mantine-color-gray-0)",
      }}
    >
      <Stack w={600}>
        {examData && (
          <Paper withBorder shadow="md" p={30} radius="md">
            <Stack align="center">
              <Text c="dimmed">Selamat datang,</Text>
              <Title order={3}>{examData.examinee.name}</Title>

              <Text mt="md" mb="xs">
                Anda akan memulai ujian:
              </Text>
              <Title order={2} ta="center">
                {examData.exam.title}
              </Title>

              <Grid mt="xl" w="100%">
                <Grid.Col span={6}>
                  <Paper withBorder p="md" radius="sm">
                    <Group>
                      <ThemeIcon variant="light" size="lg">
                        <IconClock size={20} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xs" c="dimmed">
                          Durasi
                        </Text>
                        <Text fw={500}>
                          {examData.exam.duration_minutes} Menit
                        </Text>
                      </Box>
                    </Group>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Paper withBorder p="md" radius="sm">
                    <Group>
                      <ThemeIcon variant="light" size="lg">
                        <IconListNumbers size={20} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xs" c="dimmed">
                          Jumlah Soal
                        </Text>
                        <Text fw={500}>
                          {examData.exam.exam_questions.length} Soal
                        </Text>
                      </Box>
                    </Group>
                  </Paper>
                </Grid.Col>
              </Grid>

              <Button fullWidth mt="xl" size="lg" onClick={handleStartExam}>
                Saya Siap, Mulai Kerjakan
              </Button>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
