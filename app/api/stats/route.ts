import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import type { DashboardStats } from "@/types/email";
import type { EmailCategory } from "@prisma/client";

const ALL_CATEGORIES: EmailCategory[] = [
  "URGENT",
  "IMPORTANT",
  "TODAY",
  "THIS_WEEK",
  "INFORMATION",
  "NEWSLETTER",
  "SPAM",
];

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const baseWhere = { isDeleted: false, emailAccount: { userId } };

  const [total, unprocessed, byCategory, priorityAgg, last14Days] = await Promise.all([
    prisma.email.count({ where: baseWhere }),
    prisma.email.count({ where: { ...baseWhere, isProcessed: false } }),
    prisma.email.groupBy({
      by: ["category"],
      where: baseWhere,
      _count: { _all: true },
    }),
    prisma.email.aggregate({ where: baseWhere, _avg: { priorityScore: true } }),
    prisma.email.findMany({
      where: { ...baseWhere, receivedAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
      select: { receivedAt: true },
    }),
  ]);

  const categoryBreakdown = Object.fromEntries(
    ALL_CATEGORIES.map((c) => [c, 0])
  ) as Record<EmailCategory, number>;
  for (const row of byCategory) {
    if (row.category) categoryBreakdown[row.category] = row._count._all;
  }

  const volumeMap = new Map<string, number>();
  for (const { receivedAt } of last14Days) {
    const key = receivedAt.toISOString().slice(0, 10);
    volumeMap.set(key, (volumeMap.get(key) ?? 0) + 1);
  }
  const volumeByDay = Array.from(volumeMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const stats: DashboardStats = {
    total,
    urgent: categoryBreakdown.URGENT,
    important: categoryBreakdown.IMPORTANT,
    today: categoryBreakdown.TODAY,
    thisWeek: categoryBreakdown.THIS_WEEK,
    information: categoryBreakdown.INFORMATION,
    newsletter: categoryBreakdown.NEWSLETTER,
    spam: categoryBreakdown.SPAM,
    unprocessed,
    averagePriority: Math.round((priorityAgg._avg.priorityScore ?? 0) * 10) / 10,
    categoryBreakdown,
    volumeByDay,
  };

  return NextResponse.json({ stats });
}
