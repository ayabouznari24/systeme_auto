import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { createEmailAccountSchema } from "@/lib/validations";
import { encryptSecret } from "@/lib/crypto";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.emailAccount.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      label: true,
      emailAddress: true,
      imapHost: true,
      imapPort: true,
      imapSecure: true,
      username: true,
      isActive: true,
      lastSyncAt: true,
      lastSeenUid: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createEmailAccountSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { password, ...rest } = parsed.data;

  const account = await prisma.emailAccount.create({
    data: {
      userId,
      provider: rest.provider,
      label: rest.label,
      emailAddress: rest.emailAddress,
      imapHost: rest.provider === "TITAN" ? "imap.titan.email" : rest.imapHost,
      imapPort: rest.imapPort ?? 993,
      imapSecure: rest.imapSecure ?? true,
      username: rest.username ?? rest.emailAddress,
      encryptedSecret: encryptSecret(password),
    },
  });

  return NextResponse.json({ account: { ...account, encryptedSecret: undefined } }, { status: 201 });
}
