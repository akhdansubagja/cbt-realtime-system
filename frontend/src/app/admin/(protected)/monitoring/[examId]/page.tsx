// src/app/admin/(protected)/monitoring/[examId]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
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
} from "@mantine/core";
import { io, Socket } from "socket.io-client";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import { DatePickerInput } from "@mantine/dates";
import * as XLSX from "xlsx";
import dayjs from "dayjs";

interface ParticipantScore {
  id: number;
  name: string;
  score: number | null;
  status: "started" | "finished" | "pending";
  start_time?: string; // <-- TAMBAHKAN BARIS INI
}

export default function MonitoringPage() {
  const params = useParams();
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
  const [quickFilter, setQuickFilter] = useState<string | null>(null);

  // 1. Ambil data awal peserta
  useEffect(() => {
    if (!examId) return;
    api
      .get(`/exams/${examId}/participants`)
      .then((response) => {
        const initialScores = response.data.map((p: any) => ({
          id: p.id,
          name: p.examinee.name,
          score: p.current_score,
          status: p.status,
          start_time: p.start_time, // <-- TAMBAHKAN BARIS INI
        }));
        setAllParticipants(initialScores);
      })
      .catch(() => setError("Gagal mengambil data peserta."))
      .finally(() => setLoading(false));
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
      // --- PERBAIKAN #3: Pastikan 'status' ada untuk peserta baru ---
      const newParticipant: ParticipantScore = {
        id: newParticipantData.id,
        name: newParticipantData.name,
        score: newParticipantData.score ?? null,
        status: "started", // Asumsikan baru bergabung = started
      };

      setAllParticipants((currentParticipants) => {
        if (currentParticipants.some((p) => p.id === newParticipant.id)) {
          return currentParticipants;
        }
        const newList = [...currentParticipants, newParticipant];
        newList.sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity));
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

  // Efek ini berjalan setiap kali data master atau filter tanggal berubah
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

    // Urutkan ulang hasil filter (ini juga menangani pengurutan awal!)
    filtered.sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity));

    // Simpan hasil filter ke state yang akan ditampilkan
    setFilteredParticipants(filtered);
  }, [allParticipants, dateRange]);

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
      { wch: 10 }, // Skor
      { wch: 15 }, // Status
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Peserta");

    // --- 5. MENULIS FILE DENGAN NAMA BARU ---
    XLSX.writeFile(workbook, filename); // Gunakan nama file dinamis
  };

  if (loading)
    return (
      <Center>
        <Loader />
      </Center>
    );
  if (error)
    return (
      <Alert color="red" title="Error">
        {error}
      </Alert>
    );

  const rows = participants.map((p) => (
    <Table.Tr key={p.id}>
      <Table.Td>{p.id}</Table.Td>
      <Table.Td>{p.name}</Table.Td>
      <Table.Td fw={700}>{p.score ?? "Belum ada"}</Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Title order={2}>Monitoring Ujian Real-Time</Title>
      <Text c="dimmed">
        Skor akan diperbarui dan diurutkan secara otomatis.
      </Text>

      {/* --- UI BARU UNTUK FILTER DAN EKSPOR --- */}
      <Paper withBorder p="md" mt="md">
        <Group>
          <DatePickerInput
            type="range"
            label="Filter Berdasarkan Tanggal Mulai"
            placeholder="Pilih rentang tanggal"
            value={dateRange}
            onChange={(value) => {
              // 'value' di sini adalah array berisi [string | null, string | null]
              const [start, end] = value;
              // Ubah string menjadi objek Date sebelum disimpan ke state
              setDateRange([
                start ? new Date(start) : null,
                end ? new Date(end) : null,
              ]);
            }}
            clearable
          />
          <Button
            onClick={handleExport}
            disabled={filteredParticipants.length === 0}
            style={{ alignSelf: "flex-end" }}
          >
            Ekspor ke Excel
          </Button>
        </Group>
      </Paper>

      <Paper withBorder p="md" mt="md">
        <Table withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID Peserta</Table.Th>
              <Table.Th>Nama</Table.Th>
              <Table.Th>Skor</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          {/* Gunakan motion.tbody untuk mengaktifkan layout animation */}
          <motion.tbody layout>
            <AnimatePresence>
              {filteredParticipants.map((p) => (
                <motion.tr
                  key={p.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Table.Td>{p.id}</Table.Td>
                  <Table.Td>{p.name}</Table.Td>
                  <Table.Td fw={700}>{p.score ?? "-"}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={p.status === "finished" ? "gray" : "green"}
                      variant="light"
                    >
                      {p.status === "finished" ? "Selesai" : "Mengerjakan"}
                    </Badge>
                  </Table.Td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </motion.tbody>
        </Table>
        {filteredParticipants.length === 0 && (
          <Text mt="md" ta="center">
            Belum ada peserta yang sesuai dengan filter.
          </Text>
        )}
      </Paper>
    </>
  );
}
