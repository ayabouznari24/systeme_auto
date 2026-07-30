import type { AIProvider } from "@/types/ai";
import { OpenAIProvider } from "./openai-provider";
import { ClaudeProvider } from "./claude-provider";

let cached: AIProvider | null = null;

/**
 * Returns the configured AI provider. Controlled entirely by env vars so
 * swapping OpenAI <-> Claude never requires a code change:
 *   AI_PROVIDER=openai (default) + OPENAI_API_KEY [+ OPENAI_MODEL]
 *   AI_PROVIDER=claude          + ANTHROPIC_API_KEY [+ ANTHROPIC_MODEL]
 */
export function getAIProvider(): AIProvider {
  if (cached) return cached;

  const providerName = (process.env.AI_PROVIDER ?? "openai").toLowerCase();

  if (providerName === "claude") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required when AI_PROVIDER=claude.");
    cached = new ClaudeProvider(apiKey, process.env.ANTHROPIC_MODEL);
    return cached;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai.");
  cached = new OpenAIProvider(apiKey, process.env.OPENAI_MODEL);
  return cached;
}
