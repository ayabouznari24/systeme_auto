import { describe, expect, it } from "vitest";
import { applyScoringBoosts } from "@/services/ai/scoring";

const baseAnalysis = {
  priorityScore: 50,
  isFromRecruiter: false,
  isFromClient: false,
  isJobApplication: false,
  hasDeadline: false,
  amountsDetected: [] as string[],
};

describe("applyScoringBoosts", () => {
  it("leaves the score untouched when nothing qualifies for a boost", () => {
    const { finalScore, boosts } = applyScoringBoosts(baseAnalysis, {
      fromAddress: "someone@example.com",
      subject: "Hello",
    });
    expect(finalScore).toBe(50);
    expect(boosts).toHaveLength(0);
  });

  it("boosts emails from LinkedIn", () => {
    const { finalScore, boosts } = applyScoringBoosts(baseAnalysis, {
      fromAddress: "jobs-noreply@linkedin.com",
      subject: "New opportunity",
    });
    expect(finalScore).toBeGreaterThan(50);
    expect(boosts.some((b) => b.reason === "LinkedIn")).toBe(true);
  });

  it("boosts emails from Indeed and Welcome to the Jungle", () => {
    const indeed = applyScoringBoosts(baseAnalysis, {
      fromAddress: "alerts@indeed.com",
      subject: "Job alert",
    });
    expect(indeed.boosts.some((b) => b.reason === "Indeed")).toBe(true);

    const wttj = applyScoringBoosts(baseAnalysis, {
      fromAddress: "no-reply@welcometothejungle.com",
      subject: "Candidature",
    });
    expect(wttj.boosts.some((b) => b.reason === "Welcome to the Jungle")).toBe(true);
  });

  it("stacks recruiter, client, deadline, and amount boosts", () => {
    const { finalScore, boosts } = applyScoringBoosts(
      {
        ...baseAnalysis,
        isFromClient: true,
        isJobApplication: true,
        hasDeadline: true,
        amountsDetected: ["1500 EUR"],
      },
      { fromAddress: "client@business.com", subject: "Contrat à signer" }
    );
    expect(boosts.length).toBeGreaterThanOrEqual(4);
    expect(finalScore).toBeGreaterThan(50);
  });

  it("never exceeds 100 even with many stacked boosts", () => {
    const { finalScore } = applyScoringBoosts(
      {
        priorityScore: 98,
        isFromRecruiter: true,
        isFromClient: true,
        isJobApplication: true,
        hasDeadline: true,
        amountsDetected: ["10000 EUR"],
      },
      { fromAddress: "recrutement@linkedin.com", subject: "Offre" }
    );
    expect(finalScore).toBeLessThanOrEqual(100);
  });

  it("never drops below 1", () => {
    const { finalScore } = applyScoringBoosts(
      { ...baseAnalysis, priorityScore: 1 },
      { fromAddress: "spam@unknown.com", subject: "Buy now" }
    );
    expect(finalScore).toBeGreaterThanOrEqual(1);
  });
});
