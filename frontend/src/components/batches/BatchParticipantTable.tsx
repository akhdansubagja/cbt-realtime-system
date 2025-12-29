// frontend/src/components/batches/BatchParticipantTable.tsx
"use client";

import api from "@/lib/axios";
import { BatchParticipantReportData } from "@/types/batchParticipantReport";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import {
  Alert,
  Button,
  Paper,
  Table,
  Text,
  Title,
  Avatar,
  Modal,
  Image,
  ScrollArea,
  Tooltip,
  Loader,
} from "@mantine/core";
import { ComponentLoader } from "@/components/ui/ComponentLoader";
import { Box, Group, TextInput, Flex, Stack } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import {
  IconAlertCircle,
  IconSearch,
  IconUserSearch,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { DataTable, DataTableSortStatus } from "mantine-datatable"; // Import Library Modern
import sortBy from "lodash/sortBy"; // Helper untuk sorting
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";

type ParticipantScore = BatchParticipantReportData["participantScores"][number];

interface BatchParticipantTableProps {
  /** ID dari Batch yang akan ditampilkan laporannya */
  batchId: number;
}

/**
 * Tabel laporan peserta dalam satu batch.
 * Menampilkan progress live, skor per ujian, dan total/rata-rata.
 * Mendukung sorting, filtering, dan pagination.
 */
export function BatchParticipantTable({ batchId }: BatchParticipantTableProps) {
  const [data, setData] = useState<BatchParticipantReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageModalOpened, { open: openImageModal, close: closeImageModal }] =
    useDisclosure(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const router = useRouter();
  const isDesktop = useMediaQuery('(min-width: 48em)');

  const [page, setPage] = useState(1);
  const { pageSize, setPageSize, PAGE_SIZES } = useUserPreferences();
  const [query, setQuery] = useState(""); // Untuk fitur search

  const [sortStatus, setSortStatus] = useState<
    DataTableSortStatus<ParticipantScore>
  >({
    columnAccessor: "examinee.name", // Sekarang TS tahu properti ini valid
    direction: "asc",
  });

  const records = useMemo(() => {
    if (!data || !data.participantScores) return [];

    let filtered = data.participantScores;

    // 1. Filtering (Search)
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter((item) =>
        item.examinee.name.toLowerCase().includes(lowerQuery)
      );
    }

    // 2. Sorting
    // Kita handle sorting nested object (examinee.name) dan angka
    filtered = sortBy(filtered, (item) => {
      if (sortStatus.columnAccessor === "examinee.name")
        return item.examinee.name.toLowerCase();
      // @ts-expect-error - Akses dinamis aman karena kita kontrol accessornya
      return item[sortStatus.columnAccessor];
    });

    // Reverse jika descending
    if (sortStatus.direction === "desc") {
      filtered = filtered.reverse();
    }

    // 3. Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    return filtered.slice(from, to);
  }, [data, query, sortStatus, page, pageSize]);

  // Hitung total record setelah difilter (untuk pagination)
  const totalRecords = useMemo(() => {
    if (!data || !data.participantScores) return 0;
    if (!query) return data.participantScores.length;
    return data.participantScores.filter((i) =>
      i.examinee.name.toLowerCase().includes(query.toLowerCase())
    ).length;
  }, [data, query]);

  // Reset halaman ke 1 jika user melakukan search
  // Reset halaman ke 1 jika user melakukan search
  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  const handleAvatarClick = async (examineeId: number) => {
    setSelectedImage(null);
    setLoadingImage(true);
    openImageModal();

    try {
      const response = await api.get(`/examinees/${examineeId}`);
      const examinee = response.data;
      
      if (examinee.original_avatar_url) {
          setSelectedImage(`${process.env.NEXT_PUBLIC_API_URL}/${examinee.original_avatar_url}`);
      } else if (examinee.avatar_url) {
          setSelectedImage(`${process.env.NEXT_PUBLIC_API_URL}/${examinee.avatar_url}`);
      }
    } catch (err) {
      console.error("Gagal memuat gambar original", err);
    } finally {
      setLoadingImage(false);
    }
  };

  useEffect(() => {
    if (!batchId) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        // Panggil endpoint A yang kita tes di Postman
        const response = await api.get(
          `/reports/batch-participants/${batchId}`
        );
        setData(response.data);
      } catch (err) {
        setError("Gagal mengambil data laporan peserta.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [batchId]);

  if (loading) {
    return <ComponentLoader label="Memuat data peserta..." />;
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Error!" color="red">
        {error}
      </Alert>
    );
  }

  if (!data || data.participantScores.length === 0) {
    return (
      <Text>Belum ada peserta di batch ini yang menyelesaikan ujian.</Text>
    );
  }

  return (
    <Paper shadow="sm" p={0} radius="lg" style={{ overflow: "hidden" }}>
      {/* Modal Avatar (Tetap Sama) */}
      <Modal
        opened={imageModalOpened}
        onClose={closeImageModal}
        title="Lihat Avatar"
        centered
        size="lg"
      >
        <Flex align="center" justify="center" mih={200}>
          {loadingImage ? (
            <Loader size="xl" />
          ) : (
            selectedImage && <Image src={selectedImage} alt="Avatar Peserta" />
          )}
        </Flex>
      </Modal>

      {/* Header & Search Bar Modern */}
      <Box 
        p="xl" 
        style={{ 
          background: "linear-gradient(135deg, var(--mantine-color-indigo-6) 0%, var(--mantine-color-violet-6) 100%)",
          borderRadius: "var(--mantine-radius-lg) var(--mantine-radius-lg) 0 0",
          color: "white"
        }}
      >
        <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} direction={{ base: 'column', sm: 'row' }} gap="md">
          <div>
            <Title order={3} c="white" style={{ fontWeight: 800, letterSpacing: "-0.5px" }}>Laporan Peserta</Title>
            <Text size="sm" c="indigo.1" mt={4}>Daftar peserta dan skor ujian mereka</Text>
          </div>
          <TextInput
            placeholder="Cari nama peserta..."
            leftSection={<IconSearch size={16} />}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            w={{ base: "100%", sm: 300 }}
            radius="xl"
            variant="filled"
            styles={{
              input: {
                backgroundColor: "rgba(255, 255, 255, 1)",
                color: "black",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                '&::placeholder': {
                  color: "rgba(0, 0, 0, 0.5)"
                },
                '&:focus': {
                  backgroundColor: "rgba(255, 255, 255, 1)",
                  borderColor: "white"
                }
              }
            }}
          />
        </Flex>
      </Box>

      {/* TABEL MODERN */}
      <DataTable<ParticipantScore>
        idAccessor={(record) => String(record.examinee.id)}
        minHeight={200}
        withTableBorder={false}
        borderRadius="lg"
        withColumnBorders={false}
        scrollAreaProps={{ type: 'scroll', scrollbars: 'x' }}
        customRowAttributes={(record, index) => ({
          style: {
            backgroundColor: index % 2 === 0 
              ? 'light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))' 
              : 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
            transition: 'background-color 0.2s',
            color: 'light-dark(var(--mantine-color-black), var(--mantine-color-white))'
          }
        })}
        highlightOnHover
        rowStyle={() => ({ cursor: "pointer" })}
        onRowClick={({ record }) => {
          router.push(`/admin/examinees/${record.examinee.id}`);
        }}
        verticalSpacing="md"
        horizontalSpacing="lg"
        records={records}
        totalRecords={totalRecords}
        recordsPerPage={pageSize}
        page={page}
        onPageChange={(p) => setPage(p)}
        recordsPerPageOptions={PAGE_SIZES}
        onRecordsPerPageChange={setPageSize}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        columns={[
          {
            accessor: "id", // Dummy accessor untuk avatar, bisa pakai apa saja yang unik
            title: "Avatar",
            width: 85,
            render: (record) => (
              <Box onClick={(e) => e.stopPropagation()}>
                  <Avatar
                    // TypeScript sekarang tidak akan error karena tahu 'record' adalah ParticipantScore
                    src={
                      record.examinee.avatar
                        ? `${process.env.NEXT_PUBLIC_API_URL}/${record.examinee.avatar}`
                        : null
                    }
                    size={45}
                    radius="xl"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleAvatarClick(record.examinee.id)}
                  >
                    {record.examinee.name.charAt(0)}
                  </Avatar>
              </Box>
            ),
          },
          {
            accessor: "examinee.name",
            title: "Nama Peserta",
            sortable: true,
          },
          ...data.uniqueExams.map((exam) => ({
            accessor: `exam_${exam.id}`,
            title: (
              <Tooltip label={exam.title} multiline w={200}>
                <Text span size="sm" fw={500}>
                  {exam.shortTitle}
                </Text>
              </Tooltip>
            ),

            render: (record: ParticipantScore) => {
              // Explicit type di sini juga membantu
              const scoreData = record.scores.find((s) => s.examId === exam.id);
              
              if (!scoreData || scoreData.rawScore === null) return "-";

              return (
                  <Stack gap={0}>
                      <Text span fw={700}>
                          {scoreData.percentage}
                      </Text>
                      <Text span size="xs" c="dimmed">
                          ({scoreData.rawScore}/{scoreData.maxScore})
                      </Text>
                  </Stack>
              );
            },
          })),
          {
            accessor: "examCount",
            title: "Jml Ujian",
            sortable: false,

            width: 120,
          },
          {
            accessor: "totalScore",
            title: "Total",
            sortable: true,
            width: 140,
            render: (record) => {
                const percentage = record.totalPercentageSum?.toFixed(2) ?? "0.00";
                
                return (
                    <Stack gap={0}>
                        <Text span fw={700}>
                            {percentage}
                        </Text>
                        <Text span size="xs" c="dimmed">
                            ({record.totalScore}/{record.totalMaxScore})
                        </Text>
                    </Stack>
                )
            }
          },
          {
            accessor: "averageScore",
            title: "Rata-rata",
            sortable: true,
            width: 140,
            render: (record) => (
                <Stack gap={0}>
                    <Text span fw={700}>
                        {record.averagePercentage?.toFixed(2) ?? "0.00"}
                    </Text>
                    <Text span size="xs" c="dimmed">
                        (Raw: {record.averageScore.toFixed(2)})
                    </Text>
                </Stack>
            ),
          },
        ]}
      />
    </Paper>
  );
}
