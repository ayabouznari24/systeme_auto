"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardStats, EmailListFilters, EmailWithTags } from "@/types/email";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      const { stats } = await res.json();
      return stats;
    },
    refetchInterval: 60_000,
  });
}

export interface EmailsPage {
  emails: EmailWithTags[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

function buildQueryString(filters: EmailListFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category?.length) filters.category.forEach((c) => params.append("category", c));
  if (filters.minPriority !== undefined) params.set("minPriority", String(filters.minPriority));
  if (filters.maxPriority !== undefined) params.set("maxPriority", String(filters.maxPriority));
  if (filters.fromAddress) params.set("fromAddress", filters.fromAddress);
  if (filters.isProcessed !== undefined) params.set("isProcessed", String(filters.isProcessed));
  if (filters.isArchived !== undefined) params.set("isArchived", String(filters.isArchived));
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortDir) params.set("sortDir", filters.sortDir);
  return params.toString();
}

export function useEmailsQuery(filters: EmailListFilters) {
  return useQuery({
    queryKey: ["emails", filters],
    queryFn: async (): Promise<EmailsPage> => {
      const res = await fetch(`/api/emails?${buildQueryString(filters)}`);
      if (!res.ok) throw new Error("Failed to load emails");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });
}
