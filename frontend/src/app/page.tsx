// src/app/page.tsx
'use client'; // Menandakan ini adalah komponen sisi klien (interaktif)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Paper,
  Select,
  TextInput,
  Button,
  Group,
  Alert,
  Loader,
  Center,
} from '@mantine/core';
import axios from 'axios';

// Definisikan tipe data untuk examinee
interface Examinee {
  id: number;
  name: string;
}

export default function HomePage() {
  const router = useRouter();
  const [examinees, setExaminees] = useState<{ value: string; label: string }[]>([]);
  const [selectedExamineeId, setSelectedExamineeId] = useState<string | null>(null);
  const [examCode, setExamCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFetchingExaminees, setIsFetchingExaminees] = useState(true);

  // Efek ini akan berjalan saat komponen pertama kali dimuat
  useEffect(() => {
    const fetchExaminees = async () => {
      try {
        const response = await axios.get<Examinee[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/examinees`
        );
        const formattedExaminees = response.data.map((e) => ({
          value: e.id.toString(),
          label: e.name,
        }));
        setExaminees(formattedExaminees);
      } catch (err) {
        setError('Gagal memuat daftar peserta. Pastikan server backend berjalan.');
      } finally {
        setIsFetchingExaminees(false);
      }
    };

    fetchExaminees();
  }, []); // Array kosong berarti efek ini hanya berjalan sekali

  const handleJoinExam = async () => {
    if (!selectedExamineeId || !examCode) {
      setError('Nama dan Kode Ujian harus diisi.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/participants/join`,
        {
          examinee_id: parseInt(selectedExamineeId, 10),
          code: examCode,
        }
      );

      const participantId = response.data.id;
      // Jika berhasil, arahkan ke halaman lobby/mulai ujian
      router.push(`/exam/session/${participantId}`);

    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.message || 'Terjadi kesalahan.');
      } else {
        setError('Tidak dapat terhubung ke server backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Selamat Datang di Ujian Online</Title>
      
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {isFetchingExaminees ? (
          <Center>
            <Loader />
            <span style={{ marginLeft: '10px' }}>Memuat daftar peserta...</span>
          </Center>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleJoinExam(); }}>
            <Select
              label="Pilih Nama Anda"
              placeholder="Cari dan pilih nama Anda"
              data={examinees}
              value={selectedExamineeId}
              onChange={setSelectedExamineeId}
              searchable
              required
            />
            <TextInput
              label="Kode Ujian"
              placeholder="Masukkan kode ujian"
              value={examCode}
              onChange={(event) => setExamCode(event.currentTarget.value)}
              required
              mt="md"
            />

            {error && (
              <Alert color="red" mt="md" title="Error" withCloseButton onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Button type="submit" fullWidth mt="xl" loading={loading}>
              Mulai Ujian
            </Button>
          </form>
        )}
      </Paper>
    </Container>
  );
}