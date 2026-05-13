# EstatePilot — AI-Powered Estate Agent Assistant

## Problem

UK estate agent danışmanları günde onlarca WhatsApp/email mesajı alıyor. Her mesaj için manuel olarak ilanı bulmak, müşteri niyetini analiz etmek, uygun cevap yazmak ve CRM'e not düşmek gerekiyor. Bu işlem mesaj başına 5-10 dakika sürüyor ve yanlış ilan bilgisi paylaşma, lead sıcaklığını kaçırma veya takip notu yazmayı unutma riski yüksek.

EstatePilot bu süreci birkaç saniyeye indiriyor, ancak son kararı her zaman danışmana bırakıyor.

## Solution

EstatePilot ne yapar:

- Müşteri mesajını analiz eder, property'yi bulur, lead sıcaklığını çıkarır
- Cevap taslağı üretir, danışmanın onayına sunar
- Onaylanınca CRM notu oluşturur
- Hiçbir zaman property bilgisi icat etmez — sadece gerçek veriden çalışır

## Project status (May 2026)

Bu repo şu an **çalışan bir Vite + React + TypeScript prototipi**. Tamamlanan başlıca parçalar:

| Alan | Durum |
|------|--------|
| 3 panel UI (mesajlar / çalışma alanı + trace / property + insights) | Tamam |
| `runAgent` akışı: intent (LLM JSON) → plan → tool zinciri → taslak → isteğe bağlı self-review | Tamam |
| Intent router (`router.ts`): `viewing` / `availability` → full pipeline; `pricing` → availability + self-critique kapalı; `application_status` → sadece taslak; diğer → `general` planı | Tamam |
| Tool registry: `searchListings`, `checkAvailability`, `scoreLead`, `draftReply`, `createFollowUp` | Tamam |
| Approval gate: pending → approve / edit / regenerate; approve sonrası `createFollowUp` | Tamam |
| Çoklu LLM sağlayıcı (`llmClient`): Anthropic, OpenAI, Gemini, OpenRouter, Ollama | Tamam |
| Proactive engine (30 sn): bekleyen / onaylı lead yaşlandırma + aynı gönderenden tekrar iletişim insight'ları | Tamam |
| Sabah özeti modalı (`MorningBriefing` + `generateBriefing`) — açılışta LLM ile 3–4 maddelik öncelik listesi | Tamam |
| İkincil ilanlar (`searchListings` alternatives + `AlternativesPanel`) | Tamam |
| Lead drift rozeti (`detectLeadDrift` — uzun süredir temas + `fading` sentiment → "Cooling") | Tamam |
| Vitest: entegrasyon testleri (`src/test/integration`) — `callLLM` gerçek `.env` sağlayıcısına bağlanabilir | Tamam |
| Cursor skill taslakları (`skills/ai-implementation-mode`, `skills/project-manager-mode`) | Tamam (dokümantasyon) |

Henüz yok (yol haritası `Future Improvements` ile uyumlu): gerçek CRM / WhatsApp, canlı veri feed'i, değerlendirme harness'i, takvim rezervasyonu, çoklu danışman rolü.

## Live Demo Flow

Adım adım ne görülür:

