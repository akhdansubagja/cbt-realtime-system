import {
  Box,
  Breadcrumbs,
  Flex,
  Title,
  Anchor,
  Group,
} from "@mantine/core";
import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";

/** Interface untuk item breadcrumb */
interface BreadcrumbItem {
  /** Label teks breadcrumb */
  label: string;
  /** URL tujuan */
  href: string;
}

/** Props untuk komponen PageHeader */
interface PageHeaderProps {
  /** Judul halaman utama */
  title: string;
  /** Daftar breadcrumb untuk navigasi */
  breadcrumbs: BreadcrumbItem[];
  /** Komponen aksi tambahan (tombol, dll) di sebelah kanan judul */
  actions?: React.ReactNode;
}

/**
 * Komponen header halaman standar untuk Admin Dashboard.
 * Menampilkan breadcrumbs, judul halaman, dan aksi opsional.
 */
export function PageHeader({ title, breadcrumbs, actions }: PageHeaderProps) {
  const items = breadcrumbs.map((item, index) => (
    <Anchor
      component={Link}
      href={item.href}
      key={index}
      fz="sm"
      c={index === breadcrumbs.length - 1 ? "dimmed" : "indigo"}
      fw={500}
    >
      {item.label}
    </Anchor>
  ));

  return (
    <Box mb="lg">
      <Breadcrumbs
        separator={<IconChevronRight size={14} />}
        mb="xs"
        style={{ flexWrap: "wrap" }}
      >
        {items}
      </Breadcrumbs>
      <Flex
        justify="space-between"
        align={{ base: "flex-start", sm: "center" }}
        direction={{ base: "column", sm: "row" }}
        gap="md"
      >
        <Title order={2}>{title}</Title>
        {actions && <Box w={{ base: "100%", sm: "auto" }}>{actions}</Box>}
      </Flex>
    </Box>
  );
}
