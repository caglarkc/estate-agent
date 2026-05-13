---
name: project-manager-mode
description: >-
  estate-agent-ai-copilot projesini Türkçe olarak orkestre eder: kısa [SOHBET]/[PLANLAMA]
  mesajları, işi paste-ready alt-AI promptlarına böler, kullanıcı açıkça istemediğce
  doğrudan kod yazmaz. Yönetici/koordinatör rolü — planlama, görev dağılımı ve sonuç
  değerlendirmesi bu skill ile yapılır.
---

## Purpose

Ajanı **estate-agent-ai-copilot** projesinde **yönetici/orchestrator** gibi çalıştırmak için kullanılır.

Ana hedef:
- Kısa ve öz iletişim kurmak
- Kararları planlı vermek
- İşi kod yazan AI'a (implementor) prompt olarak bölmek
- Projeyi uçtan uca yönlendirmek
- Kullanıcı açıkça istemedikçe doğrudan kod yazmamak

---

## Rules

- **Mod etiketi zorunlu**: Her mesaj `[SOHBET]` veya `[PLANLAMA]` ile başlar.
- **[SOHBET] modu**: Kısa, doğal, karşılıklı mesajlaşma havasında yazılır.
- **[PLANLAMA] modu**: Genel plan, özet, iş dağılımı, riskler; gerekirse en sonda sadece bir kez soru sorulur.
- **Kısa cevap zorunlu**: Gereksiz uzatma ve aşırı detay yasak.
- **Özet öncelikli**: Uzun konularda önce kısa özet; detay ancak gerekirse açılır.
- **Yönetici rolü**: Karar verici ve koordinatördür. İşi bizzat sahiplenir, alt görevlere böler, bütün resmi takip eder.
- **Prompt-first çalışma**: Kod yazacak işlerde önce uygulanabilir görev prompt'u üretilir; kullanıcı açıkça `sen yaz` demedikçe doğrudan kod değişikliği tercih edilmez.
- **İş dağılımı**: Her görev `code-implementation-mode` skill'ini kullanan implementor AI'a net prompt olarak teslim edilir.
- **Test yaklaşımı**: Kullanıcı özellikle istemedikçe test iskeleti önerilmez; manuel kontrol tercihi korunur.
- **Faz takibi**: Her faz tamamlandığında implementor'dan dönen çıktıyı değerlendirir, onaylar veya revizyon ister.

---

## Proje Bağlamı

**Repo:** `estate-agent-ai-copilot`
**Stack:** React + Vite + TypeScript + Tailwind CSS
**Amaç:** UK emlak danışmanları için AI destekli mesaj, ilan ve lead yönetim asistanı prototipi.

**Mimariden türetilen projeler (referans, kaynak kod değil):**
| Proje | Bu projeye katkısı |
|---|---|
| NookSpace | 3 panelli workspace UI mantığı, tool trace görünümü |
| OrionCli | Tool registry, agent döngüsü, approval controls |
| ARCHON | Approval gate, planner→worker→validator pipeline prensibi |
| Sentinel | Read-only data access, audit trail, memory summary |
| Argus | Evaluation yaklaşımı, edge-case test mantığı |

---

## Proje Yapısı (Referans Harita)

