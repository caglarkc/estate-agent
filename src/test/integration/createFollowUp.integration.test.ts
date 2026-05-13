import { describe, expect, it } from "vitest";
import { createFollowUp } from "@/tools/createFollowUp";

const hotLeadScore = {
  score: "HOT" as const,
  signals: ["Viewing requested", "Urgency signal", "Specific date mentioned"],
};

describe("createFollowUp — Gemini integration", () => {
  it("gerçek mesaj + draft + leadScore ile CRM notu üretir", async () => {
    const result = await createFollowUp(
      "Hi, is the 2-bedroom flat in Manchester still available? I can view this Saturday.",
      "The Manchester flat is available, and Saturday 10am is a viewing option.",
      hotLeadScore,
    );

    expect(result.trim().length).toBeGreaterThan(0);
  }, 60000);

  it("dönen string 2 cümle civarıdır", async () => {
    const result = await createFollowUp(
      "We need a furnished place ASAP.",
      "I can help with available furnished options and arrange the next viewing step.",
      hotLeadScore,
    );
    const sentenceCount = result
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean).length;

    expect(sentenceCount).toBeGreaterThanOrEqual(1);
    expect(sentenceCount).toBeLessThanOrEqual(3);
  }, 60000);

  it("HOT lead için hot veya urgent benzeri kelime geçer", async () => {
    const result = await createFollowUp(
      "I want to view this Saturday ASAP.",
      "The property is available and a Saturday viewing can be arranged.",
      hotLeadScore,
    );
    const normalized = result.toLowerCase();

    expect(
      normalized.includes("hot") ||
        normalized.includes("urgent") ||
        normalized.includes("urgency") ||
        normalized.includes("asap"),
    ).toBe(true);
  }, 60000);
});
