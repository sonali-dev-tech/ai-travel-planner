# ✈️ Wayfinder – Personalized Travel Itinerary Planner

AI-powered full-stack web app jo user ki preferences, budget aur travel style ke hisaab se day-by-day itinerary banata hai (attractions, dining, accommodation, transportation). SmartBridge capstone project.

**Stack:** React (Vite) · FastAPI · Supabase (Postgres + Auth) · Anthropic Claude API

## ✨ Features
- Email/password signup & login (Supabase Auth)
- SaaS-style dashboard (stats + saved trips)
- Smart Trip Builder: destination, dates, budget, travelers, style, pace, interests, notes
- AI-generated structured itinerary (JSON) with budget tracker
- Interactive view: day tabs, inline edit, add/remove activities, save
- Regenerate **poora trip** ya **single day**, optional instruction ke saath ("more street food")
- Row Level Security: har user sirf apna data dekh sakta hai

## 📁 Structure
```
travel-planner/
├── backend/        FastAPI (app/main.py, ai.py, auth.py, db.py, schemas.py)
├── frontend/       React + Vite
└── supabase/schema.sql
```

## 🧰 Prerequisites
Node.js 18+, Python 3.10+, ek free Supabase account, aur Anthropic API key (https://console.anthropic.com). *API key ke bina bhi `MOCK_AI=true` se demo data chalega.*

## 1️⃣ Supabase setup
1. https://supabase.com → **New project** banayein.
2. **SQL Editor → New query** me `supabase/schema.sql` ka poora content paste karke **Run** karein (trips table + RLS policies ban jayengi).
3. **Project Settings → API** se ye 3 cheezein copy karein: **Project URL**, **anon public key**, **service_role key**.
4. (Testing ke liye) **Authentication → Providers → Email** me *Confirm email* OFF kar dein, taaki signup ke turant baad login ho sake.

> ⚠️ `service_role` key secret hai – sirf backend `.env` me rakhein, kabhi frontend ya GitHub par nahi.

## 2️⃣ Backend run karein
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Windows: copy .env.example .env
```
`.env` me values bharein (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY). Phir:
```bash
uvicorn app.main:app --reload --port 8000
```
Check: http://localhost:8000/api/health  ·  Swagger docs: http://localhost:8000/docs

## 3️⃣ Frontend run karein
```bash
cd frontend
npm install
cp .env.example .env            # Windows: copy .env.example .env
```
`.env` me `VITE_SUPABASE_URL` aur `VITE_SUPABASE_ANON_KEY` daalein, phir:
```bash
npm run dev
```
Open http://localhost:5173 → signup → **New Trip** → Generate → Save.

## 🔌 API Endpoints (sab par `Authorization: Bearer <supabase JWT>`)
| Method | Path | Kaam |
|---|---|---|
| POST | `/api/trips/generate` | Preferences se itinerary generate (save nahi) |
| POST | `/api/trips` | Trip save |
| GET | `/api/trips` | User ke saare trips |
| GET | `/api/trips/{id}` | Single trip |
| PUT | `/api/trips/{id}` | Title / itinerary edit save |
| DELETE | `/api/trips/{id}` | Delete |
| POST | `/api/trips/{id}/regenerate` | Whole trip ya `day` regenerate (+ `instruction`) |

## 🧠 Prompt engineering – kaise kaam karta hai
- **System prompt** me rules: budget cap, geographic clustering, pace (3 / 4-5 / 6-7 activities), har din breakfast-lunch-dinner, transport legs, tips.
- **Strict JSON schema** prompt me diya hai; response se JSON extract + validate hota hai, fail hone par 1 retry.
- Backend har din ka cost activities se recompute karta hai (AI ke arithmetic par depend nahi).
- Day regeneration me poora current itinerary context ke saath bheja jaata hai taaki places repeat na hon.
- Model badalna ho to `.env` me `AI_MODEL` change karein.

## 🔐 Security design
Frontend Supabase se login karke JWT leta hai → FastAPI har request par token verify karta hai → har query `user_id` se filter hoti hai. Upar se DB level par RLS bhi laga hai (double protection).

## 🚀 Deployment (optional)
- **Backend:** Render/Railway – start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, env vars set karein, `FRONTEND_URL` = deployed frontend URL.
- **Frontend:** Vercel/Netlify – `VITE_API_URL` = deployed backend URL. SPA routing ke liye rewrite rule `/* → /index.html` lagayein.

## 🛠 Troubleshooting
| Problem | Solution |
|---|---|
| `401 Invalid or expired token` | Backend `.env` me SUPABASE_URL / service key check karein |
| CORS error | `FRONTEND_URL` exact match hona chahiye (port samet) |
| `AI generation failed` | ANTHROPIC_API_KEY / model name check karein, ya `MOCK_AI=true` try karein |
| Signup ke baad login nahi ho raha | Email confirm karein ya Supabase me Confirm email OFF karein |
| `relation "trips" does not exist` | `schema.sql` run nahi hua |

## 🔮 Future ideas
Maps integration, PDF export, trip sharing link, weather API, drag-and-drop reorder, multi-currency conversion.
