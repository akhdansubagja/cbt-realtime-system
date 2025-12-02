import {
  Avatar,
  Badge,
  Card,
  Group,
  Stack,
  Text,
  ThemeIcon,
  rem,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconCalendar,
  IconId,
  IconSchool,
  IconUser,
} from "@tabler/icons-react";
import { Examinee } from "@/types/examinee";
import dayjs from "dayjs";

interface ExamineeProfileCardProps {
  examinee: Examinee;
  stats?: {
    totalExams: number;
    averageScore: number;
  };
}

export function ExamineeProfileCard({
  examinee,
  stats,
}: ExamineeProfileCardProps) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const statsBg = isDark ? "var(--mantine-color-dark-6)" : "var(--mantine-color-gray-0)";

  return (
    <Card withBorder shadow="sm" radius="md" padding="lg">
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={500}>Profil Peserta</Text>
          <Badge
            color={examinee.is_active ? "teal" : "red"}
            variant="light"
          >
            {examinee.is_active ? "Aktif" : "Tidak Aktif"}
          </Badge>
        </Group>
      </Card.Section>

      <Stack mt="md" align="center" gap="xs">
        <Avatar
          src={
            examinee.avatar_url
              ? `http://localhost:3000/${examinee.avatar_url}`
              : null
          }
          size={200}
          radius={200}
          mx="auto"
          color="initial"
        >
          {examinee.name.charAt(0)}
        </Avatar>
        <Text fz={30} fw={700} mt="md">
          {examinee.name}
        </Text>
        <Badge
          size="lg"
          variant="outline"
          color="gray"
          leftSection={<IconId size={16} />}
          style={{ textTransform: "none" }}
        >
          {examinee.uniqid || "No ID"}
        </Badge>
      </Stack>

      <Stack mt={30} gap="lg">
        <Group wrap="nowrap">
          <ThemeIcon variant="light" color="blue" size="md">
            <IconSchool style={{ width: rem(16), height: rem(16) }} />
          </ThemeIcon>
          <div>
            <Text size="xs" c="dimmed">
              Batch
            </Text>
            <Text size="sm" fw={500}>
              {examinee.batch?.name || "-"}
            </Text>
          </div>
        </Group>

        <Group wrap="nowrap">
          <ThemeIcon variant="light" color="grape" size="md">
            <IconCalendar style={{ width: rem(16), height: rem(16) }} />
          </ThemeIcon>
          <div>
            <Text size="xs" c="dimmed">
              Terdaftar Sejak
            </Text>
            <Text size="sm" fw={500}>
              {dayjs(examinee.created_at).format("DD MMMM YYYY")}
            </Text>
          </div>
        </Group>
        
        {stats && (
           <Group grow>
             <Stack gap={0} align="center" bg={statsBg} p="xs" style={{ borderRadius: '8px' }}>
                <Text size="xs" c="dimmed">Total Ujian</Text>
                <Text fw={700} size="lg">{stats.totalExams}</Text>
             </Stack>
             <Stack gap={0} align="center" bg={statsBg} p="xs" style={{ borderRadius: '8px' }}>
                <Text size="xs" c="dimmed">Rata-rata</Text>
                <Text fw={700} size="lg" c={stats.averageScore >= 75 ? 'teal' : 'orange'}>
                    {stats.averageScore.toFixed(1)}
                </Text>
             </Stack>
           </Group>
        )}
      </Stack>
    </Card>
  );
}
