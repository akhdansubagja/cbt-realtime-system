// frontend/src/components/batches/BatchParticipantTable.tsx
"use client";

import api from "@/lib/axios";
import { BatchParticipantReportData } from "@/types/batchParticipantReport";
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
} from "@mantine/core";
import { ComponentLoader } from "@/components/ui/ComponentLoader";
import { Box, Group, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconAlertCircle,
  IconSearch,
  IconUserSearch,
} from "@tabler/icons-react";
import { DataTable, DataTableSortStatus } from "mantine-datatable"; // Import Library Modern
import sortBy from "lodash/sortBy"; // Helper untuk sorting
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";

type ParticipantScore = BatchParticipantReportData["participantScores"][number];

interface BatchParticipantTableProps {
  batchId: number;
}

export function BatchParticipantTable({ batchId }: BatchParticipantTableProps) {
  const [data, setData] = useState<BatchParticipantReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageModalOpened, { open: openImageModal, close: closeImageModal }] =
    useDisclosure(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10; // Bisa dibuat dinamis jika mau
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
      // @ts-ignore - Akses dinamis aman karena kita kontrol accessornya
      return item[sortStatus.columnAccessor];
    });

    // Reverse jika descending
    if (sortStatus.direction === "desc") {
      filtered = filtered.reverse();
    }

    // 3. Pagination
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    return filtered.slice(from, to);
  }, [data, query, sortStatus, page]);

  // Hitung total record setelah difilter (untuk pagination)
  const totalRecords = useMemo(() => {
    if (!data || !data.participantScores) return 0;
    if (!query) return data.participantScores.length;
    return data.participantScores.filter((i) =>
      i.examinee.name.toLowerCase().includes(query.toLowerCase())
    ).length;
  }, [data, query]);

  // Reset halaman ke 1 jika user melakukan search
  useEffect(() => {
    setPage(1);
  }, [query]);

  const handleAvatarClick = (imageUrl: string | null) => {
    if (imageUrl) {
      setSelectedImage(`http://localhost:3000/${imageUrl}`);
      openImageModal();
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
    <Paper shadow="sm" p="lg" withBorder>
      {/* Modal Avatar (Tetap Sama) */}
      <Modal
        opened={imageModalOpened}
        onClose={closeImageModal}
        title="Lihat Avatar"
        centered
        size="lg"
      >
        <Image src={selectedImage} alt="Avatar Peserta" />
      </Modal>

      {/* Header & Search Bar Modern */}
      <Group justify="space-between" mb="md">
        <Title order={4}>Laporan Peserta</Title>
        <TextInput
          placeholder="Cari nama peserta..."
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          w={300}
        />
      </Group>

      {/* TABEL MODERN */}
      <DataTable<ParticipantScore>
        idAccessor={(record) => String(record.examinee.id)}
        minHeight={200}
        withTableBorder
        borderRadius="sm"
        withColumnBorders={false}
        striped
        highlightOnHover
        records={records}
        totalRecords={totalRecords}
        recordsPerPage={PAGE_SIZE}
        page={page}
        onPageChange={(p) => setPage(p)}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        columns={[
          {
            accessor: "id", // Dummy accessor untuk avatar, bisa pakai apa saja yang unik
            title: "Avatar",
            width: 70,
            render: (record) => (
              <Avatar
                // TypeScript sekarang tidak akan error karena tahu 'record' adalah ParticipantScore
                src={
                  record.examinee.avatar
                    ? `http://localhost:3000/${record.examinee.avatar}`
                    : null
                }
                size="md"
                radius="xl"
                style={{ cursor: "pointer" }}
                onClick={() => handleAvatarClick(record.examinee.avatar)}
              >
                {record.examinee.name.charAt(0)}
              </Avatar>
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
              return scoreData ? scoreData.score : "-";
            },
          })),
          {
            accessor: "examCount",
            title: "Jml Ujian",
            sortable: false,

            width: 100,
          },
          {
            accessor: "totalScore",
            title: "Total",
            sortable: true,
            width: 100,
          },
          {
            accessor: "averageScore",
            title: "Rata-rata",
            sortable: true,
            width: 100,
            render: (record) => record.averageScore.toFixed(2),
          },
        ]}
      />
    </Paper>
  );
}
