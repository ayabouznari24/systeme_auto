"use client";

import * as React from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CategoryChart, VolumeChart } from "@/components/dashboard/charts";
import { SearchBar } from "@/components/dashboard/search-bar";
import { FiltersBar } from "@/components/dashboard/filters-bar";
import { EmailList } from "@/components/dashboard/email-list";
import { ExportButtons } from "@/components/dashboard/export-buttons";
import type { EmailListFilters } from "@/types/email";

const DEFAULT_FILTERS: EmailListFilters = {
  page: 1,
  pageSize: 25,
  sortBy: "receivedAt",
  sortDir: "desc",
};

export default function DashboardPage() {
  const [filters, setFilters] = React.useState<EmailListFilters>(DEFAULT_FILTERS);

  return (
    <div className="space-y-6">
      <StatsCards />

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryChart />
        <VolumeChart />
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchBar
            value={filters.search ?? ""}
            onChange={(search) => setFilters((f) => ({ ...f, search: search || undefined, page: 1 }))}
          />
          <ExportButtons />
        </div>
        <FiltersBar filters={filters} onChange={setFilters} />
        <EmailList filters={filters} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
      </div>
    </div>
  );
}
