// frontend/src/app/admin/(protected)/batches/[id]/page.tsx
"use client";

import {
  Title,
  Paper,
  Text,
  Loader,
  Alert,
  Table,
  Group,
  Button,
  Anchor,
  Breadcrumbs,
  Stack,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconUserSearch,
  IconFileExport,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Batch } from "@/types/batch"; // Tipe ini sekarang berisi Examinee
import { useParams } from "next/navigation";
import Link from "next/link";
import { BatchParticipantTable } from "@/components/batches/BatchParticipantTable";
import { InteractiveBatchChart } from "@/components/batches/InteractiveBatchChart";
import { IconPlus } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import { BulkAddExamineesModal } from "@/components/examinees/BulkAddExamineesModal";
import { PageHeader } from "@/components/layout/PageHeader";

export default function BatchDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const batchId = parseInt(id, 10);
  const router = useRouter();
  const [bulkModalOpened, { open: openBulkModal, close: closeBulkModal }] =
    useDisclosure(false);

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!id) return; // Jangan fetch jika ID belum siap

    const fetchBatchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        // Endpoint detail yang kita tes di Postman
        const response = await api.get(`/batches/${id}`);
        setBatch(response.data);
      } catch (err) {
        setError("Gagal mengambil detail batch.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBatchDetail();
  }, [id]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await api.get(`/reports/export/batch/${batchId}`, {
        responseType: "blob", // Penting: kita minta file, bukan JSON
      });

      // Ambil nama file dari header 'content-disposition'
      const contentDisposition = response.headers["content-disposition"];
      let fileName = `laporan_batch_${batchId}.xlsx`; // Fallback
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }

      // Buat URL sementara dari blob (file) dan picu download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();

      // Bersihkan
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gagal mengunduh laporan", err);
      setError("Gagal mengunduh laporan. Coba lagi nanti.");
    } finally {
      setIsExporting(false);
    }
  };

  // Menampilkan state loading
  if (loading) {
    return <Loader />;
  }

  // Menampilkan state error
  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Error!" color="red">
        {error}
      </Alert>
    );
  }

  // Menampilkan jika batch tidak ditemukan
  if (!batch) {
    return <Text>Data batch tidak ditemukan.</Text>;
  }

  // Menampilkan tabel peserta
  const rows = batch.examinees.map((examinee) => (
    <Table.Tr key={examinee.id}>
      <Table.Td>{examinee.id}</Table.Td>
      <Table.Td>{examinee.name}</Table.Td>
      <Table.Td>
        {/* Tombol ini akan mengarah ke halaman detail peserta */}
        <Button
          component={Link}
          href={`/admin/examinees/${examinee.id}`}
          leftSection={<IconUserSearch size={14} />}
          variant="outline"
          size="xs"
        >
          Lihat Riwayat
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Stack>
        <BulkAddExamineesModal
          opened={bulkModalOpened}
          onClose={closeBulkModal}
          onSuccess={() => {
            // Cara termudah untuk me-refresh tabel adalah me-refresh
            // data server untuk halaman ini
            setRefreshKey((prevKey) => prevKey + 1);
          }}
          lockedBatchId={batchId} // <-- Kirim ID batch ke modal
        />
        <PageHeader
          title={batch.name}
          breadcrumbs={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "Manajemen Batch", href: "/admin/batches" },
            { label: batch.name, href: `#` },
          ]}
          actions={
            <Group>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={openBulkModal}
              >
                Tambah Peserta
              </Button>
              <Button
                leftSection={<IconFileExport size={16} />}
                onClick={handleExport}
                loading={isExporting}
                variant="outline"
              >
                Export ke Excel
              </Button>
            </Group>
          }
        />

        {/* <InteractiveBatchChartV2 batchId={batch.id} key={`chart-${refreshKey}`} /> */}

        <InteractiveBatchChart
          batchId={batch.id}
          batchName={batch.name} // <-- TAMBAHKAN PROP INI
          key={`chart-${refreshKey}`}
        />

        <BatchParticipantTable batchId={batch.id} key={`table-${refreshKey}`} />
      </Stack>
    </>
  );
}
