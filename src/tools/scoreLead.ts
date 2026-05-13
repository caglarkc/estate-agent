import type { LeadScore } from "@/types/index";

interface Intent {
  intent_type: string;
  property_keywords: string[];
  city: string | null;
  urgency: boolean;
  specific_date: string | null;
  pet: boolean;
  furnished: boolean | null;
  bedrooms: number | null;
}

export function scoreLead(intent: Intent, messageText: string): LeadScore {
  const normalizedMessage = messageText.toLowerCase();
  const signals: string[] = [];
  let score = 0;

  if (
    normalizedMessage.includes("view") ||
    normalizedMessage.includes("visit") ||
    normalizedMessage.includes("see the property")
  ) {
    score += 2;
    signals.push("Viewing requested");
  }

  if (intent.specific_date !== null) {
    score += 1;
    signals.push("Specific date mentioned");
  }

  if (
    intent.urgency ||
    normalizedMessage.includes("asap") ||
    normalizedMessage.includes("urgently") ||
    normalizedMessage.includes("next month") ||
    normalizedMessage.includes("relocating")
  ) {
    score += 2;
    signals.push("Urgency signal");
  }

  if (
    normalizedMessage.includes("budget") ||
    normalizedMessage.includes("afford") ||
    normalizedMessage.includes("£") ||
    normalizedMessage.includes("rent")
  ) {
    score += 1;
    signals.push("Budget mentioned");
  }

  if (
    normalizedMessage.includes("just looking") ||
    normalizedMessage.includes("thinking about it")
  ) {
    score -= 1;
    signals.push("Just browsing");
  }

  if (score >= 4) {
    return { score: "HOT", signals };
  }

  if (score >= 2) {
    return { score: "WARM", signals };
  }

  return { score: "COLD", signals };
}
