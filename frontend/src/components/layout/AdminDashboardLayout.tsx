// src/components/layout/AdminDashboardLayout.tsx
"use client";
import { AppShell, Burger, Group, NavLink, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconHome2, IconLogout, IconUsers, IconFileText } from "@tabler/icons-react";
import { useRouter, usePathname } from "next/navigation";

export function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [opened, { toggle }] = useDisclosure();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.replace("/admin/login");
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={4}>CBT Admin Dashboard</Title>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">

        {/* bank soal */}
        <NavLink
          href="/admin/dashboard"
          label="Bank Soal"
          leftSection={<IconHome2 size="1rem" stroke={1.5} />}
          onClick={(e) => {
            e.preventDefault();
            router.push("/admin/dashboard");
          }}
          active={pathname === "/admin/dashboard"}
        />

        {/* Manajemen Peserta */}
        <NavLink
          href="/admin/examinees"
          label="Manajemen Peserta"
          leftSection={<IconUsers size="1rem" stroke={1.5} />}
          onClick={(e) => {
            e.preventDefault();
            router.push("/admin/examinees");
          }}
          active={pathname === "/admin/examinees"}
        />

        {/* Manajemen Ujian */}
        <NavLink
          href="/admin/exams"
          label="Manajemen Ujian"
          leftSection={<IconFileText size="1rem" stroke={1.5} />}
          onClick={(e) => {
            e.preventDefault();
            router.push("/admin/exams");
          }}
          active={pathname === "/admin/exams"}
        />

        
        {/* Tambahkan link navigasi lain di sini nanti */}
        <NavLink
          href="#"
          label="Logout"
          leftSection={<IconLogout size="1rem" stroke={1.5} />}
          onClick={handleLogout}
          color="red"
        />
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
