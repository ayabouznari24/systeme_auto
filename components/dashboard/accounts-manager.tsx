"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EmailAccountSafe } from "@/types/email";

export function AccountsManager() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async (): Promise<EmailAccountSafe[]> => {
      const res = await fetch("/api/accounts");
      const json = await res.json();
      return json.accounts;
    },
  });

  const [form, setForm] = React.useState({ emailAddress: "", password: "", label: "Titan Mail" });

  const createAccount = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "TITAN", ...form }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.formErrors?.join(", ") ?? "Erreur");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Compte Titan connecté");
      setForm({ emailAddress: "", password: "", label: "Titan Mail" });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeAccount = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comptes email connectés</CardTitle>
        <CardDescription>
          Connectez votre boîte Titan Email par IMAP. Le mot de passe est chiffré avant stockage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}
          {data?.map((account) => (
            <div key={account.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">{account.label}</p>
                <p className="text-xs text-muted-foreground">
                  {account.emailAddress} · {account.provider}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={account.isActive ? "default" : "secondary"}>
                  {account.isActive ? "Actif" : "Inactif"}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => removeAccount.mutate(account.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {data?.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun compte connecté pour le moment.</p>
          )}
        </div>

        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            createAccount.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Adresse Titan Mail</Label>
            <Input
              type="email"
              required
              value={form.emailAddress}
              onChange={(e) => setForm((f) => ({ ...f, emailAddress: e.target.value }))}
              placeholder="you@votredomaine.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Mot de passe IMAP</Label>
            <Input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={createAccount.isPending} className="w-full">
              {createAccount.isPending ? "Connexion..." : "Connecter"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
