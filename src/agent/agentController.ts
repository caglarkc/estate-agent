import { getTool } from "@/agent/toolRegistry";
import type { AgentState, CustomerMessage, TraceStep } from "@/types/index";

export interface Intent {
  intent_type:
    | "availability"
    | "pricing"
    | "viewing"
    | "application_status"
    | "general";
  property_keywords: string[];
  city: string | null;
  urgency: boolean;
  specific_date: string | null;
  pet: boolean;
  furnished: boolean | null;
  bedrooms: number | null;
}

interface ClaudeTextBlock {
  type?: string;
  text: string;
}

interface ClaudeMessagesResponse {
  content?: ClaudeTextBlock[];
}

const fallbackIntent: Intent = {
  intent_type: "general",
  property_keywords: [],
  city: null,
  urgency: false,
  specific_date: null,
  pet: false,
  furnished: null,
  bedrooms: null,
};

function createTraceStep(step: string, detail: string): TraceStep {
  return {
    id: crypto.randomUUID(),
    step,
    detail,
    timestamp: Date.now(),
  };
}

function isIntent(value: unknown): value is Intent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const validIntentTypes: Intent["intent_type"][] = [
    "availability",
    "pricing",
    "viewing",
    "application_status",
    "general",
  ];

  return (
    typeof candidate.intent_type === "string" &&
    validIntentTypes.includes(candidate.intent_type as Intent["intent_type"]) &&
    Array.isArray(candidate.property_keywords) &&
    candidate.property_keywords.every((item) => typeof item === "string") &&
    (typeof candidate.city === "string" || candidate.city === null) &&
    typeof candidate.urgency === "boolean" &&
    (typeof candidate.specific_date === "string" ||
      candidate.specific_date === null) &&
    typeof candidate.pet === "boolean" &&
    (typeof candidate.furnished === "boolean" ||
      candidate.furnished === null) &&
    (typeof candidate.bedrooms === "number" || candidate.bedrooms === null)
  );
}

function getClaudeText(data: ClaudeMessagesResponse): string {
  const text = data.content?.[0]?.text;

  if (typeof text !== "string") {
    throw new Error("Claude API response did not include text content.");
  }

  return text;
}

async function extractIntent(messageText: string): Promise<Intent> {
  const system =
    "Extract the customer intent from the message as JSON. Return ONLY valid JSON, no explanation.";
  const content = `${messageText}\n\nReturn JSON with these exact keys: intent_type (one of: availability|pricing|viewing|application_status|general), property_keywords (string[]), city (string|null), urgency (boolean), specific_date (string|null), pet (boolean), furnished (boolean|null), bedrooms (number|null)`;

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
  const text = getClaudeText(data);

  try {
    const parsed = JSON.parse(text) as unknown;

    if (isIntent(parsed)) {
      return parsed;
    }

    return fallbackIntent;
  } catch {
    return fallbackIntent;
  }
}

export async function runAgent(
  message: CustomerMessage,
  onTrace: (step: TraceStep) => void,
): Promise<AgentState> {
  try {
    const intent = await extractIntent(message.text);
    onTrace(createTraceStep("Intent extracted", `Type: ${intent.intent_type}`));

    const searchListings = getTool("searchListings");
    const matchedProperty = searchListings(intent);
    onTrace(
      createTraceStep(
        "Property matched",
        matchedProperty ? matchedProperty.title : "No match found",
      ),
    );

    const checkAvailability = getTool("checkAvailability");
    const availability = checkAvailability(matchedProperty?.id ?? "");
    onTrace(
      createTraceStep(
        "Availability checked",
        `Status: ${availability.status}`,
      ),
    );

    const scoreLead = getTool("scoreLead");
    const leadScore = scoreLead(intent, message.text);
    onTrace(
      createTraceStep(
        "Lead scored",
        `${leadScore.score} - ${leadScore.signals.join(", ")}`,
      ),
    );

    const draftReply = getTool("draftReply");
    const draft = await draftReply(message.text, matchedProperty, availability);
    onTrace(createTraceStep("Draft reply generated", "Ready for approval"));

    return {
      status: "pending",
      draft,
      trace: [],
      leadScore,
      matchedProperty,
      followUpNote: null,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    onTrace(createTraceStep("Error", detail));
    throw error;
  }
}
