import { callLLM } from "@/lib/llmClient";
import type { Property } from "@/types/index";
import type { checkAvailability } from "./checkAvailability";

export async function draftReply(
  message: string,
  property: Property | null,
  availability: ReturnType<typeof checkAvailability>,
): Promise<string> {
  const system =
    "You are a professional UK estate agent assistant. Write a friendly, concise reply (under 100 words) using ONLY the property data provided to you. Do not invent any details. If information is missing, say you'll check and follow up. Always suggest a next step.";
  const user = `${message}\n\nProperty data:\n${JSON.stringify(
    property,
  )}\n\nAvailability:\n${JSON.stringify(availability)}`;

  return callLLM(system, user);
}
