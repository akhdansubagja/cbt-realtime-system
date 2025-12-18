// Remove useLocalStorage
import { useEffect, useState } from "react";
import {
  TextInput,
  Textarea,
  Select,
  Box,
  Button,
  Group,
  Text,
  ActionIcon,
  Paper,
  Image,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { IconUpload, IconX, IconPhoto, IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import api from "@/lib/axios";
import { saveDraft, loadDraft, deleteDraft } from "@/lib/indexed-db";

export interface ManualQuestionFormValues {
  question_text: string;
  question_type: string;
  image_url: string;
  options: { key: string; text: string }[];
  correct_answer: string;
}

interface ManualQuestionFormProps {
  bankId?: string | number;
  initialValues?: ManualQuestionFormValues;
  onSubmit: (values: ManualQuestionFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function ManualQuestionForm({
  bankId,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ManualQuestionFormProps) {
  // Determine if we are in "Add" mode (no initialValues provided)
  const isAddMode = !initialValues;
  const storageKey = `draft-manual-qbank-${bankId}`;

  const form = useForm<ManualQuestionFormValues>({
    initialValues: initialValues || {
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

  // 1. Load Draft
  useEffect(() => {
    if (isAddMode && bankId) {
       const load = async () => {
         const draft = await loadDraft<ManualQuestionFormValues>(storageKey);
         if (draft) {
           form.setValues(draft);
         }
       };
       load();
    }
  }, [isAddMode, bankId, storageKey]); // Only run once on mount (or if ID changes)

  // 2. Auto-Save Draft
  useEffect(() => {
    if (isAddMode && bankId) {
      const timer = setTimeout(() => {
          saveDraft(storageKey, form.values);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [form.values, isAddMode, bankId, storageKey]);

  const handleSubmit = (values: typeof form.values) => {
    onSubmit(values);
    if (isAddMode && bankId) {
      deleteDraft(storageKey);
    }
  };

  const handleImageUpload = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

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

  const optionFields = form.values.options.map((item, index) => (
    <Group key={index} mt="xs">
      <TextInput
        placeholder={`Teks untuk pilihan ${item.key}`}
        leftSection={<Text size="sm">{item.key}</Text>}
        withAsterisk
        style={{ flex: 1 }}
        {...form.getInputProps(`options.${index}.text`)}
      />
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

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Textarea
        label="Teks Soal"
        placeholder="Masukkan isi pertanyaan di sini..."
        withAsterisk
        minRows={3}
        {...form.getInputProps("question_text")}
      />

      <Box mt="md">
        {!form.values.image_url && (
          <Dropzone
            onDrop={handleImageUpload}
            onReject={(files) => console.log("rejected files", files)}
            maxSize={5 * 1024 ** 2}
            accept={IMAGE_MIME_TYPE}
          >
            <Group
              justify="center"
              gap="md"
              mih={150}
              style={{ pointerEvents: "none" }}
              wrap="wrap"
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
              <div style={{ textAlign: 'center' }}>
                <Text size="md" inline>
                  Seret gambar ke sini atau klik untuk memilih file (Opsional)
                </Text>
                <Text size="sm" c="dimmed" inline mt={7}>
                  Ukuran file maksimal 5MB
                </Text>
              </div>
            </Group>
          </Dropzone>
        )}

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
        {onCancel && (
          <Button variant="default" onClick={onCancel}>
            Batal
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          Simpan Soal
        </Button>
      </Group>
    </form>
  );
}
