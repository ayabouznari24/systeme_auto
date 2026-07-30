"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CATEGORY_META } from "@/lib/constants";
import { cn, truncate } from "@/lib/utils";
import type { EmailListFilters, EmailWithTags } from "@/types/email";
import { useEmailsQuery } from "./hooks";
import { EmailDetailDialog } from "./email-detail-dialog";

export function EmailList({
  filters,
  onPageChange,
}: {
  filters: EmailListFilters;
  onPageChange: (page: number) => void;
}) {
  const { data, isLoading, isFetching } = useEmailsQuery(filters);
  const [selected, setSelected] = React.useState<EmailWithTags | null>(null);
  const queryClient = useQueryClient();

  const markProcessed = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/emails/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isProcessed: true }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emails"] }),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.emails.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Aucun email ne correspond à ces filtres.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", isFetching && "opacity-70")}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Catégorie</TableHead>
            <TableHead>Expéditeur / Sujet</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.emails.map((email) => {
            const meta = email.category ? CATEGORY_META[email.category] : undefined;
            return (
              <TableRow
                key={email.id}
                className={cn("cursor-pointer", !email.isRead && "font-medium")}
                onClick={() => setSelected(email)}
              >
                <TableCell>
                  {meta ? (
                    <Badge variant="outline" style={{ borderColor: meta.color, color: meta.color }}>
                      {meta.emoji} {meta.label}
                    </Badge>
                  ) : (
                    <Badge variant="outline">En cours...</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{email.fromName ?? email.fromAddress}</span>
                    <span className="text-xs text-muted-foreground">{truncate(email.subject, 80)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="tabular-nums">{email.priorityScore ?? "-"}</span>
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {format(new Date(email.receivedAt), "d MMM yyyy HH:mm", { locale: fr })}
                </TableCell>
                <TableCell className="text-right">
                  {!email.isProcessed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Marquer comme traité"
                      onClick={(e) => {
                        e.stopPropagation();
                        markProcessed.mutate(email.id);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {data.pagination.page} / {data.pagination.totalPages} — {data.pagination.total} email(s)
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={data.pagination.page <= 1}
            onClick={() => onPageChange(data.pagination.page - 1)}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={data.pagination.page >= data.pagination.totalPages}
            onClick={() => onPageChange(data.pagination.page + 1)}
          >
            Suivant
          </Button>
        </div>
      </div>

      <EmailDetailDialog email={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
