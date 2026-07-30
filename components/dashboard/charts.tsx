"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_META } from "@/lib/constants";
import { useDashboardStats } from "./hooks";

export function CategoryChart() {
  const { data, isLoading } = useDashboardStats();

  const chartData = data
    ? Object.entries(data.categoryBreakdown)
        .map(([category, count]) => ({
          name: CATEGORY_META[category as keyof typeof CATEGORY_META].label,
          value: count,
          color: CATEGORY_META[category as keyof typeof CATEGORY_META].color,
        }))
        .filter((d) => d.value > 0)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Répartition par catégorie</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : chartData.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Pas encore de données
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function VolumeChart() {
  const { data, isLoading } = useDashboardStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Volume d&apos;emails (14 derniers jours)</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : !data?.volumeByDay.length ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Pas encore de données
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.volumeByDay}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#volumeGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
