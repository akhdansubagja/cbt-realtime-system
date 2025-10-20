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
} from "@mantine/core";
import { io, Socket } from "socket.io-client";
import api from "@/lib/axios";

interface ParticipantScore {
  id: number;
  name: string;
  score: number | null;
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
          score: p.current_score, // Skor awal (jika ada)
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
        setParticipants((currentParticipants) =>
          currentParticipants.map((p) =>
            p.id === data.participantId ? { ...p, score: data.newScore } : p
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
      <Text c="dimmed">Skor akan diperbarui secara otomatis.</Text>

      <Paper withBorder p="md" mt="md">
        <Table withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID Peserta</Table.Th>
              <Table.Th>Nama</Table.Th>
              <Table.Th>Skor Sementara</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Paper>
    </>
  );
}
