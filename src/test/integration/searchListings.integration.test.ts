import { describe, expect, it } from "vitest";
import { searchListings } from "@/tools/searchListings";

const baseIntent = {
  intent_type: "availability",
  property_keywords: ["flat"],
  city: "Manchester",
  urgency: false,
  specific_date: null,
  pet: false,
  furnished: null,
  bedrooms: 2,
};

describe("searchListings — SearchResult integration", () => {
  it("intent ile çağrılınca SearchResult döner", () => {
    const result = searchListings(baseIntent);

    expect(result).toHaveProperty("primary");
    expect(result).toHaveProperty("alternatives");
    expect(Array.isArray(result.alternatives)).toBe(true);
  }, 60000);

  it("primary ve alternatives ayrı ilanlardır", () => {
    const result = searchListings(baseIntent);

    if (result.primary) {
      expect(result.alternatives.every((item) => item.id !== result.primary?.id)).toBe(true);
    }
  }, 60000);

  it("alternatives içinde primary yoktur", () => {
    const result = searchListings(baseIntent);
    const alternativeIds = result.alternatives.map((item) => item.id);

    expect(alternativeIds).not.toContain(result.primary?.id);
  }, 60000);

  it("alternatives sadece available ilanlardan gelir", () => {
    const result = searchListings(baseIntent);

    expect(result.alternatives.every((item) => item.status === "available")).toBe(true);
  }, 60000);
});
