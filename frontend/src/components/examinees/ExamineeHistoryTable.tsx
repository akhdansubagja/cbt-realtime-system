import { Badge, Box, Text, Group, ActionIcon, Tooltip, Stack } from "@mantine/core";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import { ParticipantHistory } from "@/types/participantHistory";
import dayjs from "dayjs";
import { IconEye } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

interface ExamineeHistoryTableProps {
  /** Daftar riwayat ujian peserta */
  records: ParticipantHistory[];
  /** State loading tabel */
  loading: boolean;
  /** Status sorting saat ini */
  sortStatus: DataTableSortStatus<ParticipantHistory>;
  /** Handler perubahan sorting */
  onSortStatusChange: (status: DataTableSortStatus<ParticipantHistory>) => void;
}

/**
 * Tabel riwayat ujian peserta.
 * Menampilkan daftar ujian yang pernah diikuti beserta status dan nilainya.
 */
export function ExamineeHistoryTable({ records, loading, sortStatus, onSortStatusChange }: ExamineeHistoryTableProps) {
  const router = useRouter();

  return (
    <DataTable<ParticipantHistory>
      withTableBorder
      borderRadius="lg"
      shadow="sm"
      striped
      highlightOnHover
      minHeight={150}
      records={records}
      fetching={loading}
      sortStatus={sortStatus}
      onSortStatusChange={onSortStatusChange}
      columns={[
        {
          accessor: "exam.title",
          title: "Nama Ujian",
          sortable: true,
          render: (record) => (
             <Text fw={500} size="sm">{record.exam.title}</Text>
          )
        },
        {
          accessor: "start_time",
          title: "Tanggal",
          sortable: true,
          render: (record) => {
            const date = record.start_time || record.created_at;
            return date ? dayjs(date).format("DD MMM YYYY") : "-";
          },
        },
        {
          accessor: "final_score",
          title: "Nilai",
          sortable: true,
          render: (record) => {
              const hasScore = record.final_score !== null;
              const percentage = record.percentage;
              const maxScore = record.max_score || 0;
              
              if (!hasScore) return <Text c="dimmed">-</Text>;

              return (
                <Stack gap={0}>
                    <Text
                    fw={700}
                    c={
                        percentage && percentage >= 75
                        ? "teal"
                        : percentage
                        ? "orange"
                        : "gray"
                    }
                    >
                    {percentage !== undefined ? percentage : record.final_score}
                    </Text>
                     {maxScore > 0 && (
                        <Text size="xs" c="dimmed">
                            ({record.final_score}/{maxScore})
                        </Text>
                    )}
                </Stack>
              );
          },
        },
        {
          accessor: "status",
          title: "Status",
          render: (record) => {
            let color = "gray";
            let label = record.status;
            if (record.status === "finished") {
              color = "blue";
              label = "Selesai";
            } else if (record.status === "ongoing") {
              color = "green";
              label = "Sedang Mengerjakan";
            }
            return <Badge color={color} variant="light">{label}</Badge>;
          },
        },
      ]}
      noRecordsText="Belum ada riwayat ujian."
    />
  );
}
