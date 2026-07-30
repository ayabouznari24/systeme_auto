import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { updateEmailSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = await prisma.email.findFirst({
    where: { id, emailAccount: { userId } },
    include: { tags: { include: { tag: true } } },
  });
  if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ email });
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateEmailSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.email.findFirst({ where: { id, emailAccount: { userId } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const email = await prisma.email.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(parsed.data.isProcessed ? { processedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ email });
}
