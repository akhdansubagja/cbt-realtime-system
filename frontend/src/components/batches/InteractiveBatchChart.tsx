
"use client";

import api from "@/lib/axios";
import {
  Alert,
  Paper,
  Text,
  Title,
  useMantineTheme,
  MantineProvider, // Needed for phantom rendering context
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
  Button,
  useMantineColorScheme,
} from "@mantine/core";
import { ComponentLoader } from "@/components/ui/ComponentLoader";
import { 
  IconAlertCircle, 
  IconDownload,
  IconTrophy,
  IconMedal,
  IconAward
} from "@tabler/icons-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { toPng } from "html-to-image";
import { useRouter } from "next/navigation";
import { createRoot } from "react-dom/client"; // New import // <-- Import useRouter

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
  /** ID Batch */
  batchId: number;
  /** Nama Batch (untuk judul grafik saat download) */
  batchName: string;
}

type ChartView = "avg_exam" | "avg_participant" | "specific_exam";

type ChartData = {
  name: string;
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  avatar_url?: string | null;
};


// --- 1. NEW COMPONENT: Visual-only version of the chart OR Scoreboard ---
const BatchChartVisual = ({
  chartData,
  view,
  batchName,
  batchId,
  theme,
  colorScheme,
  dataKey,
  isHorizontal,
  onBarClick,
  width, // New prop
  height, // New prop
}: {
  chartData: ChartData[];
  view: ChartView;
  batchName: string;
  batchId: number;
  theme: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  colorScheme: "light" | "dark";
  dataKey: string;
  isHorizontal: boolean;
  onBarClick?: (data: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  width?: number; // Optional fixed width
  height?: number; // Optional fixed height
}) => {
  const VIEW_TITLES: Record<ChartView, string> = {
    avg_exam: "Rata-rata per Ujian",
    avg_participant: "Rata-rata per Peserta",
    specific_exam: "Performa Ujian Spesifik",
  };

  const useFixedDimensions = typeof width === "number";

  // --- CUSTOM BAR CHART RENDERER (For View & Export) ---
  if (view === "avg_participant" || view === "specific_exam") {
    // Determine max value for 100% width reference (usually 100 for exams)
    const maxValue = 100; 

    return (
      <Box
        style={{
          background: colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
          padding: theme.spacing.xl,
          width: useFixedDimensions ? width : "100%", 
          minHeight: useFixedDimensions ? height : 400,
          display: "block",
          overflow: "visible",
        }}
      >
        <Stack gap="lg" align="center" mb="xl">
          <Title order={4}>{batchName}</Title>
          <Text size="sm" c="dimmed">
            {VIEW_TITLES[view]}
          </Text>
        </Stack>

        <Stack gap="xs" style={{ maxWidth: 800, margin: "0 auto", width: '100%' }}>
          {chartData.map((item, index) => {
            const rank = index + 1;
            let rankColor = colorScheme === 'dark' ? "transparent" : theme.colors.gray[1];
            let rankTextColor = colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6];
            let trophyIcon = null;

            if (rank === 1) {
              rankColor = "#FFD700"; // Gold
              rankTextColor = "#FFF";
              trophyIcon = <IconTrophy size={16} />;
            } else if (rank === 2) {
              rankColor = "#C0C0C0"; // Silver
              rankTextColor = "#FFF";
              trophyIcon = <IconMedal size={16} />;
            } else if (rank === 3) {
              rankColor = "#CD7F32"; // Bronze
              rankTextColor = "#FFF";
              trophyIcon = <IconAward size={16} />;
            }

            const avatarSrc = item.avatar_url?.startsWith("data:")
              ? item.avatar_url
              : item.avatar_url
              ? `${process.env.NEXT_PUBLIC_API_URL}/${item.avatar_url}`
              : null;

            // Determine value key safely
            // Use dataKey prop which is synced with view, or fallback to manual check
            // Important: Handle stale data case (view updated but data not yet fetched)
            const rawValue = item[dataKey] ?? (view === 'specific_exam' ? item["Skor"] : item["Nilai Rata-rata"]);
            const value = typeof rawValue === 'number' ? rawValue : 0;
            
            // Safe width calculation
            const barWidth = Math.min(Math.max((value / maxValue) * 100, 0), 100);

            // If we have 0 value and it might be due to stale data (mismatch), 
            // the render will just show 0 which is safe.

            return (
              <Group
                key={index}
                wrap="nowrap"
                align="center"
                p="sm"
                onClick={() => onBarClick && onBarClick(item)}
                style={{
                  cursor: onBarClick ? "pointer" : "default",
                  borderBottom: `1px solid ${
                    colorScheme === "dark"
                      ? theme.colors.dark[4]
                      : theme.colors.gray[2]
                  }`,
                }}
              >
                {/* 1. LABEL AREA: Rank, Avatar, Name */}
                <Group gap="sm" style={{ width: '30%', minWidth: 200 }} wrap="nowrap">
                    {/* Rank */}
                    <Box
                    w={28}
                    h={28}
                    style={{
                        borderRadius: "50%",
                        backgroundColor: rankColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 12,
                        color: rankTextColor,
                        flexShrink: 0,
                    }}
                    >
                    {trophyIcon || rank}
                    </Box>

                    {/* Avatar */}
                    {avatarSrc ? (
                        <Avatar src={avatarSrc} radius="xl" size="sm" />
                    ) : (
                        <Avatar radius="xl" size="sm" color="initials">{item.name.substring(0, 2).toUpperCase()}</Avatar>
                    )}

                    {/* Name */}
                    <Text
                    fw={500}
                    size="sm"
                    style={{ flex: 1 }}
                    lineClamp={1}
                    title={item.name}
                    >
                    {item.name}
                    </Text>
                </Group>

                {/* 2. BAR AREA: Custom CSS Bar */}
                <Box style={{ flex: 1, position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
                     {/* Background Track */}
                     <Box 
                        style={{ 
                            position: 'absolute',
                            left: 0,
                            top: 6, // center vertically (24 - 12) / 2
                            bottom: 6,
                            right: 0,
                            background: colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[1],
                            borderRadius: 6,
                        }} 
                     />
                     
                     {/* Filled Bar */}
                     <Box 
                        style={{ 
                            position: 'absolute',
                            left: 0,
                            top: 6,
                            bottom: 6,
                            width: `${barWidth}%`,
                            background: theme.colors.violet[5],
                            borderRadius: 6,
                            transition: 'width 0.5s ease-out', // Animation for screen
                        }} 
                     />
                </Box>

                {/* 3. VALUE AREA */}
                <Box style={{ width: 60, textAlign: 'right' }}>
                     <Text fw={700} size="sm" c="violet">
                         {value.toFixed(1)}
                     </Text>
                     {/* Optional: Show raw score details if available */}
                     {item.rawDetail && view === 'avg_participant' && (
                         <Text size="xs" c="dimmed" style={{ fontSize: 9 }}>
                             {item.rawDetail.split('(')[1]?.replace(')', '') || ''}
                         </Text>
                     )}
                </Box>

              </Group>
            );
          })}
        </Stack>
      </Box>
    );
  }

  // --- VERTICAL BAR CHART (Only for 'avg_exam') ---
  // We keep Recharts for this one as it's a standard vertical bar chart
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#E34234",
    "#FF69B4",
  ];

  const chartElement2 = (
    <BarChart
      width={useFixedDimensions ? width : undefined}
      height={useFixedDimensions ? height || 400 : undefined}
      data={chartData}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis domain={[0, 100]} />
      <RechartsTooltip />
      <Bar
        dataKey={dataKey}
        isAnimationActive={false}
        onClick={(data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (onBarClick) onBarClick(data);
        }}
        style={{ cursor: onBarClick ? "pointer" : "default" }}
      >
        {chartData.map((entry, index) => (
          <Cell
            key={`cell-${index}`}
            fill={COLORS[index % COLORS.length]}
            style={{ cursor: onBarClick ? "pointer" : "default" }}
          />
        ))}
      </Bar>
    </BarChart>
  );

  return (
    <Box
      style={{
        background: colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
        padding: theme.spacing.xl,
        width: useFixedDimensions ? width : "100%",
        height: useFixedDimensions ? "auto" : "100%",
        display: "block",
        overflow: "visible",
      }}
    >
      <Stack gap={0} align="center" mb="lg">
        <Title order={5}>{batchName}</Title>
        <Text size="sm" c="dimmed">
          {VIEW_TITLES[view]}
        </Text>
      </Stack>

      {chartData.length > 0 &&
         (view === 'avg_exam' ? (
             useFixedDimensions ? (
                chartElement2
             ) : (
                <ResponsiveContainer width="100%" height={400}>
                  {chartElement2}
                </ResponsiveContainer>
             )
         ) : null /* Handled above by custom renderer */
      )}
    </Box>
  );
}; // End BatchChartVisual

// ... InteractiveBatchChart ...

import { useMediaQuery } from "@mantine/hooks"; // Import useMediaQuery

export function InteractiveBatchChart({
  batchId,
  batchName,
}: InteractiveBatchChartProps) {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery("(max-width: 48em)"); // Detect mobile
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [uniqueExams, setUniqueExams] = useState<
    { value: string; label: string }[]
  >([]);
  const [view, setView] = useState<ChartView>("avg_participant"); // Default to participant scoreboard
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // ... (Data fetching effects remain unchanged) ...
  // [IMPORTANT: Ensure you keep the useEffects from the previous file content for fetching data]
  
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
       /* ... existing code ... */
       const promises = data.map(async (item) => {
            if (item.avatar_url) {
              try {
                // Ensure absolute URL (simple check)
                const imageUrl = item.avatar_url.startsWith("http") 
                    ? item.avatar_url 
                    : `${process.env.NEXT_PUBLIC_API_URL}/${item.avatar_url}`;
                    
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

            data = response.data.participantScores.map((item) => {
                 // Calculate average percentage across all exams
                 let totalPercentage = 0;
                 let count = 0;
                 let rawTotal = 0;
                 let maxTotal = 0;

                 item.scores.forEach(s => {
                    if (s.percentage !== undefined) {
                      totalPercentage += s.percentage;
                      count++;
                      rawTotal += (s.rawScore || 0);
                      maxTotal += (s.maxScore || 1); 
                    }
                 });

                 const avgPercentage = count > 0 ? parseFloat((totalPercentage / count).toFixed(2)) : 0;
                 const rawString = `${rawTotal}/${maxTotal}`;
                 
                 return {
                    name: item.examinee.name,
                    "Nilai Rata-rata": avgPercentage,
                    rawDetail: `Avg: ${item.averageScore.toFixed(2)} (Total: ${rawString})`, // Custom field for tooltip/label
                    avatar_url: item.examinee.avatar,
                  };
            });

            data.sort((a, b) => b["Nilai Rata-rata"] - a["Nilai Rata-rata"]);
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

  const dataKey = useMemo(() => {
    if (view === "avg_exam") return "Nilai Rata-rata";
    if (view === "avg_participant") return "Nilai Rata-rata";
    if (view === "specific_exam") return "Skor";
    return "";
  }, [view]);

  const isHorizontal = view === "avg_participant" || view === "specific_exam";

  const handleDownload = async () => {
    setIsDownloading(true);

    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "200vw";
    wrapper.style.top = "0";
    wrapper.style.zIndex = "99999";
    wrapper.style.opacity = "1";
    wrapper.style.background = "white";
    
    const hiddenContainer = document.createElement("div");
    // Update: Use 800 width for both participant AND specific exam views
    const EXPORT_WIDTH = (view === 'avg_participant' || view === 'specific_exam') ? 800 : 1920; 
    
    // Adjusted height calculation for Scoreboard/List views
    const itemHeight = 60; 
    const baseHeight = 200; 
    const dynamicHeight = chartData.length * itemHeight + baseHeight;

    const EXPORT_HEIGHT = isHorizontal 
        ? Math.max(800, dynamicHeight) 
        : 1080;

    hiddenContainer.style.width = `${EXPORT_WIDTH}px`;
    hiddenContainer.style.height = `${EXPORT_HEIGHT}px`;
    hiddenContainer.style.background = colorScheme === 'dark' ? '#1A1B1E' : '#FFFFFF';
    
    wrapper.appendChild(hiddenContainer);
    document.body.appendChild(wrapper);

    try {
        const root = createRoot(hiddenContainer);
        
        await new Promise<void>((resolve) => {
            root.render(
                <MantineProvider forceColorScheme={colorScheme === "dark" ? "dark" : "light"} theme={theme}>
                    <BatchChartVisual 
                        chartData={chartData}
                        view={view}
                        batchId={batchId}
                        batchName={batchName}
                        theme={theme}
                        colorScheme={colorScheme === "dark" ? "dark" : "light"}
                        dataKey={dataKey}
                        isHorizontal={isHorizontal}
                        width={EXPORT_WIDTH} 
                        height={EXPORT_HEIGHT}
                    />
                </MantineProvider>
            );
            setTimeout(resolve, 800); 
        });

        const dataUrl = await toPng(hiddenContainer, {
            backgroundColor: colorScheme === "dark" ? "#1A1B1E" : "#FFFFFF",
            cacheBust: true,
            pixelRatio: 1, 
            width: EXPORT_WIDTH,
            height: EXPORT_HEIGHT
        });

        const link = document.createElement("a");
        const viewName = view.replace("_", "-");
        link.download = `grafik-batch-${viewName}-${
            new Date().toISOString().split("T")[0]
        }.png`;
        link.href = dataUrl;
        link.click();

        root.unmount();
    } catch (err) {
        console.error("Download failed:", err);
        setError("Gagal mengunduh gambar.");
    } finally {
        if (document.body.contains(wrapper)) {
            document.body.removeChild(wrapper);
        }
        setIsDownloading(false);
    }
  };

  const routerPush = (url: string) => {
    router.push(url);
  }

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

      <Collapse in={!isMobile}>
          <Text size="sm" c="dimmed" mb="md">
            Pilih mode tampilan untuk melihat analisis yang berbeda.
          </Text>
      </Collapse>

      <SegmentedControl
        value={view}
        onChange={(val) => setView(val as ChartView)}
        fullWidth
        data={isMobile ? [
            { label: "Rerata Ujian", value: "avg_exam" },
            { label: "Rerata Peserta", value: "avg_participant" },
            { label: "Per Ujian", value: "specific_exam" },
        ] : [
            { label: "Rata-rata per Ujian", value: "avg_exam" },
            { label: "Rata-rata per Peserta", value: "avg_participant" },
            { label: "Per Ujian Spesifik", value: "specific_exam" },
        ]}
        mb="xl"
        size={isMobile ? "xs" : "sm"}
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

      <Box ref={chartContainerRef}>
        {loading && <ComponentLoader label="Memuat data grafik..." />}
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
             Belum ada data untuk ditampilkan.
          </Text>
        )}

        {!loading && !error && chartData.length > 0 && (
            // MOBILE VIEW LOGIC
            isMobile ? (
                <Paper withBorder p="xl" radius="md" bg={colorScheme === 'dark' ? 'dark.7' : 'gray.0'}>
                    <Stack align="center" gap="md">
                         <IconDownload size={48} color="var(--mantine-color-violet-5)" />
                         <Text ta="center" fw={500}>
                             Tampilan grafik tidak tersedia di mode mobile.
                         </Text>
                         <Text ta="center" size="sm" c="dimmed">
                             Silakan unduh grafik untuk melihat ringkasan lengkap performa peserta.
                         </Text>
                         <Button 
                            leftSection={<IconDownload size={18} />}
                            fullWidth
                            variant="gradient"
                            gradient={{ from: 'violet', to: 'indigo' }}
                            onClick={handleDownload}
                            loading={isDownloading}
                         >
                             Unduh Grafik ({view === 'avg_participant' ? 'Papan Skor' : 'Chart'})
                         </Button>
                    </Stack>
                </Paper>
            ) : (
                <BatchChartVisual 
                    chartData={chartData}
                    view={view}
                    batchId={batchId}
                    batchName={batchName}
                    theme={theme}
                    colorScheme={colorScheme === "dark" ? "dark" : "light"}
                    dataKey={dataKey}
                    isHorizontal={isHorizontal}
                    onBarClick={(data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        if (data.examId) {
                        routerPush(
                            `/admin/monitoring/${data.examId}?batch=${encodeURIComponent(
                            batchName
                            )}`
                        );
                        }
                    }}
                />
            )
        )}
      </Box>
    </Paper>
  );
}

