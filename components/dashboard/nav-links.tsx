"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/settings", label: "Paramètres" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-4 text-sm">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-muted-foreground transition-colors hover:text-foreground",
            pathname === link.href && "font-medium text-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
