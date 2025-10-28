// src/app/admin/(protected)/question-banks/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Textarea,
  Select,
  SimpleGrid,
  ActionIcon,
  Pagination,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconTrash } from "@tabler/icons-react";
import api from "@/lib/axios";
import { useMemo } from "react";
import { Flex, Box, Stack, Badge } from "@mantine/core";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import {
  IconEdit,
  IconSearch,
  IconPlus,
  IconArrowLeft,
} from "@tabler/icons-react"; // IconTrash sudah ada
import dayjs from "dayjs";
import sortBy from "lodash/sortBy";

// Definisikan tipe data
interface Question {
  id: number;
  question_text: string;
  question_type: "multiple_choice" | "essay";
  options?: { key: string; text: string }[];
  correct_answer?: string;
}

interface QuestionBankWithQuestions {
  id: number;
  name: string;
  questions: Question[];
}

export default function SingleQuestionBankPage() {
  const params = useParams();
  const router = useRouter();
  const bankId = params.id as string;

  const [bankData, setBankData] = useState<QuestionBankWithQuestions | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [opened, { open, close }] = useDisclosure(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [activePage, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(
    null
  );
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Question>>({
    columnAccessor: "id",
    direction: "asc",
  });

  // --- 1. SETUP FORM YANG LEBIH KOMPLEKS ---
  const form = useForm({
    initialValues: {
      question_text: "",
      question_type: "multiple_choice" as "multiple_choice" | "essay",
      options: [
        { key: "A", text: "" },
        { key: "B", text: "" },
        { key: "C", text: "" },
        { key: "D", text: "" },
        { key: "E", text: "" },
      ],
      correct_answer: "",
    },
    validate: {
      question_text: (value) =>
        value.trim().length > 0 ? null : "Teks soal tidak boleh kosong",
      options: (value, values) => {
        if (values.question_type === "multiple_choice") {
          if (value.some((option) => option.text.trim() === "")) {
            return "Semua pilihan jawaban harus diisi";
          }
        }
        return null;
      },
      correct_answer: (value, values) =>
        values.question_type === "multiple_choice" && !value
          ? "Kunci jawaban harus dipilih"
          : null,
    },
  });

  const fetchQuestionsForPage = (page: number) => {
    setLoading(true);
    api
      .get(`/question-banks/${bankId}/questions?page=${page}&limit=${limit}`)
      .then((questionsRes) => {
        setQuestions(questionsRes.data.data);
        setTotalPages(questionsRes.data.last_page);
      })
      .catch(() => setError("Gagal memuat data soal."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Efek ini hanya mengambil info bank soal dan soal halaman pertama
    api
      .get(`/question-banks/${bankId}`)
      .then((bankRes) => setBankData(bankRes.data))
      .catch(() => setError("Gagal memuat info bank soal."));

    // Panggil fungsi terpusat untuk mengambil soal
    fetchQuestionsForPage(activePage);
  }, [bankId, activePage]);

  const sortedRecords = useMemo(() => {
    const sorted = sortBy(questions, sortStatus.columnAccessor);
    return sortStatus.direction === "desc" ? sorted.reverse() : sorted;
  }, [questions, sortStatus]);

  // --- FUNGSI UNTUK MEMBUKA MODAL EDIT ---
  const openEditModal = (question: Question) => {
    setEditingQuestion(question);
    form.setValues({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || [
        { key: "A", text: "" },
        { key: "B", text: "" },
      ],
      correct_answer: question.correct_answer || "",
    });
    open();
  };

  const showDeleteModal = (question: Question) => {
    setQuestionToDelete(question);
    openDeleteModal();
  };

  // --- FUNGSI UNTUK MENGHAPUS SOAL ---
  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return; // Guard clause
    try {
      await api.delete(`/questions/${questionToDelete.id}`);
      // Refresh data soal untuk halaman saat ini
      fetchQuestionsForPage(activePage);
      notifications.show({
        title: "Berhasil!",
        message: "Soal telah dihapus.",
        color: "teal",
      });
    } catch (err) {
      notifications.show({
        title: "Gagal",
        message: "Terjadi kesalahan saat menghapus soal.",
        color: "red",
      });
    } finally {
      // Tutup modal dan reset state
      setQuestionToDelete(null);
      closeDeleteModal();
    }
  };

  // --- FUNGSI SUBMIT YANG BISA CREATE & UPDATE ---
  const handleSubmit = async (values: typeof form.values) => {
    const payload = {
      bank_id: parseInt(bankId),
      question_text: values.question_text,
      question_type: values.question_type,
      ...(values.question_type === "multiple_choice" && {
        options: values.options,
        correct_answer: values.correct_answer,
      }),
    };

    try {
      let response: any;
      if (editingQuestion) {
        // --- LOGIKA UPDATE ---
        response = await api.patch(`/questions/${editingQuestion.id}`, payload);
        if (bankData) {
          setBankData({
            ...bankData,
            questions: bankData.questions.map((q) =>
              q.id === editingQuestion.id ? response.data : q
            ),
          });
        }
        notifications.show({
          title: "Berhasil!",
          message: "Soal telah berhasil diperbarui.",
          color: "teal",
        });
      } else {
        // --- LOGIKA CREATE ---
        response = await api.post("/questions", payload);
        if (bankData) {
          setBankData({
            ...bankData,
            questions: [...bankData.questions, response.data],
          });
        }
        notifications.show({
          title: "Berhasil!",
          message: "Soal baru telah berhasil ditambahkan.",
          color: "teal",
        });
      }
      close();
      form.reset();
      setEditingQuestion(null);
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

  const optionFields = form.values.options.map((item, index) => (
    <Group key={index} mt="xs">
      <TextInput
        placeholder={`Teks untuk pilihan ${item.key}`}
        leftSection={<Text size="sm">{item.key}</Text>}
        withAsterisk
        style={{ flex: 1 }}
        {...form.getInputProps(`options.${index}.text`)}
      />
      {/* Hanya tampilkan tombol hapus jika ada lebih dari 2 opsi */}
      {index > 1 && (
        <ActionIcon
          color="red"
          onClick={() => form.removeListItem("options", index)}
        >
          <IconTrash size={16} />
        </ActionIcon>
      )}
    </Group>
  ));

  const rows = questions.map((question) => (
    <Table.Tr key={question.id}>
      <Table.Td>{question.id}</Table.Td>
      <Table.Td>{question.question_text.substring(0, 100)}...</Table.Td>
      <Table.Td>
        {question.question_type === "multiple_choice"
          ? "Pilihan Ganda"
          : "Esai"}
      </Table.Td>
      <Table.Td>
        <Group>
          {/* --- TAMBAHKAN onClick DI SINI --- */}
          <Button
            size="xs"
            variant="outline"
            onClick={() => openEditModal(question)}
          >
            Edit
          </Button>
          {/* --- DAN TAMBAHKAN onClick DI SINI --- */}
          <Button
            size="xs"
            color="red"
            onClick={() => showDeleteModal(question)}
          >
            Hapus
          </Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      {/* --- 3. MODAL UNTUK FORM TAMBAH SOAL --- */}
      <Modal
        opened={opened}
        onClose={close}
        title="Tambah Soal Baru"
        size="lg"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Textarea
            label="Teks Soal"
            placeholder="Masukkan isi pertanyaan di sini..."
            withAsterisk
            minRows={3}
            {...form.getInputProps("question_text")}
          />
          <Select
            label="Tipe Soal"
            data={["multiple_choice", "essay"]}
            mt="md"
            withAsterisk
            {...form.getInputProps("question_type")}
          />

          {/* Tampilkan bagian ini hanya jika tipe soalnya Pilihan Ganda */}
          {form.values.question_type === "multiple_choice" && (
            <>
              <Text size="sm" mt="md" fw={500}>
                Pilihan Jawaban
              </Text>

              {/* HANYA TAMPILKAN 'optionFields' SATU KALI */}
              {optionFields}

              <Group justify="flex-start" mt="md">
                <Button
                  variant="light"
                  onClick={() => {
                    const nextKey = String.fromCharCode(
                      65 + form.values.options.length
                    );
                    form.insertListItem("options", { key: nextKey, text: "" });
                  }}
                >
                  + Tambah Opsi
                </Button>
              </Group>

              <Select
                label="Kunci Jawaban"
                placeholder="Pilih jawaban yang benar"
                data={form.values.options.map((opt) => opt.key)}
                mt="md"
                withAsterisk
                {...form.getInputProps("correct_answer")}
              />
            </>
          )}

          <Group justify="flex-end" mt="xl">
            <Button type="submit">Simpan Soal</Button>
          </Group>
        </form>
      </Modal>

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Konfirmasi Penghapusan"
        centered
        size="sm"
      >
        <Text>Apakah Anda yakin ingin menghapus soal ini?</Text>
        <Text fw={700} truncate mt="xs">
          {questionToDelete?.question_text}
        </Text>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={closeDeleteModal}>
            Batal
          </Button>
          <Button color="red" onClick={handleDeleteQuestion}>
            Hapus Soal
          </Button>
        </Group>
      </Modal>

      <Stack>
        {/* --- HEADER BARU --- */}
        <Flex justify="space-between" align="center">
          <Group>
            <ActionIcon
              variant="default"
              onClick={() => router.back()}
              size="lg"
            >
              <IconArrowLeft />
            </ActionIcon>
            <Box>
              <Text c="dimmed" size="xs">
                Bank Soal
              </Text>
              <Title order={3}>{bankData?.name}</Title>
            </Box>
          </Group>
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Tambah Soal Baru
          </Button>
        </Flex>

        {/* --- TABEL SOAL BARU --- */}
        <Box>
          <DataTable<Question>
            withTableBorder
            withColumnBorders
            borderRadius="md"
            shadow="sm"
            minHeight={200}
            records={sortedRecords}
            idAccessor="id"
            columns={[
              { accessor: "question_text", title: "Teks Soal", ellipsis: true },
              {
                accessor: "question_type",
                title: "Tipe",
                textAlign: "center",
                width: 150,
                render: (q) => (
                  <Badge
                    variant="light"
                    color={q.question_type === "essay" ? "blue" : "teal"}
                  >
                    {q.question_type === "multiple_choice"
                      ? "Pilihan Ganda"
                      : "Esai"}
                  </Badge>
                ),
              },
              {
                accessor: "actions",
                title: "Aksi",
                textAlign: "center",
                width: 120,
                render: (question) => (
                  <Group gap={4} justify="center" wrap="nowrap">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="yellow"
                      onClick={() => openEditModal(question)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>{" "}
                    {/* <-- PERBAIKAN: Tag penutup sekarang benar */}
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="red"
                      onClick={() => showDeleteModal(question)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                ),
              },
            ]}
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            totalRecords={totalPages * limit}
            recordsPerPage={limit}
            page={activePage}
            onPageChange={(p) => setPage(p)}
            noRecordsText="Belum ada soal di bank soal ini."
          />
        </Box>
      </Stack>
    </>
  );
}
