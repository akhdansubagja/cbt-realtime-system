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

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs: BreadcrumbItem[];
  actions?: React.ReactNode;
}

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
        align="center"
        wrap="wrap"
        gap="md"
        direction={{ base: "column", sm: "row" }}
      >
        <Title order={2}>{title}</Title>
        {actions && <Group>{actions}</Group>}
      </Flex>
    </Box>
  );
}
