import { describe, expect, it } from "vitest";
import { selfReviewDraft } from "@/agent/agentController";
import mockListings from "@/data/mockListings.json";
import type { Property } from "@/types/index";

const property = (mockListings as Property[]).find(
  (listing) => listing.id === "prop-1",
);

if (!property) {
  throw new Error("Required property prop-1 is missing.");
}

describe("selfReviewDraft — Gemini integration", () => {
  it("icat edilmiş bilgi içeren draft için approved:false döner", async () => {
    const result = await selfReviewDraft(
      "Is the Manchester flat available?",
      property,
      "Great news: this flat has a private swimming pool, sea view, free parking, and all bills included.",
    );

    expect(result.approved).toBe(false);
  }, 60000);

  it("temiz draft için approved:true döner", async () => {
    const result = await selfReviewDraft(
      "Is the Manchester flat available?",
      property,
      "The 2-bedroom flat near Deansgate is available, and viewings can be arranged for Saturday 10am, Tuesday 2pm, or Thursday 6pm.",
    );

    expect(result.approved).toBe(true);
  }, 60000);

  it("sonuç her zaman beklenen JSON formatına sahiptir", async () => {
    const result = await selfReviewDraft(
      "Can I view this property?",
      property,
      "The property is available for the listed viewing slots.",
    );

    expect(typeof result.approved).toBe("boolean");
    expect(Array.isArray(result.issues)).toBe(true);
    expect(typeof result.improved_draft).toBe("string");
  }, 60000);
});
