// frontend/src/app/admin/(protected)/dashboard/page.tsx
'use client';

import { Grid, Paper, Text, Title, Group, ThemeIcon, Skeleton } from '@mantine/core';
import { IconBox, IconUsers, IconFileText } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
// PERBAIKAN: Import instance axios secara langsung
import axios from '@/lib/axios'; 

// Tipe data untuk statistik
interface StatsData {
  questionBanks: number;
  examinees: number;
  exams: number;
}

// Komponen untuk satu kartu statistik
function StatCard({ title, value, icon, loading }: { title: string; value: number; icon: React.ReactNode; loading: boolean }) {
  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between">
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          {title}
        </Text>
        <ThemeIcon color="gray" variant="light" size={38} radius="md">
          {icon}
        </ThemeIcon>
      </Group>

      {loading ? (
        <Skeleton height={30} mt={10} radius="sm" />
      ) : (
        <Text fz={30} fw={700} mt={10}>
          {value}
        </Text>
      )}
    </Paper>
  );
}

// Halaman utama Dashboard
export default function DashboardPage() {
  // PERBAIKAN: Hapus baris 'const axios = useAxios()'
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // PERBAIKAN: Langsung gunakan 'axios' yang di-import
        const [qbRes, examineeRes, examRes] = await Promise.all([
          axios.get('/question-banks'),
          axios.get('/examinees'),
          axios.get('/exams'),
        ]);

        setStats({
          questionBanks: qbRes.data.length,
          examinees: examineeRes.data.total,
          exams: examRes.data.length,
        });

      } catch (error) {
        console.error("Gagal mengambil data statistik:", error);
        setStats({ questionBanks: 0, examinees: 0, exams: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      <Title order={2} mb="xl">
        Dashboard
      </Title>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <StatCard
            title="Total Bank Soal"
            value={stats?.questionBanks ?? 0}
            icon={<IconBox size={24} />}
            loading={loading}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <StatCard
            title="Total Peserta"
            value={stats?.examinees ?? 0}
            icon={<IconUsers size={24} />}
            loading={loading}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <StatCard
            title="Total Ujian"
            value={stats?.exams ?? 0}
            icon={<IconFileText size={24} />}
            loading={loading}
          />
        </Grid.Col>
      </Grid>
    </>
  );
}