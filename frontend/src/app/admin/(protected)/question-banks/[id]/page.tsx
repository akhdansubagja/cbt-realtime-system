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
  Tabs,
  Menu,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { useDisclosure, useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconFilter, IconTrash, IconList, IconBolt } from "@tabler/icons-react";
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
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { QuickImportPanel } from "@/components/questions/QuickImportPanel";
import { ManualQuestionForm, ManualQuestionFormValues } from "@/components/questions/ManualQuestionForm";
import { ParsedQuestion } from "@/lib/question-parser";

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
  const { pageSize, setPageSize, PAGE_SIZES } = useUserPreferences();
  const [questions, setQuestions] = useState<Question[]>([]);
  // Delete state removed (using SweetAlert)
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Question>>({
    columnAccessor: "id",
    direction: "desc",
  });

  // State untuk View Modal
  const [viewModalOpened, { open: openViewModal, close: closeViewModal }] = useDisclosure(false);
  const [viewQuestion, setViewQuestion] = useState<Question | null>(null);

  // State for Add Modal (Unified)
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);


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
    openAddModal();
  };

  // showDeleteModal removed

  // --- FUNGSI UNTUK MENGHAPUS SOAL ---
  const handleDeleteQuestion = async (question: Question) => {
    const result = await confirmDelete(
      "Hapus Soal?",
      "Apakah Anda yakin ingin menghapus soal ini? Tindakan ini tidak dapat dibatalkan."
    );

    if (result.isConfirmed) {
      try {
        await api.delete(`/questions/${question.id}`);
        // Refresh data soal untuk halaman saat ini
        fetchQuestionsForPage(activePage);
        await showSuccessAlert("Berhasil!", "Soal telah dihapus.");
      } catch (err) {
        notifications.show({
          title: "Gagal",
          message: "Terjadi kesalahan saat menghapus soal.",
          color: "red",
        });
      }
    }
  };

  // --- FUNGSI SUBMIT YANG BISA CREATE & UPDATE ---
  // --- FUNGSI SUBMIT YANG BISA CREATE & UPDATE ---
  // Note: ManualQuestionForm handles its own submit, but we need a handler for the Edit Modal
  // which still uses the old form logic or we can reuse ManualQuestionForm there too.
  // For now, let's keep the Edit Modal separate or refactor it to use ManualQuestionForm as well.
  // The prompt asked to unified "Add Question" modal.
  // Let's refactor the Edit Modal to use ManualQuestionForm for consistency?
  // Or just keep the old form for Edit and use ManualQuestionForm for Add?
  // The prompt says: "Extract ManualQuestionForm... Move useForm... logic here".
  // This implies we should use it for both.
  
  const handleManualSubmit = async (values: ManualQuestionFormValues) => {
    const payload = {
      bank_id: parseInt(bankId),
      question_text: values.question_text,
      question_type: "multiple_choice",
      image_url: values.image_url,
      options: values.options,
      correct_answer: values.correct_answer,
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        close(); // Close Edit Modal
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
        closeAddModal(); // Close Add Modal
      }
      
      // Refresh data soal
      fetchQuestionsForPage(activePage);
      setEditingQuestion(null);
    } catch (err) {
      notifications.show({
        title: "Gagal",
        message: "Terjadi kesalahan.",
        color: "red",
      });
    }
  };

  const handleBulkImport = async (parsedQuestions: ParsedQuestion[]) => {
    try {
      const formData = new FormData();
      
      const questionsData = parsedQuestions.map(q => ({
        text: q.question_text,
        type: 'multiple_choice',
        options: q.options.map(opt => ({
          text: opt.text,
          isCorrect: opt.key === q.correct_answer
        }))
      }));

      formData.append('data', JSON.stringify({
        bankId: parseInt(bankId),
        questions: questionsData
      }));

      parsedQuestions.forEach((q, index) => {
        if (q.imageFile) {
          formData.append(`images_${index}`, q.imageFile);
        }
      });

      await api.post('/questions/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      notifications.show({
        title: "Berhasil!",
        message: `${parsedQuestions.length} soal berhasil diimpor.`,
        color: "teal",
      });

      fetchQuestionsForPage(activePage);
      closeAddModal();
    } catch (err) {
      notifications.show({
        title: "Gagal",
        message: "Gagal mengimpor soal.",
        color: "red",
      });
      throw err; // Re-throw to let modal know it failed
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



  const handleExport = (format: 'docx' | 'pdf') => {
    let url = `${process.env.NEXT_PUBLIC_API_URL}/question-banks/${bankId}/export?format=${format}`;
    
    if (selectedRecords.length > 0) {
      const ids = selectedRecords.map((r) => r.id).join(',');
      url += `&ids=${ids}`;
    }

    window.open(url, '_blank');
  };

  return (
    <>
      {/* ... Modals ... */}
      <Modal
        opened={addModalOpened}
        onClose={closeAddModal}
        title="Tambah Soal Baru"
        size="90%"
        centered
        styles={{ body: { height: '90vh', display: 'flex', flexDirection: 'column' } }}
      >
        <QuickImportPanel 
          bankId={bankId}
          onSave={handleBulkImport} 
          onCancel={closeAddModal} 
        />
      </Modal>

      {/* ... Other Modals ... */}
      <Modal
        opened={opened}
        onClose={close}
        title="Edit Soal"
        size="lg"
        centered
      >
        {editingQuestion && (
          <ManualQuestionForm
            initialValues={{
              question_text: editingQuestion.question_text,
              question_type: editingQuestion.question_type,
              image_url: editingQuestion.image_url || "",
              options: editingQuestion.options || [],
              correct_answer: editingQuestion.correct_answer || "",
            }}
            onSubmit={handleManualSubmit}
            onCancel={close}
          />
        )}
      </Modal>

      {/* Modal Konfirmasi Penghapusan dihapus (ganti SweetAlert) */}

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
              
              {/* Export Dropdown */}
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button variant="outline" leftSection={<IconBolt size={16} />}>
                    {selectedRecords.length > 0 ? `Export (${selectedRecords.length})` : 'Export'}
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Format</Menu.Label>
                  <Menu.Item leftSection={<IconList size={14} />} onClick={() => handleExport('docx')}>
                    Export to DOCX
                  </Menu.Item>
                  <Menu.Item leftSection={<IconList size={14} />} onClick={() => handleExport('pdf')}>
                    Export to PDF
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>

              <Button leftSection={<IconPlus size={16} />} onClick={handleOpenAddModal}>
                Tambah Soal
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
            label="Filter Soal"
            placeholder="Filter Soal"
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
                accessor: "index",
                title: "No",
                width: 35,
                render: (_, index) => (activePage - 1) * pageSize + index + 1,
              },
              { accessor: "question_text", title: "Teks Soal", width: "60%" }, // Expanded width
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
                      onClick={() => handleDeleteQuestion(question)}
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
