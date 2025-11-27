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
  ActionIcon,
  useMantineColorScheme,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { toPng } from "html-to-image";
import { useRouter } from "next/navigation"; // <-- Import useRouter

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
  LabelList, // <-- Tambahkan LabelList
} from "recharts";

import {
  IconTrophy,
  IconMedal,
  IconAward,
  IconDownload,
} from "@tabler/icons-react";

// Impor tipe-tipe data kita (tidak berubah)
import { BatchAverageReport } from "@/types/batchAverageReport";
import { BatchParticipantReportData } from "@/types/batchParticipantReport";
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
  batchName: string;
}

type ChartView = "avg_exam" | "avg_participant" | "specific_exam";

type ChartData = {
  name: string;
  [key: string]: any;
  avatar_url?: string | null;
};

export function InteractiveBatchChart({
  batchId,
  batchName,
}: InteractiveBatchChartProps) {
  const router = useRouter(); // <-- Initialize router
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [uniqueExams, setUniqueExams] = useState<
    { value: string; label: string }[]
  >([]);
  const [view, setView] = useState<ChartView>("avg_exam");
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const VIEW_TITLES: Record<ChartView, string> = {
    avg_exam: "Rata-rata per Ujian",
    avg_participant: "Rata-rata per Peserta",
    specific_exam: "Performa Ujian Spesifik",
  };

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
  useEffect(() => {
    if (view === "specific_exam" && !selectedExamId) {
      setLoading(false);
      setChartData([]);
      return;
    }


    const convertImagesToBase64 = async (data: ChartData[]) => {
      const promises = data.map(async (item) => {
        if (item.avatar_url) {
          try {
            const imageUrl = `http://localhost:3000/${item.avatar_url}`;
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            return new Promise<ChartData>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                resolve({ ...item, avatar_url: reader.result as string });
              };
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            console.error("Failed to load image", e);
            return item;
          }
        }
        return item;
      });
      return Promise.all(promises);
    };

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
              examId: item.examId,
            }));
            setChartData(data);
            break;
          case "avg_participant":
            response = await api.get<BatchParticipantReportData>(
              `/reports/batch-participants/${batchId}`
            );

            data = response.data.participantScores.map((item) => ({
              name: item.examinee.name,
              "Nilai Rata-rata": item.averageScore,
              avatar_url: item.examinee.avatar,
            }));

            data.sort((a, b) => b["Nilai Rata-rata"] - a["Nilai Rata-rata"]);
            // Convert avatars to Base64 for download compatibility
            data = await convertImagesToBase64(data);
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
            // Convert avatars to Base64 for download compatibility
            data = await convertImagesToBase64(data);
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

  const handleDownload = async () => {
    // 1. Pastikan ref terpasang
    if (!chartContainerRef.current) return;

    setIsDownloading(true);
    try {
      // 2. Ubah elemen HTML menjadi Data URL (PNG)
      // 2. Ubah elemen HTML menjadi Data URL (PNG)
      const dataUrl = await toPng(chartContainerRef.current, {
        // Beri warna latar belakang agar tidak transparan
        backgroundColor: colorScheme === "dark" ? "#1A1B1E" : "#FFFFFF",
        // Menambahkan cacheBust untuk mengatasi masalah cross-origin/tainting
        cacheBust: true,
      });

      // 3. Buat link dan picu download
      const link = document.createElement("a");
      const viewName = view.replace("_", "-");
      link.download = `grafik-batch-${viewName}-${
        new Date().toISOString().split("T")[0]
      }.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal mengunduh gambar:", err);
      setError("Gagal mengunduh gambar.");
    } finally {
      setIsDownloading(false);
    }
  };

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
      <Group justify="space-between" mb="md">
        <Title order={4}>Grafik Interaktif Batch</Title>
        <ActionIcon
          variant="outline"
          onClick={handleDownload}
          loading={isDownloading}
          title="Unduh sebagai PNG"
        >
          <IconDownload size={16} />
        </ActionIcon>
      </Group>

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
      <Box
        ref={chartContainerRef}
        style={{
          background:
            colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
          padding: theme.spacing.xl, // <-- 1. TAMBAHKAN PADDING DI SINI
        }}
      >
        {/* 2. TAMBAHKAN JUDUL DINAMIS DI SINI */}
        <Stack gap={0} align="center" mb="lg">
          <Title order={5}>{batchName}</Title>
          <Text size="sm" c="dimmed">
            {VIEW_TITLES[view]}
          </Text>
        </Stack>
        {/* Tampilkan Loader/Error/Empty State - TIDAK BERUBAH */}
        {loading && <Loader />}
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error!"
            color="red"
          >
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
              // --- TAMPILAN 1: GRAFIK RECHARTS (HORIZONTAL BAR - UNTUK PESERTA) ---
              <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 35)}>
                <BarChart
                  layout="vertical"
                  data={chartData}
                  margin={{ top: 5, right: 100, left: 40, bottom: 5 }}
                >
                  <defs>
                    <clipPath id={`circleClip-${batchId}`} clipPathUnits="objectBoundingBox">
                      <circle cx="0.5" cy="0.5" r="0.5" />
                    </clipPath>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={180}
                    tick={({ x, y, payload }) => {
                      const index = chartData.findIndex((d) => d.name === payload.value);
                      const rank = index + 1;
                      const isTop3 = rank <= 3;
                      
                      let rankColor = "#dimmed";
                      if (rank === 1) rankColor = "gold";
                      if (rank === 2) rankColor = "silver";
                      if (rank === 3) rankColor = "#CD7F32";

                      const data = chartData.find((d) => d.name === payload.value);
                      const avatarUrl = data?.avatar_url;
                      const avatarSrc = avatarUrl?.startsWith("data:")
                        ? avatarUrl
                        : avatarUrl
                        ? `http://localhost:3000/${avatarUrl}`
                        : null;

                      return (
                        <g transform={`translate(${x},${y})`}>
                          {isTop3 ? (
                             <g transform="translate(-170, -10)">
                               <circle cx="10" cy="10" r="10" fill={rankColor} />
                               <text x="10" y="14" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">{rank}</text>
                             </g>
                          ) : (
                            <text x={-160} y={4} textAnchor="middle" fill="gray" fontSize="12" fontWeight="bold">
                              {rank}.
                            </text>
                          )}
                          <text
                            x={-140}
                            y={4}
                            textAnchor="start"
                            fill={colorScheme === "dark" ? "#fff" : "#000"}
                            fontSize={12}
                            fontWeight={500}
                          >
                            {payload.value.length > 20
                              ? `${payload.value.substring(0, 20)}...`
                              : payload.value}
                          </text>
                        </g>
                      );
                    }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "transparent" }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <Paper p="xs" shadow="xs" withBorder>
                            <Text fw={500}>{label}</Text>
                            <Text size="sm">
                              {payload[0].name}: {payload[0].value}
                            </Text>
                          </Paper>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey={dataKey}
                    barSize={20}
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={false}
                    onClick={(data: any) => {
                      if (data.examId) {
                        router.push(
                          `/admin/monitoring/${data.examId}?batch=${encodeURIComponent(
                            batchName
                          )}`
                        );
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        style={{ cursor: "pointer" }}
                      />
                    ))}
                    <LabelList
                      dataKey={dataKey}
                      position="right"
                      content={(props: any) => {
                        const { x, y, width, value, index } = props;
                        const dataItem = chartData[index];
                        const avatarUrl = dataItem?.avatar_url;
                        const avatarSrc = avatarUrl?.startsWith("data:")
                          ? avatarUrl
                          : avatarUrl
                          ? `http://localhost:3000/${avatarUrl}`
                          : null;
                        
                        const startX = x + width + 10;
                        const centerY = y + 10;

                        return (
                          <g>
                            {avatarSrc ? (
                              <image
                                x={startX}
                                y={y - 9}
                                href={avatarSrc}
                                height="32"
                                width="32"
                                clipPath={`url(#circleClip-${batchId})`}
                                preserveAspectRatio="xMidYMid slice"
                              />
                            ) : (
                              <circle cx={startX + 16} cy={centerY} r={16} fill="#ccc" />
                            )}
                            <text
                              x={startX + 40}
                              y={centerY + 4}
                              fill={colorScheme === "dark" ? "#fff" : "#000"}
                              fontSize={12}
                              fontWeight="bold"
                              textAnchor="start"
                            >
                              {value}
                            </text>
                          </g>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              // --- TAMPILAN 2: GRAFIK RECHARTS (VERTIKAL COLUMN - UNTUK UJIAN) ---
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <Paper p="xs" shadow="xs" withBorder>
                            <Text fw={500}>{label}</Text>
                            <Text size="sm">
                              {payload[0].name}: {payload[0].value}
                            </Text>
                            <Text size="xs" c="dimmed" mt={4}>
                              Klik untuk monitor ujian
                            </Text>
                          </Paper>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey={dataKey}
                    isAnimationActive={false}
                    onClick={(data: any) => {
                      if (data.examId) {
                        router.push(
                          `/admin/monitoring/${data.examId}?batch=${encodeURIComponent(
                            batchName
                          )}`
                        );
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        style={{ cursor: "pointer" }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ))
          }
      </Box>
    </Paper>
  );
}

