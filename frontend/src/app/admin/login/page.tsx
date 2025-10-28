// frontend/src/app/admin/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Alert,
  Title,
  Text,
  Stack,
  Container,
} from '@mantine/core';
import { IconAt, IconLock, IconAlertCircle } from '@tabler/icons-react';
import axios from 'axios';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Mencegah refresh halaman standar
    if (!username || !password) {
      setError('Username dan password harus diisi.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        { username, password }
      );

      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      router.replace('/admin/dashboard'); // Gunakan replace agar tidak bisa kembali ke login
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        setError('Username atau password salah.');
      } else {
        setError('Terjadi kesalahan. Tidak dapat terhubung ke server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--mantine-color-gray-0)' }}>
      <Stack w={420}>
        <Title ta="center">CBT Realtime System</Title>
        <Text c="dimmed" size="sm" ta="center" mb={20}>
          Silakan masuk untuk mengakses dashboard admin
        </Text>

        <Paper withBorder shadow="md" p={30} radius="md">
          <form onSubmit={handleLogin}>
            <Stack gap="md">
              <TextInput
                leftSection={<IconAt size={16} />}
                label="Username"
                placeholder="username_admin"
                value={username}
                onChange={(event) => setUsername(event.currentTarget.value)}
                required
              />
              <PasswordInput
                leftSection={<IconLock size={16} />}
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                required
              />

              {error && (
                <Alert
                  color="red"
                  title="Login Gagal"
                  icon={<IconAlertCircle />}
                  withCloseButton
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              )}

              <Button type="submit" fullWidth mt="md" loading={loading}>
                Login
              </Button>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
}