import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  label: z.string().trim().min(1).max(60).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.emailAccount.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const account = await prisma.emailAccount.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ account: { ...account, encryptedSecret: undefined } });
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.emailAccount.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.emailAccount.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
