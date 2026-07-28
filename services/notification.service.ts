import nodemailer from "nodemailer";
import type { Email } from "@prisma/client";
import { logger } from "@/lib/logger";
import { CATEGORY_META } from "@/lib/constants";

const SCOPE = "notification-service";

/**
 * Desktop notifications can't be pushed from a server process to an OS
 * notification center directly - instead we persist "pending" desktop
 * notifications that the dashboard (running in the browser) polls and
 * displays via the Web Notifications API. See app/api/notifications and
 * components/dashboard/notification-listener.tsx.
 */
const pendingDesktopNotifications: { id: string; title: string; body: string; createdAt: Date }[] = [];

export function queueDesktopNotification(email: Email) {
  const meta = email.category ? CATEGORY_META[email.category] : undefined;
  pendingDesktopNotifications.push({
    id: email.id,
    title: `${meta?.emoji ?? "📧"} ${meta?.label ?? "Nouvel email"} (score ${email.priorityScore ?? "?"})`,
    body: `${email.fromName ?? email.fromAddress}: ${email.subject}`,
    createdAt: new Date(),
  });
  // Keep only the last 50 to avoid unbounded growth.
  if (pendingDesktopNotifications.length > 50) pendingDesktopNotifications.shift();
}

export function drainDesktopNotifications() {
  const items = [...pendingDesktopNotifications];
  pendingDesktopNotifications.length = 0;
  return items;
}

export function peekDesktopNotifications() {
  return [...pendingDesktopNotifications];
}

export async function sendEmailNotification(params: {
  to: string;
  emails: Email[];
}): Promise<void> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    logger.warn(SCOPE, "SMTP_HOST not configured, skipping email notification");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });

  const rows = params.emails
    .map((e) => {
      const meta = e.category ? CATEGORY_META[e.category] : undefined;
      return `<li><b>${meta?.emoji ?? ""} [${e.priorityScore ?? "?"}]</b> ${e.fromName ?? e.fromAddress} — ${e.subject}</li>`;
    })
    .join("\n");

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? host,
    to: params.to,
    subject: `[Mail Intelligence] ${params.emails.length} email(s) prioritaire(s)`,
    html: `<p>Nouveaux emails prioritaires détectés :</p><ul>${rows}</ul>`,
  });

  logger.info(SCOPE, "Sent email notification", { to: params.to, count: params.emails.length });
}
