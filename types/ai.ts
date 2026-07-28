import type { EmailCategory, RecommendedAction, Sentiment } from "@prisma/client";

/** Structured output the AI layer must produce for every email. */
export interface AIAnalysisResult {
  category: EmailCategory;
  priorityScore: number; // 1-100, pre-boost (boosts applied by scoring.ts)
  sentiment: Sentiment;
  summary: string; // 3 lines, \n separated
  keywords: string[];
  recommendedAction: RecommendedAction;
  hasDeadline: boolean;
  deadlineAt: string | null; // ISO date string
  amountsDetected: string[];
  isFromRecruiter: boolean;
  isFromClient: boolean;
  isJobApplication: boolean;
  reasoning?: string;
}

export interface AIAnalysisInput {
  fromName?: string;
  fromAddress: string;
  toAddresses: string[];
  subject: string;
  bodyText: string;
  receivedAt: Date;
}

/** Provider-agnostic interface so OpenAI can be swapped for Claude (or others). */
export interface AIProvider {
  readonly name: string;
  analyze(input: AIAnalysisInput): Promise<AIAnalysisResult>;
}
