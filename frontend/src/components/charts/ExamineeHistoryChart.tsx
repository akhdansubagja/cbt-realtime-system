// frontend/src/components/charts/ExamineeHistoryChart.tsx
'use client';

import api from '@/lib/axios';
import { ParticipantHistory } from '@/types/participantHistory';
import {
  Alert,
  Paper,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { ComponentLoader } from '@/components/ui/ComponentLoader';
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
  data: ChartData[];
}

// Tipe data khusus untuk grafik
export interface ChartData {
  name: string; // Nama Ujian
  Nilai: number; // Skor
}

export function ExamineeHistoryChart({
  data,
}: ExamineeHistoryChartProps) {
  const theme = useMantineTheme(); // Untuk warna grafik

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