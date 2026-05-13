type LLMProvider = "anthropic" | "openai" | "ollama";

interface AnthropicTextBlock {
  text?: string;
}

interface AnthropicResponse {
  content?: AnthropicTextBlock[];
}

interface OpenAIChoice {
  message?: {
    content?: string | null;
  };
}

interface OpenAIResponse {
  choices?: OpenAIChoice[];
}

interface OllamaResponse {
  message?: {
    content?: string;
  };
}

function getProvider(): LLMProvider {
  const provider = import.meta.env.VITE_LLM_PROVIDER ?? "anthropic";

  if (provider === "openai" || provider === "ollama") {
    return provider;
  }

  return "anthropic";
}

async function readFailure(provider: LLMProvider, response: Response) {
  const responseText = await response.text();

  throw new Error(
    `LLM call failed ${provider}: ${response.status} — ${responseText}`,
  );
}

function requireText(text: string | null | undefined, provider: LLMProvider) {
  if (typeof text !== "string" || text.length === 0) {
    throw new Error(`LLM call failed ${provider}: empty response text`);
  }

  return text;
}

export async function callLLM(system: string, user: string): Promise<string> {
  const provider = getProvider();

  if (provider === "openai") {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1000,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!response.ok) {
      await readFailure(provider, response);
    }

    const data = (await response.json()) as OpenAIResponse;
    return requireText(data.choices?.[0]?.message?.content, provider);
  }

  if (provider === "ollama") {
    const baseUrl =
      import.meta.env.VITE_OLLAMA_BASE_URL ?? "http://localhost:11434";
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_OLLAMA_MODEL ?? "llama3.2",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      await readFailure(provider, response);
    }

    const data = (await response.json()) as OllamaResponse;
    return requireText(data.message?.content, provider);
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!response.ok) {
    await readFailure(provider, response);
  }

  const data = (await response.json()) as AnthropicResponse;
  return requireText(data.content?.[0]?.text, provider);
}
