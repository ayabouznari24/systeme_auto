"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// Plain <a> tags are intentional here: these are file-download endpoints
// (API routes), not client-side page navigation, so next/link doesn't apply.
export function ExportButtons() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/api/emails/export/csv">
          <FileDown className="h-4 w-4" />
          CSV
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/api/emails/export/pdf">
          <FileDown className="h-4 w-4" />
          PDF
        </a>
      </Button>
    </div>
  );
}
