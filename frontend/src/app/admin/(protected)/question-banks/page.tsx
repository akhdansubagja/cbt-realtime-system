"use client";

import { useEffect, useState } from "react";
import {
  Title,
  Table,
  Loader,
  Alert,
  Center,
  Button,
  Modal,
  TextInput,
  Textarea,
  Group,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import api from "@/lib/axios";
import Link from "next/link";
import { useMemo } from "react";
import { Stack, ActionIcon, Text, Flex, Box } from "@mantine/core";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import {
  IconEdit,
  IconTrash,
  IconSearch,
  IconPlus,
  IconEye,
  IconFileText,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import sortBy from "lodash/sortBy";
import dayjs from "dayjs";


interface QuestionBank {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export default function QuestionBanksPage() {
  const router = useRouter();
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [opened, { open, close }] = useDisclosure(false); // Hook untuk mengontrol modal
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [descModalOpened, { open: openDescModal, close: closeDescModal }] =
    useDisclosure(false);
  const [selectedDescription, setSelectedDescription] = useState("");
  const [query, setQuery] = useState("");
  const [sortStatus, setSortStatus] = useState<
    DataTableSortStatus<QuestionBank>
  >({
    // <-- TAMBAHKAN <QuestionBank> DI SINI
    columnAccessor: "name",
    direction: "asc",
  });

  const [page, setPage] = useState(1);
  const PAGE_SIZES = [10, 20, 50];
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

  // Fungsi untuk membuka modal dalam mode 'edit'
  const openEditModal = (bank: QuestionBank) => {
    setEditingBank(bank); // Simpan data bank yang akan diedit
    form.setValues({ name: bank.name, description: bank.description }); // Isi form dengan datanya
    open(); // Buka modal
  };

  // Fungsi untuk menangani penghapusan
  const handleDeleteBank = async (bankId: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus bank soal ini?")) {
      try {
        await api.delete(`/question-banks/${bankId}`);
        // Hapus bank soal dari daftar tanpa me-refresh
        setBanks((currentBanks) => currentBanks.filter((b) => b.id !== bankId));
        notifications.show({
          title: "Berhasil!",
          message: "Bank soal telah dihapus.",
          color: "teal",
        });
      } catch (err) {
        notifications.show({
          title: "Gagal",
          message: "Terjadi kesalahan saat menghapus bank soal.",
          color: "red",
        });
      }
    }
  };

  // Hook untuk mengelola form
  const form = useForm({
    initialValues: {
      name: "",
      description: "",
    },
    validate: {
      name: (value) =>
        value.trim().length > 0 ? null : "Nama bank soal tidak boleh kosong",
    },
  });

  // Fetch data awal
  useEffect(() => {
    const fetchQuestionBanks = async () => {
      try {
        const response = await api.get("/question-banks");
        setBanks(response.data);
      } catch (err) {
        setError("Gagal mengambil data bank soal.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestionBanks();
  }, []);

  const paginatedRecords = useMemo(() => {
    let filtered = banks;
    if (query) {
      filtered = banks.filter(
        ({ name, description }) =>
          name.toLowerCase().includes(query.toLowerCase()) ||
          (description &&
            description.toLowerCase().includes(query.toLowerCase()))
      );
    }
    const sorted = sortBy(filtered, sortStatus.columnAccessor);
    const reversed =
      sortStatus.direction === "desc" ? sorted.reverse() : sorted;

    // Logika pemotongan data untuk paginasi
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    return reversed.slice(from, to);
  }, [banks, query, sortStatus, page, pageSize]);

  // Fungsi untuk menangani submit form
  const handleSubmit = async (values: typeof form.values) => {
    try {
      if (editingBank) {
        // --- UPDATE LOGIC ---
        const response = await api.patch(
          `/question-banks/${editingBank.id}`,
          values
        );
        setBanks((currentBanks) =>
          currentBanks.map((b) => (b.id === editingBank.id ? response.data : b))
        );
        notifications.show({
          title: "Berhasil!",
          message: "Bank soal telah berhasil diperbarui.",
          color: "teal",
        });
      } else {
        // --- CREATE LOGIC (yang sudah ada) ---
        const response = await api.post("/question-banks", values);
        setBanks((currentBanks) => [...currentBanks, response.data]);
        notifications.show({
          title: "Berhasil!",
          message: "Bank soal baru telah berhasil ditambahkan.",
          color: "teal",
        });
      }
      close();
      form.reset();
      setEditingBank(null); // Reset state edit
    } catch (err) {
      notifications.show({
        title: "Gagal",
        message: "Terjadi kesalahan.",
        color: "red",
      });
    }
  };

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

  const rows = banks.map((bank) => (
    <Table.Tr key={bank.id}>
      <Table.Td>{bank.id}</Table.Td>
      <Table.Td>
        <Link
          href={`/admin/question-banks/${bank.id}`}
          style={{ textDecoration: "none" }}
        >
          {bank.name}
        </Link>
      </Table.Td>
      <Table.Td>{bank.description}</Table.Td>
      <Table.Td>{new Date(bank.created_at).toLocaleDateString()}</Table.Td>
      <Table.Td>
        <Group>
          <Button
            size="xs"
            variant="outline"
            onClick={() => openEditModal(bank)}
          >
            Edit
          </Button>
          <Button
            size="xs"
            color="red"
            onClick={() => handleDeleteBank(bank.id)}
          >
            Hapus
          </Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      {/* Modal untuk Tambah/Edit (sudah ada, sedikit dimodifikasi) */}
      <Modal
        opened={opened}
        onClose={() => {
          close();
          setEditingBank(null);
          form.reset();
        }}
        title={editingBank ? "Edit Bank Soal" : "Tambah Bank Soal Baru"}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            withAsterisk
            label="Nama Bank Soal"
            placeholder="Contoh: Matematika Dasar"
            {...form.getInputProps("name")}
          />
          <Textarea
            label="Deskripsi"
            placeholder="Deskripsi singkat mengenai bank soal"
            mt="md"
            {...form.getInputProps("description")}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>
              Batal
            </Button>
            <Button type="submit">Simpan</Button>
          </Group>
        </form>
      </Modal>

      <Modal
        opened={descModalOpened}
        onClose={closeDescModal}
        title="Deskripsi Lengkap"
        centered
      >
        <Text style={{ whiteSpace: "pre-wrap" }}>{selectedDescription}</Text>
      </Modal>

      {/* --- BAGIAN BARU DIMULAI DARI SINI --- */}
      <Stack>
        <Flex justify="space-between" align="center">
          <Title order={2}>Manajemen Bank Soal</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Tambah Baru
          </Button>
        </Flex>

        <TextInput
          placeholder="Cari bank soal berdasarkan nama atau deskripsi..."
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />

        <Box>
          <DataTable<QuestionBank>
            withTableBorder={false}
            withColumnBorders={false}
            borderRadius="md"
            shadow="sm"
            striped
            highlightOnHover
            minHeight={200}
            records={paginatedRecords} // <-- Menggunakan data yang sudah difilter & diurutkan
            idAccessor="id"
            columns={[
              { accessor: "name", title: "Nama Bank Soal", sortable: true },
              {
                accessor: "description",
                title: "Deskripsi",
                width: 150, // Beri lebar tetap agar rapi
                render: (bank) => {
                  // Jika tidak ada deskripsi, jangan tampilkan tombol
                  if (!bank.description) {
                    return (
                      <Text c="dimmed" fs="italic" size="xs">
                        -
                      </Text>
                    );
                  }

                  // Tampilkan tombol "Lihat" yang akan memicu modal
                  return (
                    <Button
                      size="compact-sm"
                      variant="outline"
                      leftSection={<IconFileText size={14} />}
                      onClick={(e) => {
                        e.stopPropagation(); // Mencegah event lain terpicu
                        setSelectedDescription(bank.description);
                        openDescModal();
                      }}
                    >
                      Lihat Detail
                    </Button>
                  );
                },
              },
              {
                accessor: "created_at",
                title: "Tanggal Dibuat",
                sortable: true,
                render: (record) =>
                  dayjs(record.created_at).format("DD MMM YYYY"),
              },
              {
                accessor: "actions",
                title: "Aksi",
                render: (bank) => (
                  <Group gap={4} justify="center" wrap="nowrap">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="blue"
                      onClick={() =>
                        router.push(`/admin/question-banks/${bank.id}`)
                      }
                    >
                      <IconEye size={20} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="yellow"
                      onClick={() => openEditModal(bank)}
                    >
                      <IconEdit size={20} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="red"
                      onClick={() => handleDeleteBank(bank.id)}
                    >
                      <IconTrash size={20} />
                    </ActionIcon>
                  </Group>
                ),
              },
            ]}
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            totalRecords={query ? paginatedRecords.length : banks.length}
            recordsPerPage={pageSize}
            page={page}
            onPageChange={(p) => setPage(p)}
            recordsPerPageOptions={PAGE_SIZES}
            onRecordsPerPageChange={setPageSize}
            noRecordsText="Tidak ada data untuk ditampilkan"
            paginationText={({ from, to, totalRecords }) =>
              `${from} - ${to} dari ${totalRecords}`
            }
          />
        </Box>
      </Stack>
    </>
  );
}
