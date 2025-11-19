"use client";

import { useEffect, useState } from "react";
import {
  Title,
  Table,
  Loader,
  Alert,
  Center,
  Button,
  Group,
  Text,
  Modal,
  TextInput,
  Pagination,
  Select,
  Avatar,
  FileInput,
  Image,
  rem,
  Menu,
  Skeleton,
} from "@mantine/core";
import { useDisclosure, useHotkeys } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import api from "@/lib/axios";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { Stack, ActionIcon, Flex, Box, Kbd } from "@mantine/core";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import {
  IconEdit,
  IconTrash,
  IconSearch,
  IconPlus,
  IconEye,
  IconDotsVertical,
  IconPencil,
  IconFilter,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import sortBy from "lodash/sortBy";
import dayjs from "dayjs";
import { Batch } from "@/types/batch";
import { confirmDelete, showSuccessAlert } from "@/lib/swal";
import { PageHeader } from "@/components/layout/PageHeader";

interface Examinee {
  id: number;
  name: string;
  created_at: string;
  batch: Batch | null; // <-- GANTI dari batch_id?: number
  avatar_url: string | null;
}

export default function ExamineesPage() {
  const [examinees, setExaminees] = useState<Examinee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingExaminee, setEditingExaminee] = useState<Examinee | null>(null);
  const [activePage, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZES = [10, 25, 50, 100];
  const [pageSize, setPageSize] = useState(PAGE_SIZES[3]);
  const [query, setQuery] = useState("");
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Examinee>>({
    columnAccessor: "name",
    direction: "asc",
  });
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string | null>(
    null
  );

  // --- STATE BARU 2: MULTI-SELECT ---
  const [selectedRecords, setSelectedRecords] = useState<Examinee[]>([]);

  const router = useRouter();

  const [imageModalOpened, { open: openImageModal, close: closeImageModal }] =
    useDisclosure(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // const untuk preiview avatar
  const [currentAvatarPreview, setCurrentAvatarPreview] = useState<
    string | null
  >(null);

  const form = useForm({
    initialValues: {
      name: "",
      batch_id: null as string | null,
      avatar: null as File | null,
    },
    validate: {
      name: (value) =>
        value.trim().length > 0 ? null : "Nama peserta tidak boleh kosong",
    },
  });

  const fetchBatches = async () => {
    try {
      const response = await api.get("/batches");

      // PERBAIKAN: Endpoint ini mengembalikan array secara langsung
      setBatches(response.data);
    } catch (err) {
      console.error("Gagal mengambil data batch untuk dropdown");
    }
  };

  const fetchExaminees = async (
    page = activePage,
    search = debouncedQuery,
    batchId = selectedBatchFilter
  ) => {
    try {
      setLoading(true);
      // Bangun URL dengan parameter filter
      let url = `/examinees?page=${page}&limit=${pageSize}&search=${search}`;
      if (batchId) {
        url += `&batch_id=${batchId}`;
      }

      const response = await api.get(url);
      setExaminees(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (err) {
      setError("Gagal mengambil data peserta.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Panggil fungsi yang sudah dideklarasikan di atas
    fetchExaminees();
    // --- PERUBAHAN 2 DI SINI ---
  }, [activePage, debouncedQuery, pageSize, selectedBatchFilter]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    fetchBatches();
  }, []);

  useHotkeys([["/", () => searchInputRef.current?.focus()]]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  const openEditModal = (examinee: Examinee) => {
    setEditingExaminee(examinee);
    if (examinee.avatar_url) {
      // Pastikan URL ini sesuai dengan cara Anda menampilkan gambar di tabel
      setCurrentAvatarPreview(`http://localhost:3000/${examinee.avatar_url}`);
    } else {
      setCurrentAvatarPreview(null);
    }
    form.setValues({
      name: examinee.name,
      batch_id: examinee.batch?.id ? String(examinee.batch.id) : null,
      avatar: null, // Selalu reset input file saat edit
    });
    open();
  };

  const handleBulkDelete = async () => {
    const count = selectedRecords.length;
    const result = await confirmDelete(
      `Hapus ${count} Peserta?`,
      "Data yang dipilih akan dihapus permanen beserta avatarnya."
    );

    if (result.isConfirmed) {
      try {
        // Karena backend belum ada endpoint deleteBulk, kita loop (Promise.all)
        // Ini solusi cepat tanpa ubah backend besar-besaran
        const deletePromises = selectedRecords.map((item) =>
          api.delete(`/examinees/${item.id}`)
        );

        await Promise.all(deletePromises);

        await showSuccessAlert("Berhasil!", `${count} peserta telah dihapus.`);

        setSelectedRecords([]); // Reset checklist
        fetchExaminees(); // Refresh data
      } catch (err) {
        notifications.show({
          title: "Gagal",
          message: "Terjadi kesalahan saat menghapus beberapa data.",
          color: "red",
        });
      }
    }
  };

  const handleDeleteExaminee = async (examineeId: number) => {
    const result = await confirmDelete(
      "Hapus Peserta?",
      "Peserta ini akan dihapus permanen dari sistem."
    );

    if (result.isConfirmed) {
      try {
        await api.delete(`/examinees/${examineeId}`);

        // Update state tabel
        setExaminees((current) => current.filter((e) => e.id !== examineeId));
        // 2. Panggil Alert Sukses di sini
        await showSuccessAlert("Terhapus!", "Data peserta berhasil dihapus.");
      } catch (err) {
        notifications.show({
          title: "Gagal",
          message: "Terjadi kesalahan saat menghapus peserta.",
          color: "red",
        });
      }
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      // 1. Buat FormData
      const formData = new FormData();
      formData.append("name", values.name);

      if (values.batch_id) {
        formData.append("batch_id", values.batch_id);
      }
      if (values.avatar) {
        formData.append("avatar", values.avatar);
      }

      if (editingExaminee) {
        // 2. Kirim sebagai PATCH (catatan: beberapa backend butuh _method='PATCH')
        await api.patch(`/examinees/${editingExaminee.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // 3. Kirim sebagai POST
        await api.post("/examinees", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // 4. Logika sisanya sama
      await fetchExaminees(); // Panggil fetchExaminees yang sudah di-await

      notifications.show({
        title: "Berhasil!",
        message: editingExaminee
          ? "Data peserta telah diperbarui."
          : "Peserta baru telah ditambahkan.",
        color: "teal",
      });

      close();
      form.reset();
      setEditingExaminee(null);
    } catch (err) {
      notifications.show({
        title: "Gagal",
        message: "Terjadi kesalahan.",
        color: "red",
      });
    }
  };

  const handleAvatarClick = (imageUrl: string | null) => {
    if (imageUrl) {
      setSelectedImage(`http://localhost:3000/${imageUrl}`);
      openImageModal();
    }
  };



  const rows = examinees.map((examinee) => (
    <Table.Tr key={examinee.id}>
      <Table.Td>{examinee.id}</Table.Td>
      <Table.Td>
        <Link
          href={`/admin/examinees/${examinee.id}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          {examinee.name}
        </Link>
      </Table.Td>
      <Table.Td>{new Date(examinee.created_at).toLocaleDateString()}</Table.Td>
      <Table.Td>
        <Group>
          <Button
            size="xs"
            variant="outline"
            onClick={() => openEditModal(examinee)}
          >
            Edit
          </Button>
          <Button
            size="xs"
            color="red"
            onClick={() => handleDeleteExaminee(examinee.id)}
          >
            Hapus
          </Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  const batchOptions = batches.map((batch) => ({
    value: String(batch.id), // Select butuh value string
    label: batch.name,
  }));

  return (
    <>
      {/* --- MODAL UNTUK GAMBAR --- */}
      <Modal
        opened={imageModalOpened}
        onClose={closeImageModal}
        title="Lihat Avatar"
        centered
        size="lg"
      >
        <Image src={selectedImage} alt="Avatar Peserta" />
      </Modal>

      {/* Modal untuk Tambah/Edit */}
      <Modal
        opened={opened}
        onClose={() => {
          close();
          setEditingExaminee(null);
          form.reset();
        }}
        title={editingExaminee ? "Edit Peserta" : "Tambah Peserta Baru"}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              withAsterisk
              label="Nama Lengkap Peserta"
              placeholder="Contoh: Budi Santoso"
              {...form.getInputProps("name")}
            />
            {/* 1. Preview Avatar Lama (Hanya muncul saat Edit dan user BELUM pilih file baru) */}
            {editingExaminee && currentAvatarPreview && !form.values.avatar && (
              <Center>
                <Stack align="center" gap="xs">
                  <Text size="sm" c="dimmed">
                    Avatar Saat Ini:
                  </Text>
                  <Avatar src={currentAvatarPreview} size="xl" radius="md" />
                </Stack>
              </Center>
            )}

            {/* 2. Preview Avatar Baru (Muncul jika user BARU SAJA memilih file dari komputer) */}
            {form.values.avatar && (
              <Center>
                <Stack align="center" gap="xs">
                  <Text size="sm" c="teal">
                    Akan diganti menjadi:
                  </Text>
                  <Avatar
                    src={URL.createObjectURL(form.values.avatar)}
                    size="xl"
                    radius="md"
                  />
                </Stack>
              </Center>
            )}
            <FileInput
              label="Foto Avatar (Opsional)"
              placeholder="Pilih gambar..."
              accept="image/png,image/jpeg"
              {...form.getInputProps("avatar")}
            />
            <Select
              label="Batch"
              placeholder="Pilih batch (Opsional)"
              data={batchOptions}
              // Konversi nilai form (number) ke string, dan sebaliknya
              value={form.values.batch_id ? String(form.values.batch_id) : null}
              {...form.getInputProps("batch_id")}
              clearable
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

      {/* --- BAGIAN BARU DIMULAI DARI SINI --- */}
      <Stack>
        <PageHeader
          title="Manajemen Peserta"
          breadcrumbs={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "Peserta", href: "/admin/examinees" },
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
                  setEditingExaminee(null);
                  setCurrentAvatarPreview(null);
                  form.reset();
                  open();
                }}
              >
                Tambah Baru
              </Button>
            </Group>
          }
        />

        {/* --- AREA FILTER --- */}
        <Group align="end" grow>
          {/* Search Input */}
          <TextInput
            style={{ flex: 2 }}
            ref={searchInputRef}
            placeholder="Cari nama peserta..."
            leftSection={<IconSearch size={16} />}
            rightSection={<Kbd>/</Kbd>}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            label="Pencarian"
          />

          {/* Filter Batch Dropdown */}
          <Select
            style={{ flex: 1 }}
            label="Filter berdasarkan Batch"
            placeholder="Semua Batch"
            data={batches.map((b) => ({ value: String(b.id), label: b.name }))}
            value={selectedBatchFilter}
            onChange={setSelectedBatchFilter}
            clearable
            leftSection={<IconFilter size={16} />}
          />
        </Group>

        <Box>
          {loading ? (
            <Stack>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={50} radius="sm" />
              ))}
            </Stack>
          ) : error ? (
            <Alert color="red" title="Error">
              {error}
            </Alert>
          ) : (
            <DataTable<Examinee>
              withTableBorder
              withColumnBorders={false}
              borderRadius="md"
              shadow="sm"
              striped
              highlightOnHover
              rowStyle={() => ({ cursor: "pointer" })}
              onRowClick={({ record: examinee }) => {
                router.push(`/admin/examinees/${examinee.id}`);
              }}
              minHeight={200}
              records={examinees}
              selectedRecords={selectedRecords}
              onSelectedRecordsChange={setSelectedRecords}
              isRecordSelectable={(record) => true} // Semua bisa dipilih
              idAccessor="id"
              columns={[
                {
                  accessor: "avatar_url",
                  title: "Avatar",
                  width: 80,
                  render: (examinee) => (
                    <Box onClick={(e) => e.stopPropagation()}>
                      <Avatar
                        src={
                          examinee.avatar_url
                            ? `http://localhost:3000/${examinee.avatar_url}`
                            : null
                        }
                        radius="xl"
                        onClick={() => handleAvatarClick(examinee.avatar_url)}
                        style={{
                          cursor: examinee.avatar_url ? "pointer" : "default",
                        }}
                      >
                        {examinee.name.charAt(0)}
                      </Avatar>
                    </Box>
                  ),
                },
                { accessor: "name", title: "Nama Peserta", sortable: true },
                {
                  accessor: "batch", // <-- Ganti accessor ke 'batch' (lebih akurat)
                  title: "Batch",
                  sortable: false,
                  render: (examinee) =>
                    examinee.batch?.name || <Text c="dimmed">N/A</Text>, // <-- GANTI LOGIKA INI
                },
                {
                  accessor: "created_at",
                  title: "Tanggal Didaftarkan",
                  sortable: false,
                  render: (record) =>
                    dayjs(record.created_at).format("DD MMM YYYY"),
                },
                {
                  accessor: "actions",
                  title: "",
                  textAlign: "right",
                  render: (examinee) => (
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
                            onClick={() =>
                              router.push(`/admin/examinees/${examinee.id}`)
                            }
                          >
                            Lihat Riwayat
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconPencil size={14} />}
                            color="yellow"
                            onClick={() => openEditModal(examinee)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color="red"
                            onClick={() => handleDeleteExaminee(examinee.id)}
                          >
                            Hapus
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Box>
                  ),
                },
              ]}
              sortStatus={sortStatus}
              onSortStatusChange={setSortStatus}
              totalRecords={totalPages * pageSize} // Total data dari server
              recordsPerPage={pageSize}
              page={activePage}
              onPageChange={(p) => setPage(p)}
              recordsPerPageOptions={PAGE_SIZES}
              onRecordsPerPageChange={setPageSize}
              paginationText={({ from, to, totalRecords }) =>
                `${from} - ${to} dari ${totalRecords}`
              }
              noRecordsText="Tidak ada data untuk ditampilkan"
            />
          )}
        </Box>
      </Stack>
    </>
  );
}
