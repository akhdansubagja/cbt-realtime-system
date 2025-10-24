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
} from "@mantine/core";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import api from "@/lib/axios";

// Definisikan tipe data yang lebih detail
interface QuestionDetail {
  id: number;
  question_text: string;
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

  // State untuk ujian
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({}); // { examQuestionId: 'A' }
  const [timeLeft, setTimeLeft] = useState(0);

  const [isFinishing, setIsFinishing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <Loader />
      </Center>
    );
  }

  if (error || !examData) {
    return (
      <Center style={{ height: "100vh" }}>
        <Alert color="red">{error || "Data ujian tidak ditemukan."}</Alert>
      </Center>
    );
  }

  const currentExamQuestion =
    examData.exam.exam_questions[currentQuestionIndex];

  return (
    <Container fluid p="md">
      <Title order={3}>{examData.exam.title}</Title>

      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Konfirmasi Selesai Ujian"
        centered
      >
        <Text>
          Apakah Anda yakin ingin menyelesaikan dan mengakhiri sesi ujian ini?
          Jawaban tidak dapat diubah kembali.
        </Text>
        <Group justify="flex-end" mt="md">
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

      <Grid mt="md">
        {/* Panel Kiri: Info dan Navigasi */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md">
            <Text>
              Peserta: <b>{examData.examinee.name}</b>
            </Text>
            <Text>
              Sisa Waktu:{" "}
              <b>
                {Math.floor(timeLeft / 60)}:
                {(timeLeft % 60).toString().padStart(2, "0")}
              </b>
            </Text>
            <hr />
            <Text>Navigasi Soal:</Text>
            <SimpleGrid cols={5} mt="sm">
              {examData.exam.exam_questions.map((q, index) => (
                <Button
                  key={q.id}
                  variant={
                    index === currentQuestionIndex ? "filled" : "outline"
                  }
                  color={answers[q.id] ? "blue" : "gray"}
                  onClick={() => setCurrentQuestionIndex(index)}
                  size="xs"
                >
                  {index + 1}
                </Button>
              ))}
            </SimpleGrid>
            <Button
              color="red"
              fullWidth
              mt="xl"
              onClick={() => setIsModalOpen(true)} // <-- Tombol ini sekarang HANYA membuka modal
            >
              Selesai Ujian
            </Button>
          </Paper>
        </Grid.Col>

        {/* Panel Kanan: Soal */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper withBorder p="md">
            <Text>Soal No. {currentQuestionIndex + 1}</Text>
            <Text mt="md" size="lg">
              {currentExamQuestion.question.question_text}
            </Text>

            <Radio.Group
              mt="md"
              value={answers[currentExamQuestion.id] || null}
              onChange={(value) =>
                handleAnswerChange(currentExamQuestion.id, value)
              }
            >
              <Stack>
                {currentExamQuestion.question.options.map((option) => (
                  <Radio
                    key={option.key}
                    value={option.key}
                    label={`${option.key}. ${option.text}`}
                  />
                ))}
              </Stack>
            </Radio.Group>

            <Group justify="space-between" mt="xl">
              <Button
                variant="default"
                onClick={() => setCurrentQuestionIndex((p) => p - 1)}
                disabled={currentQuestionIndex === 0}
              >
                Sebelumnya
              </Button>
              <Button
                onClick={() => setCurrentQuestionIndex((p) => p + 1)}
                disabled={
                  currentQuestionIndex ===
                  examData.exam.exam_questions.length - 1
                }
              >
                Selanjutnya
              </Button>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
