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

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.replace("/admin/login");
  };

  const mainLinks = navLinks.map((link) => (
    <NavLink
      key={link.label}
      href={link.href}
      label={link.label}
      leftSection={<link.icon size="1rem" stroke={1.5} />}
      onClick={(e) => {
        e.preventDefault();
        router.push(link.href);
      }}
      active={pathname.startsWith(link.href)}
      variant="filled"
    />
  ));

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Title order={4}>CBT Admin</Title>
          </Group>
          <ThemeToggle />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Flex
          direction="column"
          justify="space-between"
          style={{ height: "100%" }}
        >
          <Stack>{mainLinks}</Stack>
          <NavLink
            href="#"
            label="Logout"
            leftSection={<IconLogout size="1rem" stroke={1.5} />}
            onClick={handleLogout}
            color="red"
            variant="filled"
          />
        </Flex>
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
