"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORY_META, priorityBandLabel } from "@/lib/constants";
import type { EmailWithTags } from "@/types/email";

const ACTION_LABELS: Record<string, string> = {
  REPLY: "Répondre",
  CREATE_TASK: "Créer une tâche",
  ARCHIVE: "Archiver",
  FORWARD: "Transférer",
  DELETE: "Supprimer",
};

const SENTIMENT_LABELS: Record<string, string> = {
  POSITIVE: "😊 Positif",
  NEUTRAL: "😐 Neutre",
  NEGATIVE: "😟 Négatif",
};

export function EmailDetailDialog({
  email,
  onOpenChange,
}: {
  email: EmailWithTags | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [tagInput, setTagInput] = React.useState("");

  const patch = useMutation({
    mutationFn: async (data: Record<string, boolean>) => {
      if (!email) return;
      const res = await fetch(`/api/emails/${email.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const addTag = useMutation({
    mutationFn: async (tagNames: string[]) => {
      if (!email) return;
      const res = await fetch(`/api/emails/${email.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagNames }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setTagInput("");
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
    onError: () => toast.error("Impossible d'ajouter le tag"),
  });

  if (!email) return null;
  const meta = email.category ? CATEGORY_META[email.category] : undefined;

  return (
    <Dialog open={!!email} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-6">{email.subject}</DialogTitle>
          <DialogDescription>
            {email.fromName ?? email.fromAddress} &lt;{email.fromAddress}&gt; —{" "}
            {format(new Date(email.receivedAt), "d MMMM yyyy à HH:mm", { locale: fr })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          {meta && (
            <Badge style={{ backgroundColor: meta.color, color: "white" }}>
              {meta.emoji} {meta.label}
            </Badge>
          )}
          <Badge variant="secondary">Score {email.priorityScore ?? "-"} — {priorityBandLabel(email.priorityScore ?? 0)}</Badge>
          {email.sentiment && <Badge variant="outline">{SENTIMENT_LABELS[email.sentiment]}</Badge>}
          {email.recommendedAction && (
            <Badge variant="outline">Action : {ACTION_LABELS[email.recommendedAction]}</Badge>
          )}
        </div>

        {email.summary && (
          <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-line">{email.summary}</div>
        )}

        {email.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {email.keywords.map((kw) => (
              <Badge key={kw} variant="secondary">
                {kw}
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Tags</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {email.tags.map(({ tag }) => (
              <Badge key={tag.id} variant="outline">
                {tag.name}
              </Badge>
            ))}
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                if (tagInput.trim()) addTag.mutate([tagInput.trim()]);
              }}
            >
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Ajouter un tag..."
                className="h-7 w-32 text-xs"
              />
            </form>
          </div>
        </div>

        {email.bodyText && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">Voir le contenu complet</summary>
            <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-line rounded-md border p-3">
              {email.bodyText}
            </p>
          </details>
        )}

        <DialogFooter className="gap-2">
          {!email.isProcessed && (
            <Button variant="secondary" onClick={() => patch.mutate({ isProcessed: true })}>
              Marquer comme traité
            </Button>
          )}
          {!email.isArchived && (
            <Button variant="outline" onClick={() => patch.mutate({ isArchived: true })}>
              Archiver
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => {
              patch.mutate({ isDeleted: true });
              onOpenChange(false);
            }}
          >
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
