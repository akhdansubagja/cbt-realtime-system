// frontend/src/app/admin/(protected)/batches/page.tsx
'use client';

import {
  Title,
  Paper,
  Table,
  Group,
  Button,
  Loader,
  Alert,
  Text,
} from '@mantine/core';
import { IconAlertCircle, IconEye } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Batch } from '@/types/batch';
import Link from 'next/link';

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        setError(null);
        // Endpoint yang kita tes di Postman
        const response = await api.get('/batches'); 
        setBatches(response.data);
      } catch (err) {
        setError('Gagal mengambil data batch. Coba lagi nanti.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  // Menampilkan state loading
  if (loading) {
    return <Loader />;
  }

  // Menampilkan state error
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

  // Menampilkan data dalam tabel
  const rows = batches.map((batch) => (
    <Table.Tr key={batch.id}>
      <Table.Td>{batch.id}</Table.Td>
      <Table.Td>{batch.name}</Table.Td>
      <Table.Td>
        {/* Tombol detail akan diarahkan ke halaman yang akan kita buat nanti */}
        <Button
          component={Link}
          href={`/admin/batches/${batch.id}`}
          leftSection={<IconEye size={14} />}
          variant="outline"
          size="xs"
        >
          Lihat Detail
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Title order={2} mb="md">
        Manajemen Batch
      </Title>

      <Paper shadow="sm" p="lg">
        {batches.length === 0 ? (
          <Text>Belum ada data batch.</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Nama Batch</Table.Th>
                <Table.Th>Aksi</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        )}
      </Paper>
    </>
  );
}