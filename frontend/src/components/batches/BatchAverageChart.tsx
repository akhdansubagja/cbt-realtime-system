// frontend/src/components/batches/BatchAverageChart.tsx
'use client';

import api from '@/lib/axios';
import { BatchAverageReport } from '@/types/batchAverageReport';
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

interface BatchAverageChartProps {
  batchId: number;
}

// Tipe data khusus untuk Recharts
interface ChartData {
  name: string; // Judul Ujian
  'Nilai Rata-rata': number; // Skor rata-rata
}

export function BatchAverageChart({ batchId }: BatchAverageChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useMantineTheme();

  useEffect(() => {
    if (!batchId) return;

    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Panggil endpoint B yang kita tes di Postman
        const response = await api.get<BatchAverageReport[]>(
          `/reports/batch-averages/${batchId}`
        );

        // Ubah data API menjadi data yang bisa dibaca Recharts
        const formattedData = response.data.map((item) => ({
          name: item.examTitle,
          'Nilai Rata-rata': parseFloat(item.averageScore), // Ubah string "85.50" jadi number 85.5
        }));

        setData(formattedData);
      } catch (err) {
        setError('Gagal mengambil data grafik rata-rata batch.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
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
    return (
      <Text c="dimmed" ta="center" py="md">
        Belum ada data ujian yang selesai untuk ditampilkan di grafik.
      </Text>
    );
  }

  // Tampilkan Grafiknya
  return (
    <Paper shadow="sm" p="lg" withBorder>
      <Title order={4} mb="md">
        Grafik Rata-rata Nilai Batch per Ujian
      </Title>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="Nilai Rata-rata"
            fill={theme.colors[theme.primaryColor][6]}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}