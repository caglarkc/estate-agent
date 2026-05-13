import { describe, expect, it } from "vitest";
import mockListings from "@/data/mockListings.json";
import { mockMessages } from "@/data/mockMessages";
import { generateBriefing } from "@/tools/generateBriefing";
import type { Property } from "@/types/index";

const listings = mockListings as Property[];

describe("generateBriefing — Gemini integration", () => {
  it("mockMessages ve mockListings ile string array döner", async () => {
    const result = await generateBriefing(mockMessages, listings);

    expect(Array.isArray(result)).toBe(true);
    expect(result.every((item) => typeof item === "string")).toBe(true);
  }, 60000);

  it("array boş değildir", async () => {
    const result = await generateBriefing(mockMessages, listings);

    expect(result.length).toBeGreaterThan(0);
  }, 60000);

  it("her item 15 kelimeden kısadır", async () => {
    const result = await generateBriefing(mockMessages, listings);

    expect(
      result.every((item) => item.trim().split(/\s+/).filter(Boolean).length <= 15),
    ).toBe(true);
  }, 60000);

  it("3-4 madde arası döner", async () => {
    const result = await generateBriefing(mockMessages, listings);

    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.length).toBeLessThanOrEqual(4);
  }, 60000);
});
