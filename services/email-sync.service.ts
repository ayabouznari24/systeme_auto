import type { Email, EmailAccount } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { createProviderForAccount } from "@/services/email/provider-factory";
import { getAIProvider } from "@/services/ai/ai-factory";
import { applyScoringBoosts } from "@/services/ai/scoring";
import { queueDesktopNotification, sendEmailNotification } from "@/services/notification.service";
import { truncate } from "@/lib/utils";
import type { RawEmailMessage } from "@/types/email";

const SCOPE = "email-sync";

export interface SyncResult {
  emailAccountId: string;
  fetched: number;
  created: number;
  analyzed: number;
  failed: number;
}

/** Runs a full fetch -> dedupe -> analyze -> score -> save cycle for one mailbox. */
export async function syncEmailAccount(account: EmailAccount): Promise<SyncResult> {
  const syncRun = await prisma.syncRun.create({
    data: { emailAccountId: account.id, status: "RUNNING" },
  });

  const result: SyncResult = { emailAccountId: account.id, fetched: 0, created: 0, analyzed: 0, failed: 0 };

  try {
    const provider = createProviderForAccount(account);
    const { messages, newCursor } = await provider.fetchNewMessages(account.lastSeenUid ?? 0);
    result.fetched = messages.length;

    logger.info(SCOPE, `Fetched ${messages.length} new message(s)`, { account: account.emailAddress });

    const freshMessages = await dedupeAgainstExisting(account.id, messages);

    const notifyEmails: Email[] = [];
    const settings = await prisma.notificationSettings.findFirst({
      where: { user: { emailAccounts: { some: { id: account.id } } } },
    });

    for (const message of freshMessages) {
      try {
        const saved = await analyzeAndSaveMessage(account, message);
        result.created += 1;
        if (saved.status === "DONE") result.analyzed += 1;
        else result.failed += 1;

        const meetsThreshold =
          settings && saved.priorityScore !== null && saved.priorityScore >= settings.minPriorityScore;
        const inWatchedCategory =
          !settings?.categories.length || (saved.category && settings.categories.includes(saved.category));

        if (settings?.desktopEnabled && meetsThreshold && inWatchedCategory) {
          queueDesktopNotification(saved);
        }
        if (settings?.emailEnabled && meetsThreshold && inWatchedCategory) {
          notifyEmails.push(saved);
        }
      } catch (error) {
        result.failed += 1;
        logger.error(SCOPE, "Failed to process message", {
          messageId: message.messageId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (notifyEmails.length && settings?.notifyEmailTo) {
      await sendEmailNotification({ to: settings.notifyEmailTo, emails: notifyEmails }).catch((err) =>
        logger.error(SCOPE, "Email notification failed", { error: String(err) })
      );
    }

    await prisma.emailAccount.update({
      where: { id: account.id },
      data: { lastSeenUid: newCursor, lastSyncAt: new Date() },
    });

    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        finishedAt: new Date(),
        fetchedCount: result.fetched,
        newCount: result.created,
        analyzedCount: result.analyzed,
        failedCount: result.failed,
        status: "SUCCESS",
      },
    });
  } catch (error) {
    logger.error(SCOPE, "Sync run failed", {
      account: account.emailAddress,
      error: error instanceof Error ? error.message : String(error),
    });
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        finishedAt: new Date(),
        status: "FAILED",
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }

  return result;
}

export async function syncAllActiveAccounts(userId?: string): Promise<SyncResult[]> {
  const accounts = await prisma.emailAccount.findMany({
    where: { isActive: true, ...(userId ? { userId } : {}) },
  });
  const results: SyncResult[] = [];
  for (const account of accounts) {
    results.push(await syncEmailAccount(account));
  }
  return results;
}

/** Belt-and-suspenders dedupe on top of the DB unique constraint (emailAccountId, messageId). */
async function dedupeAgainstExisting(
  emailAccountId: string,
  messages: RawEmailMessage[]
): Promise<RawEmailMessage[]> {
  if (!messages.length) return [];
  const existing = await prisma.email.findMany({
    where: { emailAccountId, messageId: { in: messages.map((m) => m.messageId) } },
    select: { messageId: true },
  });
  const existingIds = new Set(existing.map((e) => e.messageId));
  return messages.filter((m) => !existingIds.has(m.messageId));
}

async function analyzeAndSaveMessage(account: EmailAccount, message: RawEmailMessage): Promise<Email> {
  const ai = getAIProvider();

  try {
    const analysis = await ai.analyze({
      fromName: message.fromName,
      fromAddress: message.fromAddress,
      toAddresses: message.toAddresses,
      subject: message.subject,
      bodyText: message.bodyText ?? "",
      receivedAt: message.receivedAt,
    });

    const { finalScore } = applyScoringBoosts(analysis, {
      fromAddress: message.fromAddress,
      fromName: message.fromName,
      subject: message.subject,
    });

    return prisma.email.upsert({
      where: { emailAccountId_messageId: { emailAccountId: account.id, messageId: message.messageId } },
      create: {
        emailAccountId: account.id,
        messageId: message.messageId,
        uid: message.uid,
        folder: message.folder,
        fromName: message.fromName,
        fromAddress: message.fromAddress,
        toAddresses: message.toAddresses,
        subject: message.subject,
        bodyText: message.bodyText,
        bodyHtml: message.bodyHtml,
        snippet: truncate(message.bodyText ?? "", 240),
        receivedAt: message.receivedAt,
        hasAttachments: message.hasAttachments,
        status: "DONE",
        category: analysis.category,
        priorityScore: finalScore,
        sentiment: analysis.sentiment,
        summary: analysis.summary,
        keywords: analysis.keywords,
        recommendedAction: analysis.recommendedAction,
        hasDeadline: analysis.hasDeadline,
        deadlineAt: analysis.deadlineAt ? new Date(analysis.deadlineAt) : null,
        amountsDetected: analysis.amountsDetected,
        isFromRecruiter: analysis.isFromRecruiter,
        isFromClient: analysis.isFromClient,
        isJobApplication: analysis.isJobApplication,
        aiModel: ai.name,
        aiRawResponse: analysis as unknown as object,
        analyzedAt: new Date(),
      },
      update: {},
    });
  } catch (error) {
    logger.error(SCOPE, "AI analysis failed, saving raw email without analysis", {
      messageId: message.messageId,
      error: error instanceof Error ? error.message : String(error),
    });

    return prisma.email.upsert({
      where: { emailAccountId_messageId: { emailAccountId: account.id, messageId: message.messageId } },
      create: {
        emailAccountId: account.id,
        messageId: message.messageId,
        uid: message.uid,
        folder: message.folder,
        fromName: message.fromName,
        fromAddress: message.fromAddress,
        toAddresses: message.toAddresses,
        subject: message.subject,
        bodyText: message.bodyText,
        bodyHtml: message.bodyHtml,
        snippet: truncate(message.bodyText ?? "", 240),
        receivedAt: message.receivedAt,
        hasAttachments: message.hasAttachments,
        status: "FAILED",
        analysisError: error instanceof Error ? error.message : String(error),
      },
      update: {},
    });
  }
}
