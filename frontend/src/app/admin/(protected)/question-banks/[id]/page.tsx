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
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { useDisclosure, useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconFilter, IconTrash } from "@tabler/icons-react";
import api from "@/lib/axios";
import { useMemo } from "react";
import { Flex, Box, Stack, Badge, Paper, Image, Skeleton } from "@mantine/core";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import {
  IconEdit,
  IconSearch,
  IconPlus,
  IconArrowLeft,
  IconUpload,
  IconX,
  IconPhoto,
  IconCheck,
} from "@tabler/icons-react"; // IconTrash sudah ada
import dayjs from "dayjs";
import sortBy from "lodash/sortBy";
import { confirmDelete, showSuccessAlert } from "@/lib/swal";
import { PageHeader } from "@/components/layout/PageHeader";

// Definisikan tipe data
interface Question {
  id: number;
  question_text: string;
  question_type: "multiple_choice" | "essay";
  options?: { key: string; text: string }[];
  correct_answer?: string;
  image_url?: string;
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
  const PAGE_SIZES = [10, 25, 50, 100];
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
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

  // State untuk View Modal
  const [viewModalOpened, { open: openViewModal, close: closeViewModal }] = useDisclosure(false);
  const [viewQuestion, setViewQuestion] = useState<Question | null>(null);

  const handleRowClick = ({ record }: { record: Question }) => {
    setViewQuestion(record);
    openViewModal();
  };

  // State untuk Multi-Select
  const [selectedRecords, setSelectedRecords] = useState<Question[]>([]);

  // State untuk Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 500);
  const [filterImage, setFilterImage] = useState<string | null>("all");

  const handleBulkDelete = async () => {
    const count = selectedRecords.length;
    const result = await confirmDelete(
      `Hapus ${count} Soal?`,
      "Soal yang dipilih akan dihapus permanen."
    );

    if (result.isConfirmed) {
      try {
        const deletePromises = selectedRecords.map((item) =>
          api.delete(`/questions/${item.id}`)
        );
        await Promise.all(deletePromises);

        await showSuccessAlert("Berhasil!", `${count} soal telah dihapus.`);
        setSelectedRecords([]);
        fetchQuestionsForPage(activePage);
      } catch (err) {
        notifications.show({
          title: "Gagal",
          message: "Terjadi kesalahan saat menghapus beberapa soal.",
          color: "red",
        });
      }
    }
  };

  const handleImageUpload = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    const formData = new FormData();
    formData.append("file", file); // 'file' harus cocok dengan nama field di backend

    // Tampilkan notifikasi loading
    const uploadNotification = notifications.show({
      loading: true,
      title: "Mengunggah gambar...",
      message: "Mohon tunggu.",
      autoClose: false,
      withCloseButton: false,
    });

