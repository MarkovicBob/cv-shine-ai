# CVMatch Pro 🎯

**AI-powered CV optimizer** — upload a CV, paste a job ad, get an ATS score, missing keywords and an AI-rewritten CV as PDF.

**Stack:**
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Python + FastAPI + ReportLab + pdfplumber + Anthropic Claude Sonnet
- **Auth & DB:** Supabase (PostgreSQL + Auth)

```
cvmatch-pro/
├── frontend/          ← React/Vite app (port 3000)
├── backend/           ← Python/FastAPI app (port 8000)
├── supabase/
│   └── schema.sql     ← Run once in Supabase SQL Editor
└── docker-compose.yml ← Optional: run both with Docker
```

---

## 🚀 Pokretanje lokalno (bez Dockera)

### 1. Supabase Setup

1. Idi na https://supabase.com → kreiraj novi projekat
2. SQL Editor → New Query → zalijepi `supabase/schema.sql` → **Run**
3. Settings → API → kopiraj **Project URL** i **anon public key**

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
```

Popuni `backend/.env`:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...   # service_role key (ne anon!)
ANTHROPIC_API_KEY=sk-ant-api03-...
FRONTEND_URL=http://localhost:3000
```

> ⚠️ Backend treba **service_role** ključ (ne anon), jer direktno čita/piše bazu.
> Supabase → Settings → API → **service_role** (secret)

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend radi na: http://localhost:8000
Docs na: http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
```

Popuni `frontend/.env`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbG...   # anon public key
VITE_API_URL=http://localhost:8000
```

```bash
npm install
npm run dev
```

Frontend radi na: http://localhost:5173

---

## 🐳 Pokretanje sa Dockerom (opciono)

```bash
# Kopiraj env fajlove
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Popuni oba .env fajla

# Pokretanje
docker-compose up --build
```

Frontend: http://localhost:3000
Backend: http://localhost:8000

---

## 🔑 Ključevi — gdje ih naći

| Ključ | Gdje |
|-------|------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API → **anon** public key |
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → **service_role** secret key |
| `OPENAI_API_KEY` | https://console.anthropic.com/settings/api-keys |

---

## 🏗️ Arhitektura

```
Browser
  │
  ├─→ Supabase Auth (login/register/session)
  │
  └─→ Python/FastAPI Backend (port 8000)
        ├── POST /api/cv/parse         ← pdfplumber / python-docx
        ├── POST /api/analyze          ← Anthropic Claude Sonnet
        ├── POST /api/pdf/generate     ← ReportLab (ATS-safe PDF)
        ├── GET  /api/history          ← Supabase DB
        ├── DELETE /api/history/:id    ← Supabase DB
        ├── GET  /api/profile          ← Supabase DB
        └── PATCH /api/profile         ← Supabase DB
```

---

## ✨ Funkcionalnosti

- ✅ Registracija / Prijava (Supabase Auth)
- ✅ Upload CV — PDF ili DOCX (Python/pdfplumber + python-docx)
- ✅ AI analiza — Claude Sonnet (ATS score, keywords, suggestions)
- ✅ Optimizovani CV — rewrite sa 100/100 ATS score
- ✅ Download PDF — **Python/ReportLab** (ne jsPDF!)
- ✅ Historija svih analiza sa re-download opcijom
- ✅ Profil korisnika
- ✅ Free tier: 3 analize/month
- ✅ Protected routes (redirect na /login)

---

## 📋 API Dokumentacija

Kada pokreneš backend, otvori: **http://localhost:8000/docs**

Tu se nalazi interaktivna Swagger dokumentacija svih endpointa.
