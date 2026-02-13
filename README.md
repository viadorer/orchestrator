# Orchestrator – Content Command Center

AI-powered marketing content orchestrator for 59+ projects. Admin panel for generating, reviewing, and publishing social media content across multiple platforms.

## Stack

- **Next.js 16** – App Router, React 19
- **Supabase** – PostgreSQL + Auth + pgvector
- **Gemini AI** – Content generation (via Vercel AI SDK)
- **getLate.dev** – Social media publishing (LinkedIn, Instagram, Facebook, X, TikTok)
- **Tailwind CSS 4** – Styling
- **Vercel** – Hosting

## Architecture

1. **Variable Content Graph** – Multi-layer content composition (KB facts, safe/ban list, semantic anchors, style sheets)
2. **Modular Prompting** – Lego system: `{{System_Role}} + {{Project_KB}} + {{Tone_of_Voice}} + {{Pattern}} + {{Context}}`
3. **4-1-1 Rule** – Automatic content mix cadence (educational / soft-sell / hard-sell)
4. **AI Quality Score** – Self-rating for bulk review (creativity, tone match, hallucination risk)
5. **Cross-Project Intelligence** – pgvector dedup across all projects
6. **Contextual Pulse** – RSS/news monitoring for dynamic content

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.example .env.local

# 3. Run Supabase migration
# Go to Supabase SQL Editor and run: supabase/migrations/001_orchestrator_schema.sql

# 4. Start dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini AI API key |
| `GETLATE_API_KEY` | getLate.dev API key |
| `GETLATE_API_URL` | getLate.dev API URL (default: https://api.getlate.dev/v1) |

## Admin Panel Sections

- **Dashboard** – Overview stats
- **Projects** – CRUD for 59+ projects with KB, tone of voice, constraints
- **Generate** – AI content generation with pattern selection and 4-1-1 cadence
- **Review** – Post review with AI quality scores, bulk approve
- **Publish** – Send to getLate.dev with scheduling
- **Calendar** – Content calendar view
- **Settings** – Prompt templates (Lego system)
