// src/app/admin/(protected)/exams/page.tsx
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
  Badge,
  Modal,
  TextInput,
  NumberInput,
  SimpleGrid,
  ActionIcon,
  MultiSelect,
  Select,
  Paper,
  Stack,
  ScrollArea,
  Checkbox,
  Textarea,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import "dayjs/locale/id"; // Import locale untuk bahasa Indonesia
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import api from "@/lib/axios";
import Link from "next/link";

// Definisikan tipe data yang kita butuhkan
interface Exam {
  id: number;
  title: string;
  code: string;
  duration_minutes: number;
  start_time: string | null;
  end_time: string | null;
}
interface QuestionBank {
  value: string;
  label: string;
}
interface Question {
  id: number;
  question_text: string;
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [opened, { open, close }] = useDisclosure(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]); // State baru untuk menyimpan semua soal
  const [
    questionPickerModalOpened,
    { open: openQuestionPickerModal, close: closeQuestionPickerModal },
  ] = useDisclosure(false); // Modal baru untuk katalog soal
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]); // State untuk checkbox
  const [pickerBankId, setPickerBankId] = useState<string | null>(null); // Untuk dropdown di modal
  const [questionsInPicker, setQuestionsInPicker] = useState<Question[]>([]); // Untuk daftar soal di modal

  const form = useForm({
    initialValues: {
      title: "",
      code: "",
      duration_minutes: 60,
      start_time: null,
      end_time: null,
      manual_questions: [] as { question_id: number; point: number }[],
      random_rules: [] as {
        question_bank_id: number;
        number_of_questions: number;
        point_per_question: number;
      }[],
    },
    // ... (validasi bisa ditambahkan nanti)
  });

  // Fetch data awal (ujian dan bank soal)
  useEffect(() => {
    Promise.all([
      api.get("/exams"),
      api.get("/question-banks"),
      api.get("/questions"), // <-- Tambahkan request baru ini
    ])
      .then(([examsRes, banksRes, questionsRes]) => {
        setExams(examsRes.data);
        setQuestionBanks(
          banksRes.data.map((b: any) => ({
            value: b.id.toString(),
            label: b.name,
          }))
        );
        setAllQuestions(questionsRes.data); // <-- Simpan semua soal ke state baru
      })
      .catch(() => {
        setError("Gagal mengambil data awal.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Efek ini berjalan setiap kali bank soal di modal picker berubah
  useEffect(() => {
    // Jika tidak ada bank soal yang dipilih, kosongkan daftar soal
    if (!pickerBankId) {
      setQuestionsInPicker([]);
      return;
    }

    // Ambil detail bank soal, yang di dalamnya sudah termasuk daftar soalnya
    api
      .get(`/question-banks/${pickerBankId}`)
      .then((response) => {
        setQuestionsInPicker(response.data.questions);
      })
      .catch(() => {
        notifications.show({
          title: "Gagal",
          message: "Tidak dapat memuat soal dari bank soal yang dipilih.",
          color: "red",
        });
      });
  }, [pickerBankId]); // <-- 'Dengarkan' perubahan pada pickerBankId

  const handleDeleteExam = async (examId: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus ujian ini?")) {
      try {
        await api.delete(`/exams/${examId}`);
        setExams((current) => current.filter((e) => e.id !== examId));
        notifications.show({
          title: "Berhasil!",
          message: "Ujian telah dihapus.",
          color: "teal",
        });
      } catch (err) {
        notifications.show({
          title: "Gagal",
          message: "Gagal menghapus ujian.",
          color: "red",
        });
      }
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    const payload = {
      ...values,
      start_time: values.start_time
        ? new Date(values.start_time).toISOString()
        : null,
      end_time: values.end_time
        ? new Date(values.end_time).toISOString()
        : null,
    };

    try {
      if (editingExam) {
        const response = await api.patch(`/exams/${editingExam.id}`, payload);
        setExams((current) =>
          current.map((e) => (e.id === editingExam.id ? response.data : e))
        );
        notifications.show({
          title: "Berhasil!",
          message: "Ujian telah diperbarui.",
          color: "teal",
        });
      } else {
        const response = await api.post("/exams", payload);
        setExams((current) => [response.data, ...current]);
        notifications.show({
          title: "Berhasil!",
          message: "Ujian baru telah dibuat.",
          color: "teal",
        });
      }
      close();
      form.reset();
      setEditingExam(null);
    } catch (err) {
      notifications.show({
        title: "Gagal",
        message: "Terjadi kesalahan.",
        color: "red",
      });
    }
  };

  // Fungsi untuk membuka katalog soal
  const handleSelectQuestions = () => {
    // Ambil ID soal yang sudah ada di 'keranjang' (form)
    const currentlySelectedIds = form.values.manual_questions.map(
      (q) => q.question_id
    );
    // Set state checkbox agar sesuai dengan yang sudah ada di keranjang
    setSelectedQuestionIds(currentlySelectedIds);
    // Buka modal katalog
    openQuestionPickerModal();
  };

  // Fungsi untuk mengkonfirmasi pilihan dari katalog
  const handleConfirmQuestionSelection = () => {
    // Buat daftar soal baru berdasarkan ID yang dicentang
    const selectedQuestions = selectedQuestionIds.map((id) => {
      // Cari apakah soal ini sudah ada di form sebelumnya untuk mempertahankan poinnya
      const existing = form.values.manual_questions.find(
        (q) => q.question_id === id
      );
      return existing || { question_id: id, point: 10 }; // Beri poin default 10 untuk soal baru
    });
    // Update nilai form dengan 'keranjang' yang baru
    form.setFieldValue("manual_questions", selectedQuestions);
    // Tutup modal katalog
    closeQuestionPickerModal();
  };

  const openEditModal = async (exam: Exam) => {
    // Ambil detail lengkap dari exam
    const response = await api.get(`/exams/${exam.id}`);
    const examDetails = response.data;
    setEditingExam(examDetails);

    // --- LAKUKAN TRANSFORMASI DATA DI SINI ---
    const transformedRules = examDetails.exam_rules.map((rule: any) => ({
      ...rule,
      // Ambil ID dari objek 'question_bank' dan ubah menjadi string
      question_bank_id: rule.question_bank.id.toString(),
    }));
    // --- AKHIR TRANSFORMASI ---

    form.setValues({
      ...examDetails,
      start_time: examDetails.start_time
        ? new Date(examDetails.start_time)
        : null,
      end_time: examDetails.end_time ? new Date(examDetails.end_time) : null,
      manual_questions: examDetails.exam_questions.map((q: any) => ({
        question_id: q.question.id,
        point: q.point,
      })),
      random_rules: transformedRules, // <-- GUNAKAN DATA YANG SUDAH DITRANSFORMASI
    });
    open();
  };

  const getStatus = (startTime: string | null, endTime: string | null) => {
    const now = new Date();
    const start = startTime ? new Date(startTime) : null;
    const end = endTime ? new Date(endTime) : null;

    if (end && now > end) return <Badge color="gray">Selesai</Badge>;
    if (start && now >= start)
      return <Badge color="green">Sedang Berlangsung</Badge>;
    if (start && now < start) return <Badge color="blue">Terjadwal</Badge>;
    return <Badge color="violet">Selalu Aktif</Badge>;
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

  const rows = exams.map((exam) => (
    <Table.Tr key={exam.id}>
      <Table.Td>{exam.id}</Table.Td>
      <Table.Td>{exam.title}</Table.Td>
      <Table.Td>{exam.code}</Table.Td>
      <Table.Td>{exam.duration_minutes} Menit</Table.Td>
      <Table.Td>{getStatus(exam.start_time, exam.end_time)}</Table.Td>
      <Table.Td>
        <Group>
          <Link href={`/admin/monitoring/${exam.id}`}>
            <Button size="xs" variant="filled">
              Monitor
            </Button>
          </Link>
          <Button
            size="xs"
            variant="outline"
            onClick={() => openEditModal(exam)}
          >
            Edit
          </Button>
          <Button
            size="xs"
            color="red"
            onClick={() => handleDeleteExam(exam.id)}
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
          setEditingExam(null);
          form.reset();
          setPickerBankId(null);
          setQuestionsInPicker([]);
        }}
        title={editingExam ? "Edit Ujian" : "Buat Ujian Baru"}
        size="xl"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Paper withBorder p="md" radius="md">
              <Title order={4}>Info Dasar</Title>
              <SimpleGrid cols={2} mt="md">
                <TextInput
                  withAsterisk
                  label="Judul Ujian"
                  placeholder="Contoh: Ujian Tengah Semester"
                  {...form.getInputProps("title")}
                />
                <TextInput
                  withAsterisk
                  label="Kode Ujian"
                  placeholder="Contoh: UTS-2025"
                  {...form.getInputProps("code")}
                />
              </SimpleGrid>
              <SimpleGrid cols={3} mt="md">
                <NumberInput
                  withAsterisk
                  label="Durasi (menit)"
                  placeholder="60"
                  {...form.getInputProps("duration_minutes")}
                />
                <DateTimePicker
                  locale="id"
                  label="Waktu Mulai (Opsional)"
                  placeholder="Pilih tanggal & waktu"
                  {...form.getInputProps("start_time")}
                />
                <DateTimePicker
                  locale="id"
                  label="Waktu Selesai (Opsional)"
                  placeholder="Pilih tanggal & waktu"
                  {...form.getInputProps("end_time")}
                />
              </SimpleGrid>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <Title order={4}>Soal Manual</Title>
                {/* Tombol ini sekarang memanggil fungsi untuk membuka katalog */}
                <Button
                  variant="light"
                  size="xs"
                  onClick={handleSelectQuestions}
                >
                  <IconPlus size={14} /> Pilih Soal
                </Button>
              </Group>

              {/* Tampilkan daftar soal yang sudah dipilih */}
              {form.values.manual_questions.length > 0 ? (
                form.values.manual_questions.map((item, index) => {
                  // Cari detail soal berdasarkan ID untuk ditampilkan
                  const questionDetail = allQuestions.find(
                    (q) => q.id === item.question_id
                  );
                  return (
                    <Group key={index} mt="xs" grow>
                      <Text size="sm" style={{ flex: 3 }} truncate>
                        {questionDetail
                          ? `${questionDetail.id}: ${questionDetail.question_text}`
                          : `Soal ID: ${item.question_id}`}
                      </Text>
                      <NumberInput
                        placeholder="Poin"
                        {...form.getInputProps(
                          `manual_questions.${index}.point`
                        )}
                      />
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() =>
                          form.removeListItem("manual_questions", index)
                        }
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  );
                })
              ) : (
                <Text c="dimmed" size="sm" ta="center" mt="sm">
                  Belum ada soal manual yang dipilih.
                </Text>
              )}
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <Title order={4}>Aturan Soal Acak</Title>
                <Button
                  variant="light"
                  size="xs"
                  onClick={() =>
                    form.insertListItem("random_rules", {
                      question_bank_id: "",
                      number_of_questions: "",
                      point_per_question: "",
                    })
                  }
                >
                  <IconPlus size={14} /> Tambah
                </Button>
              </Group>
              {form.values.random_rules.map((item, index) => (
                <Group key={index} mt="xs" grow>
                  <Select
                    placeholder="Pilih Bank Soal"
                    data={questionBanks}
                    {...form.getInputProps(
                      `random_rules.${index}.question_bank_id`
                    )}
                  />
                  <NumberInput
                    placeholder="Jumlah Soal"
                    {...form.getInputProps(
                      `random_rules.${index}.number_of_questions`
                    )}
                  />
                  <NumberInput
                    placeholder="Poin/Soal"
                    {...form.getInputProps(
                      `random_rules.${index}.point_per_question`
                    )}
                  />
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => form.removeListItem("random_rules", index)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
            </Paper>
          </Stack>
          <Group justify="flex-end" mt="xl">
            <Button type="submit">Simpan Ujian</Button>
          </Group>
        </form>
      </Modal>

      <Modal
        opened={questionPickerModalOpened}
        onClose={closeQuestionPickerModal}
        title="Pilih Soal Manual"
        size="lg"
        centered
      >
        {/* --- DROPDOWN FILTER BARU --- */}
        <Select
          label="Filter berdasarkan Bank Soal"
          placeholder="Pilih bank soal untuk menampilkan soal"
          data={questionBanks}
          value={pickerBankId}
          onChange={(value) => {
            setPickerBankId(value);
            // Kosongkan centang saat bank soal diganti
            setSelectedQuestionIds(
              form.values.manual_questions
                .map((q) => q.question_id)
                .filter((id) => questionsInPicker.some((qip) => qip.id === id))
            );
          }}
          clearable
          searchable
          mb="md"
        />

        <ScrollArea h={350}>
          {questionsInPicker.length > 0 ? (
            <Checkbox.Group
              value={selectedQuestionIds.map(String)}
              onChange={(values) => setSelectedQuestionIds(values.map(Number))}
            >
              <Stack>
                {questionsInPicker.map((question) => (
                  <Checkbox
                    key={question.id}
                    value={question.id.toString()}
                    label={`${question.id}: ${question.question_text}`}
                  />
                ))}
              </Stack>
            </Checkbox.Group>
          ) : (
            <Text c="dimmed" ta="center">
              Pilih bank soal untuk melihat daftar soal.
            </Text>
          )}
        </ScrollArea>
        <Group justify="flex-end" mt="md">
          <Button onClick={handleConfirmQuestionSelection}>
            Tambahkan Soal Terpilih
          </Button>
        </Group>
      </Modal>

      <Group justify="space-between">
        <Title order={2}>Manajemen Ujian</Title>
        <Button
          onClick={() => {
            setEditingExam(null);
            form.reset();
            open();
          }}
        >
          Buat Ujian Baru
        </Button>
      </Group>

      <Table mt="md" withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: 60 }}>ID</Table.Th>
            <Table.Th>Judul Ujian</Table.Th>
            <Table.Th>Kode</Table.Th>
            <Table.Th>Durasi</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th style={{ width: 180 }}>Aksi</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      {exams.length === 0 && (
        <Text mt="md" ta="center">
          Belum ada ujian yang dibuat.
        </Text>
      )}
    </>
  );
}
