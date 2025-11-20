// src/app/exam/live/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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
  Grid,
  SimpleGrid,
  Radio,
  Group,
  Stack,
  Box,
  Modal,
  useMantineColorScheme,
  AppShell,
  Progress,
  Drawer,
  rem,
  ActionIcon,
  Flex,
  Image,
  Badge,
  ThemeIcon,
  RingProgress,
} from "@mantine/core";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import api from "@/lib/axios";
import {
  IconGripVertical,
  IconClock,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { ThemeToggle } from "../../../../components/layout/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

// Definisikan tipe data yang lebih detail
interface QuestionDetail {
  id: number;
  question_text: string;
  image_url?: string;
  options: { key: string; text: string }[];
}

interface ExamQuestion {
  id: number;
  point: number;
  question: QuestionDetail;
}

// Hanya butuh satu definisi yang benar sesuai data dari backend
interface ExamData {
  id: number; // Participant ID
  examinee: { name: string };
  exam: {
    title: string;
    duration_minutes: number;
    exam_questions: ExamQuestion[];
  };
  time_left_seconds: number; // Sisa waktu langsung dari backend
}

export default function LiveExamPage() {
  const params = useParams();
  const participantId = parseInt(params.id as string, 10);
  const router = useRouter();

  // State untuk data dan UI
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { colorScheme } = useMantineColorScheme();

  // State untuk ujian
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({}); // { examQuestionId: 'A' }
  const [timeLeft, setTimeLeft] = useState(0);

  const [isFinishing, setIsFinishing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [navOpened, { open: openNav, close: closeNav }] = useDisclosure(false);

  // State untuk WebSocket
  const socketRef = useRef<Socket | null>(null);

  const handleFinishExam = async (force: boolean = false) => {
    // Jika tidak dipaksa (tombol manual ditekan), buka modal terlebih dahulu
    if (!force) {
      setIsModalOpen(true);
      return;
    }

    // Logika ini akan berjalan jika dipaksa (waktu habis) atau dari dalam modal
    setIsFinishing(true);
    setError("");

    try {
      const response = await api.post(
        `${process.env.NEXT_PUBLIC_API_URL}/participants/${participantId}/finish`
      );

      const finalScore = response.data.final_score;
      // Tambahkan participantId agar bisa digunakan di halaman hasil
      router.push(
        `/exam/result?score=${finalScore}&participantId=${participantId}`
      );
    } catch (err) {
      setError("Gagal menyelesaikan ujian. Coba lagi.");
      if (!force) {
        // Hanya tutup modal jika dipanggil manual
        setIsModalOpen(false);
      }
    } finally {
      setIsFinishing(false);
    }
  };

  // 1. Ambil data ujian saat halaman dimuat
  useEffect(() => {
    if (!participantId) return;

    const fetchExamDataAndAnswers = async () => {
      try {
        const [examRes, answersRes] = await Promise.all([
          api.get(
            `${process.env.NEXT_PUBLIC_API_URL}/participants/${participantId}/start`
          ),
          api.get(
            `${process.env.NEXT_PUBLIC_API_URL}/participants/${participantId}/answers`
          ),
        ]);

        const examDataPayload: ExamData = examRes.data;
        const savedAnswers: Record<number, string> = answersRes.data;

        // Periksa sisa waktu sebelum set state
        if (examDataPayload.time_left_seconds <= 0) {
          // Jika waktu sudah habis dari server, langsung redirect tanpa render
          router.replace(
            `/exam/result?participantId=${participantId}&finished=true`
          );
          return; // Hentikan eksekusi
        }

        setExamData(examDataPayload);
        setTimeLeft(examDataPayload.time_left_seconds);
        setAnswers(savedAnswers);
      } catch (err: any) {
        if (err.response && err.response.status === 403) {
          const message = err.response.data.message || "";
          if (message.includes("telah selesai")) {
            // Jika errornya karena ujian selesai, baru redirect
            router.replace(
              `/exam/result?participantId=${participantId}&finished=true`
            );
          } else {
            // Jika error 403 lain (seperti token salah), tampilkan pesan
            setError(message);
          }
        } else if (err.response && err.response.status === 401) {
          // Jika tidak ada token sama sekali, tampilkan pesan
          setError(
            err.response.data.message ||
              "Akses ditolak. Silakan bergabung melalui halaman utama."
          );
        } else {
          setError("Gagal memuat data ujian. Server bermasalah.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExamDataAndAnswers();
  }, [participantId]);

  // Logika Timer Countdown (ini tidak perlu diubah)
  useEffect(() => {
    // ... (kode timer setInterval Anda sudah benar dan tidak perlu diubah) ...
  }, [timeLeft, examData]);

  // 2. Inisialisasi koneksi WebSocket
  useEffect(() => {
    if (!participantId) return;

    // Buat koneksi ke server WebSocket
    const socket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    );
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Terhubung ke server WebSocket dengan ID:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Terputus dari server WebSocket.");
    });

    socket.on("answerReceived", (data) => {
      console.log("Konfirmasi jawaban diterima dari server:", data);
    });

    // Cleanup: putuskan koneksi saat komponen di-unmount
    return () => {
      socket.disconnect();
    };
  }, [participantId]);

  // 3. Logika Timer
  useEffect(() => {
    // Jangan jalankan timer jika data belum siap
    if (!examData) return;

    // Jika waktu sudah habis saat halaman dimuat, panggil 'finish' HANYA JIKA belum dalam proses
    if (timeLeft <= 0) {
      if (!isFinishing) {
        // <-- PENJAGA #1
        handleFinishExam(true);
      }
      return; // Hentikan eksekusi lebih lanjut
    }

    // Jalankan countdown
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        // Saat waktu mencapai 1, bersiap untuk berhenti
        if (prevTime <= 1) {
          clearInterval(timer);
          // Panggil 'finish' HANYA JIKA belum dalam proses
          if (!isFinishing) {
            // <-- PENJAGA #2
            handleFinishExam(true);
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Cleanup function untuk memberhentikan interval saat komponen di-unmount
    return () => clearInterval(timer);
  }, [examData, timeLeft, isFinishing]);

  // Fungsi saat pengguna memilih jawaban
  const handleAnswerChange = (examQuestionId: number, answer: string) => {
    const newAnswers = { ...answers, [examQuestionId]: answer };
    setAnswers(newAnswers);

    // Kirim jawaban ke backend melalui WebSocket
    if (socketRef.current) {
      socketRef.current.emit("submitAnswer", {
        participantId: participantId,
        examQuestionId: examQuestionId,
        answer: answer,
      });
    }
  };

  if (loading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader type="dots" size="xl" color="violet" />
      </Center>
    );
  }

  if (error || !examData) {
    return (
      <Center style={{ height: "100vh" }}>
        <Alert
          variant="light"
          color="red"
          title="Terjadi Kesalahan"
          icon={<IconAlertTriangle />}
        >
          {error || "Data ujian tidak ditemukan."}
        </Alert>
      </Center>
    );
  }

  const currentExamQuestion =
    examData.exam.exam_questions[currentQuestionIndex];

  return (
    <Box>
      <AppShell
        header={{ height: 80 }}
        padding="md"
        bg={colorScheme === "dark" ? "dark.8" : "gray.0"}
      >
        {/* --- HEADER UJIAN BARU --- */}
        <AppShell.Header
          style={{
            backdropFilter: "blur(12px)",
            backgroundColor:
              colorScheme === "dark"
                ? "rgba(36, 36, 36, 0.8)"
                : "rgba(255, 255, 255, 0.8)",
            borderBottom: `1px solid ${
              colorScheme === "dark"
                ? "var(--mantine-color-dark-4)"
                : "var(--mantine-color-gray-2)"
            }`,
          }}
        >
          <Container size="xl" h="100%">
            <Flex h="100%" align="center" justify="space-between">
              <Group>
                <ThemeIcon
                  size="lg"
                  radius="md"
                  variant="gradient"
                  gradient={{ from: "violet", to: "indigo" }}
                >
                  <IconCheck size={20} />
                </ThemeIcon>
                <Box>
                  <Title order={4} style={{ lineHeight: 1.2 }}>
                    {examData.exam.title}
                  </Title>
                  <Text size="xs" c="dimmed" fw={500}>
                    Peserta: {examData.examinee.name}
                  </Text>
                </Box>
              </Group>

              <Group gap="xl">
                <Group gap="xs">
                  <RingProgress
                    size={48}
                    thickness={4}
                    roundCaps
                    sections={[
                      {
                        value:
                          (timeLeft / (examData.exam.duration_minutes * 60)) *
                          100,
                        color: timeLeft < 300 ? "red" : "violet",
                      },
                    ]}
                    label={
                      <Center>
                        <IconClock
                          size={16}
                          color={timeLeft < 300 ? "var(--mantine-color-red-6)" : "inherit"}
                        />
                      </Center>
                    }
                  />
                  <Box>
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                      Sisa Waktu
                    </Text>
                    <Text
                      fw={700}
                      fz="lg"
                      c={timeLeft < 300 ? "red" : "inherit"}
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {Math.floor(timeLeft / 60)}:
                      {("0" + (timeLeft % 60)).slice(-2)}
                    </Text>
                  </Box>
                </Group>

                <Group>
                  <ThemeToggle />
                  <Button
                    color="red"
                    variant="light"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Selesai Ujian
                  </Button>
                </Group>
              </Group>
            </Flex>
          </Container>
        </AppShell.Header>

        {/* --- KONTEN UTAMA (SOAL) --- */}
        <AppShell.Main>
          <Container size="md" py="xl">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Paper
                withBorder
                p={40}
                radius="lg"
                shadow="sm"
                style={{
                  WebkitUserSelect: "none",
                  msUserSelect: "none",
                  userSelect: "none",
                  minHeight: 400,
                }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <Group justify="space-between" mb="xl">
                  <Badge size="lg" variant="light" color="violet">
                    Soal No. {currentQuestionIndex + 1}
                  </Badge>
                  <Text size="sm" c="dimmed">
                    Bobot: {currentExamQuestion.point} Poin
                  </Text>
                </Group>

                <Text size="xl" style={{ lineHeight: 1.6 }}>
                  {currentExamQuestion.question.question_text}
                </Text>

                {currentExamQuestion.question.image_url && (
                  <Box mt="lg" mb="xl">
                    <Image
                      radius="md"
                      mah={400}
                      w="auto"
                      fit="contain"
                      src={`${process.env.NEXT_PUBLIC_API_URL}${currentExamQuestion.question.image_url}`}
                      alt={`Gambar soal no. ${currentQuestionIndex + 1}`}
                      style={{ border: "1px solid var(--mantine-color-gray-2)" }}
                    />
                  </Box>
                )}

                <Stack mt={40} gap="md">
                  {currentExamQuestion.question.options.map((option) => {
                    const isSelected =
                      answers[currentExamQuestion.id] === option.key;
                    return (
                      <Paper
                        key={option.key}
                        withBorder
                        p="md"
                        radius="md"
                        onClick={() =>
                          handleAnswerChange(currentExamQuestion.id, option.key)
                        }
                        style={{
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          borderColor: isSelected
                            ? "var(--mantine-color-violet-6)"
                            : undefined,
                          backgroundColor: isSelected
                            ? "var(--mantine-color-violet-0)"
                            : undefined,
                        }}
                      >
                        <Group>
                          <ThemeIcon
                            variant={isSelected ? "filled" : "light"}
                            color={isSelected ? "violet" : "gray"}
                            radius="xl"
                            size="md"
                          >
                            <Text size="xs" fw={700}>
                              {option.key}
                            </Text>
                          </ThemeIcon>
                          <Text
                            fw={isSelected ? 500 : 400}
                            c={isSelected ? "violet.9" : undefined}
                          >
                            {option.text}
                          </Text>
                        </Group>
                      </Paper>
                    );
                  })}
                </Stack>
              </Paper>
            </motion.div>

            {/* --- TOMBOL NAVIGASI --- */}
            <Paper
              withBorder
              p="md"
              radius="md"
              mt="lg"
              style={{ position: "sticky", bottom: 20, zIndex: 10 }}
              shadow="md"
            >
              <Flex justify="space-between">
                <Button
                  variant="subtle"
                  color="gray"
                  leftSection={<IconArrowLeft size={18} />}
                  onClick={() => setCurrentQuestionIndex((p) => p - 1)}
                  disabled={currentQuestionIndex === 0}
                >
                  Sebelumnya
                </Button>

                <Button
                  variant="light"
                  color="violet"
                  leftSection={<IconGripVertical size={18} />}
                  onClick={openNav}
                >
                  Daftar Soal
                </Button>

                <Button
                  variant="filled"
                  color="violet"
                  rightSection={<IconArrowRight size={18} />}
                  onClick={() => setCurrentQuestionIndex((p) => p + 1)}
                  disabled={
                    currentQuestionIndex ===
                    examData.exam.exam_questions.length - 1
                  }
                >
                  Selanjutnya
                </Button>
              </Flex>
            </Paper>
          </Container>
        </AppShell.Main>

        {/* --- DRAWER NAVIGASI --- */}
        <Drawer
          opened={navOpened}
          onClose={closeNav}
          title="Navigasi Soal"
          position="right"
          padding="md"
          size="md"
        >
          <Text size="sm" c="dimmed" mb="lg">
            Klik nomor untuk melompat ke soal tersebut.
          </Text>
          <SimpleGrid cols={5} spacing="sm">
            {examData.exam.exam_questions.map((q, index) => {
              const isCurrent = index === currentQuestionIndex;
              const isAnswered = !!answers[q.id];

              return (
                <Button
                  key={q.id}
                  variant={isCurrent ? "filled" : isAnswered ? "light" : "default"}
                  color={isCurrent ? "violet" : isAnswered ? "violet" : "gray"}
                  onClick={() => {
                    setCurrentQuestionIndex(index);
                    closeNav();
                  }}
                  h={50}
                  radius="md"
                  style={{
                    border: isCurrent
                      ? "2px solid var(--mantine-color-violet-8)"
                      : undefined,
                  }}
                >
                  {index + 1}
                </Button>
              );
            })}
          </SimpleGrid>

          <Group mt="xl" justify="center">
            <Group gap="xs">
              <Box w={16} h={16} bg="violet.1" style={{ borderRadius: 4 }} />
              <Text size="xs">Dijawab</Text>
            </Group>
            <Group gap="xs">
              <Box
                w={16}
                h={16}
                style={{
                  border: "1px solid var(--mantine-color-gray-4)",
                  borderRadius: 4,
                }}
              />
              <Text size="xs">Belum</Text>
            </Group>
            <Group gap="xs">
              <Box w={16} h={16} bg="violet.6" style={{ borderRadius: 4 }} />
              <Text size="xs">Aktif</Text>
            </Group>
          </Group>
        </Drawer>

        {/* --- MODAL KONFIRMASI --- */}
        <Modal
          opened={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Konfirmasi Selesai Ujian"
          centered
          radius="lg"
        >
          <Text size="sm" mb="lg">
            Apakah Anda yakin ingin menyelesaikan sesi ujian ini? Pastikan semua
            jawaban sudah terisi dengan benar.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button
              color="red"
              loading={isFinishing}
              onClick={() => handleFinishExam(true)}
            >
              Ya, Selesaikan
            </Button>
          </Group>
        </Modal>
      </AppShell>
    </Box>
  );
}
