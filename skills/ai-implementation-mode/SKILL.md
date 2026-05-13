---
name: code-implementation-mode
description: >-
  estate-agent-ai-copilot reposunda kod yazan uygulayıcı ajan modu.
  Kısa etki analizi, proje kurallarına uyum, doğrudan implementasyon
  ve kısa teslim çıktısı. React + Vite + TypeScript + Tailwind stack.
---

## Purpose

Ajanı **uygulayıcı mühendis** gibi çalıştır: işi doğru anla, etkilenen dosyaları ve riskleri kısa çıkar, kurallara uyarak kodu yaz, gereksiz teoriyi kes, sonunda somut doğrulama notu ver.

---

## Rules

### Her zaman

- **Ön analiz (koddan önce, zorunlu):** «Ne istendi?» «Hangi dosya/katmanlar?» «Riskler?» «Hangi güncellemeler?»
- **Doğrudan uygulama:** Kritik belirsizlik yoksa plan yerine kod; kullanıcı açıkça sadece plan istemediyse iş kodla tamamlanır.
- **Varsayımlar:** Mimaride boşlukta dur ve sor; küçük detayda makul karar → kısa not.
- **Loading/error UX:** Boş veya tepkisiz ekran bırakma. Her async işlemin loading ve error state'i olmalı.
- **Test:** Kullanıcı istemedikçe geniş test iskelesi kurma; mümkünse **Manuel kontrol** notu bırak.
- **Kurulum:** `npm install` veya benzeri çalıştırma; sadece `package.json` güncelle, kullanıcı kurar.
- **Teslim:** Çıktıda değişen dosya listesi şart; «gerekli düzenlemeler yapıldı» gibi muğlak kapanış yasak.

### Stack Kuralları

- **Framework:** React 18 + Vite + TypeScript (strict mod)
- **Stil:** Tailwind CSS — inline `className` ile, harici CSS dosyası minimum
- **State:** React `useState` / `useReducer` — basit global state için Context yeterli, Redux/Zustand zorunlu değil
- **API:** Claude API'yi doğrudan `fetch` ile çağır — SDK import etme, bundle size'ı şişirme
- **Env:** API key `import.meta.env.VITE_ANTHROPIC_API_KEY` ile alınır
- **Tipler:** Tüm tipler `src/types/index.ts`'te tanımlı; `any` kullanma
- **Import:** Alias `@/` → `src/` olarak yapılandırılmış (vite.config.ts)

### Katman Zincirleri

```
UI Component
  → agentController (agent döngüsü)
    → toolRegistry (tool dispatch)
      → tools/* (iş mantığı + Claude API)
        → approvalGate (state machine)
```

UI'da doğrudan API çağrısı yapma. Her şey `agentController` üzerinden geçer.

### Claude API Çağrısı Şablonu

```typescript
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
    messages: [{ role: "user", content: prompt }],
    system: systemPrompt,
  }),
});
const data = await response.json();
const text = data.content[0].text;
```

### Güvenlik Kuralları (Sentinel'den)

- AI property detayı **icat etmez** — sadece `mockListings.json`'dan gelen veriyi kullanır
- `draftReply` system prompt'u şunu içermeli: *"Use ONLY the property data provided. Do not invent details."*
- Agent onayı olmadan hiçbir aksiyon "gönderilmiş" sayılmaz — approval gate zorunlu

---

## Workflow

1. Özet → 4 başlıklı ön analiz
2. Proje yapısını kontrol et (aşağıdaki referans haritadan)
3. Kodu uygula
4. Final teslim (zorunlu format)

---

## Required Output Format

**Koddan önce (zorunlu):**

1. `Ne istendi?`
2. `Hangi dosya/katmanlar etkilenecek?`
3. `Riskler neler?`
4. `Hangi güncellemeler yapılacak?`

**Kod sonrası (zorunlu sıra):**

