import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { syncAllActiveAccounts } from "@/services/email-sync.service";

/** Manual "sync now" trigger for the dashboard, on top of the 5-minute cron. */
export async function POST() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const results = await syncAllActiveAccounts(userId);
  return NextResponse.json({ results });
}
