import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Returns the current session's user id, or null if unauthenticated. */
export async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
