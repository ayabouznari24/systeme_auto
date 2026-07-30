import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DarkModeToggle } from "@/components/dashboard/dark-mode-toggle";
import { SyncNowButton } from "@/components/dashboard/sync-now-button";
import { NotificationListener } from "@/components/dashboard/notification-listener";
import { NavLinks } from "@/components/dashboard/nav-links";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Mail } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <NotificationListener />
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-semibold">
              <Mail className="h-5 w-5 text-primary" />
              Mail Intelligence
            </div>
            <NavLinks />
          </div>
          <div className="flex items-center gap-2">
            <SyncNowButton />
            <DarkModeToggle />
            <UserMenu email={session.user?.email ?? ""} />
          </div>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
