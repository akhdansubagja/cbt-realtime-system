"use client";

import api from "@/lib/axios";
import {
  Alert,
  Loader,
  Paper,
  Text,
  Title,
  useMantineTheme,
  SegmentedControl,
  Collapse,
  Select,
  Avatar,
  Group,
  Box, // <-- Tambahkan Box
  Grid, // <-- Tambahkan Grid
  Tooltip,
  Stack, // <-- Tambahkan Tooltip
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useState, useMemo } from "react";

// Hapus semua impor 'recharts' KECUALI untuk yang vertikal
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip, // Beri nama alias
  XAxis,
  YAxis,
  Cell,
} from "recharts";

import { IconTrophy, IconMedal, IconAward } from "@tabler/icons-react";

// Impor tipe-tipe data kita (tidak berubah)
import { BatchAverageReport } from "@/types/batchAverageReport";
import { BatchParticipantReport } from "@/types/batchParticipantReport";
import { UniqueExam } from "@/types/uniqueExam";
import { ExamPerformance } from "@/types/examPerformance";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#E34234",
  "#FF69B4",
];

interface InteractiveBatchChartProps {
  batchId: number;
}

type ChartView = "avg_exam" | "avg_participant" | "specific_exam";

type ChartData = {
  name: string;
  [key: string]: any;
  avatar_url?: string | null;
};

