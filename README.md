# EstatePilot — AI-Powered Estate Agent Assistant

## Problem

UK estate agent consultants receive dozens of WhatsApp and email messages every day. Each message means manually finding the listing, analysing customer intent, drafting an appropriate reply, and logging notes in the CRM. That often takes 5–10 minutes per message, with a high risk of sharing wrong listing details, missing lead temperature, or forgetting a follow-up note.

EstatePilot compresses that workflow to seconds while keeping the final decision with the consultant.

## Solution

EstatePilot:

- Analyses the customer message, finds the property, and infers lead temperature
- Produces a reply draft for consultant review
- After approval, creates a CRM-style follow-up note
- Never invents property details — it only works from real (mock) listing data

## Project status (May 2026)

This repo is a **working Vite + React + TypeScript prototype**. Major shipped pieces:

| Area | Status |
|------|--------|
| 3-panel UI (messages / workbench + trace / property + insights) | Done |
| `runAgent` flow: intent (LLM JSON) → plan → tool chain → draft → optional self-review | Done |
| Intent router (`router.ts`): `viewing` / `availability` → full pipeline; `pricing` → no availability check or self-critique; `application_status` → draft only; default → `general` plan | Done |
| Tool registry: `searchListings`, `checkAvailability`, `scoreLead`, `draftReply`, `createFollowUp` | Done |
| Approval gate: pending → approve / edit / regenerate; after approve, `createFollowUp` runs | Done |
| Multi-provider LLM (`llmClient`): Anthropic, OpenAI, Gemini, OpenRouter, Ollama | Done |
| Proactive engine (30s): aging for pending/approved leads + repeat-contact insights | Done |
| Morning briefing modal (`MorningBriefing` + `generateBriefing`) — LLM-generated 3–4 priority bullets on load | Done |
| Secondary listings (`searchListings` alternatives + `AlternativesPanel`) | Done |
| Lead drift badge (`detectLeadDrift` — long gap since contact + `fading` sentiment → “Cooling”) | Done |
| Vitest: integration tests under `src/test/integration` — `callLLM` may hit the real provider from `.env` | Done |
| Cursor skill drafts (`skills/ai-implementation-mode`, `skills/project-manager-mode`) | Done (documentation) |

Not built yet (aligned with **Future Improvements** below): real CRM / WhatsApp, live data feeds, evaluation harness, calendar booking, multi-agent roles.

## Live Demo Flow

What you see step by step:

1. On first load, an optional **morning briefing** card appears; you can dismiss it
2. Click a customer message in the left panel (cooling leads show a **Cooling** badge)
3. In the centre, the agent trace updates live: Intent extracted → Property matched (or skipped) → Availability / Lead scoring (may be skipped per plan) → Draft → Self-review (per plan)
4. Before approval, an **alternative listings** list appears under the matched property
5. The right panel shows the matched property and a HOT/WARM/COLD badge
6. The draft reply is editable in a textarea
7. Choose Approve, Edit & Send, or Regenerate
8. After Approve, a CRM note is created automatically; the Insights panel can generate a manager summary

## Architecture

```text
Customer Message
      ↓
 agentController
      ↓
 llmClient (anthropic | openai | gemini | openrouter | ollama)
      ↓
┌─────────────────────────────┐
│  searchListings             │  ← mock JSON
│  checkAvailability          │  ← property status
│  scoreLead                  │  ← HOT/WARM/COLD
│  draftReply ──→ LLM API     │  ← reply draft
└─────────────────────────────┘
      ↓
 approvalGate (pending → approved | edited | regenerated)
      ↓
 createFollowUp ──→ LLM API  ← CRM note
```

The UI never calls provider APIs directly. It sends selected customer messages into `agentController`, receives live trace updates, then routes approval actions through `approvalGate`. All provider traffic goes through `llmClient`, which switches between Anthropic, OpenAI, Gemini, OpenRouter, and Ollama based on `VITE_LLM_PROVIDER`.

## Tool System

Each tool has a single responsibility and can be invoked independently. `toolRegistry` dispatches by name to the implementation. This pattern was adapted from the tool registry architecture in my OrionCli project.

**Five registered tools** (used in the agent loop):

- `searchListings`: Finds the best property match in `mockListings.json` using city, pet, furnished, and bedroom signals from intent; returns a primary match plus `alternatives`
- `checkAvailability`: Returns property status and viewing slot information
- `scoreLead`: Produces a HOT/WARM/COLD score from message signals
- `draftReply`: Uses the selected LLM provider to produce a short, listing-faithful reply draft
- `createFollowUp`: Uses the selected LLM provider to produce a two-sentence CRM follow-up note

Outside the registry: `generateBriefing` — on app load, uses the LLM with `mockMessages` and listing metrics to produce short priority bullets (shown in `MorningBriefing`).

## Chain of Thought & Self-Critique

EstatePilot uses a two-stage reasoning pattern:

