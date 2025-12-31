// src/app/exam/result/page.tsx
"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Center,
  Alert,
  AppShell,
} from "@mantine/core";
import { IconCircleCheck, IconInfoCircle } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { Stack, Box } from "@mantine/core";
import api from "@/lib/axios";
import { motion, useSpring, useTransform } from "framer-motion";
import { ThemeToggle } from "../../../components/layout/ThemeToggle";

// Komponen ini akan menangani logika utama
// Komponen ini akan menangani logika utama
/**
 * Konten Halaman Hasil Ujian.
 * Menampilkan skor akhir dengan animasi dan pesan feedback.
 * Membedakan status selesai normal atau waktu habis.
 */
function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const score = searchParams.get("score");
  const finished = searchParams.get("finished");

  const [participantName, setParticipantName] = useState("");
  const participantId = searchParams.get("participantId");

  const finalScore = parseInt(score || "0", 10);
  const animatedScore = useSpring(0, {
    damping: 50,
    stiffness: 100,
  });

  const roundedAnimatedScore = useTransform(animatedScore, (latest) => {
    return Math.round(latest);
  });

  useEffect(() => {
    animatedScore.set(finalScore);
  }, [finalScore, animatedScore]);

  const getFeedbackMessage = (s: number) => {
    if (s >= 90) return "Luar Biasa!";
    if (s >= 75) return "Kerja Bagus!";
    if (s >= 60) return "Cukup Baik!";
    return "Terus Belajar!";
  };

  useEffect(() => {
    if (participantId) {
      api
        .get(`/participants/${participantId}`)
        .then((response) => {
          setParticipantName(response.data.examinee.name);
        })
        .catch((err) => {
          console.error("Gagal mengambil nama peserta:", err);
        });
    }
  }, [participantId]);

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
          <Paper withBorder shadow="md" p="xl" radius="md" w={450}>
            <Stack align="center">
              <IconCircleCheck size={80} color="var(--mantine-color-teal-5)" />

              <Title order={2} ta="center" mt="md">
                Ujian Telah Selesai
              </Title>


              {finished ? (
                <Alert
                  color="blue"
                  title="Informasi"
                  icon={<IconInfoCircle />}
                  mt="lg"
                  ta="center"
                >
                  Sesi ujian ini telah selesai atau waktunya telah habis.
                </Alert>
              ) : (
                <>
                  <Text c="dimmed" size="sm" ta="center" mt={5}>
                    Skor akhir Anda adalah:
                  </Text>

                  <motion.div
                    style={{
                      width: 180,
                      height: 180,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "linear-gradient(135deg, var(--mantine-color-teal-5), var(--mantine-color-cyan-5))",
                      color: "white",
                      boxShadow:
                        "0px 10px 30px -10px var(--mantine-color-teal-4)",
                      marginTop: "var(--mantine-spacing-xl)",
                      flexDirection: "column",
                    }}
                  >
                    <motion.h1
                      style={{
                        fontSize: "4.5rem",
                        fontWeight: 700,
                        margin: 0,
                        lineHeight: 1,
                      }}
                    >
                      {roundedAnimatedScore}
                    </motion.h1>
                  </motion.div>
                  {/* <Text fw={500} mt="md">
                    {getFeedbackMessage(finalScore)}
                  </Text> */}
                </>
              )}

              <Button
                fullWidth
                mt="xl"
                size="md"
                onClick={() => router.push("/")}
              >
                Kembali ke Halaman Utama
              </Button>
            </Stack>
          </Paper>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}


/**
 * Halaman Hasil Ujian (Wrapper).
 * Menggunakan Suspense karena mengakses useSearchParams.
 */
export default function ResultPage() {
  return (
    <Suspense
      fallback={<Center style={{ height: "100vh" }}>Memuat hasil...</Center>}
    >
      <ResultContent />
    </Suspense>
  );
}
