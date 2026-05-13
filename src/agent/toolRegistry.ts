import { checkAvailability } from "@/tools/checkAvailability";
import { createFollowUp } from "@/tools/createFollowUp";
import { draftReply } from "@/tools/draftReply";
import { scoreLead } from "@/tools/scoreLead";
import { searchListings } from "@/tools/searchListings";

export const toolRegistry = {
  searchListings,
  checkAvailability,
  scoreLead,
  draftReply,
  createFollowUp,
} as const;

export type ToolName = keyof typeof toolRegistry;

export function getTool<TName extends ToolName>(
  name: TName,
): (typeof toolRegistry)[TName] {
  return toolRegistry[name];
}
