// src/app/admin/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Alert,
} from '@mantine/core';
import axios from 'axios';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
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
      
      // Simpan token di browser untuk digunakan nanti
      localStorage.setItem('access_token', access_token);
      
      // Arahkan ke halaman dashboard setelah login berhasil
      router.push('/admin/dashboard');

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
    <Container size={420} my={40}>
      <Title ta="center">Admin Login</Title>
      
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <TextInput
            label="Username"
            placeholder="Masukkan username admin"
            value={username}
            onChange={(event) => setUsername(event.currentTarget.value)}
            required
          />
          <PasswordInput
            label="Password"
            placeholder="Masukkan password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            required
            mt="md"
          />

          {error && (
            <Alert color="red" mt="md" title="Login Gagal">
              {error}
            </Alert>
          )}

          <Button type="submit" fullWidth mt="xl" loading={loading}>
            Login
          </Button>
        </form>
      </Paper>
    </Container>
  );
}