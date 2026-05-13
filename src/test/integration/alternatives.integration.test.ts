import { describe, expect, it } from "vitest";
import { extractIntent, runAgent } from "@/agent/agentController";
import { searchListings } from "@/tools/searchListings";
import type { CustomerMessage, TraceStep } from "@/types/index";

const manchesterMessage: CustomerMessage = {
  id: "integration-alt-1",
  sender: "Integration Tester",
  text: "I need a 2 bed flat in Manchester",
  timestamp: Date.now(),
  lastContactDays: 0,
  sentimentSignal: "positive",
};

describe("alternatives — Gemini integration", () => {
  it("2 bed flat Manchester mesajı extractIntent ile parse edilir", async () => {
    const intent = await extractIntent(manchesterMessage.text);

    expect(intent).toHaveProperty("intent_type");
    expect(intent.city?.toLowerCase()).toContain("manchester");
  }, 60000);

  it("SearchResult primary veya alternatives en az biri doludur", async () => {
    const intent = await extractIntent(manchesterMessage.text);
    const result = searchListings(intent);

    expect(Boolean(result.primary) || result.alternatives.length > 0).toBe(true);
  }, 60000);

  it("runAgent AgentState.alternatives array döner", async () => {
    const trace: TraceStep[] = [];
    const result = await runAgent(manchesterMessage, (step) => {
      trace.push(step);
    });

    expect(Array.isArray(result.alternatives)).toBe(true);
    expect(trace.length).toBeGreaterThanOrEqual(3);
  }, 90000);
});
