// frontend/src/app/admin/(protected)/examinees/[id]/page.tsx
'use client';

import {
  Title,
  Paper,
  Text,
  Loader,
  Alert,
  Breadcrumbs,
  Anchor,
  Stack,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Examinee } from '@/types/examinee';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ExamineeHistoryChart } from '@/components/charts/ExamineeHistoryChart';


export default function ExamineeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const examineeId = parseInt(id, 10); // ID sebagai number

  const [examinee, setExaminee] = useState<Examinee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examineeId) return;

    const fetchExamineeDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        // Endpoint ini mengambil detail 1 peserta
        const response = await api.get(`/examinees/${examineeId}`);
        setExaminee(response.data);
      } catch (err) {
        setError('Gagal mengambil detail peserta.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExamineeDetail();
  }, [examineeId]);

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

  // Menampilkan jika peserta tidak ditemukan
  if (!examinee) {
    return <Text>Data peserta tidak ditemukan.</Text>;
  }

  return (
    <Stack>
      <Breadcrumbs mb="md">
        {/* Link kembali ke Batch (jika ada) atau ke daftar Peserta */}
        {examinee.batch_id ? (
          <Anchor component={Link} href={`/admin/batches/${examinee.batch_id}`}>
            Detail Batch
          </Anchor>
        ) : (
          <Anchor component={Link} href="/admin/examinees">
            Manajemen Peserta
          </Anchor>
        )}
        <Text>{examinee.name}</Text>
      </Breadcrumbs>

      <Title order={2} mb="md">
        Detail Peserta: {examinee.name}
      </Title>

      {/* V V V Tampilkan Komponen Grafik V V V */}
      {/* Kita hanya perlu meneruskan examineeId. 
          Komponen akan menangani logikanya sendiri.
      */}
      <ExamineeHistoryChart examineeId={examineeId} />
      {/* ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ */}

      {/* Anda bisa menambahkan info lain tentang peserta di sini 
          di dalam <Paper> lain jika mau */}
    </Stack>
  );
}