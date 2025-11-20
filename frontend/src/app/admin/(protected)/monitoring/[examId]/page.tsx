// src/app/admin/(protected)/monitoring/[examId]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Title,
  Table,
  Loader,
  Alert,
  Center,
  Text,
  Paper,
  Badge,
  Group,
  Button,
  SegmentedControl,
  Stack,
  Flex,
  Box,
  ActionIcon,
  Avatar,
  Tooltip,
  RingProgress,
  ThemeIcon,
  useMantineColorScheme,
  Select,
} from "@mantine/core";
import { io, Socket } from "socket.io-client";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import { DatePickerInput } from "@mantine/dates";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import {
  IconArrowLeft,
  IconFileExport,
  IconTrophy,
  IconUser,
  IconClock,
  IconCheck,
  IconFilter,
} from "@tabler/icons-react";

interface ParticipantScore {
  id: number;
  name: string;
  score: number | null;
  status: "started" | "finished" | "pending";
  start_time?: string;
  batch?: string; // Tambahkan field batch
}

interface ExamInfo {
  title: string;
  code: string;
}

export default function MonitoringPage() {
  const params = useParams();
  const router = useRouter();
  const { colorScheme } = useMantineColorScheme(); // Hook untuk deteksi tema
  const examId = params.examId as string;
  const [participants, setParticipants] = useState<ParticipantScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const [allParticipants, setAllParticipants] = useState<ParticipantScore[]>(
    []
  ); // Data master
  const [filteredParticipants, setFilteredParticipants] = useState<
    ParticipantScore[]
  >([]); // Data yang ditampilkan
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null); // State untuk filter batch
  const [batchOptions, setBatchOptions] = useState<string[]>([]); // Opsi batch yang tersedia
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  
  // 1. Ambil data awal peserta
  useEffect(() => {
    if (!examId) return;

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch participants and exam info
        const [participantsRes, examRes] = await Promise.all([
          api.get(`/exams/${examId}/participants`),
          api.get(`/exams/${examId}`),
        ]);

        const initialScores = participantsRes.data.map((p: any) => {
            return {
              id: p.id,
              name: p.examinee.name,
              score: p.current_score,
              status: p.status,
              start_time: p.start_time,
              // Sekarang backend sudah mengirimkan data batch!
              batch: p.examinee.batch?.name || "Umum",
            };
        });

        setAllParticipants(initialScores);
        setExamInfo({ title: examRes.data.title, code: examRes.data.code });

        // Ekstrak daftar batch unik untuk filter dari data peserta yang ada
        const uniqueBatches = Array.from(
          new Set(initialScores.map((p: ParticipantScore) => p.batch || "Umum"))
        ).filter(Boolean) as string[];
        setBatchOptions(uniqueBatches.sort());

      } catch (err) {
        console.error(err);
        setError("Gagal mengambil data awal.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [examId]);

  // 2. Hubungkan ke WebSocket
  useEffect(() => {
    if (!examId) return;

    const socket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    );
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Terhubung ke server WebSocket.");
      // Bergabung ke ruangan monitoring yang spesifik
      socket.emit("join-monitoring-room", { examId: parseInt(examId) });
    });

    // Dengarkan event 'score-update' dari server
    socket.on(
      "score-update",
      (data: { participantId: number; newScore: number }) => {
        // --- TAMBAHKAN LOG INI UNTUK DEBUGGING ---
        console.log("Menerima update skor dari server:", data);

        // Perbarui state untuk memicu re-render
        setAllParticipants((currentParticipants) => {
          // 1. Update skor peserta yang bersangkutan
          const updatedParticipants = currentParticipants.map((p) =>
            p.id === data.participantId ? { ...p, score: data.newScore } : p
          );

          // 2. Urutkan ulang array berdasarkan skor (tertinggi di atas)
          //    Peserta dengan skor null akan ditaruh di bawah
          updatedParticipants.sort((a, b) => {
            const scoreA = a.score ?? -Infinity; // Anggap null sebagai skor terendah
            const scoreB = b.score ?? -Infinity;
            return scoreB - scoreA; // Urutkan descending
          });

          // 3. Kembalikan array yang sudah terurut
          return updatedParticipants;
        });
      }
    );

    socket.on("new-participant", (newParticipantData: any) => {
      console.log("Peserta baru bergabung:", newParticipantData);
      
      const newParticipant: ParticipantScore = {
        id: newParticipantData.id,
        name: newParticipantData.name,
        score: newParticipantData.score ?? null,
        status: "started", // Asumsikan baru bergabung = started
        // Pastikan data batch juga diambil untuk peserta baru (jika tersedia di event)
        // Note: Backend socket event mungkin perlu diupdate juga jika belum mengirim batch
        batch: newParticipantData.examinee?.batch?.name || "Umum", 
      };

      setAllParticipants((currentParticipants) => {
        if (currentParticipants.some((p) => p.id === newParticipant.id)) {
          return currentParticipants;
        }
        const newList = [...currentParticipants, newParticipant];
        newList.sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity));
        
        // Update opsi batch jika ada batch baru yang belum ada di list
        const batchName = newParticipant.batch || "Umum";
        setBatchOptions(prev => {
            if (!prev.includes(batchName)) {
                return [...prev, batchName].sort();
            }
            return prev;
        });

        return newList;
      });
    });

    socket.on(
      "status-update",
      (data: { participantId: number; newStatus: "started" | "finished" }) => {
        console.log("Menerima update status:", data);

        // Perbarui state 'master' (allParticipants)
        setAllParticipants((currentParticipants) =>
          currentParticipants.map((p) =>
            p.id === data.participantId ? { ...p, status: data.newStatus } : p
          )
        );
      }
    );

    socket.on("disconnect", () => console.log("Terputus dari server."));

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [examId]);

  // Efek ini berjalan setiap kali data master, filter tanggal, atau filter batch berubah
  useEffect(() => {
    let filtered = [...allParticipants]; // Salin data master

    const [startDate, endDate] = dateRange;

    // Terapkan filter hanya jika kedua tanggal sudah dipilih
    if (startDate && endDate) {
      filtered = filtered.filter((p) => {
        // Asumsi kita memfilter berdasarkan waktu mulai peserta
        // Kita butuh 'start_time' dari backend untuk ini
        const startTime = (p as any).start_time;
        if (!startTime) return false;

        // Cek apakah waktu mulai berada di antara rentang yang dipilih
        return (
          dayjs(startTime).isAfter(dayjs(startDate).startOf("day")) &&
          dayjs(startTime).isBefore(dayjs(endDate).endOf("day"))
        );
      });
    }

    // Filter Batch
    if (selectedBatch) {
      filtered = filtered.filter((p) => p.batch === selectedBatch);
    }

    // Urutkan ulang hasil filter (ini juga menangani pengurutan awal!)
    filtered.sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity));

    // Simpan hasil filter ke state yang akan ditampilkan
    setFilteredParticipants(filtered);
  }, [allParticipants, dateRange, selectedBatch]);

  const handleExport = () => {
    // --- 1. MEMBUAT NAMA FILE DINAMIS ---
    const [startDate, endDate] = dateRange;
    let dateString = dayjs().format("YYYY-MM-DD"); // Default jika tidak ada rentang

    if (startDate && endDate) {
      // Jika rentang dipilih, format menjadi "YYYY-MM-DD_s-d_YYYY-MM-DD"
      dateString = `${dayjs(startDate).format("YYYY-MM-DD")}_s-d_${dayjs(
        endDate
      ).format("YYYY-MM-DD")}`;
    }
    const filename = `Laporan Ujian_${examId}_${dateString}.xlsx`;

    // --- 2. MEMBUAT DATA UNTUK TABEL ---
    const dataToExport = filteredParticipants.map((p) => ({
      "ID Peserta": p.id,
      "Nama Peserta": p.name,
      "Batch/Kelas": p.batch || "-",
      Skor: p.score ?? "N/A",
      Status: p.status === "finished" ? "Selesai" : "Mengerjakan",
    }));

    // --- 3. MEMBUAT JUDUL/HEADER UNTUK EXCEL ---
    // Kita akan membuat header kustom sebagai array dari array
    const headerData = [
      ["Laporan Ujian Peserta"], // Judul Utama
      [], // Baris kosong
    ];

    // Tambahkan baris rentang tanggal secara dinamis
    if (startDate && endDate) {
      headerData.push([
        "Rentang Tanggal:",
        `${dayjs(startDate).format("DD MMM YYYY")} s/d ${dayjs(endDate).format(
          "DD MMM YYYY"
        )}`,
      ]);
    } else {
      headerData.push(["Tanggal Ekspor:", dayjs().format("DD MMM YYYY")]);
    }
    
    if (selectedBatch) {
        headerData.push(["Filter Batch:", selectedBatch]);
    }

    headerData.push([]); // Baris kosong sebelum tabel

    // --- 4. MEMBUAT WORKSHEET ---
    const workbook = XLSX.utils.book_new();

    // 4a. Buat sheet dari header kustom kita (array of arrays)
    const worksheet = XLSX.utils.aoa_to_sheet(headerData);

    // 4b. Tambahkan data JSON (tabel) kita ke sheet yang sama, DI BAWAH header
    XLSX.utils.sheet_add_json(worksheet, dataToExport, {
      origin: -1, // '-1' berarti "tambahkan setelah baris terakhir yang ada"
      skipHeader: false, // 'false' berarti kita ingin menyertakan header tabel (ID Peserta, Nama, Skor, dll)
    });

    // (Opsional tapi bagus) Atur lebar kolom
    worksheet["!cols"] = [
      { wch: 10 }, // ID Peserta
      { wch: 30 }, // Nama Peserta
      { wch: 20 }, // Batch/Kelas
      { wch: 10 }, // Skor
      { wch: 15 }, // Status
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Peserta");

    // --- 5. MENULIS FILE DENGAN NAMA BARU ---
    XLSX.writeFile(workbook, filename); // Gunakan nama file dinamis
  };

  if (loading)
    return (
      <Center h={400}>
        <Loader type="dots" size="xl" color="violet" />
      </Center>
    );
  if (error)
    return (
      <Alert color="red" title="Error">
        {error}
      </Alert>
    );

  return (
    <Stack gap="lg">
      {/* --- HEADER BARU --- */}
      <Flex justify="space-between" align="center">
        <Group>
          <ActionIcon
            variant="light"
            color="gray"
            onClick={() => router.back()}
            size="xl"
            radius="md"
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Box>
            <Title order={3} fw={800} style={{ letterSpacing: -0.5 }}>
              Monitoring: {examInfo?.title}
            </Title>
            <Group gap="xs">
              <Badge variant="dot" color="green" size="sm">
                Live Update
              </Badge>
              <Text c="dimmed" size="sm">
                {filteredParticipants.length} Peserta Aktif
              </Text>
            </Group>
          </Box>
        </Group>
      </Flex>

      {/* --- KONTROL FILTER & EKSPOR BARU --- */}
      <Paper withBorder p="md" radius="md" shadow="sm">
        <Flex justify="space-between" align="flex-end" gap="md" wrap="wrap">
          <Group style={{ flex: 1 }}>
            <DatePickerInput
              type="range"
              label="Filter Tanggal"
              placeholder="Pilih rentang tanggal"
              value={dateRange}
              onChange={(value) =>
                setDateRange([
                  value[0] ? new Date(value[0]) : null,
                  value[1] ? new Date(value[1]) : null,
                ])
              }
              clearable
              style={{ flex: 1, minWidth: 200 }}
              radius="md"
            />
            <Select
                label="Filter Batch"
                placeholder="Semua Batch"
                data={batchOptions}
                value={selectedBatch}
                onChange={setSelectedBatch}
                clearable
                searchable
                style={{ flex: 1, minWidth: 150 }}
                radius="md"
                leftSection={<IconFilter size={16} />}
            />
          </Group>
          <Button
            leftSection={<IconFileExport size={16} />}
            onClick={handleExport}
            disabled={filteredParticipants.length === 0}
            variant="light"
            color="violet"
            radius="md"
          >
            Ekspor Excel
          </Button>
        </Flex>
      </Paper>

      {/* --- LEADERBOARD REAL-TIME BARU --- */}
      <AnimatePresence mode="popLayout">
        <Stack gap="sm">
          {filteredParticipants.map((p, index) => {
            // Logic warna untuk dark mode
            const isDark = colorScheme === 'dark';
            
            // Default colors for everyone
            const iconBg = isDark ? "var(--mantine-color-dark-6)" : "var(--mantine-color-gray-1)";
            const iconColor = isDark ? "var(--mantine-color-gray-4)" : "var(--mantine-color-gray-6)";

            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Paper
                  withBorder
                  shadow="xs"
                  p="md"
                  radius="md"
                >
                  <Flex align="center" justify="space-between" gap="md">
                    <Group style={{ flex: 1 }}>
                      <Flex
                        align="center"
                        justify="center"
                        w={40}
                        h={40}
                        style={{
                          borderRadius: "50%",
                          background: iconBg,
                          color: iconColor,
                          fontWeight: 700,
                        }}
                      >
                        #{index + 1}
                      </Flex>
                      
                      <Box>
                        <Text fw={600} size="lg">
                          {p.name}
                        </Text>
                        <Group gap={6}>
                          <Badge
                            size="sm"
                            variant="light"
                            color={p.status === "finished" ? "gray" : "green"}
                            leftSection={
                              p.status === "finished" ? (
                                <IconCheck size={10} />
                              ) : (
                                <IconClock size={10} />
                              )
                            }
                          >
                            {p.status === "finished"
                              ? "Selesai"
                              : "Mengerjakan"}
                          </Badge>
                          <Badge size="sm" variant="outline" color="gray">
                            {p.batch || "Umum"}
                          </Badge>
                        </Group>
                      </Box>
                    </Group>

                    <Group>
                      <Box ta="right">
                        <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                          Skor Saat Ini
                        </Text>
                        <Text
                          fz={28}
                          fw={800}
                          c={p.score !== null ? "violet" : "dimmed"}
                          style={{ lineHeight: 1 }}
                        >
                          {p.score ?? "-"}
                        </Text>
                      </Box>
                    </Group>
                  </Flex>
                </Paper>
              </motion.div>
            );
          })}
        </Stack>
      </AnimatePresence>

      {!loading && filteredParticipants.length === 0 && (
        <Center mt="xl" p="xl">
          <Stack align="center" gap="xs">
            <ThemeIcon size={60} radius="xl" variant="light" color="gray">
              <IconUser size={32} />
            </ThemeIcon>
            <Text c="dimmed" fw={500}>
              Belum ada peserta yang memulai ujian atau sesuai dengan filter.
            </Text>
          </Stack>
        </Center>
      )}
    </Stack>
  );
}