1. **Intent extraction:** A “think step by step” style system prompt analyses customer intent as JSON; reasoning appears in the trace when the model returns it.
2. **Self-critique:** When `needsSelfCritique` is `true` in the `router.ts` plan (currently the `full` route for `viewing` / `availability`), a separate LLM call reviews the draft after generation. If issues are found, the draft is auto-corrected and the trace logs “auto-corrected”. Other intent routes skip this step.

## Proactive Engine

Runs in the background every 30 seconds. A **lead aging** rule flags pending or approved items that have been waiting 2+ minutes. A **repeat contact** rule emits an insight when the same customer has 2+ processed messages.

The Insights panel sits in the right column (collapsible). From there you can generate a manager summary, sent through `llmClient` to the configured provider.

## Multi-Provider LLM Support

Set `VITE_LLM_PROVIDER` in `.env` to `anthropic`, `openai`, `gemini`, `openrouter`, or `ollama`. Ollama runs locally and does not require internet for the model call itself.

| Provider | Env var | Notes |
|---|---|---|
| anthropic | `VITE_ANTHROPIC_API_KEY` | Default |
| openai | `VITE_OPENAI_API_KEY` | gpt-4o |
| gemini | `VITE_GEMINI_API_KEY` + `VITE_GEMINI_MODEL` | gemini-2.0-flash default |
| openrouter | `VITE_OPENROUTER_API_KEY` + `VITE_OPENROUTER_MODEL` | 100+ models, mistral-7b default |
| ollama | `VITE_OLLAMA_BASE_URL` + `VITE_OLLAMA_MODEL` | Local, no cloud API |

```bash
VITE_LLM_PROVIDER=anthropic
VITE_ANTHROPIC_API_KEY=sk-...
VITE_OPENAI_API_KEY=
VITE_GEMINI_API_KEY=
VITE_GEMINI_MODEL=gemini-2.0-flash
VITE_OPENROUTER_API_KEY=
VITE_OPENROUTER_MODEL=mistralai/mistral-7b-instruct
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.2
```

## Approval Gate

State machine: `idle → pending → approved | edited | regenerated`

Calling `approve` runs `createFollowUp` and writes the CRM note into state. `edit` treats the latest textarea content as the sent reply. `regenerate` clears draft and trace and starts a new agent run for the selected message.

This design was adapted from the approval gate in my ARCHON project.

## Safety Design

- The assistant does not invent property details; that constraint is enforced at the system prompt level
- The consultant always has the final say — human-in-the-loop is mandatory
- Read-only retrieval: the agent does not create listing data; it only reads mock JSON
- The trace panel provides an audit trail of which tools ran and in what order

Inspired by the safety architecture in my Sentinel project.

## Success Metrics

- Time per message: manual 5–10 min → with AI assist, target under 30 seconds
- Draft quality: faithful to listing data, no fabrication
- Lead temperature: rule-based and explainable
- Consultant approval: required for every outbound path; no bypass

## What I Reused From My Existing Projects

> This prototype was built by directly adapting patterns from my existing agentic projects:

| Project | What I Reused |
|---|---|
| **NookSpace** | 3-panel workspace layout, tool trace visibility, selected-session state management, and the left-context / center-workbench / right-inspector interaction model |
| **OrionCli** | Tool registry pattern, agent loop architecture, approval controls, skill-driven implementation workflow, and name-based tool dispatch |
| **ARCHON** | Approval gate state machine, planner→worker→validator pipeline thinking, stateful execution boundaries, and explicit pending/approved/regenerated transitions |
| **Sentinel** | Read-only data access pattern, audit trail via trace, “do not invent” system prompt design, and human approval before externally meaningful actions |
| **Argus** | Edge-case thinking, success metric design, evaluation approach, and clear separation between observable signals and inferred outcomes |

> Rather than building from scratch, I adapted proven patterns to a new domain in ~5 hours.

## Testing

```bash
npm test                 # Vitest — full suite
npm run test:integration # Only src/test/integration
```

For non-integration runs, `src/test/setup.ts` mocks `fetch` and `import.meta.env`. When you run the **integration** folder, real `VITE_*` values are used and `callLLM` tests may call the network. Slow providers or missing keys can cause errors or timeouts; per-test timeouts are raised where needed for live calls.

## How to Run

1. Clone the repo or open the project directory:

   ```bash
   cd estate-agent
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment example:

   ```bash
   cp .env.example .env
   ```

4. Add your provider settings to `.env`:

   ```bash
   VITE_LLM_PROVIDER=anthropic
   VITE_ANTHROPIC_API_KEY=sk-...
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

6. Open the app:

   ```text
   http://localhost:5173
   ```

   Then select a message from the left panel.

## Future Improvements

- Real CRM integration via HubSpot API or Salesforce API
- WhatsApp Business API integration for live inbound message ingestion
- Better evaluation harness for lead scoring and no-invention checks
- Calendar-aware viewing slot booking
- Role-based team inbox for multiple estate agents


