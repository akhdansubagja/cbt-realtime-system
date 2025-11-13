// frontend/src/components/batches/BatchParticipantTable.tsx
"use client";

import api from "@/lib/axios";
import { BatchParticipantReportData } from "@/types/batchParticipantReport";
import {
  Alert,
  Button,
  Loader,
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
import { useDisclosure } from "@mantine/hooks";
import { IconAlertCircle, IconUserSearch } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
    return <Loader />;
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
      {/* V V V PINDAHKAN MODAL KE SINI V V V */}
      <Modal
        opened={imageModalOpened}
        onClose={closeImageModal}
        title="Lihat Avatar"
        centered
        size="lg"
      >
        <Image src={selectedImage} alt="Avatar Peserta" />
      </Modal>
      {/* ^ ^ ^ BATAS PEMINDAHAN ^ ^ ^ */}

      <Title order={4} mb="md">
        Daftar Peserta
      </Title>
      <ScrollArea>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Avatar</Table.Th>
              <Table.Th>Nama Peserta</Table.Th>

              {/* Kolom Ujian Dinamis */}
              {data.uniqueExams.map((exam) => (
                <Table.Th key={exam.id} align="center" miw={100}>
                  <Tooltip label={exam.title} withArrow multiline w={220}>
                    <Text span truncate>
                      {exam.shortTitle}
                    </Text>
                  </Tooltip>
                </Table.Th>
              ))}

              <Table.Th align="center">Jml. Ujian</Table.Th>
              <Table.Th align="center">Total Skor</Table.Th>
              <Table.Th align="center">Rata-rata</Table.Th>
              {/* Kolom Aksi dihapus */}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.participantScores.map((participant) => {
              // Buat lookup map untuk skor peserta ini agar pencarian cepat
              const scoreMap = new Map(
                participant.scores.map((s) => [s.examId, s.score])
              );

              return (
                <Table.Tr key={participant.examinee.id}>
                  {/* KolLOM AVATAR */}
                  <Table.Td>
                    <Avatar
                      src={
                        participant.examinee.avatar
                          ? `http://localhost:3000/${participant.examinee.avatar}`
                          : null
                      }
                      radius="xl"
                      onClick={() =>
                        handleAvatarClick(participant.examinee.avatar)
                      }
                      style={{
                        cursor: participant.examinee.avatar
                          ? "pointer"
                          : "default",
                      }}
                    >
                      {participant.examinee.name.charAt(0)}
                    </Avatar>
                  </Table.Td>

                  {/* Kolom NAMA */}
                  <Table.Td>{participant.examinee.name}</Table.Td>

                  {/* Kolom NILAI DINAMIS */}
                  {data.uniqueExams.map((exam) => {
                    const score = scoreMap.get(exam.id);
                    return (
                      <Table.Td key={exam.id}>
                        {score !== null && score !== undefined ? score : "-"}
                      </Table.Td>
                    );
                  })}

                  {/* Kolom AGREGAT BARU */}
                  <Table.Td align="center">{participant.examCount}</Table.Td>
                  <Table.Td align="center">{participant.totalScore}</Table.Td>
                  <Table.Td align="center">
                    {participant.averageScore.toFixed(2)}
                  </Table.Td>

                  {/* Kolom Aksi (Button) dihapus */}
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  );
}
