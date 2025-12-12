// frontend/src/app/admin/(protected)/examinees/[id]/page.tsx
'use client';

import {
  Title,
  Text,
  Loader,
  Alert,
  Breadcrumbs,
  Anchor,
  Stack,
  Grid,
  Group,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Examinee } from '@/types/examinee';
import { ParticipantHistory } from '@/types/participantHistory';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ExamineeProfileCard } from '@/components/examinees/ExamineeProfileCard';
import { ExamineeHistoryTable } from '@/components/examinees/ExamineeHistoryTable';
import { DataTableSortStatus } from 'mantine-datatable';
import sortBy from 'lodash/sortBy';
import { PageHeader } from '@/components/layout/PageHeader';

import { ExamineeHistoryChart, ChartData } from '@/components/examinees/ExamineeHistoryChart';

export default function ExamineeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const examineeId = parseInt(id, 10);

  const [examinee, setExaminee] = useState<Examinee | null>(null);
  const [history, setHistory] = useState<ParticipantHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<ParticipantHistory>>({
    columnAccessor: 'start_time',
    direction: 'desc',
  });

  useEffect(() => {
    if (!examineeId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Parallel fetching
        const [examineeRes, historyRes] = await Promise.all([
          api.get(`/examinees/${examineeId}`),
          api.get<ParticipantHistory[]>(`/participants/by-examinee/${examineeId}`)
        ]);

        setExaminee(examineeRes.data);
        
        const historyData = historyRes.data;
        setHistory(historyData);

      } catch (err) {
        setError('Gagal mengambil data peserta.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examineeId]);

  // Compute stats
  const stats = {
    totalExams: history.filter(h => h.status === 'finished').length,
    averageScore: history.length > 0 
      ? history.reduce((acc, curr) => acc + (curr.final_score || 0), 0) / history.filter(h => h.final_score !== null).length || 0
      : 0
  };

  // Prepare chart data
  const chartData: ChartData[] = history
    .filter(h => h.status === 'finished' && h.final_score !== null)
    .sort((a, b) => {
      const dateA = new Date(a.start_time || a.created_at).getTime();
      const dateB = new Date(b.start_time || b.created_at).getTime();
      return dateA - dateB;
    })
    .map(h => ({
      name: h.exam?.title || `Ujian #${h.exam_id}`,
      Nilai: h.final_score || 0,
    }));

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Error!"
        color="red"
      >
        {error}
      </Alert>
    );
  }

  if (!examinee) {
    return <Text>Data peserta tidak ditemukan.</Text>;
  }

  // Sorting Logic
  const sortedHistory = sortBy(history, sortStatus.columnAccessor) as ParticipantHistory[];
  const records = sortStatus.direction === 'desc' ? sortedHistory.reverse() : sortedHistory;

  return (
    <Stack gap="lg">
      <PageHeader
        title="Detail Peserta"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Manajemen Peserta", href: "/admin/examinees" },
          { label: examinee.name, href: `/admin/examinees/${examinee.id}` },
        ]}
      />

      <Stack gap="sm">
        <ExamineeProfileCard examinee={examinee} stats={stats} />
        
        <ExamineeHistoryChart data={chartData} />

        <Stack gap="xs">
            <Title order={4}>Riwayat Ujian Lengkap</Title>
            <ExamineeHistoryTable 
              records={records} 
              loading={loading} 
              sortStatus={sortStatus}
              onSortStatusChange={setSortStatus}
            />
        </Stack>
      </Stack>
    </Stack>
  );
}