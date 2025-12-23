
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
  useMantineColorScheme,
} from "@mantine/core";
import { ComponentLoader } from "@/components/ui/ComponentLoader";
import { IconAlertCircle } from "@tabler/icons-react";
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
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  avatar_url?: string | null;
};


  // --- 1. NEW COMPONENT: Visual-only version of the chart ---
// This component receives data and renders the chart exactly how we want it to look
// either on screen or in the exported image.
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

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#E34234",
    "#FF69B4",
  ];

  // If width is provided, we use fixed dimensions (for export). 
  // If not, we use ResponsiveContainer ( for display).
  const useFixedDimensions = typeof width === 'number';

  const chartElement1 = (
    <BarChart
      width={useFixedDimensions ? width : undefined}
      height={useFixedDimensions ? (height || Math.max(400, chartData.length * 35)) : undefined}
      layout="vertical"
      data={chartData}
      margin={{ top: 5, right: 100, left: 40, bottom: 5 }}
    >
        <defs>
        <clipPath
            id={`circleClip-${batchId}`}
            clipPathUnits="objectBoundingBox"
        >
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
            const index = chartData.findIndex(
            (d) => d.name === payload.value
            );
            const rank = index + 1;
            const isTop3 = rank <= 3;

            let rankColor = "#dimmed";
            if (rank === 1) rankColor = "gold";
            if (rank === 2) rankColor = "silver";
            if (rank === 3) rankColor = "#CD7F32";

            const data = chartData.find((d) => d.name === payload.value);
            const avatarUrl = data?.avatar_url;

            return (
            <g transform={`translate(${x},${y})`}>
                {isTop3 ? (
                <g transform="translate(-170, -10)">
                    <circle cx="10" cy="10" r="10" fill={rankColor} />
                    <text
                    x="10"
                    y="14"
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="10"
                    fontWeight="bold"
                    >
                    {rank}
                    </text>
                </g>
                ) : (
                <text
                    x={-160}
                    y={4}
                    textAnchor="middle"
                    fill="gray"
                    fontSize="12"
                    fontWeight="bold"
                >
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
                const data = payload[0].payload;
                const normalized = payload[0].value;
            return (
                <Paper p="xs" shadow="xs" withBorder>
                <Text fw={500}>{label}</Text>
                <Text size="sm">
                   Normalized: {normalized}%
                </Text>
                {data.rawDetail && (
                     <Text size="xs" c="dimmed">
                        Raw Score: {data.rawDetail}
                     </Text>
                )}
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
        <LabelList
            dataKey={dataKey}
            position="right"
            content={(props: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const { x, y, width: barWidth, value, index } = props;
            const dataItem = chartData[index];
            const avatarUrl = dataItem?.avatar_url;
            // Note: avatar extraction logic assumes pre-processing
            const avatarSrc = avatarUrl?.startsWith("data:")
                ? avatarUrl
                : avatarUrl
                ? `${process.env.NEXT_PUBLIC_API_URL}/${avatarUrl}`
                : null;

            const startX = x + barWidth + 10;
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
                    <circle
                    cx={startX + 16}
                    cy={centerY}
                    r={16}
                    fill="#ccc"
                    />
                )}
                <text
                    x={startX + 40}
                    y={centerY + 4}
                    fill={colorScheme === "dark" ? "#fff" : "#000"}
                    fontSize={12}
                    fontWeight="bold"
                    textAnchor="start"
                >
                    {dataItem.rawDetail ? `${value}%` : value}
                </text>
                {dataItem.rawDetail && (
                    <text
                        x={startX + 40}
                        y={centerY + 16}
                        fill={colorScheme === "dark" ? "#aaa" : "#555"}
                        fontSize={10}
                        textAnchor="start"
                    >
                        {dataItem.rawDetail}
                    </text>
                )}
                </g>
            );
            }}
        />
        </Bar>
    </BarChart>
  );

  const chartElement2 = (
    <BarChart
      width={useFixedDimensions ? width : undefined}
      height={useFixedDimensions ? (height || 400) : undefined}
      data={chartData}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} />
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
        width: useFixedDimensions ? width : "100%", // Always take full width of container
        height: useFixedDimensions ? "auto" : "100%",
        display: "block", // Ensure block layout
        overflow: "visible"
      }}
    >
      <Stack gap={0} align="center" mb="lg">
        <Title order={5}>{batchName}</Title>
        <Text size="sm" c="dimmed">
          {VIEW_TITLES[view]}
        </Text>
      </Stack>

      {chartData.length > 0 && (
          isHorizontal ? (
            useFixedDimensions ? chartElement1 : (
                <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 35)}>
                    {chartElement1}
                </ResponsiveContainer>
            )
          ) : (
            useFixedDimensions ? chartElement2 : (
                <ResponsiveContainer width="100%" height={400}>
                    {chartElement2}
                </ResponsiveContainer>
            )
          )
      )}
    </Box>
  );
};

export function InteractiveBatchChart({
  batchId,
  batchName,
}: InteractiveBatchChartProps) {
  const router = useRouter(); 
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
  
  // Ref not really needed for display anymore, but kept if needed for other things
  const chartContainerRef = useRef<HTMLDivElement>(null); 
  const [isDownloading, setIsDownloading] = useState(false);

  // ... (Keep existing useEffect data fetching logic - no changes needed there) ...
  // [Only duplicating the View/Title map logic for logic consistency if needed, but it's used inside Visual]

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
        // ... (Existing logic) ...
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

  // Tentukan 'dataKey'
  const dataKey = useMemo(() => {
    if (view === "avg_exam") return "Nilai Rata-rata";
    if (view === "avg_participant") return "Nilai Rata-rata";
    if (view === "specific_exam") return "Skor";
    return "";
  }, [view]);

  // Tentukan 'layout' berdasarkan 'view'
  const isHorizontal = view === "avg_participant" || view === "specific_exam";

  // --- PHANTOM RENDERING LOGIC ---
  const handleDownload = async () => {
    setIsDownloading(true);

    // 1. Create a wrapper that pushes content off-screen but keeps it rendered
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "200vw"; // Far off-screen
    wrapper.style.top = "0";
    wrapper.style.zIndex = "99999"; // High z-index to avoid overlap issues during paint
    wrapper.style.opacity = "1"; // Fully opaque so it paints
    wrapper.style.background = "white"; // Solid background
    
    // 2. Create the actual container for the chart
    const hiddenContainer = document.createElement("div");
    const EXPORT_WIDTH = 1920; 
    const EXPORT_HEIGHT = Math.max(1080, chartData.length * 40 + 200); 

    hiddenContainer.style.width = `${EXPORT_WIDTH}px`;
    hiddenContainer.style.height = `${EXPORT_HEIGHT}px`;
    // Ensure background matches theme
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
                        width={EXPORT_WIDTH} // PASS FIXED DIMENSIONS
                        height={EXPORT_HEIGHT}
                    />
                </MantineProvider>
            );
            setTimeout(resolve, 800); 
        });

        // 3. Capture with high quality
        // Note: html-to-image might be confused by left: -3000px.
        // We can use the 'width' and 'height' options to forcedly grab that rect?
        // No, usually it grabs the node.
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

      {/* Kontrol UI (Tabs dan Dropdown) */}
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
      >
        {/* Tampilkan Loader/Error/Empty State */}
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

        {/* --- MAIN DISPLAY RENDER --- */}
        {!loading && !error && chartData.length > 0 && (
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
        )}
      </Box>
    </Paper>
  );
}

