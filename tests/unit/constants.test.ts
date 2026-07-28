import { describe, expect, it } from "vitest";
import { priorityBandLabel, CATEGORY_META } from "@/lib/constants";

describe("priorityBandLabel", () => {
  it.each([
    [100, "Répondre immédiatement"],
    [95, "Répondre immédiatement"],
    [94, "Aujourd'hui"],
    [80, "Aujourd'hui"],
    [79, "Important mais pas urgent"],
    [60, "Important mais pas urgent"],
    [59, "Peut attendre"],
    [40, "Peut attendre"],
    [39, "Faible priorité"],
    [0, "Faible priorité"],
  ])("maps score %i to \"%s\"", (score, expected) => {
    expect(priorityBandLabel(score)).toBe(expected);
  });
});

describe("CATEGORY_META", () => {
  it("defines all 7 required categories", () => {
    expect(Object.keys(CATEGORY_META).sort()).toEqual(
      ["IMPORTANT", "INFORMATION", "NEWSLETTER", "SPAM", "THIS_WEEK", "TODAY", "URGENT"].sort()
    );
  });
});
