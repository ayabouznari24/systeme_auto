import { ImapProvider } from "./imap-provider";
import type { MailProviderClient } from "./types";

const TITAN_IMAP_HOST = "imap.titan.email";
const TITAN_IMAP_PORT = 993;

export interface TitanCredentials {
  emailAddress: string;
  password: string;
  folder?: string;
}

/**
 * Titan Email preset. Titan (Hostinger's business email) exposes standard
 * IMAP/SMTP - no proprietary API needed. This just supplies Titan's known
 * host/port to the generic IMAP client.
 */
export function createTitanProvider(creds: TitanCredentials): MailProviderClient {
  return new ImapProvider(
    {
      host: TITAN_IMAP_HOST,
      port: TITAN_IMAP_PORT,
      secure: true,
      username: creds.emailAddress,
      password: creds.password,
      folder: creds.folder ?? "INBOX",
    },
    "TITAN"
  );
}