    api
      .post("/questions/upload", formData)
      .then((response) => {
        // Simpan URL gambar ke dalam form
        form.setFieldValue("image_url", response.data.url);
        notifications.update({
          id: uploadNotification,
          color: "teal",
          title: "Berhasil!",
          message: "Gambar telah berhasil diunggah.",
          icon: <IconUpload size={16} />,
          autoClose: 3000,
        });
      })
      .catch((error) => {
        notifications.update({
          id: uploadNotification,
          color: "red",
          title: "Gagal",
          message: error.response?.data?.message || "Gagal mengunggah gambar.",
          icon: <IconX size={16} />,
          autoClose: 5000,
        });
      });
  };

  // --- 1. SETUP FORM YANG LEBIH KOMPLEKS ---
  const form = useForm({
    initialValues: {
      question_text: "",
      question_type: "multiple_choice",
      image_url: "",
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
      options: (value) => {
        if (value.some((option) => option.text.trim() === "")) {
          return "Semua pilihan jawaban harus diisi";
        }
        return null;
      },
      correct_answer: (value) =>
        !value ? "Kunci jawaban harus dipilih" : null,
    },
  });

  const fetchQuestionsForPage = (page: number) => {
    setLoading(true);
    api
      .get(`/question-banks/${bankId}/questions`, {
        params: {
          page,
          limit: pageSize,
          search: debouncedSearchQuery,
          has_image: filterImage === "all" ? undefined : filterImage === "with_image",
        },
      })
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
  }, [bankId, activePage, pageSize, debouncedSearchQuery, filterImage]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const sortedRecords = useMemo(() => {
    const sorted = sortBy(questions, sortStatus.columnAccessor);
    return sortStatus.direction === "desc" ? sorted.reverse() : sorted;
  }, [questions, sortStatus]);

  // --- FUNGSI UNTUK MEMBUKA MODAL EDIT ---
  const openEditModal = (question: Question) => {
    setEditingQuestion(question);
    form.setValues({
      question_text: question.question_text,
      question_type: "multiple_choice",
      image_url: question.image_url || "",
      options: question.options || [
        { key: "A", text: "" },
        { key: "B", text: "" },
      ],
      correct_answer: question.correct_answer || "",
    });
    open();
  };

  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    form.reset();
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
      question_type: "multiple_choice",
      image_url: values.image_url,
      options: values.options,
      correct_answer: values.correct_answer,
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
      
      // Refresh data soal
      fetchQuestionsForPage(activePage);

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

          <Box mt="md">
            {/* Jika BELUM ada gambar, tampilkan Dropzone */}
            {!form.values.image_url && (
              <Dropzone
                onDrop={handleImageUpload}
                onReject={(files) => console.log("rejected files", files)}
                maxSize={5 * 1024 ** 2} // 5MB
                accept={IMAGE_MIME_TYPE}
              >
                <Group
                  justify="center"
                  gap="xl"
                  mih={150}
                  style={{ pointerEvents: "none" }}
                >
                  <Dropzone.Accept>
                    <IconUpload size={52} stroke={1.5} />
                  </Dropzone.Accept>
                  <Dropzone.Reject>
                    <IconX size={52} stroke={1.5} />
                  </Dropzone.Reject>
                  <Dropzone.Idle>
                    <IconPhoto size={52} stroke={1.5} />
                  </Dropzone.Idle>
                  <div>
                    <Text size="xl" inline>
                      Seret gambar ke sini atau klik untuk memilih file(Opsional)
                    </Text>
                    <Text size="sm" c="dimmed" inline mt={7}>
                      Ukuran file maksimal 5MB
                    </Text>
                  </div>
                </Group>
              </Dropzone>
            )}

            {/* Jika SUDAH ada gambar, tampilkan preview dan tombol hapus */}
            {form.values.image_url && (
              <Paper withBorder p="sm" radius="sm">
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}${form.values.image_url}`}
                  alt="Preview soal"
                  height={200}
                  width="auto"
                  fit="contain"
                />
                <Button
                  fullWidth
                  variant="light"
                  color="red"
                  mt="sm"
                  onClick={() => form.setFieldValue("image_url", "")}
                >
                  Hapus Gambar
                </Button>
              </Paper>
            )}
          </Box>

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

      {/* --- MODAL DETAIL SOAL --- */}
      <Modal
        opened={viewModalOpened}
        onClose={closeViewModal}
        title="Detail Soal"
        size="lg"
        centered
      >
        {viewQuestion && (
          <Stack>
            {viewQuestion.image_url && (
              <Box>
                <Text fw={500} mb="xs">Gambar:</Text>
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}${viewQuestion.image_url}`}
                  alt="Gambar Soal"
                  radius="md"
                  fit="contain"
                  mah={300}
                />
              </Box>
            )}
            
            <Box>
              <Text fw={500} mb="xs">Pertanyaan:</Text>
              <Paper withBorder p="md" bg="gray.0">
                <Text>{viewQuestion.question_text}</Text>
              </Paper>
            </Box>

            <Group>
              <Badge color={viewQuestion.question_type === 'multiple_choice' ? 'blue' : 'orange'}>
                {viewQuestion.question_type === 'multiple_choice' ? 'Pilihan Ganda' : 'Esai'}
              </Badge>
            </Group>

            {viewQuestion.question_type === 'multiple_choice' && viewQuestion.options && (
              <Box>
                <Text fw={500} mb="xs">Pilihan Jawaban:</Text>
                <Stack gap="xs">
                  {viewQuestion.options.map((opt) => (
                    <Group key={opt.key} align="flex-start" wrap="nowrap">
                      <Badge 
                        variant={opt.key === viewQuestion.correct_answer ? "filled" : "outline"}
                        color={opt.key === viewQuestion.correct_answer ? "green" : "gray"}
                        size="lg"
                        circle
                      >
                        {opt.key}
                      </Badge>
                      <Text style={{ flex: 1 }}>{opt.text}</Text>
                    </Group>
                  ))}
                </Stack>
                {viewQuestion.correct_answer && (
                   <Alert color="green" title="Kunci Jawaban" mt="md" icon={<IconCheck size={16}/>}>
                      Jawaban Benar: {viewQuestion.correct_answer}
                   </Alert>
                )}
              </Box>
            )}
          </Stack>
        )}
      </Modal>

      <Stack>
        <PageHeader
          title={bankData?.name || "Detail Bank Soal"}
          breadcrumbs={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "Bank Soal", href: "/admin/question-banks" },
            { label: bankData?.name || "Detail", href: "#" },
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
              <Button leftSection={<IconPlus size={16} />} onClick={handleOpenAddModal}>
                Tambah Soal Baru
              </Button>
            </Group>
          }
        />

        {/* --- SEARCH & FILTER --- */}
        <Group align="end" grow>
          <TextInput
            label="Pencarian"
            placeholder="Cari soal..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            style={{ flex: 2 }}
          />
          <Select
            label="Filter Gambar"
            placeholder="Filter Gambar"
            leftSection={<IconFilter size={16} />}
            data={[
              { value: "all", label: "Semua Soal" },
              { value: "with_image", label: "Dengan Gambar" },
              { value: "without_image", label: "Tanpa Gambar" },
            ]}
            value={filterImage}
            onChange={setFilterImage}
            style={{ flex: 1 }}
          />
        </Group>

        {/* --- TABEL SOAL BARU --- */}
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
            <DataTable<Question>
              withTableBorder={false}
              withColumnBorders={false}
              borderRadius="lg"
              shadow="sm"
              striped
              highlightOnHover
              minHeight={200}
              records={sortedRecords}
              selectedRecords={selectedRecords}
              onSelectedRecordsChange={setSelectedRecords}
              isRecordSelectable={(record) => true}
              idAccessor="id"
              fetching={loading}
            columns={[
              {
                accessor: "id",
                title: "ID",
                width: 80,
                sortable: true,
              },
              {
                accessor: "has_image",
                title: "",
                width: 50,
                render: (record) => (
                  record.image_url ? (
                    <IconPhoto size={20} color="gray" style={{ opacity: 0.7 }} />
                  ) : null
                ),
              },
              { accessor: "question_text", title: "Teks Soal", ellipsis: true },
              {
                accessor: "actions",
                title: "Aksi",
                textAlign: "center",
                width: 120,
                render: (question) => (
                  <Group gap={4} justify="center" wrap="nowrap" onClick={(e) => e.stopPropagation()}>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="yellow"
                      onClick={() => openEditModal(question)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
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
            onRowClick={handleRowClick}
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            totalRecords={totalPages * pageSize}
            recordsPerPage={pageSize}
            page={activePage}
            onPageChange={(p) => setPage(p)}
            recordsPerPageOptions={PAGE_SIZES}
            onRecordsPerPageChange={setPageSize}
            noRecordsText="Belum ada soal di bank soal ini."
          />
          )}
        </Box>
      </Stack>
    </>
  );
}
