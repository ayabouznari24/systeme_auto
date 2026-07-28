import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { sendEmailNotification, queueDesktopNotification } from "@/services/notification.service";

/** Sends a synthetic test notification so the user can verify their setup end-to-end. */
export async function POST() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.notificationSettings.findUnique({ where: { userId } });

  const fakeEmail = {
    id: "test",
    emailAccountId: "test",
    messageId: "test",
    uid: null,
    folder: "INBOX",
    fromName: "Mail Intelligence",
    fromAddress: "system@mail-intelligence.local",
    toAddresses: [],
    subject: "Ceci est une notification de test",
    bodyText: null,
    bodyHtml: null,
    snippet: null,
    receivedAt: new Date(),
    hasAttachments: false,
    status: "DONE",
    category: "URGENT",
    priorityScore: 99,
    sentiment: "NEUTRAL",
    summary: "Test de configuration des notifications.",
    keywords: [],
    recommendedAction: "REPLY",
    hasDeadline: false,
    deadlineAt: null,
    amountsDetected: [],
    isFromRecruiter: false,
    isFromClient: false,
    isJobApplication: false,
    aiModel: null,
    aiRawResponse: null,
    analysisError: null,
    analyzedAt: new Date(),
    isRead: false,
    isProcessed: false,
    processedAt: null,
    isArchived: false,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Parameters<typeof queueDesktopNotification>[0];

  queueDesktopNotification(fakeEmail);

  if (settings?.emailEnabled && settings.notifyEmailTo) {
    await sendEmailNotification({ to: settings.notifyEmailTo, emails: [fakeEmail] });
  }

  return NextResponse.json({ success: true });
}
