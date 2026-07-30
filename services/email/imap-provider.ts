import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { logger } from "@/lib/logger";
import { stripHtml } from "@/lib/utils";
import type { RawEmailMessage } from "@/types/email";
import type { MailboxConnectionConfig, MailProviderClient } from "./types";

const SCOPE = "imap-provider";

/**
 * Generic IMAP mailbox client built on imapflow/mailparser. Works with any
 * standards-compliant IMAP server - Titan Mail included. Provider-specific
 * presets (host/port defaults) live in titan-provider.ts and simply wrap this
 * class, so adding another IMAP-based provider is a ~10 line file.
 */
export class ImapProvider implements MailProviderClient {
  readonly providerName: string;
  private config: MailboxConnectionConfig;

  constructor(config: MailboxConnectionConfig, providerName = "IMAP_GENERIC") {
    this.config = config;
    this.providerName = providerName;
  }

  async fetchNewMessages(
    sinceUid: number
  ): Promise<{ messages: RawEmailMessage[]; newCursor: number }> {
    const client = new ImapFlow({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: { user: this.config.username, pass: this.config.password },
      logger: false,
    });

    const messages: RawEmailMessage[] = [];
    let newCursor = sinceUid;

    try {
      await client.connect();
      const lock = await client.getMailboxLock(this.config.folder ?? "INBOX");

      try {
        const mailbox = client.mailbox;
        if (!mailbox || typeof mailbox === "boolean") {
          return { messages: [], newCursor };
        }

        const highestUid = mailbox.uidNext ? mailbox.uidNext - 1 : sinceUid;
        if (highestUid <= sinceUid) {
          return { messages: [], newCursor: sinceUid };
        }

        // Fetch every message with a UID greater than our last-seen cursor.
        const range = `${sinceUid + 1}:*`;

        for await (const message of client.fetch(
          range,
          { envelope: true, source: true, uid: true, flags: true },
          { uid: true }
        )) {
          if (!message.source) continue;

          const parsed = await simpleParser(message.source);
          const bodyHtml = typeof parsed.html === "string" ? parsed.html : undefined;
          const bodyText = parsed.text ?? (bodyHtml ? stripHtml(bodyHtml) : "");

          messages.push({
            messageId: parsed.messageId ?? `<generated-${this.config.host}-${message.uid}>`,
            uid: message.uid,
            folder: this.config.folder ?? "INBOX",
            fromName: parsed.from?.value?.[0]?.name || undefined,
            fromAddress: parsed.from?.value?.[0]?.address ?? "unknown@unknown",
            toAddresses: (parsed.to
              ? Array.isArray(parsed.to)
                ? parsed.to
                : [parsed.to]
              : []
            ).flatMap((addr) => addr.value.map((v) => v.address ?? "").filter(Boolean)),
            subject: parsed.subject ?? "(no subject)",
            bodyText,
            bodyHtml,
            receivedAt: parsed.date ?? new Date(),
            hasAttachments: (parsed.attachments?.length ?? 0) > 0,
          });

          if (message.uid > newCursor) newCursor = message.uid;
        }
      } finally {
        lock.release();
      }
    } catch (error) {
      logger.error(SCOPE, "Failed to fetch messages via IMAP", {
        host: this.config.host,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      await client.logout().catch(() => client.close());
    }

    return { messages, newCursor };
  }
}
