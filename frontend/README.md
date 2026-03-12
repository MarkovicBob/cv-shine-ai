# CVMatch Pro 🎯

AI-powered CV optimizer — rewrites your CV to achieve 100/100 ATS score.

---

## 🚀 Pokretanje lokalno

### 1. Instalacija

```bash
npm install
cp .env.example .env
# Popuni .env sa Supabase ključevima (vidi ispod)
npm run dev
```

Otvori http://localhost:5173

---

## 🗄️ Supabase Setup (jednom)

### Korak 1 — Kreiraj projekat
https://supabase.com → New Project

### Korak 2 — Popuni .env
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbG...
```
Ključevi su na: Supabase Dashboard → Settings → API

### Korak 3 — Kreiraj tabele
Idi na: SQL Editor → New Query → Zalijepi cijeli sadržaj fajla `supabase/schema.sql` → Run

### Korak 4 — Deploy Edge Function

```bash
npm install -g supabase
supabase login
supabase link --project-ref TVOJ_PROJECT_REF
supabase functions deploy analyze-cv
```

Project ref: Supabase Dashboard → Settings → General → Reference ID

### Korak 5 — Dodaj AI API ključ

Supabase Dashboard → Edge Functions → analyze-cv → Secrets:
```
OPENAI_API_KEY = sk-proj-...
```
(ili koristiš Lovable gateway — već je konfigurisano po defaultu, samo treba LOVABLE_API_KEY)

---

## 🔑 .env varijable

| Varijabla | Gdje |
|-----------|------|
| VITE_SUPABASE_URL | Supabase → Settings → API → Project URL |
| VITE_SUPABASE_PUBLISHABLE_KEY | Supabase → Settings → API → anon public key |

---

## 📁 Struktura

```
src/lib/          → supabase, auth, fileParser, pdfGenerator
src/pages/        → Landing, Login, Register, Dashboard, Optimizer, History, Profile
src/components/   → AppShell, ProtectedRoute, ui/
supabase/
  schema.sql      → SQL za Supabase (pokreni jednom)
  functions/analyze-cv/index.ts  → Edge Function (AI analiza)
```

---

## ✨ Šta radi

- Registracija/Prijava (Supabase Auth)
- Upload CV (PDF/DOCX) + parsiranje teksta
- Unos opisa posla
- AI analiza → ATS score, missing keywords, suggestions, optimizovani CV
- Download optimizovanog CV kao PDF
- Historija svih analiza
- Free tier: 3 analize/month, Pro: unlimited
