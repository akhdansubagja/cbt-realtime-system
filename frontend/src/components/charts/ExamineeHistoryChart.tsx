// frontend/src/components/charts/ExamineeHistoryChart.tsx
'use client';

import api from '@/lib/axios';
import { ParticipantHistory } from '@/types/participantHistory';
import {
  Alert,
  Loader,
  Paper,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ExamineeHistoryChartProps {
  examineeId: number; // Kita akan terima ID peserta sebagai prop
}

// Tipe data khusus untuk grafik
interface ChartData {
  name: string; // Nama Ujian
  Nilai: number; // Skor
}

export function ExamineeHistoryChart({
  examineeId,
}: ExamineeHistoryChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useMantineTheme(); // Untuk warna grafik

  useEffect(() => {
    if (!examineeId) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        // Endpoint yang kita tes di Postman
        const response = await api.get<ParticipantHistory[]>(
          `/participants/by-examinee/${examineeId}`
        );

        // Ubah data API menjadi data yang bisa dibaca Recharts
        const formattedData = response.data
          .filter((item) => item.status === 'finished' && item.final_score !== null)
          .map((item) => ({
            name: item.exam.title, // 'Informatika', 'Matematika'
            Nilai: item.final_score as number, // 80, 90
          }))
          .reverse(); // Balik urutannya agar ujian terlama di kiri

        setData(formattedData);
      } catch (err) {
        setError('Gagal mengambil riwayat ujian.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [examineeId]);

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
    return <Text>Peserta ini belum memiliki riwayat ujian yang selesai.</Text>;
  }

  // Tampilkan Grafiknya
  return (
    <Paper shadow="sm" p="lg" withBorder>
      <Title order={4} mb="md">
        Grafik Riwayat Nilai
      </Title>
      {/* ResponsiveContainer penting agar grafik bisa menyesuaikan 
        ukuran layar/kontainer.
      */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="Nilai"
            fill={theme.colors[theme.primaryColor][6]}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}