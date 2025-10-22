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
} from "@mantine/core";
import { io, Socket } from "socket.io-client";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";

interface ParticipantScore {
  id: number;
  name: string;
  score: number | null;
  status: "started" | "finished" | "pending"; // Tambah status
}

export default function MonitoringPage() {
  const params = useParams();
  const examId = params.examId as string;
  const [participants, setParticipants] = useState<ParticipantScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const socketRef = useRef<Socket | null>(null);

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
          status: p.status, // Ambil status dari backend
        }));
        setParticipants(initialScores);
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
        setParticipants((currentParticipants) => {
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

      setParticipants((currentParticipants) => {
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

        // Perbarui state untuk mengubah status peserta yang bersangkutan
        setParticipants(
          (currentParticipants) =>
            currentParticipants.map((p) =>
              p.id === data.participantId ? { ...p, status: data.newStatus } : p
            )
          // Tidak perlu sort ulang karena status tidak mempengaruhi urutan
        );
      }
    );

    socket.on("disconnect", () => console.log("Terputus dari server."));

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [examId]);

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
              {participants.map((p) => (
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
        {participants.length === 0 && (
          <Text mt="md" ta="center">
            Belum ada peserta yang bergabung.
          </Text>
        )}
      </Paper>
    </>
  );
}