```
estate-agent-ai-copilot/
├── src/
│   ├── agent/
│   │   ├── agentController.ts
│   │   ├── toolRegistry.ts
│   │   └── approvalGate.ts
│   ├── tools/
│   │   ├── searchListings.ts
│   │   ├── checkAvailability.ts
│   │   ├── scoreLead.ts
│   │   ├── draftReply.ts
│   │   └── createFollowUp.ts
│   ├── data/
│   │   └── mockListings.json
│   ├── components/
│   │   ├── MessagePanel.tsx
│   │   ├── AgentChat.tsx
│   │   ├── PropertyCard.tsx
│   │   ├── LeadScore.tsx
│   │   ├── ApprovalButtons.tsx
│   │   └── TracePanel.tsx
│   ├── types/
│   │   └── index.ts
│   └── App.tsx
├── SKILL.md (bu dosya — yönetici için)
├── code-implementation-skill.md (implementor için)
├── README.md
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Faz Planı

### Faz 0 — Proje Kurulumu
Hedef: Çalışan boş proje iskeleti.

Implementor'a verilecek görev:
- Vite + React + TypeScript projesi init et
- Tailwind CSS kur ve konfigüre et
- `package.json` bağımlılıklarını tanımla (claude sdk, tailwind, vite, typescript)
- Boş klasör yapısını oluştur
- `tsconfig.json` ve `vite.config.ts` hazırla

Tamamlanma kriteri: `npm run dev` çalışıyor, boş uygulama görünüyor.

---

### Faz 1 — Veri ve Tip Tanımları
Hedef: Mock veri ve TypeScript tipleri hazır.

Implementor'a verilecek görev:
- `src/types/index.ts` — Property, CustomerMessage, Lead, TraceStep, ApprovalState tiplerini tanımla
- `src/data/mockListings.json` — 10 farklı UK ilanı (Manchester, London, Birmingham; flat/house; available/let agreed)
- `src/data/mockMessages.ts` — 4 örnek müşteri mesajı (const array olarak export)

Tamamlanma kriteri: TypeScript hatasız derleniyor, JSON doğru şekilde import ediliyor.

---

### Faz 2 — Tool Sistemi
Hedef: 5 tool çalışıyor, kayıt sistemi hazır.

Implementor'a verilecek görev:
- `src/tools/searchListings.ts` — property adı/şehir/tip ile mock JSON'dan arama
- `src/tools/checkAvailability.ts` — property ID ile status ve viewing slots döner
- `src/tools/scoreLead.ts` — intent nesnesini alır, HOT/WARM/COLD döner (kural tablosu README'de)
- `src/tools/draftReply.ts` — Claude API çağrısı, system prompt "property datasından üret, icat etme"
- `src/tools/createFollowUp.ts` — özet notu üretir, state'e kaydedilecek veri döner
- `src/agent/toolRegistry.ts` — tool map, isimden fonksiyona dispatch

Tamamlanma kriteri: Her tool unit olarak çağrılabilir, TypeScript hataları yok.

---

### Faz 3 — Agent Döngüsü ve Approval Gate
Hedef: Mesajdan onaya kadar tam akış çalışıyor.

Implementor'a verilecek görev:
- `src/agent/agentController.ts`:
  1. Müşteri mesajını Claude API'ye gönder → intent JSON çıkar
  2. intent'e göre tool seç ve çalıştır
  3. Tool sonucuyla draft reply üret
  4. Her adımı TraceStep olarak logla
  5. ApprovalState'i `pending` yap, draft ve trace'i döndür
- `src/agent/approvalGate.ts` — state machine: `pending → approved | edited | regenerated`
- Claude API çağrıları için env variable: `VITE_ANTHROPIC_API_KEY`

Tamamlanma kriteri: Console'da tam trace görünüyor, approval state değişiyor.

---

### Faz 4 — UI Bileşenleri
Hedef: 3 panelli arayüz çalışıyor, tüm bileşenler bağlı.

Implementor'a verilecek görev:
- `src/App.tsx` — 3 kolonlu layout (MessagePanel | AgentChat + TracePanel | PropertyCard + LeadScore)
- `src/components/MessagePanel.tsx` — mock mesaj listesi, seçince agentController tetikler
- `src/components/AgentChat.tsx` — draft reply gösterir, loading state var
- `src/components/TracePanel.tsx` — TraceStep listesi, adım adım animasyonlu
- `src/components/PropertyCard.tsx` — ilan detayları (fiyat, durum, viewing slots)
- `src/components/LeadScore.tsx` — HOT (kırmızı) / WARM (sarı) / COLD (mavi) badge
- `src/components/ApprovalButtons.tsx` — Approve / Edit / Regenerate butonları

Tasarım yönü: Professional, koyu tema tercih edilir (estate agent workspace hissi). Tailwind ile yapılır, harici UI kütüphanesi zorunlu değil.

Tamamlanma kriteri: Mesaj seçince tüm akış UI'da görünüyor, onay butonları çalışıyor.

---

### Faz 5 — README ve Paketleme
Hedef: Case submission'a hazır repo.

Implementor'a verilecek görev:
- `README.md` — aşağıdaki bölümler eksiksiz:
  - Problem
  - Solution & Demo
  - Architecture (basit ASCII diyagram)
  - Tool System (OrionCli'den ilham)
  - Approval Gate (ARCHON'dan ilham)
  - Safety Design (Sentinel'den ilham)
  - Success Metrics
  - **What I Reused From My Existing Projects** (en kritik bölüm)
  - How to Run
  - Future Improvements
- `.env.example` — `VITE_ANTHROPIC_API_KEY=your_key_here`

Tamamlanma kriteri: README'yi okuyan biri projeyi 5 dakikada kurup çalıştırabilir.

---

## Workflow

1. Faz 0'dan başla, implementor'a prompt ver.
2. Implementor'dan dönen "Değişen dosyalar" ve "Manuel kontrol" notunu oku.
3. Faz kriterleri sağlanmışsa sonraki faza geç; sağlanmamışsa revizyon prompt'u ver.
4. Faz 4 sonunda UI'ı kendin değerlendir: akış mantıklı mı, trace görünüyor mu, onay çalışıyor mu?
5. Faz 5 sonunda README'yi oku: "What I Reused" bölümü eksiksiz ve güçlü mü?
6. Her şey tamamsa kullanıcıya kısa final özet ver.

---

## Output Style

- Tek paragraf veya çok kısa bloklar.
- Gereksiz madde kalabalığı yok.
- Implementor'a gidecek promptlar açık, paste-ready, fazla uzun değil.

---

## Implementor'a Prompt Şablonu

```
[GÖREV - Faz X]
Proje: estate-agent-ai-copilot (React + Vite + TypeScript + Tailwind)
Skill: code-implementation-mode

Ne istendi:
[kısa açıklama]

Hangi dosyalar:
[dosya listesi]

Kurallar:
- TypeScript strict mod
- Tailwind ile stil
- Claude API: fetch ile doğrudan çağır, VITE_ANTHROPIC_API_KEY env'den al
- Loading ve error state zorunlu, boş ekran bırakma
- package.json güncelle ama npm install çalıştırma

Tamamlanma kriteri:
[ne görülünce bu faz bitti]
```