'use client';

import {
  Button,
  Group,
  Modal,
  TextInput,
  Select,
  Stack,
  FileInput,
  Center,
  Avatar,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { notifications } from "@mantine/notifications";
import { Examinee } from "@/types/examinee";
import { Batch } from "@/types/batch";

/** Props untuk ExamineeFormModal */
interface ExamineeFormModalProps {
  /** Apakah modal terbuka */
  opened: boolean;
  /** Callback saat modal ditutup */
  onClose: () => void;
  /** Callback saat data berhasil disimpan */
  onSuccess: () => void;
  /** Data peserta awal untuk edit mode (null jika create mode) */
  initialExaminee?: Examinee | null;
  /** Daftar batch untuk dropdown */
  batches: Batch[];
}

/**
 * Modal form untuk membuat atau mengedit data peserta ujian (Examinee).
 * Mendukung upload avatar dan pemilihan batch.
 */
export function ExamineeFormModal({
  opened,
  onClose,
  onSuccess,
  initialExaminee,
  batches,
}: ExamineeFormModalProps) {
  const [currentAvatarPreview, setCurrentAvatarPreview] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      name: "",
      workplace: "",
      batch_id: null as string | null,
      avatar: null as File | null,
    },
    validate: {
      name: (value) =>
        value.trim().length > 0 ? null : "Nama peserta tidak boleh kosong",
    },
  });

  // Reset form when modal opens or initialExaminee changes
  useEffect(() => {
    if (opened) {
      if (initialExaminee) {
        form.setValues({
          name: initialExaminee.name,
          workplace: initialExaminee.workplace || "",
          batch_id: initialExaminee.batch?.id
            ? String(initialExaminee.batch.id)
            : null,
          avatar: null,
        });
        setCurrentAvatarPreview(
          initialExaminee.avatar_url
            ? `${process.env.NEXT_PUBLIC_API_URL}/${initialExaminee.avatar_url}`
            : null
        );
      } else {
        form.reset();
        setCurrentAvatarPreview(null);
      }
    }
  }, [opened, initialExaminee]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("workplace", values.workplace);

      if (values.batch_id) {
        formData.append("batch_id", values.batch_id);
      }
      if (values.avatar) {
        formData.append("avatar", values.avatar);
      }

      if (initialExaminee) {
        await api.patch(`/examinees/${initialExaminee.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/examinees", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      notifications.show({
        title: "Berhasil!",
        message: initialExaminee
          ? "Data peserta telah diperbarui."
          : "Peserta baru telah ditambahkan.",
        color: "teal",
      });

      onSuccess();
      onClose();
      form.reset();
    } catch (err) {
      notifications.show({
        title: "Gagal",
        message: "Terjadi kesalahan.",
        color: "red",
      });
    }
  };

  const batchOptions = batches.map((batch) => ({
    value: String(batch.id),
    label: batch.name,
  }));

  return (
    <Modal
      opened={opened}
      onClose={() => {
        onClose();
        form.reset();
      }}
      title={initialExaminee ? "Edit Peserta" : "Tambah Peserta Baru"}
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

          {initialExaminee && currentAvatarPreview && !form.values.avatar && (
            <Center>
              <Stack align="center" gap="xs">
                <Text size="sm" c="dimmed">
                  Avatar Saat Ini:
                </Text>
                <Avatar src={currentAvatarPreview} size="xl" radius="md" />
              </Stack>
            </Center>
          )}

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
            value={form.values.batch_id ? String(form.values.batch_id) : null}
            {...form.getInputProps("batch_id")}
            clearable
          />
          <TextInput
            label="Institusi / Tempat Kerja (Opsional)"
            placeholder="Contoh: Universitas Indonesia / PT. Maju Jaya"
            {...form.getInputProps("workplace")}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit">Simpan</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
