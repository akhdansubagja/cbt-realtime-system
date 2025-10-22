'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Title, Table, Loader, Alert, Center, Button, Group, Text, Paper, Badge } from '@mantine/core';
import api from '@/lib/axios';

// Definisikan tipe data yang kita harapkan dari backend
interface ParticipantSession {
  id: number;
  status: 'started' | 'finished';
  final_score: number | null;
  start_time: string;
  exam: {
    title: string;
  };
}

interface ExamineeDetails {
  id: number;
  name: string;
  participants: ParticipantSession[];
}

export default function ExamineeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examineeId = params.id as string;

  const [examineeData, setExamineeData] = useState<ExamineeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!examineeId) return;
    api.get(`/examinees/${examineeId}`)
      .then(response => {
        setExamineeData(response.data);
      })
      .catch(() => setError('Gagal mengambil data detail peserta.'))
      .finally(() => setLoading(false));
  }, [examineeId]);

  if (loading) return <Center><Loader /></Center>;
  if (error) return <Alert color="red" title="Error">{error}</Alert>;
  if (!examineeData) return <Alert color="yellow">Data peserta tidak ditemukan.</Alert>;

  const rows = examineeData.participants.map((session) => (
    <Table.Tr key={session.id}>
      <Table.Td>{session.exam.title}</Table.Td>
      <Table.Td>{new Date(session.start_time).toLocaleString('id-ID')}</Table.Td>
      <Table.Td>
        <Badge color={session.status === 'finished' ? 'gray' : 'green'} variant="light">
          {session.status === 'finished' ? 'Selesai' : 'Mengerjakan'}
        </Badge>
      </Table.Td>
      <Table.Td fw={700}>{session.final_score ?? '-'}</Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Group justify="space-between">
        <Title order={2}>Profil Peserta: {examineeData.name}</Title>
        <Button variant="default" onClick={() => router.back()}>
          &larr; Kembali ke Daftar
        </Button>
      </Group>

      <Paper withBorder p="md" mt="md">
        <Title order={4} mb="md">Riwayat Ujian</Title>
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Judul Ujian</Table.Th>
              <Table.Th>Waktu Mulai</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Skor Akhir</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
        {examineeData.participants.length === 0 && (
          <Text mt="md" ta="center">Peserta ini belum pernah mengikuti ujian.</Text>
        )}
      </Paper>
    </>
  );
}