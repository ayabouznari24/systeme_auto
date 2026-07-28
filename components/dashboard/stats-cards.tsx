"use client";

import { Mail, AlertTriangle, Clock, Trash2, TrendingUp, Inbox } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "./hooks";

const CARD_DEFS = [
  { key: "total", label: "Total emails", icon: Mail, tone: "text-foreground" },
  { key: "urgent", label: "🔴 Urgents", icon: AlertTriangle, tone: "text-urgent" },
  { key: "important", label: "🟠 Importants", icon: TrendingUp, tone: "text-important" },
  { key: "unprocessed", label: "En attente", icon: Clock, tone: "text-week" },
  { key: "spam", label: "⚫ Spam", icon: Trash2, tone: "text-muted-foreground" },
  { key: "averagePriority", label: "Score moyen", icon: Inbox, tone: "text-foreground" },
] as const;

export function StatsCards() {
  const { data, isLoading } = useDashboardStats();

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {CARD_DEFS.map(({ key, label, icon: Icon, tone }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            <Icon className={`h-4 w-4 ${tone}`} />
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <div className="text-2xl font-bold">{data[key]}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
