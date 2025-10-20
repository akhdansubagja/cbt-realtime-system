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

interface QuestionBank {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export default function QuestionBanksPage() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [opened, { open, close }] = useDisclosure(false); // Hook untuk mengontrol modal
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);

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
            <Button type="submit">Simpan</Button>
          </Group>
        </form>
      </Modal>

      <Group justify="space-between">
        <Title order={2}>Manajemen Bank Soal</Title>
        <Button onClick={open}>Tambah Bank Soal Baru</Button>
      </Group>

      <Table mt="md" withTableBorder withColumnBorders>
        <Table.Thead>{/* ... Header Tabel ... */}</Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
      {/* ... Tampilan jika tabel kosong ... */}
    </>
  );
}
