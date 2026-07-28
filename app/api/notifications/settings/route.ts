import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { notificationSettingsSchema } from "@/lib/validations";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.notificationSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = notificationSettingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const settings = await prisma.notificationSettings.upsert({
    where: { userId },
    update: parsed.data,
    create: { userId, ...parsed.data },
  });

  return NextResponse.json({ settings });
}
