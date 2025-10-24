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
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import api from "@/lib/axios";
import Link from "next/link";

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

  const form = useForm({
    initialValues: { name: "" },
    validate: {
      name: (value) =>
        value.trim().length > 0 ? null : "Nama peserta tidak boleh kosong",
    },
  });

  useEffect(() => {
    setLoading(true);
    api.get(`/examinees?page=${activePage}&limit=${limit}`)
      .then((response) => {
        setExaminees(response.data.data);
        setTotalPages(response.data.last_page);
      })
      .catch(() => setError('Gagal mengambil data peserta.'))
      .finally(() => setLoading(false));
  }, [activePage]); // <-- Dijalankan setiap kali 'activePage' berubah

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
            <Button type="submit">Simpan</Button>
          </Group>
        </form>
      </Modal>

      <Group justify="space-between">
        <Title order={2}>Manajemen Peserta</Title>
        <Button
          onClick={() => {
            setEditingExaminee(null);
            form.reset();
            open();
          }}
        >
          Tambah Peserta Baru
        </Button>
      </Group>

      <Table mt="md" withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: 60 }}>ID</Table.Th>
            <Table.Th>Nama Peserta</Table.Th>
            <Table.Th>Tanggal Didaftarkan</Table.Th>
            <Table.Th style={{ width: 180 }}>Aksi</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      {examinees.length === 0 && (
        <Text mt="md" ta="center">
          Belum ada peserta yang didaftarkan.
        </Text>
      )}

      {totalPages > 1 && (
        <Center mt="md">
          <Pagination total={totalPages} value={activePage} onChange={setPage} />
        </Center>
      )}
    </>
  );
}
