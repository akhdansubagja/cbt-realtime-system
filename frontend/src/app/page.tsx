// src/app/page.tsx
"use client"; // Menandakan ini adalah komponen sisi klien (interaktif)

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Title,
  Paper,
  Select,
  TextInput,
  Button,
  Group,
  Alert,
  Loader,
  Center,
  MantineTheme,
  Box,
  Stack,
  Text,
  AppShell,
} from "@mantine/core";
import axios from "axios";
import { IconUser, IconKey } from "@tabler/icons-react";
import { ThemeToggle } from "../components/layout/ThemeToggle";
import { InteractiveMascot } from "@/components/ui/InteractiveMascot";
// Definisikan tipe data untuk examinee
interface Examinee {
  id: number;
  name: string;
}

/**
 * Halaman Utama (Login Peserta).
 * Peserta memilih nama dari dropdown dan memasukkan kode ujian untuk bergabung.
 */
export default function HomePage() {
  const router = useRouter();
  const [examinees, setExaminees] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedExamineeId, setSelectedExamineeId] = useState<string | null>(
    null
  );
  const [examCode, setExamCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFetchingExaminees, setIsFetchingExaminees] = useState(true);

  // State untuk interaksi maskot
  const [mascotVariant, setMascotVariant] = useState<"idle" | "typing">("idle");

  // Efek ini akan berjalan saat komponen pertama kali dimuat
  useEffect(() => {
    const fetchExaminees = async () => {
      try {
        // Kita harapkan responsnya adalah objek, bukan array Examinee[]
        const response = await axios.get<Examinee[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/examinees/all/simple`
        );
        // --- PERBAIKAN DI SINI ---
        // Buka "kotak" (response.data) untuk mendapatkan "daftar" (response.data.data)
        const formattedExaminees = response.data.map((e) => ({
          value: e.id.toString(),
          label: e.name,
        }));
        setExaminees(formattedExaminees);
      } catch (err) {
        setError(
          "Gagal memuat daftar peserta. Pastikan server backend berjalan."
        );
      } finally {
        setIsFetchingExaminees(false);
      }
    };

    fetchExaminees();
  }, []);

  const handleJoinExam = async () => {
    if (!selectedExamineeId || !examCode) {
      setError("Nama dan Kode Ujian harus diisi.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/participants/join`,
        {
          // --- PERBAIKI RADIX DI SINI ---
          examinee_id: parseInt(selectedExamineeId, 10), // Ubah 100 menjadi 10
          code: examCode,
        }
      );

      // 1. "Buka paket" respons.data untuk mendapatkan 'participant' dan 'access_token'
      const { participant, access_token } = response.data;

      // 2. Pastikan participant ada sebelum melanjutkan
      if (participant && participant.id && access_token) {
        // 3. Simpan token dengan kunci yang spesifik untuk ID sesi ini
        sessionStorage.setItem(
          `participant_token_${participant.id}`,
          access_token
        );

        // 4. Arahkan ke URL menggunakan ID yang benar dari dalam objek 'participant'
        router.push(`/exam/session/${participant.id}`);
      } else {
        throw new Error("Respons dari server tidak valid.");
      }
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((err as any).response) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setError((err as any).response.data.message || "Terjadi kesalahan.");
      } else {
        setError("Tidak dapat terhubung ke server backend.");
      }
    } finally {
      setLoading(false);
    }
  };

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
          <Stack w={420} align="center" gap={2}>
            <Box mb={-20} style={{ zIndex: 1, position: "relative" }}>
              <InteractiveMascot variant={mascotVariant} size={140} />
            </Box>

            <Title ta="center" lh={2}>
              VIOLET
            </Title>

            <Text ta="center" size="sm" mb={20}>
              (Virtual Integrated Online Evaluation Tool)
            </Text>

            <Text c="dimmed" size="sm" ta="center" mt={8} mb={10}>
              Silakan masukkan nama dan kode untuk memulai ujian.
            </Text>

            <Paper withBorder shadow="md" p={30} radius="md">
              {isFetchingExaminees ? (
                <Center>
                  <Loader />
                  <Text ml="md">Memuat daftar peserta...</Text>
                </Center>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleJoinExam();
                  }}
                >
                  <Stack gap="md">
                    <Select
                      leftSection={<IconUser size={16} />}
                      label="Pilih Nama Anda"
                      placeholder="Cari dan pilih nama Anda"
                      data={examinees}
                      value={selectedExamineeId}
                      onChange={setSelectedExamineeId}
                      onFocus={() => setMascotVariant("typing")}
                      onBlur={() => setMascotVariant("idle")}
                      searchable
                      required
                    />
                    <TextInput
                      leftSection={<IconKey size={16} />}
                      label="Kode Ujian"
                      placeholder="Masukkan kode ujian"
                      value={examCode}
                      onChange={(event) =>
                        setExamCode(event.currentTarget.value)
                      }
                      onFocus={() => setMascotVariant("typing")}
                      onBlur={() => setMascotVariant("idle")}
                      required
                    />

                    {error && (
                      <Alert
                        color="red"
                        title="Gagal Bergabung"
                        withCloseButton
                        onClose={() => setError("")}
                      >
                        {error}
                      </Alert>
                    )}

                    <Button type="submit" fullWidth mt="md" loading={loading}>
                      Gabung Ujian
                    </Button>
                  </Stack>
                </form>
              )}
            </Paper>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