export function InteractiveBatchChart({ batchId }: InteractiveBatchChartProps) {
  const theme = useMantineTheme();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [uniqueExams, setUniqueExams] = useState<
    { value: string; label: string }[]
  >([]);
  const [view, setView] = useState<ChartView>("avg_exam");
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Ambil daftar ujian unik (dropdown) - TIDAK BERUBAH
  useEffect(() => {
    if (!batchId) return;
    api
      .get<UniqueExam[]>(`/reports/batch-unique-exams/${batchId}`)
      .then((res) => {
        const options = res.data.map((exam) => ({
          value: String(exam.id),
          label: exam.title,
        }));
        setUniqueExams(options);
      })
      .catch(() => console.error("Gagal memuat daftar ujian."));
  }, [batchId]);

  // 2. Ambil data grafik - TIDAK BERUBAH
  useEffect(() => {
    if (view === "specific_exam" && !selectedExamId) {
      setLoading(false);
      setChartData([]);
      return;
    }
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);
      try {
        let response;
        let data: ChartData[];
        switch (view) {
          case "avg_exam":
            response = await api.get<BatchAverageReport[]>(
              `/reports/batch-averages/${batchId}`
            );
            data = response.data.map((item) => ({
              name: item.examTitle,
              "Nilai Rata-rata": parseFloat(item.averageScore),
            }));
            setChartData(data);
            break;
          case "avg_participant":
            response = await api.get<BatchParticipantReport[]>(
              `/reports/batch-participants/${batchId}`
            );
            data = response.data.map((item) => ({
              name: item.examinee_name,
              "Nilai Rata-rata": parseFloat(
                (
                  parseFloat(item.totalScore) /
                  (parseFloat(item.examCount) || 1)
                ).toFixed(2)
              ),
              avatar_url: item.examinee_avatar_url,
            }));
            setChartData(data);
            data.sort((a, b) => b["Nilai Rata-rata"] - a["Nilai Rata-rata"]);
            setChartData(data);

            break;
          case "specific_exam":
            response = await api.get<ExamPerformance[]>(
              `/reports/batch-exam-performance/${batchId}/${selectedExamId}`
            );
            data = response.data.map((item) => ({
              name: item.name,
              Skor: parseFloat(item.score),
              avatar_url: item.avatar_url,
            }));
            data.sort((a, b) => b.Skor - a.Skor);
            setChartData(data);
            break;
        }
      } catch (err) {
        setError("Gagal mengambil data grafik.");
      } finally {
        setLoading(false);
      }
    };
    fetchChartData();
  }, [batchId, view, selectedExamId]);

  // Tentukan 'dataKey' - TIDAK BERUBAH
  const dataKey = useMemo(() => {
    if (view === "avg_exam") return "Nilai Rata-rata";
    if (view === "avg_participant") return "Nilai Rata-rata";
    if (view === "specific_exam") return "Skor";
    return "";
  }, [view]);

  // Tentukan 'layout' berdasarkan 'view' - TIDAK BERUBAH
  const isHorizontal = view === "avg_participant" || view === "specific_exam";

  return (
    <Paper shadow="sm" p="lg" withBorder>
      <Title order={4} mb="md">
        Grafik Interaktif Batch
      </Title>

      {/* Kontrol UI (Tabs dan Dropdown) - TIDAK BERUBAH */}
      <SegmentedControl
        fullWidth
        value={view}
        onChange={(value) => setView(value as ChartView)}
        data={[
          { label: "Rata-rata per Ujian", value: "avg_exam" },
          { label: "Rata-rata per Peserta", value: "avg_participant" },
          { label: "Per Ujian Spesifik", value: "specific_exam" },
        ]}
        mb="md"
      />
      <Collapse in={view === "specific_exam"}>
        <Select
          label="Pilih Ujian"
          placeholder="Pilih satu ujian untuk dilihat..."
          data={uniqueExams}
          value={selectedExamId}
          onChange={setSelectedExamId}
          mb="md"
          searchable
        />
      </Collapse>

      {/* Tampilkan Loader/Error/Empty State - TIDAK BERUBAH */}
      {loading && <Loader />}
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Error!" color="red">
          {error}
        </Alert>
      )}
      {!loading && !error && chartData.length === 0 && (
        <Text c="dimmed" ta="center" py="md">
          {/* ... (logika empty state) ... */}
        </Text>
      )}

      {/* --- INI ADALAH LOGIKA RENDER BARU --- */}
      {!loading &&
        !error &&
        chartData.length > 0 &&
        (isHorizontal ? (
          // --- TAMPILAN 1: GRAFIK MANUAL (HORIZONTAL) ---
          <Stack gap="sm" mt="md">
            {chartData.map((item, index) => {
              const score = item[dataKey];
              const barWidthPercent = (score / 110) * 100;
              const avatarSrc = item.avatar_url
                ? `http://localhost:3000/${item.avatar_url}`
                : null;
              const barColor = COLORS[index % COLORS.length]; // Warna dinamis per bar

              return (
                <Grid key={item.name} align="center">
                  <Grid.Col span={2}>
                    <Group gap="xs" wrap="nowrap" justify="flex-start">
                      {/* Penomoran dengan ikon untuk juara 1-3, angka untuk sisanya */}
                      {index === 0 ? (
                        <IconTrophy size={16} color="gold" />
                      ) : index === 1 ? (
                        <IconMedal size={16} color="silver" />
                      ) : index === 2 ? (
                        <IconAward size={16} color="#CD7F32" />
                      ) : (
                        <Text size="sm" fw={500} c="dimmed">
                          {index + 1}.
                        </Text>
                      )}
                      <Text ta="left" size="sm" fw={500} truncate>
                        {item.name}
                      </Text>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={10}>
                    <Tooltip
                      label={`${item.name}: ${score}`}
                      position="top"
                      withArrow
                    >
                      <Group gap={8} wrap="nowrap">
                        <Box
                          bg={barColor} // Gunakan warna dinamis
                          h={24}
                          w={`${barWidthPercent}%`}
                          style={{
                            borderRadius: theme.radius.sm,
                            minWidth: "4px",
                          }}
                        />
                        <Avatar src={avatarSrc} radius="xl" size="sm">
                          {item.name.charAt(0)}
                        </Avatar>
                        <Text c="dimmed" fw={700} size="sm">
                          {score}
                        </Text>
                      </Group>
                    </Tooltip>
                  </Grid.Col>
                </Grid>
              );
            })}
          </Stack>
        ) : (
          // --- TAMPILAN 2: GRAFIK RECHARTS (VERTIKAL) ---
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey={dataKey}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ))}
    </Paper>
  );
}
