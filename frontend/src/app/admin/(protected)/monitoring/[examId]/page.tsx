// src/app/admin/(protected)/monitoring/[examId]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  IconDotsVertical, // New
  IconRefresh, // New
  IconEdit, // New
  IconTrash, // New
  IconAlertCircle, // New
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { Menu, Modal, TextInput, NumberInput, Switch } from "@mantine/core";
import Swal from "sweetalert2"; // Ensure Swal is available or use Mantine confirmation

interface ParticipantScore {
  id: number;
  name: string;
  score: number | null;
  status: "started" | "finished" | "pending";
  start_time?: string;
  finished_at?: string; // Tambahkan field finished_at
  batch?: string; // Tambahkan field batch
  attempt_number?: number;
  is_retake?: boolean;
}

interface ExamInfo {
  title: string;
  code: string;
  duration: number; // in minutes
}

// Komponen Timer untuk menghitung durasi secara real-time
const DurationTimer = ({ startTime, status, finishedAt, limitMinutes }: { startTime?: string; status: string; finishedAt?: string; limitMinutes?: number }) => {
  const [duration, setDuration] = useState<string>("-");
  const [isOverLimit, setIsOverLimit] = useState(false);

  useEffect(() => {
    if (!startTime) return;

    const calculateDuration = () => {
      const start = new Date(startTime).getTime();
      let end: number;

      if (status === 'finished') {
          if (finishedAt) {
              end = new Date(finishedAt).getTime();
          } else if (limitMinutes) {
               // Fallback: If finished but no timestamp, assume partial/auto-close at limit
               // But usually we just want to show the LIMIT duration.
               // So we force diff = limitSeconds
               end = start + (limitMinutes * 60 * 1000); 
          } else {
              end = Date.now(); // Should not happen ideally
          }
      } else {
          end = Date.now();
      }
      
      let diff = Math.max(0, Math.floor((end - start) / 1000));

      // CLAMP LOGIC (For running status OR fallback calculation)
      // If we used the fallback above, diff is naturally limitSeconds.
      // If still running, we clamp.
      if (limitMinutes) {
          const limitSeconds = limitMinutes * 60;
           if (diff >= limitSeconds) {
              diff = limitSeconds;
              setIsOverLimit(true);
          } else {
              setIsOverLimit(false);
          }
      }

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      if (hours > 0) {
        setDuration(`${hours}j ${minutes}m ${seconds}d`);
      } else {
        setDuration(`${minutes}m ${seconds}d`);
      }
    };

    calculateDuration(); // Hitung langsung

    if (status === 'started' && !isOverLimit) { // Stop ticking if over limit
      const interval = setInterval(calculateDuration, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, status, finishedAt, limitMinutes, isOverLimit]);

  return (
    <Group gap={4}>
        <Text size="sm" fw={500} c={isOverLimit ? "red" : undefined}>{duration}</Text>
        {isOverLimit && (
             <Tooltip label="Waktu Habis (Menunggu sistem/refresh)">
                <IconAlertCircle size={14} color="red" />
             </Tooltip>
        )}
    </Group>
  );
};

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
  
  const searchParams = useSearchParams();
  const batchParam = searchParams.get("batch");

  useEffect(() => {
    if (batchParam) {
      setSelectedBatch(batchParam);
    }
  }, [batchParam]);

  // --- ACTIONS STATE ---
  const [openedEdit, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editingParticipant, setEditingParticipant] = useState<ParticipantScore | null>(null);
  const [editForm, setEditForm] = useState({
    status: "",
    admin_notes: "",
  });

  // --- HANDLERS ---
  const handleRetake = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: "Izinkan Ujian Ulang?",
      text: `Data ujian lama ${name} akan diarsipkan sebagai history. Siswa akan mendapatkan sesi baru.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Izinkan!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await api.post(`/participants/${id}/retake`);
        Swal.fire("Berhasil!", "Sesi ujian baru telah dibuat.", "success");
        // Reload data? Or wait for socket? Usually reload is safer for new session ID.
        window.location.reload(); 
      } catch (error) {
        Swal.fire("Gagal", "Terjadi kesalahan saat memproses retake.", "error");
      }
    }
  };

  const handleDelete = async (id: number, name: string) => {
     const result = await Swal.fire({
      title: "Hapus Peserta?",
      text: `Anda yakin ingin menghapus data ${name}? Tindakan ini tidak dapat dibatalkan.`,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/participants/${id}`);
        Swal.fire("Terhapus!", "Data peserta telah dihapus.", "success");
        setAllParticipants(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        Swal.fire("Gagal", "Gagal menghapus peserta.", "error");
      }
    }
  };

  const handleEditClick = (p: ParticipantScore) => {
    setEditingParticipant(p);
    setEditForm({
      status: p.status,
      admin_notes: "", // Load existing notes if we had them in interface, currently assume empty or fetch
    });
    openEdit();
  };

  const  saveEdit = async () => {
    if (!editingParticipant) return;
    try {
      await api.patch(`/participants/${editingParticipant.id}`, {
        status: editForm.status,
        admin_notes: editForm.admin_notes
      });
      Swal.fire("Berhasil", "Data peserta diperbarui.", "success");
      
      // Update local state optimistic
      setAllParticipants(prev => prev.map(p => 
        p.id === editingParticipant.id ? { ...p, status: editForm.status as any } : p
      ));
      closeEdit();
    } catch (error) {
      Swal.fire("Error", "Gagal menyimpan perubahan.", "error");
    }
  };
  
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
              finished_at: p.finished_at, // Map finished_at
              // Sekarang backend sudah mengirimkan data batch!
              batch: p.examinee.batch?.name || "Umum",
              attempt_number: p.attempt_number,
              is_retake: p.is_retake,
            };
        });

        setAllParticipants(initialScores);
        setExamInfo({ 
            title: examRes.data.title, 
            code: examRes.data.code,
            duration: examRes.data.duration // Asumsi field dari API
        });

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

  // Helper Sort Function
  const sortParticipants = (list: ParticipantScore[]) => {
    return [...list].sort((a, b) => {
      // 1. Score (Highest first)
      const scoreA = a.score ?? -9999; // Treat null as very low
      const scoreB = b.score ?? -9999;
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      // 2. Duration (Lowest/Fastest first)
      // Duration = (finished_at || now) - start_time
      const getDuration = (p: ParticipantScore) => {
        if (!p.start_time) return Infinity; // Not started -> Put at bottom
        const start = new Date(p.start_time).getTime();
        const end = p.finished_at ? new Date(p.finished_at).getTime() : Date.now();
        return Math.max(0, end - start);
      };

      const durA = getDuration(a);
      const durB = getDuration(b);

      return durA - durB;
    });
  };

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

          // 2. Urutkan ulang
          return sortParticipants(updatedParticipants);
        });
      }
    );

    socket.on("new-participant", (newParticipantData: any) => {
      console.log("Peserta baru bergabung:", newParticipantData);
      
      setAllParticipants((currentParticipants) => {
        // Cek jika peserta sudah ada di list (berdasarkan ID) - UPDATE datanya jika sudah ada
        const existingIndex = currentParticipants.findIndex(p => p.id === newParticipantData.id);
        
        const updatedParticipant: ParticipantScore = {
          id: newParticipantData.id,
          name: newParticipantData.name || newParticipantData.examinee?.name || "Unknown",
          score: newParticipantData.score ?? null,
          status: newParticipantData.status || "started",
          start_time: newParticipantData.start_time, // Penting: pastikan ini ada
          finished_at: newParticipantData.finished_at,
          batch: newParticipantData.batch || newParticipantData.examinee?.batch?.name || "Umum", 
          attempt_number: newParticipantData.attempt_number,
          is_retake: newParticipantData.is_retake
        };

        let newList;
        if (existingIndex >= 0) {
            // Update existing
            newList = [...currentParticipants];
            newList[existingIndex] = { ...newList[existingIndex], ...updatedParticipant };
        } else {
            // Append new
            newList = [...currentParticipants, updatedParticipant];
        }

        // Sort
        const sortedList = sortParticipants(newList);
        
        // Update batch options if needed
        const batchName = updatedParticipant.batch || "Umum";
        setBatchOptions(prev => {
            if (!prev.includes(batchName)) {
                return [...prev, batchName].sort();
            }
            return prev;
        });

        return sortedList;
      });
    });

    socket.on(
      "status-update",
      (data: { participantId: number; newStatus: "started" | "finished"; finished_at?: string }) => {
        console.log("Menerima update status:", data);

        // Perbarui state 'master' (allParticipants)
        setAllParticipants((currentParticipants) => {
          const updatedList = currentParticipants.map((p) =>
            p.id === data.participantId
              ? {
                  ...p,
                  status: data.newStatus,
                  finished_at: data.finished_at, // Update waktu selesai
                }
              : p
          );
          // Sort juga saat status update (karena duration mungkin finalize)
          return sortParticipants(updatedList);
        });
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

    // Urutkan ulang hasil filter menggunakan Helper
    filtered = sortParticipants(filtered);

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
    const dataToExport = filteredParticipants.map((p) => {
      // Hitung durasi untuk export
      let durationStr = "-";
      if (p.start_time) {
        const start = new Date(p.start_time).getTime();
        const end = p.status === 'finished' && p.finished_at ? new Date(p.finished_at).getTime() : Date.now();
        const diff = Math.max(0, Math.floor((end - start) / 1000));
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        durationStr = hours > 0 ? `${hours}j ${minutes}m ${seconds}d` : `${minutes}m ${seconds}d`;
      }

      return {
        "ID Peserta": p.id,
        "Nama Peserta": p.name,
        "Batch/Kelas": p.batch || "-",
        "Waktu Mulai": p.start_time ? dayjs(p.start_time).format("D MMM YYYY, HH:mm:ss") : "-",
        "Waktu Selesai": p.finished_at ? dayjs(p.finished_at).format("D MMM YYYY, HH:mm:ss") : "-",
        "Durasi": durationStr,
        Skor: p.score ?? "N/A",
        Status: p.status === "finished" ? "Selesai" : "Mengerjakan",
      };
    });

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
      { wch: 25 }, // Waktu Mulai
      { wch: 25 }, // Waktu Selesai
      { wch: 15 }, // Durasi
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
      <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "flex-start", sm: "center" }} gap="md">
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
                {filteredParticipants.length} Peserta
              </Text>
            </Group>
          </Box>
        </Group>
      </Flex>

      {/* --- KONTROL FILTER & EKSPOR BARU --- */}
      <Paper withBorder p="md" radius="md" shadow="sm">
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "stretch", md: "flex-end" }} gap="md">
          <Flex direction={{ base: "column", sm: "row" }} gap="md" style={{ flex: 1 }}>
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
          </Flex>
          <Button
            leftSection={<IconFileExport size={16} />}
            onClick={handleExport}
            disabled={filteredParticipants.length === 0}
            variant="light"
            color="violet"
            radius="md"
            fullWidth={false} // Default value
            w={{ base: "100%", md: "auto" }} // Full width on mobile
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
                  <Flex direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }} justify="space-between" gap="md">
                    <Group style={{ flex: 1 }} align="flex-start" wrap="nowrap">
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
                          flexShrink: 0
                        }}
                      >
                        #{index + 1}
                      </Flex>
                      
                      <Box style={{ minWidth: 0, flex: 1 }}> {/* minWidth 0 prevents overflow */}
                        <Text fw={600} size="lg" truncate>
                          {p.name}
                        </Text>
                        <Group gap={6} wrap="wrap"> {/* Allow wrap */}
                          {/* STATUS BADGE */}
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

                          {/* BATCH CARD */}
                          <Badge size="sm" variant="outline" color="gray">
                            {p.batch || "Umum"}
                          </Badge>

                          {/* ATTEMPT BADGE (NEW) */}
                          {(p.attempt_number && p.attempt_number > 1) && (
                            <Badge size="sm" variant="filled" color="orange">
                              Attempt #{p.attempt_number}
                            </Badge>
                          )}
                        </Group>
                      </Box>
                    </Group>

                    {/* Stats Grid for Mobile / Row for Desktop */}
                    <Flex 
                         gap="md" 
                         direction={{ base: "column", sm: "row" }} 
                         align={{ base: "flex-start", sm: "center" }}
                         wrap="wrap"
                         justify={{ base: "flex-start", md: "flex-end" }}
                         mt={{ base: "xs", md: 0 }}
                         style={{ borderTop: "0px" }} // Placeholder style override
                    >
                         {/* Wrapper for Time Stats */}
                         <Flex gap="xl" align="flex-start" w={{ base: "100%", sm: "auto" }} justify={{ base: "space-between", sm: "flex-start" }}>
                            <Box ta={{ base: "left", sm: "right" }}>
                              <Text size="xs" c="dimmed" fw={600} tt="uppercase" ta="left">
                                Mulai
                              </Text>
                              <Text size="sm" fw={500}>
                                {p.start_time
                            ? dayjs(p.start_time).format("D MMM YYYY, HH:mm:ss")
                                  : "-"}
                              </Text>
                            </Box>
                            
                            <Box ta={{ base: "left", sm: "right" }}>
                              <Text size="xs" c="dimmed" fw={600} tt="uppercase" ta="left">
                                Selesai
                              </Text>
                              <Text size="sm" fw={500}>
                                {p.finished_at
                            ? dayjs(p.finished_at).format("D MMM YYYY, HH:mm:ss")
                                  : (p.status === 'finished' && p.start_time && examInfo?.duration) 
                                      ? dayjs(p.start_time).add(examInfo.duration, 'minute').format("HH:mm")
                                      : "-"}
                              </Text>
                            </Box>

                            <Box ta={{ base: "left", sm: "right" }}>
                               <Text size="xs" c="dimmed" fw={600} tt="uppercase" ta="left">Durasi</Text>
                               <DurationTimer 
                                  startTime={p.start_time}                             status={p.status} 
                                   finishedAt={p.finished_at} 
                                   limitMinutes={examInfo?.duration}
                                />
                            </Box>
                         </Flex>

                        {/* Wrapper for Score and Actions */}
                        <Group w={{ base: "100%", sm: "auto" }} justify="space-between" mt={{ base: "xs", sm: 0 }}>
                            <Box ta={{ base: "left", sm: "right" }} style={{ flexGrow: 1, textAlign: "right" }}>
                                <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                                  Skor
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
                            
                            {/* ACTION MENU */}
                            <Menu shadow="md" width={200} position="bottom-end">
                              <Menu.Target>
                                <ActionIcon variant="subtle" color="gray" size="lg">
                                  <IconDotsVertical size={20} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Label>Aksi Peserta</Menu.Label>
                                <Menu.Item 
                                  leftSection={<IconRefresh size={14} />}
                                  onClick={() => handleRetake(p.id, p.name)}
                                >
                                  Reset / Ujian Ulang
                                </Menu.Item>
                                
                                <Menu.Divider />
                                <Menu.Item
                                  leftSection={<IconTrash size={14} />}
                                  color="red"
                                  onClick={() => handleDelete(p.id, p.name)}
                                >
                                  Hapus Data
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                        </Group>
                    </Flex>
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

      {/* MODAL EDIT
      <Modal opened={openedEdit} onClose={closeEdit} title="Edit Data Peserta">
        <Stack>
          <Select
            label="Status"
            data={['started', 'finished']}
            value={editForm.status}
            onChange={(val) => setEditForm({ ...editForm, status: val || 'started' })}
          />
          <TextInput
            label="Catatan Admin"
            placeholder="Alasan perubahan..."
            value={editForm.admin_notes}
            onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
          />
          <Button onClick={saveEdit}>Simpan Perubahan</Button>
        </Stack>
      </Modal> */}
    </Stack>
  );
}
