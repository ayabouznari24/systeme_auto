import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { emailListQuerySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const raw = {
    search: url.searchParams.get("search") ?? undefined,
    category: url.searchParams.getAll("category").length
      ? url.searchParams.getAll("category")
      : undefined,
    minPriority: url.searchParams.get("minPriority") ?? undefined,
    maxPriority: url.searchParams.get("maxPriority") ?? undefined,
    fromAddress: url.searchParams.get("fromAddress") ?? undefined,
    isProcessed: url.searchParams.get("isProcessed") ?? undefined,
    isArchived: url.searchParams.get("isArchived") ?? undefined,
    tagIds: url.searchParams.getAll("tagIds").length ? url.searchParams.getAll("tagIds") : undefined,
    emailAccountId: url.searchParams.get("emailAccountId") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
    sortBy: url.searchParams.get("sortBy") ?? undefined,
    sortDir: url.searchParams.get("sortDir") ?? undefined,
  };

  const parsed = emailListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const filters = parsed.data;

  const where: Prisma.EmailWhereInput = {
    isDeleted: false,
    emailAccount: { userId },
    ...(filters.emailAccountId ? { emailAccountId: filters.emailAccountId } : {}),
    ...(filters.category ? { category: { in: filters.category } } : {}),
    ...(filters.fromAddress ? { fromAddress: { contains: filters.fromAddress, mode: "insensitive" } } : {}),
    ...(filters.isProcessed !== undefined ? { isProcessed: filters.isProcessed } : {}),
    ...(filters.isArchived !== undefined ? { isArchived: filters.isArchived } : {}),
    ...(filters.minPriority !== undefined || filters.maxPriority !== undefined
      ? {
          priorityScore: {
            ...(filters.minPriority !== undefined ? { gte: filters.minPriority } : {}),
            ...(filters.maxPriority !== undefined ? { lte: filters.maxPriority } : {}),
          },
        }
      : {}),
    ...(filters.tagIds ? { tags: { some: { tagId: { in: filters.tagIds } } } } : {}),
    ...(filters.search
      ? {
          OR: [
            { subject: { contains: filters.search, mode: "insensitive" } },
            { bodyText: { contains: filters.search, mode: "insensitive" } },
            { fromAddress: { contains: filters.search, mode: "insensitive" } },
            { fromName: { contains: filters.search, mode: "insensitive" } },
            { summary: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, emails] = await Promise.all([
    prisma.email.count({ where }),
    prisma.email.findMany({
      where,
      orderBy: { [filters.sortBy]: filters.sortDir },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: { tags: { include: { tag: true } } },
    }),
  ]);

  return NextResponse.json({
    emails,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    },
  });
}
