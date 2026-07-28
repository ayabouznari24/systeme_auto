"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { NotificationSettings } from "@prisma/client";

export function NotificationSettingsForm() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: async (): Promise<NotificationSettings> => {
      const res = await fetch("/api/notifications/settings");
      const json = await res.json();
      return json.settings;
    },
  });

  const [local, setLocal] = React.useState<NotificationSettings | null>(null);
  React.useEffect(() => {
    if (data) setLocal(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async (settings: NotificationSettings) => {
      const res = await fetch("/api/notifications/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desktopEnabled: settings.desktopEnabled,
          emailEnabled: settings.emailEnabled,
          notifyEmailTo: settings.notifyEmailTo,
          minPriorityScore: settings.minPriorityScore,
          categories: settings.categories,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Préférences enregistrées");
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
    },
  });

  const sendTest = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/test", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => toast.success("Notification de test envoyée"),
    onError: () => toast.error("Échec de l'envoi du test"),
  });

  if (!local) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Recevez une alerte dès qu&apos;un email prioritaire est détecté.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="desktop">Notifications desktop</Label>
          <Switch
            id="desktop"
            checked={local.desktopEnabled}
            onCheckedChange={(v) => setLocal({ ...local, desktopEnabled: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="email">Notifications email</Label>
          <Switch
            id="email"
            checked={local.emailEnabled}
            onCheckedChange={(v) => setLocal({ ...local, emailEnabled: v })}
          />
        </div>
        {local.emailEnabled && (
          <div className="space-y-1.5">
            <Label>Adresse de notification</Label>
            <Input
              type="email"
              value={local.notifyEmailTo ?? ""}
              onChange={(e) => setLocal({ ...local, notifyEmailTo: e.target.value })}
              placeholder="alertes@example.com"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Score minimum déclenchant une notification</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={local.minPriorityScore}
            onChange={(e) => setLocal({ ...local, minPriorityScore: Number(e.target.value) })}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => save.mutate(local)} disabled={save.isPending}>
            Enregistrer
          </Button>
          <Button variant="outline" onClick={() => sendTest.mutate()} disabled={sendTest.isPending}>
            Envoyer un test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
