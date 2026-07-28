"use client";

import type { EmailCategory } from "@prisma/client";
import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORY_META } from "@/lib/constants";
import type { EmailListFilters } from "@/types/email";

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as EmailCategory[];

export function FiltersBar({
  filters,
  onChange,
}: {
  filters: EmailListFilters;
  onChange: (filters: EmailListFilters) => void;
}) {
  const selectedCategories = filters.category ?? [];

  function toggleCategory(category: EmailCategory) {
    const next = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    onChange({ ...filters, category: next.length ? next : undefined, page: 1 });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <ListFilter className="h-4 w-4" />
            Catégories {selectedCategories.length ? `(${selectedCategories.length})` : ""}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Filtrer par catégorie</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ALL_CATEGORIES.map((category) => (
            <DropdownMenuCheckboxItem
              key={category}
              checked={selectedCategories.includes(category)}
              onCheckedChange={() => toggleCategory(category)}
              onSelect={(e) => e.preventDefault()}
            >
              {CATEGORY_META[category].emoji} {CATEGORY_META[category].label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-1.5">
        <Label htmlFor="minPriority" className="text-xs text-muted-foreground">
          Score min
        </Label>
        <Input
          id="minPriority"
          type="number"
          min={0}
          max={100}
          className="h-8 w-20"
          value={filters.minPriority ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              minPriority: e.target.value ? Number(e.target.value) : undefined,
              page: 1,
            })
          }
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Label htmlFor="fromAddress" className="text-xs text-muted-foreground">
          Expéditeur
        </Label>
        <Input
          id="fromAddress"
          placeholder="ex. linkedin.com"
          className="h-8 w-40"
          value={filters.fromAddress ?? ""}
          onChange={(e) => onChange({ ...filters, fromAddress: e.target.value || undefined, page: 1 })}
        />
      </div>

      <Button
        variant={filters.isProcessed === false ? "secondary" : "ghost"}
        size="sm"
        onClick={() =>
          onChange({
            ...filters,
            isProcessed: filters.isProcessed === false ? undefined : false,
            page: 1,
          })
        }
      >
        Non traités
      </Button>

      <Button
        variant={filters.isArchived === true ? "secondary" : "ghost"}
        size="sm"
        onClick={() =>
          onChange({
            ...filters,
            isArchived: filters.isArchived === true ? undefined : true,
            page: 1,
          })
        }
      >
        Archivés
      </Button>
    </div>
  );
}
