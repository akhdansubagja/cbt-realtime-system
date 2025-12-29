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
  Box,
  Stack,
  Grid,
  Group,
  AppShell,
} from "@mantine/core";
import { IconCircleCheck, IconInfoCircle } from "@tabler/icons-react";
import axios from "axios";
import api from "@/lib/axios";
import { IconClock, IconListNumbers } from "@tabler/icons-react";
import { ThemeToggle } from "../../../../components/layout/ThemeToggle";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";

// --- PERBAIKAN TIPE DATA DI SINI ---
/** Interface data ujian untuk halaman persiapan */
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
    exam_questions: unknown[];
  };
}

/**
 * Halaman Persiapan Ujian (Start Page).
 * Menampilkan detail ujian (judul, durasi, jumlah soal) sebelum peserta memulai timer.
 */
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
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((err as any).response && ((err as any).response.status === 401 || (err as any).response.status === 403)) {
          // Jika ditolak (401 atau 403), tampilkan pesan error dari backend
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setError((err as any).response.data.message || "Akses ditolak.");
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
    <AppShell>
      <Box style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
        <ThemeToggle />
      </Box>

      <AppShell.Main>
        <Container
          fluid
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
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
      </AppShell.Main>
    </AppShell>
  );
}
