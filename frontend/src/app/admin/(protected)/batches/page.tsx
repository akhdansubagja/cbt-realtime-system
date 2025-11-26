"use client";

import {
  Title,
  Paper,
  Table,
  Group,
  Button,
  Loader,
  Alert,
  Text,
  Modal,
  TextInput,
  Stack,
  ActionIcon,
  Menu,
  Box,
  Skeleton,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconEye,
  IconPlus,
  IconPencil,
  IconTrash,
  IconDotsVertical,
  IconSearch,
} from "@tabler/icons-react"; // <-- Tambahkan IconPlus
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/axios";
import { Batch } from "@/types/batch";
import Link from "next/link";
import { useForm } from "@mantine/form"; // <-- Tambahkan ini
import { useDisclosure } from "@mantine/hooks"; // <-- Tambahkan ini
import { notifications } from "@mantine/notifications"; // <-- Tambahkan ini
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { confirmDelete, showSuccessAlert } from "@/lib/swal";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import sortBy from "lodash/sortBy";

export default function BatchesPage() {
  // State Data
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State DataTable Modern
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [query, setQuery] = useState("");
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Batch>>({
    columnAccessor: "name",
    direction: "asc",
  });

  // State Modal & Router
  const [opened, { open, close }] = useDisclosure(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const router = useRouter();

  const filteredBatches = batches.filter((batch) =>
    batch.name.toLowerCase().includes(query.toLowerCase())
  );

  // 1. Form Hook (Sama seperti sebelumnya)
  const form = useForm({
    initialValues: { name: "" },
    validate: { name: (value) => (value.trim().length > 0 ? null : "Nama batch harus diisi") },
  });

  // 2. Fetch Data
  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await api.get("/batches");
      setBatches(response.data);
    } catch (err) {
      setError("Gagal mengambil data batch.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBatches(); }, []);

  // 3. LOGIKA PENTING: Filter -> Sort -> Paginate
  const records = useMemo(() => {
    let data = batches;

    // Filter Pencarian
    if (query) {
      data = data.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()));
    }

    // Sorting
    data = sortBy(data, sortStatus.columnAccessor) as Batch[];
    if (sortStatus.direction === "desc") data = data.reverse();

    // Pagination
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    return data.slice(from, to);
  }, [batches, query, sortStatus, page]);

  // Total data (untuk indikator halaman)
  const totalRecords = useMemo(() => {
      return query ? batches.filter(b => b.name.toLowerCase().includes(query.toLowerCase())).length : batches.length;
  }, [batches, query]);

  // Reset halaman ke 1 jika user mengetik di search
  useEffect(() => setPage(1), [query]);

  // 4. Handler Actions (Create/Edit/Delete)
  const handleSubmit = async (values: { name: string }) => {
    try {
      if (editingBatch) {
        await api.patch(`/batches/${editingBatch.id}`, values);
        await showSuccessAlert("Berhasil", "Batch diperbarui");
      } else {
        await api.post("/batches", values);
        await showSuccessAlert("Berhasil", "Batch baru dibuat");
      }
      close(); form.reset(); fetchBatches();
    } catch (err) {
      notifications.show({ title: "Gagal", message: "Terjadi kesalahan", color: "red" });
    }
  };

  // Handler Delete dengan SweetAlert Baru
  // Handler Delete dengan SweetAlert Baru

  // State untuk Multi-Select
  const [selectedRecords, setSelectedRecords] = useState<Batch[]>([]);

  const handleBulkDelete = async () => {
    const count = selectedRecords.length;
    const result = await confirmDelete(
      `Hapus ${count} Batch?`,
      "Data peserta di dalamnya mungkin ikut terhapus!"
    );

    if (result.isConfirmed) {
      try {
        const deletePromises = selectedRecords.map((item) =>
          api.delete(`/batches/${item.id}`)
        );
        await Promise.all(deletePromises);

        await showSuccessAlert("Berhasil!", `${count} batch telah dihapus.`);
        setSelectedRecords([]);
        fetchBatches();
      } catch (err) {
        notifications.show({
          title: "Gagal",
          message: "Terjadi kesalahan saat menghapus beberapa batch.",
          color: "red",
        });
      }
    }
  };

  const handleDelete = async (id: number) => {
    const result = await confirmDelete("Hapus Batch?", "Data peserta di dalamnya mungkin ikut terhapus!");
    if (result.isConfirmed) {
      try {
        await api.delete(`/batches/${id}`);
        setBatches((prev) => prev.filter((b) => b.id !== id)); // Hapus langsung dari tabel
        await showSuccessAlert("Terhapus!", "Batch berhasil dihapus.");
      } catch (err) {
        notifications.show({ title: "Gagal", message: "Gagal menghapus batch.", color: "red" });
      }
    }
  };

  const handleBatchStatusUpdate = async (batchId: number, isActive: boolean) => {
    const action = isActive ? "mengaktifkan" : "menonaktifkan";
    const result = await confirmDelete(
      `Konfirmasi`,
      `Apakah Anda yakin ingin ${action} semua peserta dalam batch ini?`
    );

    if (result.isConfirmed) {
      try {
        await api.patch(`/batches/${batchId}/status`, { is_active: isActive });
        await showSuccessAlert("Berhasil", `Semua peserta dalam batch telah di${isActive ? "aktifkan" : "nonaktifkan"}.`);
      } catch (err) {
        notifications.show({
          title: "Gagal",
          message: "Gagal memperbarui status batch.",
          color: "red",
        });
      }
    }
  };

  if (loading) return <Loader />;
  if (error) return <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">{error}</Alert>;

  return (
    <Stack>
      {/* Modal Form (Create/Edit) */}
      <Modal
        opened={opened}
        onClose={() => { close(); form.reset(); }}
        title={editingBatch ? "Edit Batch" : "Buat Batch Baru"}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput label="Nama Batch" placeholder="Contoh: Batch 2025" withAsterisk {...form.getInputProps("name")} />
            <Group justify="flex-end">
              <Button variant="default" onClick={close}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Header Halaman */}
      <PageHeader
        title="Manajemen Batch"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Batch", href: "/admin/batches" },
        ]}
        actions={
          <Group>
            {selectedRecords.length > 0 && (
              <Button
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={handleBulkDelete}
              >
                Hapus ({selectedRecords.length})
              </Button>
            )}
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => {
                setEditingBatch(null);
                form.reset();
                open();
              }}
            >
              Tambah Batch
            </Button>
          </Group>
        }
      />

      {/* Kolom Pencarian */}
      <TextInput
        placeholder="Cari batch..."
        leftSection={<IconSearch size={16} />}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
      />

      {/* TABEL MODERN */}
      <Paper shadow="xs" withBorder p={0}>
        <DataTable<Batch>
          minHeight={150}
          withTableBorder={false}
          borderRadius="sm"
          striped
          highlightOnHover
          // Data & Pagination
          records={records}
          totalRecords={totalRecords}
          recordsPerPage={PAGE_SIZE}
          page={page}
          onPageChange={setPage}
          selectedRecords={selectedRecords}
          onSelectedRecordsChange={setSelectedRecords}
          isRecordSelectable={(record) => true}
          // Sorting
          sortStatus={sortStatus}
          onSortStatusChange={setSortStatus}
          // Interaksi
          onRowClick={({ record }) =>
            router.push(`/admin/batches/${record.id}`)
          }
          rowStyle={() => ({ cursor: "pointer" })}
          // Definisi Kolom
          columns={[
            { accessor: "name", title: "Nama Batch", sortable: true },
            {
              accessor: "createdAt",
              title: "Tanggal Dibuat",
              sortable: true,
              render: ({ createdAt }) =>
                dayjs(createdAt).format("DD MMM YYYY"),
            },
            {
              accessor: "actions",
              title: "",
              textAlign: "right",
              render: (batch) => (
                <Box onClick={(e) => e.stopPropagation()}>
                  <Menu shadow="md" width={200} position="bottom-end">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>Aksi Batch</Menu.Label>
                      <Menu.Item
                        leftSection={<IconEye size={14} />}
                        onClick={() =>
                          router.push(`/admin/batches/${batch.id}`)
                        }
                      >
                        Lihat Detail
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconPencil size={14} />}
                        onClick={() => {
                          setEditingBatch(batch);
                          form.setValues({ name: batch.name });
                          open();
                        }}
                      >
                        Edit
                      </Menu.Item>
                      
                      <Menu.Divider />
                      <Menu.Label>Status Peserta</Menu.Label>
                      <Menu.Item
                        leftSection={<IconPlus size={14} />} // Ganti icon nanti jika perlu
                        color="green"
                        onClick={() => handleBatchStatusUpdate(batch.id, true)}
                      >
                        Aktifkan Semua
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconAlertCircle size={14} />} // Ganti icon nanti jika perlu
                        color="orange"
                        onClick={() => handleBatchStatusUpdate(batch.id, false)}
                      >
                        Nonaktifkan Semua
                      </Menu.Item>

                      <Menu.Divider />
                      <Menu.Item
                        leftSection={<IconTrash size={14} />}
                        color="red"
                        onClick={() => handleDelete(batch.id)}
                      >
                        Hapus
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Box>
              ),
            },
          ]}
        />
      </Paper>
    </Stack>
  );
}

