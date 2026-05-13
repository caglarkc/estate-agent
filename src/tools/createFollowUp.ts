import type { LeadScore } from "@/types/index";

interface ClaudeTextBlock {
  type?: string;
  text: string;
}

interface ClaudeMessagesResponse {
  content?: ClaudeTextBlock[];
}

function getClaudeText(data: ClaudeMessagesResponse): string {
  const text = data.content?.[0]?.text;

  if (typeof text !== "string") {
    throw new Error("Claude API response did not include text content.");
  }

  return text;
}

export async function createFollowUp(
  message: string,
  draft: string,
  leadScore: LeadScore,
): Promise<string> {
  const system =
    "You are a CRM assistant. Write a 2-sentence CRM note summarizing this estate agent interaction.";
  const content = `Customer message: ${message}\nAgent reply: ${draft}\nLead temperature: ${
    leadScore.score
  }\nSignals: ${leadScore.signals.join(", ")}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      system,
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as ClaudeMessagesResponse;

  return getClaudeText(data);
}
