// frontend/src/app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Box,
  Flex,
  BackgroundImage,
  Overlay,
  ThemeIcon,
} from "@mantine/core";
import {
  IconAt,
  IconLock,
  IconAlertCircle,
  IconSchool,
} from "@tabler/icons-react";
import axios from "axios";
import { motion } from "framer-motion";

/**
 * Halaman Login Administrator.
 * Menyediakan form username/password untuk mendapatkan token akses admin.
 * Memiliki dekorasi visual di sisi kiri dan form di sisi kanan.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username || !password) {
      setError("Username dan password harus diisi.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        { username, password }
      );

      const { access_token } = response.data;
      localStorage.setItem("access_token", access_token);
      router.replace("/admin/dashboard");
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((err as any).response && (err as any).response.status === 401) {
        setError("Username atau password salah.");
      } else {
        setError("Terjadi kesalahan. Tidak dapat terhubung ke server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex h="100vh" style={{ overflow: "hidden" }}>
      {/* Left Side - Decorative */}
      <Box
        visibleFrom="sm"
        style={{
          flex: 1,
          position: "relative",
          background:
            "linear-gradient(135deg, var(--mantine-color-violet-9) 0%, var(--mantine-color-indigo-9) 100%)",
        }}
      >
        <Overlay
          gradient="linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, .65) 40%)"
          opacity={1}
          zIndex={1}
        />
        <Stack
          h="100%"
          justify="center"
          p={80}
          style={{ position: "relative", zIndex: 2, color: "white" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <ThemeIcon
              size={60}
              radius="md"
              variant="gradient"
              gradient={{ from: "violet.4", to: "indigo.4" }}
              mb="xl"
            >
              <IconSchool size={32} stroke={1.5} color="white" />
            </ThemeIcon>
            <Title order={1} size={48} fw={900} style={{ lineHeight: 1.1 }}>
              CBT Realtime
              <br />
              System
            </Title>
            <Text size="xl" mt="md" c="gray.3" maw={500}>
              Platform ujian online modern dengan pemantauan real-time dan
              analisis hasil yang akurat.
            </Text>
          </motion.div>
        </Stack>

        {/* Abstract Shapes */}
        <Box
          style={{
            position: "absolute",
            bottom: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
            zIndex: 1,
          }}
        />
      </Box>

      {/* Right Side - Login Form */}
      <Flex
        flex={1}
        align="center"
        justify="center"
        bg="gray.0"
        style={{ position: "relative" }}
      >
        <Container size="xs" w="100%" p="xl">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Stack gap="lg">
              <Box>
                <Title order={2} fw={800}>
                  Selamat Datang Kembali
                </Title>
                <Text c="dimmed" size="sm">
                  Masuk ke akun administrator Anda
                </Text>
              </Box>

              <form onSubmit={handleLogin}>
                <Stack gap="md">
                  <TextInput
                    label="Username"
                    placeholder="Masukkan username"
                    size="md"
                    leftSection={<IconAt size={18} />}
                    value={username}
                    onChange={(event) => setUsername(event.currentTarget.value)}
                    required
                  />
                  <PasswordInput
                    label="Password"
                    placeholder="Masukkan password"
                    size="md"
                    leftSection={<IconLock size={18} />}
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    required
                  />

                  {error && (
                    <Alert
                      variant="light"
                      color="red"
                      title="Login Gagal"
                      icon={<IconAlertCircle />}
                      withCloseButton
                      onClose={() => setError("")}
                    >
                      {error}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    fullWidth
                    mt="md"
                    size="md"
                    loading={loading}
                    variant="gradient"
                    gradient={{ from: "violet", to: "indigo" }}
                  >
                    Masuk Dashboard
                  </Button>
                </Stack>
              </form>

              <Text c="dimmed" size="xs" ta="center">
                &copy; {new Date().getFullYear()} CBT Realtime System. All
                rights reserved.
              </Text>
            </Stack>
          </motion.div>
        </Container>
      </Flex>
    </Flex>
  );
}