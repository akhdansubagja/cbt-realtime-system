// frontend/src/app/admin/(protected)/dashboard/page.tsx
"use client";

import {
  Grid,
  Paper,
  Text,
  Title,
  Group,
  ThemeIcon,
  Skeleton,
  SimpleGrid,
  Box,
  Stack,
  RingProgress,
  Card,
} from "@mantine/core";
import {
  IconBox,
  IconUsers,
  IconFileText,
  IconArrowUpRight,
  IconArrowDownRight,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { motion } from "framer-motion";

// Tipe data untuk statistik
interface StatsData {
  questionBanks: number;
  examinees: number;
  exams: number;
}

// Komponen untuk satu kartu statistik
function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  color,
  description,
}: {
  title: string;
  value: number;
  icon: any;
  loading: boolean;
  color: string;
  description: string;
}) {
  return (
    <Paper withBorder p="md" radius="md" shadow="sm">
      <Group justify="space-between">
        <div>
          <Text c="dimmed" tt="uppercase" fw={700} size="xs">
            {title}
          </Text>
          {loading ? (
            <Skeleton height={30} mt={10} width={100} radius="sm" />
          ) : (
            <Text fw={700} size="xl" mt={10}>
              {value}
            </Text>
          )}
          <Text c="dimmed" size="xs" mt={4}>
            {description}
          </Text>
        </div>
        <ThemeIcon
          color={color}
          variant="light"
          size={48}
          radius="md"
          style={{ transition: "transform 0.2s" }}
        >
          <Icon size={28} stroke={1.5} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [qbRes, examineeRes, examRes] = await Promise.all([
          axios.get("/question-banks"),
          axios.get("/examinees"),
          axios.get("/exams"),
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

  const statsList = [
    {
      title: "Total Bank Soal",
      value: stats?.questionBanks ?? 0,
      icon: IconBox,
      color: "blue",
      description: "Bank soal tersedia",
    },
    {
      title: "Total Peserta",
      value: stats?.examinees ?? 0,
      icon: IconUsers,
      color: "teal",
      description: "Peserta terdaftar",
    },
    {
      title: "Total Ujian",
      value: stats?.exams ?? 0,
      icon: IconFileText,
      color: "violet",
      description: "Ujian dibuat",
    },
  ];

  return (
    <Stack gap="lg">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          p="xl"
          radius="md"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--mantine-color-violet-6) 0%, var(--mantine-color-indigo-6) 100%)",
            color: "white",
          }}
        >
          <Title order={2} fw={700}>
            Dashboard Overview
          </Title>
          <Text mt="xs" c="white" style={{ opacity: 0.9 }}>
            Selamat datang kembali di panel admin CBT Realtime System.
          </Text>
        </Paper>
      </motion.div>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
        {statsList.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              loading={loading}
              color={stat.color}
              description={stat.description}
            />
          </motion.div>
        ))}
      </SimpleGrid>

      {/* Example of another section, maybe recent activity or chart placeholder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card withBorder radius="md" p="md">
              <Title order={4} mb="md">
                Aktivitas Terkini
              </Title>
              <Skeleton height={200} radius="md" />
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder radius="md" p="md">
              <Title order={4} mb="md">
                Status Server
              </Title>
              <Group justify="center">
                <RingProgress
                  size={150}
                  roundCaps
                  thickness={12}
                  sections={[{ value: 100, color: "teal" }]}
                  label={
                    <Text c="teal" fw={700} ta="center" size="xl">
                      Online
                    </Text>
                  }
                />
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      </motion.div>
    </Stack>
  );
}