import { describe, expect, it } from "vitest";
import { extractIntent, runAgent } from "@/agent/agentController";
import { mockMessages } from "@/data/mockMessages";
import type { CustomerMessage, TraceStep } from "@/types/index";

function getMessage(sender: string): CustomerMessage {
  const message = mockMessages.find((item) => item.sender === sender);

  if (!message) {
    throw new Error(`Missing mock message for ${sender}`);
  }

  return message;
}

describe("agentController — Gemini integration", () => {
  it("Sarah Johnson mesajı availability veya viewing intent çıkarır", async () => {
    const intent = await extractIntent(getMessage("Sarah Johnson").text);

    expect(["availability", "viewing"]).toContain(intent.intent_type);
  }, 60000);

  it("Ahmed mesajı pet:true çıkarır", async () => {
    const intent = await extractIntent(getMessage("Ahmed Al-Rashid").text);

    expect(intent.pet).toBe(true);
  }, 60000);

  it("Liam & Priya mesajı urgency:true çıkarır", async () => {
    const intent = await extractIntent(getMessage("Liam & Priya Patel").text);

    expect(intent.urgency).toBe(true);
  }, 60000);

  it("runAgent baştan sona çalışır ve pending state döner", async () => {
    const trace: TraceStep[] = [];
    const result = await runAgent(getMessage("Sarah Johnson"), (step) => {
      trace.push(step);
    });

    expect(result.status).toBe("pending");
    expect(result.draft.trim().length).toBeGreaterThan(0);
    expect(trace.length).toBeGreaterThanOrEqual(3);
  }, 90000);
});
