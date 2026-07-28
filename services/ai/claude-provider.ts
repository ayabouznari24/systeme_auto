import Anthropic from "@anthropic-ai/sdk";
import { aiAnalysisSchema } from "@/lib/validations";
import type { AIAnalysisInput, AIAnalysisResult, AIProvider } from "@/types/ai";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";

/**
 * Drop-in replacement for OpenAIProvider. Both implement the same AIProvider
 * interface (see types/ai.ts), so switching is a one-line change in
 * ai-factory.ts / AI_PROVIDER env var - nothing else in the app changes.
 */
export class ClaudeProvider implements AIProvider {
  readonly name = "claude";
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = "claude-sonnet-5") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async analyze(input: AIAnalysisInput): Promise<AIAnalysisResult> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });

    const block = message.content.find((c) => c.type === "text");
    if (!block || block.type !== "text") {
      throw new Error("Claude returned an empty response.");
    }

    const jsonText = extractJson(block.text);
    const parsed = aiAnalysisSchema.parse(JSON.parse(jsonText));
    return parsed;
  }
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  return text.trim();
}
