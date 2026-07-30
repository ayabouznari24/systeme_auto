import { describe, expect, it } from "vitest";
import { aiAnalysisSchema, emailListQuerySchema } from "@/lib/validations";

const validAnalysis = {
  category: "URGENT",
  priorityScore: 95,
  sentiment: "NEGATIVE",
  summary: "Ligne 1\nLigne 2\nLigne 3",
  keywords: ["facture", "urgent"],
  recommendedAction: "REPLY",
  hasDeadline: true,
  deadlineAt: new Date().toISOString(),
  amountsDetected: ["500 EUR"],
  isFromRecruiter: false,
  isFromClient: true,
  isJobApplication: false,
};

describe("aiAnalysisSchema", () => {
  it("accepts a well-formed AI response", () => {
    expect(() => aiAnalysisSchema.parse(validAnalysis)).not.toThrow();
  });

  it("rejects a priority score outside 1-100", () => {
    expect(() => aiAnalysisSchema.parse({ ...validAnalysis, priorityScore: 150 })).toThrow();
  });

  it("rejects an invalid category", () => {
    expect(() => aiAnalysisSchema.parse({ ...validAnalysis, category: "NOT_A_CATEGORY" })).toThrow();
  });

  it("allows a null deadlineAt", () => {
    expect(() => aiAnalysisSchema.parse({ ...validAnalysis, deadlineAt: null })).not.toThrow();
  });
});

describe("emailListQuerySchema", () => {
  it("applies defaults for pagination and sorting", () => {
    const parsed = emailListQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(25);
    expect(parsed.sortBy).toBe("receivedAt");
    expect(parsed.sortDir).toBe("desc");
  });

  it("coerces string query params to numbers/booleans", () => {
    const parsed = emailListQuerySchema.parse({ minPriority: "80", isProcessed: "false", page: "2" });
    expect(parsed.minPriority).toBe(80);
    expect(parsed.isProcessed).toBe(false);
    expect(parsed.page).toBe(2);
  });
});
