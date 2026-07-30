import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { emailsToPdf } from "@/services/export.service";

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
    take: 1000,
  });

  const pdf = await emailsToPdf(emails);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="emails-export-${Date.now()}.pdf"`,
    },
  });
}
