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
} from "@mantine/core";
import { useDisclosure, useHotkeys} from "@mantine/hooks";
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
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import sortBy from "lodash/sortBy";
import dayjs from "dayjs";

interface Examinee {
  id: number;
  name: string;
  created_at: string;
}

export default function ExamineesPage() {
  const [examinees, setExaminees] = useState<Examinee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [opened, { open, close }] = useDisclosure(false);
  const [editingExaminee, setEditingExaminee] = useState<Examinee | null>(null);
  const [activePage, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10; // 10 data per halaman
  const [query, setQuery] = useState("");
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Examinee>>({
    columnAccessor: "name",
    direction: "asc",
  });
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const form = useForm({
    initialValues: { name: "" },
    validate: {
      name: (value) =>
        value.trim().length > 0 ? null : "Nama peserta tidak boleh kosong",
    },
  });

  useEffect(() => {
    setLoading(true);
    // Tambahkan parameter `search` ke URL
    api
      .get(
        `/examinees?page=${activePage}&limit=${limit}&search=${debouncedQuery}`
      )
      .then((response) => {
        setExaminees(response.data.data);
        setTotalPages(response.data.last_page);
      })
      .catch(() => setError("Gagal mengambil data peserta."))
      .finally(() => setLoading(false));
    // --- PERUBAHAN 2 DI SINI ---
  }, [activePage, debouncedQuery]);

  useHotkeys([
    ['/', () => searchInputRef.current?.focus()],
  ]);

  useEffect(() => {
    // Atur timer untuk 500ms (setengah detik)
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    // Fungsi cleanup ini sangat penting.
    // Ia akan membatalkan timer sebelumnya setiap kali Anda mengetik huruf baru.
    return () => {
      clearTimeout(handler);
    };
  }, [query]); // <-- useEffect ini hanya berjalan saat 'query' berubah

  const openEditModal = (examinee: Examinee) => {
    setEditingExaminee(examinee);
    form.setValues({ name: examinee.name });
    open();
  };

  const handleDeleteExaminee = async (examineeId: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus peserta ini?")) {
      try {
        await api.delete(`/examinees/${examineeId}`);
        setExaminees((current) => current.filter((e) => e.id !== examineeId));
        notifications.show({
          title: "Berhasil!",
          message: "Peserta telah dihapus.",
          color: "teal",
        });
      } catch (err) {
        notifications.show({
          title: "Gagal",
          message: "Terjadi kesalahan saat menghapus peserta.",
          color: "red",
        });
      }
    }
  };

  const handleSubmit = async (values: { name: string }) => {
    try {
      if (editingExaminee) {
        const response = await api.patch(
          `/examinees/${editingExaminee.id}`,
          values
        );
        setExaminees((current) =>
          current.map((e) => (e.id === editingExaminee.id ? response.data : e))
        );
        notifications.show({
          title: "Berhasil!",
          message: "Data peserta telah diperbarui.",
          color: "teal",
        });
      } else {
        const response = await api.post("/examinees", values);
        setExaminees((current) => [...current, response.data]);
        notifications.show({
          title: "Berhasil!",
          message: "Peserta baru telah ditambahkan.",
          color: "teal",
        });
      }
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

  return (
    <>
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
          <TextInput
            withAsterisk
            label="Nama Lengkap Peserta"
            placeholder="Contoh: Budi Santoso"
            {...form.getInputProps("name")}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>
              Batal
            </Button>
            <Button type="submit">Simpan</Button>
          </Group>
        </form>
      </Modal>

      {/* --- BAGIAN BARU DIMULAI DARI SINI --- */}
      <Stack>
        <Flex justify="space-between" align="center">
          <Title order={2}>Manajemen Peserta</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              setEditingExaminee(null);
              form.reset();
              open();
            }}
          >
            Tambah Baru
          </Button>
        </Flex>

        <TextInput
          ref={searchInputRef}
          placeholder="Cari peserta berdasarkan nama..."
          leftSection={<IconSearch size={16} />}
          rightSection={<Kbd>/</Kbd>}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />

        <Box>
          <DataTable<Examinee>
            withTableBorder
            withColumnBorders
            borderRadius="md"
            shadow="sm"
            minHeight={200}
            records={examinees}
            idAccessor="id"
            columns={[
              { accessor: "name", title: "Nama Peserta", sortable: true },
              {
                accessor: "created_at",
                title: "Tanggal Didaftarkan",
                sortable: true,
                textAlign: "center",
                render: (record) =>
                  dayjs(record.created_at).format("DD MMM YYYY"),
              },
              {
                accessor: "actions",
                title: "Aksi",
                textAlign: "center",
                render: (examinee) => (
                  <Group gap={4} justify="center" wrap="nowrap">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="blue"
                      onClick={() =>
                        router.push(`/admin/examinees/${examinee.id}`)
                      }
                    >
                      <IconEye size={20} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="yellow"
                      onClick={() => openEditModal(examinee)}
                    >
                      <IconEdit size={20} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="red"
                      onClick={() => handleDeleteExaminee(examinee.id)}
                    >
                      <IconTrash size={20} />
                    </ActionIcon>
                  </Group>
                ),
              },
            ]}
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            // --- Mengintegrasikan Paginasi Server-Side ---
            totalRecords={totalPages * limit}
            recordsPerPage={limit}
            page={activePage}
            onPageChange={(p) => setPage(p)}
            noRecordsText="Tidak ada data untuk ditampilkan"
          />
        </Box>
      </Stack>
    </>
  );
}
