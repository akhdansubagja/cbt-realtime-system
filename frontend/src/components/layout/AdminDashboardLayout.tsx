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
          <MantineText fw={isActive ? 600 : 400} size="sm">
            {link.label}
          </MantineText>
        }
        leftSection={
          <link.icon
            size="1.2rem"
            stroke={1.5}
            color={isActive ? theme.colors.indigo[6] : "currentColor"}
          />
        }
        onClick={(e) => {
          e.preventDefault();
          router.push(link.href);
        }}
        active={isActive}
        variant="light"
        color="indigo"
        style={{ borderRadius: theme.radius.md, marginBottom: 4 }}
      />
    );
  });

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
      bg={computedColorScheme === "dark" ? "dark.8" : "gray.0"}
    >
      <AppShell.Header
        style={{
          backdropFilter: "blur(10px)",
          backgroundColor:
            computedColorScheme === "dark"
              ? "rgba(36, 36, 36, 0.8)"
              : "rgba(255, 255, 255, 0.8)",
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Group gap="xs">
              <ThemeToggle />
              <Title order={4} c="indigo">
                CBT Realtime
              </Title>
            </Group>
          </Group>
          {/* Bisa tambah user profile di sini nanti */}
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" style={{ backgroundColor: "transparent" }}>
        <Flex
          direction="column"
          justify="space-between"
          style={{ height: "100%" }}
        >
          <Stack gap="xs">
            <MantineText
              size="xs"
              fw={500}
              c="dimmed"
              mb="xs"
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
              style={{ borderRadius: theme.radius.md }}
            />
          </Box>
        </Flex>
      </AppShell.Navbar>
      <AppShell.Main bg={computedColorScheme === "dark" ? "dark.8" : "gray.0"}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
