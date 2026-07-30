import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { addTagsSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = addTagsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const email = await prisma.email.findFirst({ where: { id, emailAccount: { userId } } });
  if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 });

  for (const name of parsed.data.tagNames) {
    const tag = await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
    await prisma.emailTag.upsert({
      where: { emailId_tagId: { emailId: email.id, tagId: tag.id } },
      update: {},
      create: { emailId: email.id, tagId: tag.id },
    });
  }

  const updated = await prisma.email.findUnique({
    where: { id: email.id },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json({ email: updated });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tagId = new URL(req.url).searchParams.get("tagId");
  if (!tagId) return NextResponse.json({ error: "tagId query param is required" }, { status: 400 });

  const email = await prisma.email.findFirst({ where: { id, emailAccount: { userId } } });
  if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.emailTag.deleteMany({ where: { emailId: email.id, tagId } });

  return NextResponse.json({ success: true });
}
