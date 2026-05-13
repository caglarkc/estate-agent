import { getTool } from "@/agent/toolRegistry";
import { callLLM } from "@/lib/llmClient";
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
  reasoning?: string;
}

interface SelfReviewResult {
  approved: boolean;
  issues: string[];
  improved_draft: string;
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

async function extractIntent(messageText: string): Promise<Intent> {
  const system =
    "Extract the customer intent from the message as JSON. Think step by step before concluding. Return ONLY valid JSON, no explanation.";
  const user = `${messageText}\n\nReturn JSON with these exact keys: intent_type (one of: availability|pricing|viewing|application_status|general), property_keywords (string[]), city (string|null), urgency (boolean), specific_date (string|null), pet (boolean), furnished (boolean|null), bedrooms (number|null), reasoning (string)`;
  const text = await callLLM(system, user);

  try {
    const parsed = JSON.parse(cleanJson(text)) as unknown;

    if (isIntent(parsed)) {
      return parsed;
    }

    return fallbackIntent;
  } catch {
    return fallbackIntent;
  }
}

function cleanJson(text: string): string {
  return text.replace(/```json|```/g, "").trim();
}

function isSelfReviewResult(value: unknown): value is SelfReviewResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.approved === "boolean" &&
    Array.isArray(candidate.issues) &&
    candidate.issues.every((issue) => typeof issue === "string") &&
    typeof candidate.improved_draft === "string"
  );
}

async function selfReviewDraft(
  messageText: string,
  matchedProperty: AgentState["matchedProperty"],
  rawDraft: string,
): Promise<SelfReviewResult> {
  const system =
    "You are a quality reviewer for a UK estate agent AI assistant. Check the draft reply strictly.";
  const user = `Customer message: ${messageText}\n\nProperty data: ${JSON.stringify(
    matchedProperty,
  )}\n\nDraft reply: ${rawDraft}\n\nReturn ONLY valid JSON: { "approved": boolean, "issues": string[], "improved_draft": string }`;

  try {
    const text = await callLLM(system, user);
    const parsed = JSON.parse(cleanJson(text)) as unknown;

    if (isSelfReviewResult(parsed)) {
      return parsed;
    }

    return {
      approved: true,
      issues: [],
      improved_draft: rawDraft,
    };
  } catch {
    return {
      approved: true,
      issues: [],
      improved_draft: rawDraft,
    };
  }
}

export async function runAgent(
  message: CustomerMessage,
  onTrace: (step: TraceStep) => void,
): Promise<AgentState> {
  try {
    const intent = await extractIntent(message.text);
    onTrace(
      createTraceStep(
        "Intent extracted",
        `Type: ${intent.intent_type} — ${intent.reasoning?.slice(0, 60) ?? ""}`,
      ),
    );

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
        `${leadScore.score} — ${leadScore.signals.join(", ")}`,
      ),
    );

    const draftReply = getTool("draftReply");
    const rawDraft = await draftReply(
      message.text,
      matchedProperty,
      availability,
    );
    onTrace(createTraceStep("Draft reply generated", "Ready for approval"));

    const review = await selfReviewDraft(
      message.text,
      matchedProperty,
      rawDraft,
    );
    const draft = review.approved ? rawDraft : review.improved_draft;
    onTrace(
      createTraceStep(
        "Self-review",
        review.approved
          ? "Approved — no issues found"
          : `${review.issues.length} issue(s) found, auto-corrected`,
      ),
    );

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
