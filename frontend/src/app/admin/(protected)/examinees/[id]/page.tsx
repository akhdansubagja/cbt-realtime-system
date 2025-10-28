"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Title,
  Table,
  Loader,
  Alert,
  Center,
  Button,
  Group,
  Text,
  Paper,
  Badge,
} from "@mantine/core";
import api from "@/lib/axios";
import { useMemo } from "react";
import { Stack, Flex, Box, ActionIcon } from "@mantine/core";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import { IconArrowLeft } from "@tabler/icons-react";
import sortBy from "lodash/sortBy";
import dayjs from "dayjs";

// Definisikan tipe data yang kita harapkan dari backend
interface ParticipantSession {
  id: number;
  status: "started" | "finished";
  final_score: number | null;
  start_time: string;
  exam: {
    title: string;
  };
}

interface ExamineeDetails {
  id: number;
  name: string;
  participants: ParticipantSession[];
}

export default function ExamineeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examineeId = params.id as string;

  const [examineeData, setExamineeData] = useState<ExamineeDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortStatus, setSortStatus] = useState<
    DataTableSortStatus<ParticipantSession>
  >({
    columnAccessor: "start_time",
    direction: "desc",
  });

  useEffect(() => {
    if (!examineeId) return;
    api
      .get(`/examinees/${examineeId}`)
      .then((response) => {
        setExamineeData(response.data);
      })
      .catch(() => setError("Gagal mengambil data detail peserta."))
      .finally(() => setLoading(false));
  }, [examineeId]);

  const sortedRecords = useMemo(() => {
    if (!examineeData) return [];
    const sorted = sortBy(examineeData.participants, sortStatus.columnAccessor);
    return sortStatus.direction === "desc" ? sorted.reverse() : sorted;
  }, [examineeData, sortStatus]);

  if (loading)
    return (
      <Center>
        <Loader />
      </Center>
    );
  if (error)
    return (
      <Alert color="red" title="Error">
        {error}
      </Alert>
    );
  if (!examineeData)
    return <Alert color="yellow">Data peserta tidak ditemukan.</Alert>;

  const rows = examineeData.participants.map((session) => (
    <Table.Tr key={session.id}>
      <Table.Td>{session.exam.title}</Table.Td>
      <Table.Td>
        {new Date(session.start_time).toLocaleString("id-ID")}
      </Table.Td>
      <Table.Td>
        <Badge
          color={session.status === "finished" ? "gray" : "green"}
          variant="light"
        >
          {session.status === "finished" ? "Selesai" : "Mengerjakan"}
        </Badge>
      </Table.Td>
      <Table.Td fw={700}>{session.final_score ?? "-"}</Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Stack>
        {/* --- HEADER BARU --- */}
        <Flex justify="space-between" align="center">
          <Group>
            <ActionIcon
              variant="default"
              onClick={() => router.back()}
              size="lg"
            >
              <IconArrowLeft />
            </ActionIcon>
            <Box>
              <Text c="dimmed" size="xs">
                Profil Peserta
              </Text>
              <Title order={3}>{examineeData.name}</Title>
            </Box>
          </Group>
        </Flex>

        {/* --- TABEL RIWAYAT UJIAN BARU --- */}
        <Box mt="md">
          <DataTable<ParticipantSession>
            withTableBorder
            withColumnBorders
            borderRadius="md"
            shadow="sm"
            minHeight={200}
            records={sortedRecords}
            idAccessor="id"
            columns={[
              {
                accessor: "exam.title",
                title: "Judul Ujian",
                sortable: true,
              },
              {
                accessor: "start_time",
                title: "Waktu Mulai",
                sortable: true,
                textAlign: "center",
                render: (session) =>
                  dayjs(session.start_time).format("DD MMM YYYY, HH:mm"),
              },
              {
                accessor: "status",
                title: "Status",
                sortable: true,
                textAlign: "center",
                render: (session) => (
                  <Badge
                    color={session.status === "finished" ? "gray" : "green"}
                    variant="light"
                  >
                    {session.status === "finished" ? "Selesai" : "Mengerjakan"}
                  </Badge>
                ),
              },
              {
                accessor: "final_score",
                title: "Skor Akhir",
                sortable: true,
                textAlign: "center",
                render: (session) => (
                  <Text fw={700}>{session.final_score ?? "-"}</Text>
                ),
              },
            ]}
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            noRecordsText="Peserta ini belum pernah mengikuti ujian."
          />
        </Box>
      </Stack>
    </>
  );
}
