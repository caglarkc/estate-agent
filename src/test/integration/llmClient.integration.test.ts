import { describe, expect, it } from "vitest";
import { callLLM } from "@/lib/llmClient";

function cleanJson(text: string): string {
  return text.replace(/```json|```/g, "").trim();
}

describe("callLLM — provider integration (uses VITE_LLM_* from .env)", () => {
  it(
    "basit soru sorunca string döner ve cevap London içerir",
    async () => {
      const result = await callLLM(
        "Answer briefly and directly.",
        "What is the capital of the UK? Reply with only the city name.",
      );

      expect(typeof result).toBe("string");
      expect(result.toLowerCase()).toContain("london");
    },
    120_000,
  );

  it("JSON çıktısı isteyince parse edilebilir JSON döner", async () => {
    const result = await callLLM(
      "Return ONLY valid JSON. No markdown.",
      'Return {"city":"London","country":"UK"} exactly as valid JSON.',
    );
    const parsed = JSON.parse(cleanJson(result)) as {
      city?: string;
      country?: string;
    };

    expect(parsed.city?.toLowerCase()).toBe("london");
    expect(parsed.country?.toLowerCase()).toBe("uk");
  });

  it("boş olmayan yanıt döner", async () => {
    const result = await callLLM(
      "Answer with a short phrase.",
      "Say EstatePilot is ready.",
    );

    expect(result.trim().length).toBeGreaterThan(0);
  });
});
