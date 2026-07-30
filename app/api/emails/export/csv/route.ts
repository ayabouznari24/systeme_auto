import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { emailsToCsv } from "@/services/export.service";

export async function GET(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const category = new URL(req.url).searchParams.getAll("category");

  const emails = await prisma.email.findMany({
    where: {
      isDeleted: false,
      emailAccount: { userId },
      ...(category.length ? { category: { in: category as never[] } } : {}),
    },
    orderBy: { receivedAt: "desc" },
    take: 5000,
  });

  const csv = emailsToCsv(emails);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="emails-export-${Date.now()}.csv"`,
    },
  });
}
