import "@testing-library/jest-dom";
import { vi } from "vitest";

declare const process: { argv: string[] };

const isIntegrationRun = process.argv.some((arg: string) =>
  arg.includes("src/test/integration"),
);
const usesRealGeminiProvider = import.meta.env.VITE_LLM_PROVIDER === "gemini";

Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `test-uuid-${Math.random().toString(36).slice(2)}` },
});

if (!isIntegrationRun && !usesRealGeminiProvider) {
  Object.defineProperty(import.meta, "env", {
    value: {
      VITE_LLM_PROVIDER: "anthropic",
      VITE_ANTHROPIC_API_KEY: "test-key",
      VITE_OPENAI_API_KEY: "",
      VITE_GEMINI_API_KEY: "",
      VITE_OPENROUTER_API_KEY: "",
      VITE_OLLAMA_BASE_URL: "http://localhost:11434",
      VITE_OLLAMA_MODEL: "llama3.2",
      VITE_GEMINI_MODEL: "gemini-2.0-flash",
      VITE_OPENROUTER_MODEL: "mistralai/mistral-7b-instruct",
    },
    writable: true,
  });

  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      content: [{ text: "Mocked LLM response" }],
    }),
    text: async () => "Mocked LLM response",
  });
}
