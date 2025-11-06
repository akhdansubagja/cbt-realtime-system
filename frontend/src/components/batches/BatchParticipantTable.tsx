// frontend/src/components/batches/BatchParticipantTable.tsx
'use client';

import api from '@/lib/axios';
import { BatchParticipantReport } from '@/types/batchParticipantReport';
import {
  Alert,
  Button,
  Loader,
  Paper,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconUserSearch } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface BatchParticipantTableProps {
  batchId: number;
}

export function BatchParticipantTable({ batchId }: BatchParticipantTableProps) {
  const [data, setData] = useState<BatchParticipantReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        // Panggil endpoint A yang kita tes di Postman
        const response = await api.get(
          `/reports/batch-participants/${batchId}`
        );
        setData(response.data);
      } catch (err) {
        setError('Gagal mengambil data laporan peserta.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [batchId]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Error!"
        color="red"
      >
        {error}
      </Alert>
    );
  }

  if (data.length === 0) {
    return <Text>Belum ada peserta di batch ini yang menyelesaikan ujian.</Text>;
  }

  // Tampilkan tabel canggih Anda
  const rows = data.map((row) => (
    <Table.Tr key={row.examinee_id}>
      <Table.Td>{row.examinee_name}</Table.Td>
      <Table.Td align="center">{row.examCount}</Table.Td>
      <Table.Td align="center">{row.totalScore}</Table.Td>
      <Table.Td>
        <Button
          component={Link}
          href={`/admin/examinees/${row.examinee_id}`}
          leftSection={<IconUserSearch size={14} />}
          variant="outline"
          size="xs"
        >
          Lihat Riwayat
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper shadow="sm" p="lg" withBorder>
      <Title order={4} mb="md">
        Peringkat Peserta (Berdasarkan Total Skor)
      </Title>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nama Peserta</Table.Th>
            <Table.Th>Jumlah Ujian Selesai</Table.Th>
            <Table.Th>Total Skor</Table.Th>
            <Table.Th>Aksi</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  );
}