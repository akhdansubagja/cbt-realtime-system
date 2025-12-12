'use client';

import {
  Paper,
  Text,
  Title,
  useMantineTheme,
  useMantineColorScheme,
} from '@mantine/core';
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

export interface ChartData {
  name: string; // Nama Ujian
  Nilai: number; // Skor
}

interface ExamineeHistoryChartProps {
  data: ChartData[];
}

export function ExamineeHistoryChart({
  data,
}: ExamineeHistoryChartProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  if (data.length === 0) {
    return (
        <Paper shadow="sm" p="lg" radius="md" withBorder>
            <Text c="dimmed" fs="italic" ta="center">
                Peserta ini belum memiliki riwayat ujian yang selesai untuk ditampilkan dalam grafik.
            </Text>
        </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder>
      <Title order={4} mb="lg">
        Statistik Performa Ujian
      </Title>
      
      <ResponsiveContainer width="100%" height={350}>
        <BarChart 
          data={data} 
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? theme.colors.dark[4] : theme.colors.gray[2]} />
          <XAxis 
            dataKey="name" 
            tick={{ fill: isDark ? theme.colors.gray[3] : theme.colors.gray[7], fontSize: 12 }}
            axisLine={{ stroke: isDark ? theme.colors.dark[4] : theme.colors.gray[4] }}
            tickLine={false}
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fill: isDark ? theme.colors.gray[3] : theme.colors.gray[7], fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            cursor={{ fill: isDark ? theme.colors.dark[6] : theme.colors.gray[0] }}
            contentStyle={{ 
                backgroundColor: isDark ? theme.colors.dark[7] : '#fff',
                borderColor: isDark ? theme.colors.dark[4] : theme.colors.gray[3],
                borderRadius: '8px',
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar
            name="Nilai Akhir"
            dataKey="Nilai"
            fill={theme.colors[theme.primaryColor][6]}
            radius={[6, 6, 0, 0]}
            // Removed fixed barSize to allow it to expand with gap
          />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
