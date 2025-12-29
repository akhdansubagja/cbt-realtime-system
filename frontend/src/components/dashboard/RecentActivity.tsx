"use client";

import { Paper, Text, Timeline, ThemeIcon, Group, Badge, Skeleton } from "@mantine/core";
import { IconCheck, IconUserPlus, IconFileText, IconClock, IconCalendarPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Batch } from "@/types/batch";
import { Exam } from "@/types/exam";

// Define a unified Activity type
/** Interface untuk item aktivitas */
interface ActivityItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  timestamp: number;
  icon: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  color: string;
  type: "exam" | "batch" | "user";
}

/**
 * Komponen timeline aktivitas terkini.
 * Menggabungkan data dari Batch dan Exam terbaru.
 */
export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [batchesRes, examsRes] = await Promise.all([
          api.get<Batch[]>("/batches"),
          api.get<Exam[]>("/exams"),
        ]);

        const batchActivities: ActivityItem[] = batchesRes.data.map((batch) => ({
          id: `batch-${batch.id}`,
          title: "Batch Baru Dijadwalkan",
          desc: `Batch "${batch.name}" telah dibuat.`,
          time: new Date(batch.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(batch.createdAt).getTime(),
          icon: IconCalendarPlus,
          color: "violet",
          type: "batch",
        }));

        // Assuming Exam has createdAt, if not we might need to skip or use a default
        // Assuming Exam has createdAt, if not we might need to skip or use a default
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const examActivities: ActivityItem[] = examsRes.data.map((exam: any) => ({
          id: `exam-${exam.id}`,
          title: "Paket Soal Baru",
          desc: `Paket soal "${exam.title}" telah ditambahkan.`,
          time: exam.createdAt ? new Date(exam.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Baru saja",
          timestamp: exam.createdAt ? new Date(exam.createdAt).getTime() : Date.now(),
          icon: IconFileText,
          color: "blue",
          type: "exam",
        }));

        const combined = [...batchActivities, ...examActivities]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5);

        setActivities(combined);
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Paper p="xl" radius="lg" withBorder h="100%">
      <Group justify="space-between" mb="lg">
        <Text fw={700} size="lg">Aktivitas Terkini</Text>
        <Badge variant="light" color="gray">Terbaru</Badge>
      </Group>
      
      {loading ? (
         <Skeleton height={200} radius="md" />
      ) : (
        <Timeline active={1} bulletSize={32} lineWidth={2}>
          {activities.length > 0 ? (
            activities.map((item) => (
              <Timeline.Item
                key={item.id}
                bullet={
                  <ThemeIcon
                    size={22}
                    variant="gradient"
                    gradient={{ from: item.color, to: `${item.color}.6`, deg: 45 }}
                    radius="xl"
                  >
                    <item.icon size={12} />
                  </ThemeIcon>
                }
                title={item.title}
              >
                <Text c="dimmed" size="sm">
                  {item.desc}
                </Text>
                <Text size="xs" mt={4} c="dimmed">
                  {item.time}
                </Text>
              </Timeline.Item>
            ))
          ) : (
            <Text c="dimmed" size="sm">Belum ada aktivitas tercatat.</Text>
          )}
        </Timeline>
      )}
    </Paper>
  );
}
