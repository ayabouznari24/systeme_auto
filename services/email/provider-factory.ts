import type { EmailAccount } from "@prisma/client";
import { decryptSecret } from "@/lib/crypto";
import { createTitanProvider } from "./titan-provider";
import { ImapProvider } from "./imap-provider";
import type { MailProviderClient } from "./types";

/**
 * Builds the right MailProviderClient for a stored EmailAccount.
 *
 * This is the single extension point for adding new mailbox providers:
 * Gmail / Outlook / Office365 / Yahoo / Proton would each add one case here
 * (typically backed by OAuth instead of a raw password) - nothing else in
 * the app (sync service, API routes, dashboard) needs to change.
 */
export function createProviderForAccount(account: EmailAccount): MailProviderClient {
  const secret = account.encryptedSecret ? decryptSecret(account.encryptedSecret) : "";

  switch (account.provider) {
    case "TITAN":
      return createTitanProvider({ emailAddress: account.emailAddress, password: secret });

    case "IMAP_GENERIC":
      if (!account.imapHost || !account.username) {
        throw new Error(`EmailAccount ${account.id} is missing IMAP host/username.`);
      }
      return new ImapProvider(
        {
          host: account.imapHost,
          port: account.imapPort ?? 993,
          secure: account.imapSecure,
          username: account.username,
          password: secret,
        },
        "IMAP_GENERIC"
      );

    case "GMAIL":
    case "OUTLOOK":
    case "OFFICE365":
    case "YAHOO":
    case "PROTON":
      throw new Error(
        `Provider ${account.provider} is not implemented yet. Add a client under ` +
          `services/email/ (e.g. gmail-provider.ts using OAuth2) and wire it in here - ` +
          `no other part of the app needs to change.`
      );

    default:
      throw new Error(`Unknown mail provider: ${account.provider}`);
  }
}
