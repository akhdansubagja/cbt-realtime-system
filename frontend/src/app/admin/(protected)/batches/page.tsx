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
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Batch } from "@/types/batch";
import Link from "next/link";
import { useForm } from "@mantine/form"; // <-- Tambahkan ini
import { useDisclosure } from "@mantine/hooks"; // <-- Tambahkan ini
import { notifications } from "@mantine/notifications"; // <-- Tambahkan ini
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // State untuk Modal
  const [opened, { open, close }] = useDisclosure(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const router = useRouter(); // <-- TAMBAHKAN INI

  const filteredBatches = batches.filter((batch) =>
    batch.name.toLowerCase().includes(query.toLowerCase())
  );

  // Form hook untuk modal
  const form = useForm({
    initialValues: {
      name: "",
    },
    validate: {
      name: (value) =>
        value.trim().length > 0 ? null : "Nama batch harus diisi",
    },
  });

  // Pindahkan fetchBatches ke luar agar bisa dipanggil lagi
  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/batches");
      // Asumsi /batches mengembalikan array langsung,
      // jika pakai paginasi, gunakan response.data.data
      setBatches(response.data);
    } catch (err) {
      setError("Gagal mengambil data batch. Coba lagi nanti.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Handler untuk Buka Modal (Mode Create)
  const openCreateModal = () => {
    form.reset();
    setEditingBatch(null);
    open();
  };

  // Handler untuk Buka Modal (Mode Edit)
  const openEditModal = (batch: Batch) => {
    form.setValues({ name: batch.name });
    setEditingBatch(batch);
    open();
  };

  // Handler untuk Hapus Batch
  const handleDelete = async (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus batch ini?")) {
      try {
        await api.delete(`/batches/${id}`);
        notifications.show({
          title: "Berhasil!",
          message: "Batch telah dihapus.",
          color: "teal",
        });
        fetchBatches(); // Refresh tabel
      } catch (err) {
        notifications.show({
          title: "Gagal",
          message: "Gagal menghapus batch.",
          color: "red",
        });
      }
    }
  };

  // Handler untuk submit form
  const handleSubmit = async (values: { name: string }) => {
    try {
      if (editingBatch) {
        // Mode Update
        await api.patch(`/batches/${editingBatch.id}`, values);
      } else {
        // Mode Create
        await api.post("/batches", values);
      }

      notifications.show({
        title: "Berhasil!",
        message: `Data batch telah ${
          editingBatch ? "diperbarui" : "ditambahkan"
        }.`,
        color: "teal",
      });

      close();
      form.reset();
      fetchBatches(); // Muat ulang data tabel
    } catch (err) {
      notifications.show({
        title: "Gagal",
        message: "Gagal menyimpan data batch.",
        color: "red",
      });
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

  // Menampilkan data dalam tabel
  const rows = filteredBatches.map(
    (
      batch // <-- Gunakan filteredBatches
    ) => (
      <Table.Tr
        key={batch.id}
        onClick={() => router.push(`/admin/batches/${batch.id}`)}
        style={{ cursor: "pointer" }}
      >
        <Table.Td>{batch.name}</Table.Td>
        <Table.Td>{dayjs(batch.createdAt).format("DD MMM YYYY")}</Table.Td>
        <Table.Td align="right">
          <Box onClick={(e) => e.stopPropagation()}>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <IconDotsVertical size={16} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconEye size={14} />}
                  component={Link}
                  href={`/admin/batches/${batch.id}`}
                >
                  Lihat Detail
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconPencil size={14} />}
                  color="yellow"
                  onClick={() => openEditModal(batch)}
                >
                  Edit
                </Menu.Item>
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
        </Table.Td>
      </Table.Tr>
    )
  );

  return (
    <>
      {/* --- MODAL UNTUK BUAT BATCH BARU --- */}
      <Modal
        opened={opened}
        onClose={() => {
          close();
          form.reset();
        }}
        title="Buat Batch Baru"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              withAsterisk
              label="Nama Batch"
              placeholder="Contoh: Batch Januari 2025"
              {...form.getInputProps("name")}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={close}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* --- MODAL UNTUK CREATE/EDIT --- */}
      <Modal
        opened={opened}
        onClose={() => {
          close();
          form.reset();
        }}
        title={editingBatch ? "Edit Batch" : "Buat Batch Baru"}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              withAsterisk
              label="Nama Batch"
              placeholder="Contoh: Batch Januari 2025"
              {...form.getInputProps("name")}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={close}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* --- JUDUL HALAMAN & TOMBOL --- */}
      <Group justify="space-between" mb="md">
        <Title order={2}>Manajemen Batch</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={open}>
          Tambah Batch
        </Button>
      </Group>

      <TextInput
        placeholder="Cari batch berdasarkan nama..."
        leftSection={<IconSearch size={16} />}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        mb="md"
      />

      {/* --- TABEL DATA --- */}
      <Paper shadow="sm" p="lg">
        {/* V V V PERBARUI EMPTY STATE V V V */}
        {filteredBatches.length === 0 ? (
          <Text>
            {query ? "Tidak ada hasil pencarian" : "Belum ada data batch."}
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nama Batch</Table.Th>
                <Table.Th>Tanggal Dibuat</Table.Th>
                <Table.Th align="right"></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        )}
      </Paper>
    </>
  );
}
