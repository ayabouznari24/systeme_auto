import type { RawEmailMessage } from "@/types/email";

/** Connection details a provider needs to open a mailbox session. Provider-agnostic. */
export interface MailboxConnectionConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  folder?: string;
}

/**
 * Provider-agnostic mailbox interface. Titan (and any generic IMAP mailbox)
 * implements this today; Gmail/Outlook/Yahoo/Proton can implement it later
 * (via OAuth + their own APIs) without any caller needing to change.
 */
export interface MailProviderClient {
  readonly providerName: string;

  /**
   * Fetches messages that arrived after `sinceUid` (provider-defined cursor).
   * Returns the messages plus the new cursor to persist for the next run.
   */
  fetchNewMessages(sinceUid: number): Promise<{
    messages: RawEmailMessage[];
    newCursor: number;
  }>;
}
