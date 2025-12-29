// frontend/src/components/examinees/BulkAddExamineesModal.tsx
'use client';

import {
  Modal,
  Stack,
  TextInput,
  FileInput,
  Button,
  Group,
  ActionIcon,
  Text,
  Flex,
  Select,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Batch } from '@/types/batch';

// Tipe untuk data form
interface FormValues {
  examinees: {
    name: string;
    avatar: File | null;
  }[];
  batch_id: string | null; // Kita gunakan string untuk Select
}

// Tipe untuk props komponen
/** Props untuk BulkAddExamineesModal */
interface BulkAddExamineesModalProps {
  /** Apakah modal terbuka */
  opened: boolean;
  /** Fungsi penutup modal */
  onClose: () => void;
  /** Fungsi untuk me-refresh tabel di halaman induk setelah sukses */
  onSuccess: () => void; 
  /** Jika modal ini dibuka dari halaman detail batch, batchId akan dikunci */
  lockedBatchId?: number; 
}

/**
 * Modal untuk menambahkan banyak peserta sekaligus secara manual.
 * User dapat menambah baris input nama dan avatar.
 */
export function BulkAddExamineesModal({
  opened,
  onClose,
  onSuccess,
  lockedBatchId,
}: BulkAddExamineesModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchOptions, setBatchOptions] = useState<{ value: string; label: string }[]>([]);

  const form = useForm<FormValues>({
    initialValues: {
      examinees: [{ name: '', avatar: null }], // Mulai dengan 1 baris
      batch_id: lockedBatchId ? String(lockedBatchId) : null,
    },
    validate: {
      examinees: {
        name: (value) => (value.trim().length > 0 ? null : 'Nama harus diisi'),
      },
    },
  });

  // Ambil data batch (jika tidak di-lock) untuk dropdown
  useEffect(() => {
    if (!lockedBatchId) {
      api.get('/batches').then((res) => {
        const options = res.data.map((batch: Batch) => ({
          value: String(batch.id),
          label: batch.name,
        }));
        setBatchOptions(options);
      });
    }
  }, [lockedBatchId]);

  // Handler untuk submit
  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Tambahkan batch_id jika ada
      if (values.batch_id) {
        formData.append('batch_id', values.batch_id);
      }

      // Loop melalui setiap peserta dan tambahkan datanya
     values.examinees.forEach((examinee, index) => {
        formData.append('names[]', examinee.name); 
        
        if (examinee.avatar) {
          formData.append('avatars', examinee.avatar);
        }
      });

      // Panggil API backend baru kita
      await api.post('/examinees/bulk-with-avatars', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      notifications.show({
        title: 'Berhasil!',
        message: 'Semua peserta baru telah ditambahkan.',
        color: 'teal',
      });
      onSuccess(); // Panggil fungsi refresh
      handleClose(); // Tutup modal
    } catch (err) {
      notifications.show({
        title: 'Gagal',
        message: 'Gagal menambahkan peserta.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi untuk menutup dan me-reset modal
  const handleClose = () => {
    form.reset();
    form.setFieldValue('examinees', [{ name: '', avatar: null }]);
    onClose();
  };

  // JSX untuk baris form dinamis
  const fields = form.values.examinees.map((item, index) => (
    <Flex key={index} gap="md" align="flex-end" mb="sm">
      <TextInput
        label={`Nama Peserta ${index + 1}`}
        placeholder="Masukkan nama..."
        withAsterisk
        style={{ flex: 1 }}
        {...form.getInputProps(`examinees.${index}.name`)}
      />
      <FileInput
        label="Avatar (Opsional)"
        placeholder="Pilih gambar..."
        accept="image/png,image/jpeg"
        style={{ flex: 1 }}
        {...form.getInputProps(`examinees.${index}.avatar`)}
      />
      <ActionIcon
        color="red"
        onClick={() => form.removeListItem('examinees', index)}
        disabled={form.values.examinees.length <= 1} // Jangan hapus baris terakhir
      >
        <IconTrash size={16} />
      </ActionIcon>
    </Flex>
  ));

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Tambah Peserta (Massal)"
      size="xl"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {/* Tampilkan dropdown batch HANYA jika tidak di-lock */}
          {!lockedBatchId && (
            <Select
              label="Pilih Batch (Opsional)"
              placeholder="Pilih batch untuk semua peserta..."
              data={batchOptions}
              {...form.getInputProps('batch_id')}
              clearable
            />
          )}

          {/* Render semua baris form dinamis */}
          {fields}

          <Button
            leftSection={<IconPlus size={16} />}
            variant="outline"
            onClick={() => form.insertListItem('examinees', { name: '', avatar: null })}
          >
            Tambah Baris
          </Button>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Simpan Semua
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}