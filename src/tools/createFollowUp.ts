import { callLLM } from "@/lib/llmClient";
import type { LeadScore } from "@/types/index";

export async function createFollowUp(
  message: string,
  draft: string,
  leadScore: LeadScore,
): Promise<string> {
  const system =
    "You are a CRM assistant. Write a 2-sentence CRM note summarizing this estate agent interaction.";
  const user = `Customer message: ${message}\nAgent reply: ${draft}\nLead temperature: ${
    leadScore.score
  }\nSignals: ${leadScore.signals.join(", ")}`;

  return callLLM(system, user);
}
