import { z } from "zod";

/** z.coerce.boolean() treats the string "false" as truthy (Boolean("false") === true) - this parses "true"/"false" literally. */
const stringBoolean = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((v) => (typeof v === "boolean" ? v : v === "true"));

export const emailCategoryEnum = z.enum([
  "URGENT",
  "IMPORTANT",
  "TODAY",
  "THIS_WEEK",
  "INFORMATION",
  "NEWSLETTER",
  "SPAM",
]);

export const sentimentEnum = z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]);

export const recommendedActionEnum = z.enum([
  "REPLY",
  "CREATE_TASK",
  "ARCHIVE",
  "FORWARD",
  "DELETE",
]);

/** Shape the AI must return; validated before persisting so a bad LLM response never corrupts data. */
export const aiAnalysisSchema = z.object({
  category: emailCategoryEnum,
  priorityScore: z.number().int().min(1).max(100),
  sentiment: sentimentEnum,
  summary: z.string().min(1).max(1000),
  keywords: z.array(z.string()).max(15),
  recommendedAction: recommendedActionEnum,
  hasDeadline: z.boolean(),
  deadlineAt: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  amountsDetected: z.array(z.string()).max(10),
  isFromRecruiter: z.boolean(),
  isFromClient: z.boolean(),
  isJobApplication: z.boolean(),
  reasoning: z.string().optional(),
});

export const emailListQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  category: z.array(emailCategoryEnum).optional(),
  minPriority: z.coerce.number().int().min(0).max(100).optional(),
  maxPriority: z.coerce.number().int().min(0).max(100).optional(),
  fromAddress: z.string().trim().max(200).optional(),
  isProcessed: stringBoolean.optional(),
  isArchived: stringBoolean.optional(),
  tagIds: z.array(z.string()).optional(),
  emailAccountId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(["priorityScore", "receivedAt"]).default("receivedAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export const updateEmailSchema = z.object({
  isProcessed: z.boolean().optional(),
  isRead: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
});

export const addTagsSchema = z.object({
  tagNames: z.array(z.string().trim().min(1).max(40)).min(1).max(10),
});

export const createEmailAccountSchema = z.object({
  provider: z
    .enum(["TITAN", "IMAP_GENERIC", "GMAIL", "OUTLOOK", "OFFICE365", "YAHOO", "PROTON"])
    .default("TITAN"),
  label: z.string().trim().min(1).max(60).default("Titan Mail"),
  emailAddress: z.string().email(),
  imapHost: z.string().trim().optional(),
  imapPort: z.number().int().min(1).max(65535).optional(),
  imapSecure: z.boolean().optional(),
  username: z.string().trim().optional(),
  password: z.string().min(1),
});

export const notificationSettingsSchema = z.object({
  desktopEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  notifyEmailTo: z.string().email().nullable().optional(),
  minPriorityScore: z.number().int().min(0).max(100),
  categories: z.array(emailCategoryEnum),
});
