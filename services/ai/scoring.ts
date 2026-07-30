import { HIGH_VALUE_SENDER_PATTERNS } from "@/lib/constants";
import type { AIAnalysisResult } from "@/types/ai";

export interface ScoringBoost {
  reason: string;
  amount: number;
}

export interface ScoredResult {
  finalScore: number;
  boosts: ScoringBoost[];
}

/**
 * Applies deterministic, explainable boosts on top of the LLM's own score.
 * Keeping this rule-based (rather than folding it into the prompt) means the
 * "always prioritize recruiters/clients" requirement is guaranteed even if
 * the model under/over-scores, and it's cheap to unit test.
 */
export function applyScoringBoosts(
  aiResult: Pick<
    AIAnalysisResult,
    "priorityScore" | "isFromRecruiter" | "isFromClient" | "isJobApplication" | "hasDeadline" | "amountsDetected"
  >,
  email: { fromAddress: string; fromName?: string; subject: string }
): ScoredResult {
  const boosts: ScoringBoost[] = [];
  const contentHaystack = `${email.fromAddress} ${email.fromName ?? ""} ${email.subject}`;

  for (const { pattern, boost, reason, scope } of HIGH_VALUE_SENDER_PATTERNS) {
    const target = scope === "sender" ? email.fromAddress : contentHaystack;
    if (pattern.test(target)) {
      boosts.push({ reason, amount: boost });
      break; // one sender-pattern boost is enough; avoid stacking near-duplicates
    }
  }

  if (aiResult.isFromRecruiter && !boosts.length) {
    boosts.push({ reason: "Recruteur (détecté par l'IA)", amount: 12 });
  }
  if (aiResult.isFromClient) {
    boosts.push({ reason: "Client", amount: 10 });
  }
  if (aiResult.isJobApplication) {
    boosts.push({ reason: "Candidature / réponse à une offre", amount: 10 });
  }
  if (aiResult.hasDeadline) {
    boosts.push({ reason: "Deadline détectée", amount: 8 });
  }
  if (aiResult.amountsDetected.length > 0) {
    boosts.push({ reason: "Montant financier détecté", amount: 5 });
  }

  const totalBoost = boosts.reduce((sum, b) => sum + b.amount, 0);
  const finalScore = Math.min(100, Math.max(1, aiResult.priorityScore + totalBoost));

  return { finalScore, boosts };
}
