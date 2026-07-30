import type { EmailCategory } from "@prisma/client";

export const CATEGORY_META: Record<
  EmailCategory,
  { label: string; emoji: string; color: string }
> = {
  URGENT: { label: "Urgent", emoji: "🔴", color: "#ef4444" },
  IMPORTANT: { label: "Important", emoji: "🟠", color: "#f97316" },
  TODAY: { label: "À traiter aujourd'hui", emoji: "🟡", color: "#eab308" },
  THIS_WEEK: { label: "À traiter cette semaine", emoji: "🔵", color: "#3b82f6" },
  INFORMATION: { label: "Information", emoji: "🟢", color: "#22c55e" },
  NEWSLETTER: { label: "Newsletter", emoji: "⚪", color: "#94a3b8" },
  SPAM: { label: "Spam", emoji: "⚫", color: "#334155" },
};

export const PRIORITY_BANDS = [
  { min: 95, max: 100, label: "Répondre immédiatement" },
  { min: 80, max: 94, label: "Aujourd'hui" },
  { min: 60, max: 79, label: "Important mais pas urgent" },
  { min: 40, max: 59, label: "Peut attendre" },
  { min: 0, max: 39, label: "Faible priorité" },
] as const;

export function priorityBandLabel(score: number): string {
  const band = PRIORITY_BANDS.find((b) => score >= b.min && score <= b.max);
  return band?.label ?? "Non évalué";
}

/**
 * Domains/senders that automatically receive a priority boost.
 * `scope: "sender"` patterns are matched against the from-address alone (the
 * trailing `$` anchor only makes sense there); `scope: "content"` patterns
 * are matched against the full from/subject text.
 */
export const HIGH_VALUE_SENDER_PATTERNS: {
  pattern: RegExp;
  boost: number;
  reason: string;
  scope: "sender" | "content";
}[] = [
  { pattern: /@linkedin\.com$/i, boost: 15, reason: "LinkedIn", scope: "sender" },
  { pattern: /@indeed\.com$/i, boost: 15, reason: "Indeed", scope: "sender" },
  { pattern: /@welcometothejungle\.com$/i, boost: 15, reason: "Welcome to the Jungle", scope: "sender" },
  { pattern: /recrut(ement|eur|er)/i, boost: 12, reason: "Recruteur", scope: "content" },
  { pattern: /@(hr|talent|jobs)\./i, boost: 10, reason: "RH / Talent acquisition", scope: "sender" },
];

export const DEFAULT_SYNC_INTERVAL_CRON = "*/5 * * * *";
