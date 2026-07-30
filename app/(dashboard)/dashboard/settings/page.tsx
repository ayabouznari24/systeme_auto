import { AccountsManager } from "@/components/dashboard/accounts-manager";
import { NotificationSettingsForm } from "@/components/dashboard/notification-settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <AccountsManager />
      <NotificationSettingsForm />
    </div>
  );
}
