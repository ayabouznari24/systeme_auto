import type {
  Email,
  EmailAccount,
  EmailCategory,
  MailProvider,
  ProcessingStatus,
  RecommendedAction,
  Sentiment,
  Tag,
} from "@prisma/client";

export type {
  EmailCategory,
  MailProvider,
  ProcessingStatus,
  RecommendedAction,
  Sentiment,
};

/** A message as read off the wire, before any AI analysis is attached. */
export interface RawEmailMessage {
  messageId: string;
  uid?: number;
  folder: string;
  fromName?: string;
  fromAddress: string;
  toAddresses: string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  receivedAt: Date;
  hasAttachments: boolean;
}

export type EmailWithTags = Email & { tags: { tag: Tag }[] };

export interface EmailListFilters {
  search?: string;
  category?: EmailCategory[];
  minPriority?: number;
  maxPriority?: number;
  fromAddress?: string;
  isProcessed?: boolean;
  isArchived?: boolean;
  tagIds?: string[];
  emailAccountId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "priorityScore" | "receivedAt";
  sortDir?: "asc" | "desc";
}

export interface DashboardStats {
  total: number;
  urgent: number;
  important: number;
  today: number;
  thisWeek: number;
  information: number;
  newsletter: number;
  spam: number;
  unprocessed: number;
  averagePriority: number;
  categoryBreakdown: Record<EmailCategory, number>;
  volumeByDay: { date: string; count: number }[];
}

export type EmailAccountSafe = Omit<EmailAccount, "encryptedSecret">;
