import { describe, expect, it } from "vitest";
import mockListings from "@/data/mockListings.json";
import { draftReply } from "@/tools/draftReply";
import type { Property } from "@/types/index";

const properties = mockListings as Property[];
const manchesterProperty = properties.find(
  (property) => property.city === "Manchester" && property.status === "available",
);
const letAgreedProperty = properties.find(
  (property) => property.status === "let_agreed",
);

if (!manchesterProperty || !letAgreedProperty) {
  throw new Error("Required integration test properties are missing.");
}

describe("draftReply — Gemini integration", () => {
  it("gerçek property verisiyle kısa ve boş olmayan draft üretir", async () => {
    const result = await draftReply(
      "Hi, is the 2-bedroom flat in Manchester still available? I can view Saturday.",
      manchesterProperty,
      {
        status: manchesterProperty.status,
        viewing_slots: manchesterProperty.viewing_slots,
        message: "Viewing slots are available.",
      },
    );
    const wordCount = result.trim().split(/\s+/).length;

    expect(result.trim().length).toBeGreaterThan(0);
    expect(wordCount).toBeLessThan(100);
  }, 60000);

  it("draft property title veya Manchester bilgisinden birini içerir", async () => {
    const result = await draftReply(
      "Can you tell me about this Manchester property?",
      manchesterProperty,
      {
        status: manchesterProperty.status,
        viewing_slots: manchesterProperty.viewing_slots,
        message: "Viewing slots are available.",
      },
    );
    const normalized = result.toLowerCase();
    const titleKeyword = manchesterProperty.title
      .toLowerCase()
      .split(/\s+/)
      .find((word) => word.length > 4);

    expect(
      normalized.includes("manchester") ||
        (titleKeyword ? normalized.includes(titleKeyword) : false),
    ).toBe(true);
  }, 60000);

  it("let_agreed property için artık uygun olmadığını söyler", async () => {
    const result = await draftReply(
      "Is this property still available?",
      letAgreedProperty,
      {
        status: letAgreedProperty.status,
        viewing_slots: letAgreedProperty.viewing_slots,
        message: "This property is no longer available.",
      },
    );
    const normalized = result.toLowerCase();

    expect(
      normalized.includes("no longer available") ||
        normalized.includes("not available") ||
        normalized.includes("let agreed"),
    ).toBe(true);
  }, 60000);
});
