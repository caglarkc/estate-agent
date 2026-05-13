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

## Live Demo Flow

Adım adım ne görülür:

1. Sol panelde bir müşteri mesajına tıkla
2. Orta panelde agent trace canlı oluşuyor: Intent extracted → Property matched → Lead scored → Draft generated
3. Sağ panelde matched property ve HOT/WARM/COLD badge görünüyor
4. Draft reply düzenlenebilir textarea'da hazır
5. Approve / Edit & Send / Regenerate butonlarından biri seçilir
6. Approve sonrası CRM notu otomatik oluşuyor

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

The UI never calls provider APIs directly. It sends selected customer messages into `agentController`, receives live trace updates, then routes approval actions through `approvalGate`. All provider traffic goes through `llmClient`, which switches between Anthropic, OpenAI, and Ollama based on `VITE_LLM_PROVIDER`.

## Tool System

Her tool tek sorumluluk taşır ve birbirinden bağımsız çağrılabilir. `toolRegistry` isimden fonksiyona dispatch yapar. Bu pattern OrionCli projemdeki tool registry mimarisinden adapte edildi.

5 tool:

- `searchListings`: Intent içindeki city, pet, furnished ve bedroom sinyallerine göre `mockListings.json` içinde en iyi property eşleşmesini bulur
- `checkAvailability`: Property status ve viewing slot bilgisini döner
- `scoreLead`: Mesaj sinyallerinden HOT/WARM/COLD lead skoru üretir
- `draftReply`: Claude API ile property verisine sadık, kısa cevap taslağı üretir
- `createFollowUp`: seçili LLM provider ile CRM'e yazılacak 2 cümlelik takip notu oluşturur

## Chain of Thought & Self-Critique

EstatePilot iki aşamalı akıl yürütme kullanır:

1. Intent extraction: "Think step by step" system prompt ile müşteri niyeti analiz edilir, reasoning alanı trace'de görünür.
2. Self-critique: Draft üretildikten sonra ayrı bir LLM çağrısı ile gözden geçirilir. Sorun bulunursa otomatik düzeltilir, trace'de "auto-corrected" olarak loglanır.

## Proactive Engine

Arka planda 30 saniyede bir çalışır. Lead aging kuralı 2+ dakika bekleyen pending/approved lead'leri yakalar. Repeat contact kuralı aynı müşteriden 2+ işlenmiş mesaj olduğunda insight üretir.

Insights paneli sağ kolonda collapsible olarak görünür. Panelden manager summary üretilebilir; bu özet `llmClient` üzerinden seçili provider'a gönderilir.

## Multi-Provider LLM Support

`.env` içinde `VITE_LLM_PROVIDER` değiştirerek `anthropic`, `openai` veya `ollama` seçilebilir. Ollama local çalıştığı için internet gerektirmez.

```bash
VITE_LLM_PROVIDER=anthropic
VITE_ANTHROPIC_API_KEY=sk-...
VITE_OPENAI_API_KEY=
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

## How to Run

1. Clone the repo or open the project directory:

   ```bash
   cd /home/caglarkc/Desktop/Github/all-agentics/estate-agent
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
