# Hugo Orchestrator

AI-powered social media & blog content orchestrator. Hugo autonomously generates, reviews, and publishes posts across multiple platforms for multiple projects — with brand-consistent visuals, smart scheduling, and human-in-the-loop review.

## Key Features

- **Multi-project management** — brand identity, tone, content mix, and schedule per project
- **AI content generation** — Gemini-powered text + image prompts with self-review editor loop
- **Smart visual pipeline** — media library match (pgvector similarity) → Imagen 4 generation → fallback
- **Branded templates** — dynamic SVG/Sharp photo overlays with logo, colors, typography
- **Content queue & review** — quality scoring, bulk approve, manual editing
- **Auto-publishing** — scheduled posting via getLate API (Facebook, Instagram, LinkedIn, X)
- **Blog system** — long-form article generation + GitHub Pages publishing
- **Contextual Pulse** — RSS/news monitoring for trending topic inspiration
- **AIO tracking** — monitor brand visibility in AI search overviews
- **MCP server** — full Model Context Protocol integration for Claude Desktop / Claude Code

## Tech Stack

- **Next.js 16** — App Router, React 19
- **Supabase** — PostgreSQL + Auth + pgvector
- **Gemini AI** — content generation via Vercel AI SDK
- **Imagen 4** — AI photo generation (Google)
- **getLate.dev** — social media publishing
- **Tailwind CSS 4** — styling
- **Vercel** — hosting

## Architecture

1. **Variable Content Graph** — multi-layer composition (KB facts, safe/ban list, semantic anchors, style sheets)
2. **Modular Prompting** — Lego system: `{{System_Role}} + {{Project_KB}} + {{Tone_of_Voice}} + {{Pattern}} + {{Context}}`
3. **4-1-1 Rule** — automatic content mix cadence (educational / soft-sell / hard-sell)
4. **AI Quality Score** — self-rating for bulk review (creativity, tone match, hallucination risk)
5. **3-Tier Visual Pipeline** — real photo match → AI generation → placeholder
6. **Cross-Project Intelligence** — pgvector dedup across all projects
7. **Contextual Pulse** — RSS/news monitoring for dynamic content

## Project Structure

```
src/
├── app/api/
│   ├── agent/        # Hugo agent (cron, tasks, health, AIO, feedback)
│   ├── blog/         # Blog generation & publishing
│   ├── generate/     # Content generation endpoint
│   ├── media/        # Media library (upload, match, vision analysis)
│   ├── projects/     # Project CRUD + KB + prompts
│   ├── publish/      # Post publishing pipeline
│   ├── queue/        # Content review queue
│   ├── rss/          # RSS feed management
│   └── visual/       # Template rendering (cards, photos)
├── components/       # React UI (dashboard, review, projects, agent)
└── lib/
    ├── ai/           # Content engine, agent orchestrator, editor, prompts
    ├── visual/       # Visual agent, Imagen, QuickChart
    ├── rss/          # RSS fetcher
    └── publishers/   # getLate integration
```

## Setup

```bash
npm install
cp .env.example .env.local   # fill in values below
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
| `GETLATE_API_URL` | getLate.dev API URL |

## Admin Panel

- **Dashboard** — overview stats across all projects
- **Projects** — CRUD with KB, tone of voice, visual identity, orchestrator config
- **Generate** — AI content generation with pattern selection and 4-1-1 cadence
- **Review** — post review with AI quality scores, bulk approve, image swap
- **Publish** — send to getLate with scheduling and platform picker
- **Blog** — article management and GitHub Pages publishing
- **Agent** — Hugo autonomous agent status, task queue, cron planning
- **Calendar** — content calendar view
- **Settings** — prompt templates (Lego system)
