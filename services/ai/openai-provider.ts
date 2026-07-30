import OpenAI from "openai";
import { aiAnalysisSchema } from "@/lib/validations";
import type { AIAnalysisInput, AIAnalysisResult, AIProvider } from "@/types/ai";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async analyze(input: AIAnalysisInput): Promise<AIAnalysisResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("OpenAI returned an empty response.");

    const parsed = aiAnalysisSchema.parse(JSON.parse(raw));
    return parsed;
  }
}
