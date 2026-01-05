// frontend/src/components/layout/AdminDashboardLayout.tsx
"use client";

import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Title,
  Stack,
  Flex,
  useMantineTheme,
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
  Text as MantineText,
  Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconHome2,
  IconLogout,
  IconUsers,
  IconFileText,
  IconBox,
  IconSun,
  IconMoon,
  IconUsersGroup,
} from "@tabler/icons-react";
import { useRouter, usePathname } from "next/navigation";
import React from "react";
import { ThemeToggle } from "./ThemeToggle";

// Data untuk navigasi, agar lebih rapi dan mudah diubah
// Data untuk navigasi, agar lebih rapi dan mudah diubah
/** Daftar link navigasi di sidebar */
const navLinks = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: IconHome2,
  },
  {
    href: "/admin/question-banks",
    label: "Bank Soal",
    icon: IconBox,
  },
  {
    href: "/admin/examinees",
    label: "Manajemen Peserta",
    icon: IconUsers,
  },
  {
    href: "/admin/batches",
    label: "Manajemen Batch",
    icon: IconUsersGroup,
  },
  {
    href: "/admin/exams",
    label: "Manajemen Ujian",
    icon: IconFileText,
  },
];

/**
 * Layout utama untuk Admin Dashboard application.
 * Menyediakan sidebar navigasi, header responsive, dan area konten utama.
 * 
 * @param children Konten halaman yang akan dirender didalam layout.
 */
export function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [opened, { toggle }] = useDisclosure();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.replace("/admin/login");
  };

  const mainLinks = navLinks.map((link) => {
    const isActive = pathname.startsWith(link.href);
    return (
      <NavLink
        key={link.label}
        href={link.href}
        label={
          <MantineText fw={isActive ? 700 : 500} size="sm" c={isActive ? "white" : "dimmed"}>
            {link.label}
          </MantineText>
        }
        leftSection={
          <link.icon
            size="1.2rem"
            stroke={1.5}
            color={isActive ? "white" : "currentColor"}
          />
        }
        onClick={(e) => {
          e.preventDefault();
          router.push(link.href);
        }}
        active={isActive}
        variant="filled"
        color="transparent"
        style={{
          borderRadius: theme.radius.lg,
          marginBottom: 4,
          transition: "all 0.2s ease",
          background: isActive ? "linear-gradient(90deg, rgba(121, 80, 242, 0.8) 0%, rgba(79, 70, 229, 0.8) 100%)" : "transparent",
          boxShadow: isActive ? "0 4px 15px rgba(121, 80, 242, 0.4)" : "none",
        }}
      />
    );
  });

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{ width: 280, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
      bg={computedColorScheme === "dark" ? "dark.8" : "gray.0"}
    >
      <AppShell.Header
        style={{
          backdropFilter: "blur(16px) saturate(180%)",
          backgroundColor:
            computedColorScheme === "dark"
              ? "rgba(15, 23, 42, 0.6)"
              : "rgba(255, 255, 255, 0.6)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Group h="100%" px="xl" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Group gap="xs" align="center">
              <ThemeToggle />
              <Box
                style={{
                  padding: "6px 16px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(121, 80, 242, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)",
                  border: "1px solid rgba(121, 80, 242, 0.2)",
                }}
              >
                <Title order={4} style={{ 
                  background: "linear-gradient(135deg, #7950f2 0%, #4f46e5 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.5px",
                  fontWeight: 800
                }}>
                  VIOLET ( Virtual Integrated Online Evaluation Tool )
                </Title>
              </Box>
            </Group>
          </Group>
          {/* Bisa tambah user profile di sini nanti */}
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        p="md"
        style={{
          backgroundColor:
            computedColorScheme === "dark"
              ? "rgba(15, 23, 42, 0.4)"
              : "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(16px) saturate(180%)",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Flex
          direction="column"
          justify="space-between"
          style={{ height: "100%" }}
        >
          <Stack gap="xs">
            <MantineText
              size="xs"
              fw={600}
              c="dimmed"
              mb="sm"
              pl="xs"
              style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
            >
              Menu Utama
            </MantineText>
            {mainLinks}
          </Stack>

          <Box
            pt="md"
            style={{
              borderTop: `1px solid ${
                computedColorScheme === "dark"
                  ? "var(--mantine-color-dark-4)"
                  : "var(--mantine-color-gray-2)"
              }`,
            }}
          >
            <NavLink
              href="#"
              label="Logout"
              leftSection={<IconLogout size="1.2rem" stroke={1.5} />}
              onClick={handleLogout}
              color="red"
              variant="subtle"
              style={{
                borderRadius: theme.radius.md,
                transition: "background-color 0.2s",
              }}
            />
          </Box>
        </Flex>
      </AppShell.Navbar>
      <AppShell.Main
        bg={computedColorScheme === "dark" ? "dark.8" : "gray.0"}
        style={{
          transition: "padding-left 0.2s ease",
        }}
      >
        <Box
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            width: "100%",
          }}
        >
          {children}
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