1. `Yapılan iş` — çok kısa özet
2. `Değişen dosyalar` — değişen ve yeni dosyalar ayrı listele
3. `Aktif davranışlar` — kullanıcı ne görür / ne çalışır
4. `Beklenen eklemeler` — env / config gereksinimleri; yoksa `Yok`
5. `Manuel kontrol` — elle doğrulanacaklar

---

## Proje Referans Haritası

```
estate-agent-ai-copilot/
├── src/
│   ├── agent/
│   │   ├── agentController.ts    ← Mesaj → intent → tool → draft → trace
│   │   ├── toolRegistry.ts       ← Tool isimden fonksiyona map
│   │   └── approvalGate.ts       ← pending | approved | edited | regenerated
│   ├── tools/
│   │   ├── searchListings.ts     ← Mock JSON'dan property arama
│   │   ├── checkAvailability.ts  ← Status ve viewing slots
│   │   ├── scoreLead.ts          ← HOT / WARM / COLD skoru
│   │   ├── draftReply.ts         ← Claude API → cevap taslağı
│   │   └── createFollowUp.ts     ← CRM özet notu
│   ├── data/
│   │   ├── mockListings.json     ← 10 UK ilanı
│   │   └── mockMessages.ts       ← 4 örnek müşteri mesajı
│   ├── components/
│   │   ├── MessagePanel.tsx      ← Sol panel: mesaj listesi
│   │   ├── AgentChat.tsx         ← Orta: draft reply + loading
│   │   ├── TracePanel.tsx        ← Orta alt: tool adımları
│   │   ├── PropertyCard.tsx      ← Sağ: ilan detayları
│   │   ├── LeadScore.tsx         ← HOT/WARM/COLD badge
│   │   └── ApprovalButtons.tsx   ← Approve / Edit / Regenerate
│   ├── types/
│   │   └── index.ts              ← Tüm TypeScript tipleri
│   └── App.tsx                   ← 3 kolonlu layout
├── .env.example
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## TypeScript Tip Referansı

```typescript
// src/types/index.ts — bu tiplere uygun kod yaz

interface Property {
  id: string;
  title: string;
  city: string;
  type: "flat" | "house";
  status: "available" | "let_agreed" | "viewing_only";
  price: string;
  viewing_slots: string[];
  deposit: string;
  council_tax_band: string;
  furnished: boolean;
  bedrooms: number;
  pet_friendly: boolean;
}

interface CustomerMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface LeadScore {
  score: "HOT" | "WARM" | "COLD";
  signals: string[];
}

interface TraceStep {
  id: string;
  step: string;          // "Intent extracted", "Property found", vb.
  detail: string;
  timestamp: number;
}

type ApprovalStatus = "idle" | "pending" | "approved" | "edited" | "regenerated";

interface AgentState {
  status: ApprovalStatus;
  draft: string;
  trace: TraceStep[];
  leadScore: LeadScore | null;
  matchedProperty: Property | null;
  followUpNote: string | null;
}
```

---

## Lead Scoring Kuralları

```
+2 → viewing request ("view", "visit", "see the property")
+1 → specific date/time mentioned
+2 → urgency signals ("ASAP", "urgently", "move next month")
+1 → budget mentioned
-1 → just browsing ("just looking", "thinking about it")

HOT  → toplam 4+
WARM → toplam 2-3
COLD → toplam 0-1
```

---

## Tasarım Yönü

**Tema:** Profesyonel, koyu (dark) workspace. Estate agent dashboard hissi.
**Palette:** Koyu gri/slate arka plan, beyaz metin, amber/turuncu aksanlar (HOT için kırmızı, WARM için sarı, COLD için mavi).
**Font:** Tailwind default yeterli — `font-mono` trace panel için, `font-sans` genel UI için.
**Layout:** 3 kolon, sabit yükseklik, scroll içeride.
**Animasyon:** TracePanel'de adımlar sırayla belirir (Tailwind `transition` + `opacity`).
**Boş state:** Her panel için placeholder göster, asla boş bırakma.