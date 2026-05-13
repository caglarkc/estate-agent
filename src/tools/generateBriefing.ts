import { callLLM } from "@/lib/llmClient";
import type { CustomerMessage, Property } from "@/types/index";

const fallbackBriefing = [
  "Check your messages",
  "Review listing performance",
  "Follow up with recent leads",
];

function cleanJson(text: string): string {
  return text.replace(/```json|```/g, "").trim();
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export async function generateBriefing(
  messages: CustomerMessage[],
  listings: Property[],
): Promise<string[]> {
  const system =
    "You are a briefing assistant for a UK estate agent. Be concise and actionable.";
  const briefingData = {
    messages: messages.map((message) => ({
      sender: message.sender,
      lastContactDays: message.lastContactDays,
      sentimentSignal: message.sentimentSignal,
    })),
    listings: listings.map((listing) => ({
      title: listing.title,
      inquiryCount: listing.inquiryCount,
      viewingCount: listing.viewingCount,
      status: listing.status,
    })),
  };
  const user = `${JSON.stringify(
    briefingData,
  )}\n\nReturn ONLY a JSON array of 3-4 short actionable briefing items (strings), max 15 words each. Focus on: unanswered hot leads, listings with low conversion, today's priorities.`;

  try {
    const response = await callLLM(system, user);
    const parsed = JSON.parse(cleanJson(response)) as unknown;

    if (isStringArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 4);
    }

    return fallbackBriefing;
  } catch {
    return fallbackBriefing;
  }
}
