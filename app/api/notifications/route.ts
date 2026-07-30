import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { drainDesktopNotifications } from "@/services/notification.service";

/** Polled by the dashboard (see components/dashboard/notification-listener.tsx) to surface desktop notifications. */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = drainDesktopNotifications();
  return NextResponse.json({ notifications });
}
