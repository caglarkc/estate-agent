import type { Property } from "@/types/index";
import type { checkAvailability } from "./checkAvailability";

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

export async function draftReply(
  message: string,
  property: Property | null,
  availability: ReturnType<typeof checkAvailability>,
): Promise<string> {
  const system =
    "You are a professional UK estate agent assistant. Write a friendly, concise reply (under 100 words) using ONLY the property data provided to you. Do not invent any details. If information is missing, say you'll check and follow up. Always suggest a next step.";
  const content = `${message}\n\nProperty data:\n${JSON.stringify(
    property,
  )}\n\nAvailability:\n${JSON.stringify(availability)}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
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