1. İlk yüklemede isteğe bağlı **sabah özeti** kartı açılır; kapatabilirsin
2. Sol panelde bir müşteri mesajına tıkla (soğuyan lead'lerde **Cooling** rozeti görünür)
3. Orta panelde agent trace canlı oluşuyor: Intent extracted → Property matched (veya skip) → Availability / Lead scoring (plan’a göre skip olabilir) → Draft → Self-review (plan’a göre)
4. Taslak onay öncesi eşleşen ilanın altında **alternatif ilan** listesi görünür
5. Sağ panelde matched property ve HOT/WARM/COLD badge görünüyor
6. Draft reply düzenlenebilir textarea'da hazır
7. Approve / Edit & Send / Regenerate butonlarından biri seçilir
8. Approve sonrası CRM notu otomatik oluşuyor; Insights panelinden manager özeti üretilebilir

## Architecture

```text
Customer Message
      ↓
 agentController
      ↓
 llmClient (anthropic | openai | ollama)
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

Her tool tek sorumluluk taşır ve birbirinden bağımsız çağrılabilir. `toolRegistry` isimden fonksiyona dispatch yapar. Bu pattern OrionCli projemdeki tool registry mimarisinden adapte edildi.

Kayıtlı **5 tool** (agent döngüsünde kullanılır):

- `searchListings`: Intent içindeki city, pet, furnished ve bedroom sinyallerine göre `mockListings.json` içinde en iyi property eşleşmesini bulur; birincil eşleşme + `alternatives` döner
- `checkAvailability`: Property status ve viewing slot bilgisini döner
- `scoreLead`: Mesaj sinyallerinden HOT/WARM/COLD lead skoru üretir
- `draftReply`: seçili LLM provider ile property verisine sadık, kısa cevap taslağı üretir
- `createFollowUp`: seçili LLM provider ile CRM'e yazılacak 2 cümlelik takip notu oluşturur

Registry dışı yardımcı: `generateBriefing` — uygulama açılışında `mockMessages` + listing metriklerinden LLM ile kısa öncelik maddeleri üretir (`MorningBriefing` UI).

## Chain of Thought & Self-Critique

EstatePilot iki aşamalı akıl yürütme kullanır:

1. Intent extraction: "Think step by step" system prompt ile müşteri niyeti analiz edilir, reasoning alanı trace'de görünür.
2. Self-critique: `router.ts` planında `needsSelfCritique: true` ise (şu an özellikle `viewing` / `availability` → `full` rotası), draft üretildikten sonra ayrı bir LLM çağrısı ile gözden geçirilir. Sorun bulunursa otomatik düzeltilir, trace'de "auto-corrected" olarak loglanır. Diğer intent rotalarında bu adım atlanır.

## Proactive Engine

Arka planda 30 saniyede bir çalışır. Lead aging kuralı 2+ dakika bekleyen pending/approved lead'leri yakalar. Repeat contact kuralı aynı müşteriden 2+ işlenmiş mesaj olduğunda insight üretir.

Insights paneli sağ kolonda collapsible olarak görünür. Panelden manager summary üretilebilir; bu özet `llmClient` üzerinden seçili provider'a gönderilir.

## Multi-Provider LLM Support

`.env` içinde `VITE_LLM_PROVIDER` değiştirerek `anthropic`, `openai`, `gemini`, `openrouter` veya `ollama` seçilebilir. Ollama local çalıştığı için internet gerektirmez.

| Provider | Env Var | Notlar |
|---|---|---|
| anthropic | `VITE_ANTHROPIC_API_KEY` | Default |
| openai | `VITE_OPENAI_API_KEY` | gpt-4o |
| gemini | `VITE_GEMINI_API_KEY` + `VITE_GEMINI_MODEL` | gemini-2.0-flash default |
| openrouter | `VITE_OPENROUTER_API_KEY` + `VITE_OPENROUTER_MODEL` | 100+ model, mistral-7b default |
| ollama | `VITE_OLLAMA_BASE_URL` + `VITE_OLLAMA_MODEL` | Local, internet gerektirmez |

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

`approve` çağrılınca `createFollowUp` otomatik çalışır ve CRM notu state'e yazılır. `edit`, danışmanın textarea'daki son taslağını gönderilmiş kabul eder. `regenerate`, draft ve trace'i temizleyip seçili mesaj için yeni agent döngüsü başlatır.

Bu ARCHON projemdeki approval gate tasarımından adapte edildi.

## Safety Design

- AI hiçbir zaman property detayı icat etmez; bu kısıt system prompt seviyesinde uygulanır
- Son karar her zaman danışmanda — human-in-the-loop zorunlu
- Read-only retrieval: agent veri oluşturmaz, sadece mock JSON'dan çeker
- Trace paneli audit trail sağlar; hangi tool'un hangi sırayla çalıştığı görünür

Bu Sentinel projemdeki güvenlik mimarisinden ilham alındı.

## Success Metrics

- Mesaj başına işlem süresi: manuel 5-10 dk → AI ile <30 saniye
- Draft kalitesi: property verisine sadık, icat yok
- Lead sıcaklık doğruluğu: kural tabanlı, açıklanabilir
- Danışman onayı: %100 zorunlu, hiç bypass yok

## What I Reused From My Existing Projects

> This prototype was built by directly adapting patterns from my existing agentic projects:

| Project | What I Reused |
|---|---|
| **NookSpace** | 3-panel workspace layout, tool trace visibility, selected-session state management, and the left-context / center-workbench / right-inspector interaction model |
| **OrionCli** | Tool registry pattern, agent loop architecture, approval controls, skill-driven implementation workflow, and name-based tool dispatch |
| **ARCHON** | Approval gate state machine, planner→worker→validator pipeline thinking, stateful execution boundaries, and explicit pending/approved/regenerated transitions |
| **Sentinel** | Read-only data access pattern, audit trail via trace, "do not invent" system prompt design, and human approval before externally meaningful actions |
| **Argus** | Edge-case thinking, success metric design, evaluation approach, and clear separation between observable signals and inferred outcomes |

> Rather than building from scratch, I adapted proven patterns to a new domain in ~5 hours.

## Testing

```bash
npm test              # Vitest — tüm testler
npm run test:integration   # Sadece src/test/integration
```

Unit tarafında `src/test/setup.ts`, entegrasyon dışı koşularda `fetch` ve `import.meta.env` mock’lar. **Entegrasyon klasörü** çalıştırıldığında gerçek `VITE_*` değerleri kullanılır; `callLLM` testleri seçili sağlayıcıya ağ üzerinden gider. Sağlayıcı yavaşsa veya anahtar eksikse hata veya zaman aşımı alabilirsin — ilgili testlerde test başına süre üst sınırı yükseltilmiştir.

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
