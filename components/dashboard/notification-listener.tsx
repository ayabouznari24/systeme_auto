"use client";

import * as React from "react";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 30_000;

/**
 * Polls the server for newly-analyzed high-priority emails and surfaces them
 * as desktop notifications (Web Notifications API) with a toast fallback.
 * The actual queueing happens server-side in services/notification.service.ts
 * right after the cron sync analyzes each email.
 */
export function NotificationListener() {
  React.useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const { notifications } = await res.json();
        if (cancelled) return;

        for (const n of notifications as { id: string; title: string; body: string }[]) {
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(n.title, { body: n.body });
          } else {
            toast(n.title, { description: n.body });
          }
        }
      } catch {
        // Silent - notification polling should never disrupt the dashboard.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return null;
}
