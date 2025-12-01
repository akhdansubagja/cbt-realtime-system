"use client";

import { Paper, Text, Group, Select, useMantineTheme, Skeleton } from "@mantine/core";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Batch } from "@/types/batch";
import { BatchAverageReport } from "@/types/batchAverageReport";

interface ChartData {
  name: string;
  score: number;
}

export function DashboardChart() {
  const theme = useMantineTheme();
  const [period, setPeriod] = useState<string | null>("7");
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Get recent batches
        const batchesRes = await api.get<Batch[]>("/batches");
        // Sort by ID desc (assuming higher ID = newer) or createdAt
        const sortedBatches = batchesRes.data.sort((a, b) => b.id - a.id);
        const limit = period ? parseInt(period) : 7;
        const recentBatches = sortedBatches.slice(0, limit).reverse(); // Reverse back for chronological order

        // 2. Get average for each batch
        const promises = recentBatches.map(async (batch) => {
          try {
            const reportRes = await api.get<BatchAverageReport[]>(`/reports/batch-averages/${batch.id}`);
            const reports = reportRes.data;
            
            if (reports.length === 0) return { name: batch.name, score: 0 };

            // Calculate average of averages
            const totalAvg = reports.reduce((sum, item) => sum + parseFloat(item.averageScore), 0);
            const overallAvg = totalAvg / reports.length;
            
            return {
              name: batch.name,
              score: parseFloat(overallAvg.toFixed(2))
            };
          } catch (e) {
            console.error(`Failed to fetch report for batch ${batch.id}`, e);
            return { name: batch.name, score: 0 };
          }
        });

        const results = await Promise.all(promises);
        setData(results);
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  return (
    <Paper p="xl" radius="lg" withBorder h="100%">
      <Group justify="space-between" mb="lg">
        <div>
          <Text fw={700} size="lg">Performa Rata-rata</Text>
          <Text c="dimmed" size="sm">Tren nilai rata-rata per batch</Text>
        </div>
        <Select
          value={period}
          onChange={setPeriod}
          data={[
            { value: "7", label: "7 Batch Terakhir" },
            { value: "30", label: "30 Batch Terakhir" },
          ]}
          w={150}
          variant="filled"
          radius="md"
        />
      </Group>

      {loading ? (
        <Skeleton height={300} radius="md" />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.colors.violet[6]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={theme.colors.violet[6]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.colors.gray[3]} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: theme.colors.gray[6], fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: theme.colors.gray[6], fontSize: 12 }} 
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.white,
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.gray[2]}`,
                boxShadow: theme.shadows.sm,
              }}
              itemStyle={{ color: theme.colors.dark[9] }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke={theme.colors.violet[6]}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorScore)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}
