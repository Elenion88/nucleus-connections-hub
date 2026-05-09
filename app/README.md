# Nucleus · Utah Innovation Connections Hub

AI-powered matchmaking between Utah deep-tech startups and the operators who can commercialize them.

Built for the Nucleus Institute bounty at AI Builder Day 2026 (Lehi, UT).

**Live demo:** https://nucleus.kokomo.quest

## What it does

Today, Nucleus matches University of Utah / BYU / USU spinouts to operators by hand — a Squarespace contact form drops into Affinity CRM, and Nick + the team manually triage. This prototype turns that manual queue into:

1. **Two-sided signup wizards** (4 steps for talent, 3 for startups) that capture the brief's full profile schema (skills, sectors, availability, stage, comp shape, mission, Utah affiliations, immediate needs, TRL, funding, etc.)
2. **Hybrid AI matcher** — hard filters → multi-vector embedding cosine similarity → Utah-roots booster → Claude rerank-and-explain → cached.
3. **Explainable-by-design "Why matched" drawer** — radar chart across five dimensions (skills, sector, stage, mission, network), three concrete "why" bullets cited from profile evidence, gap analysis ("you're 80% fit, here's the gap"), suggested talking points for the intro, and a network-bridge visualization (e.g., *Sarah Chen → Alumnus Of → University of Utah → Home To → NeuroTouch*).
4. **Force-directed ecosystem map** of talent ↔ startup ↔ Utah institution edges.
5. **Nucleus admin queue** for staff to triage intro requests, with one-click *Sync to Affinity* (real REST calls when a key is configured, otherwise dry-run with full request body preview).
6. **Drop-in Squarespace embed** snippet that replaces the existing Typeform on `nucleusutah.org/contact` with a single iframe + 12 lines of vanilla JS.

## Demo scenarios (try these on the running site)

- **Executive → deep tech:** `/talent/t_sarah_chen` — Ex-Recursion VP Regulatory matched to NeuroTouch Bio (neural prosthetic, U of U spinout). The "why" calls out FDA Class III pathway overlap; the gap honestly notes she lacks neural-interface domain depth; the network bridge surfaces Dr. Lee at U of U.
- **Student → research spinout:** `/talent/t_mira_okonjo` — BYU CS senior with ML/remote-sensing publications matched to TerraForm Ag. The gap says quietly that her PhD advisor (Dr. Hart) is in fact a TerraForm cofounder.
- **Operator → scaling SaaS:** `/talent/t_tom_brigham` — Ex-Pluralsight COO matched to Sentry SaaS, a profitable $2M-ARR Utah franchise-software bootstrapper looking to bring in a CEO.

## How the AI works

- **Embeddings:** `openai/text-embedding-3-small` (via OpenRouter), three slots per profile: skills/needs, mission, experience/description. Stored as JSON in SQLite.
- **Hard filters:** stage compatibility, comp shape ↔ availability ↔ stage sanity, mentor/advisor edge cases.
- **Multi-vector cosine:** weighted per role type (executive vs. engineer vs. student weight skills/mission/network differently).
- **Utah-roots booster:** shared institution (U of U / BYU / USU / Recursion / Sarcos / etc.) lifts the network dimension by 20+ points; even one shared affiliation in a tight ecosystem is meaningful.
- **LLM rerank + explain:** Claude Sonnet 4.5 (via OpenRouter) writes 3 "why" bullets, 1-2 honest gaps, and 2 talking points. JSON mode + per-pair caching.

## Repo layout

```
app/
├── server/           Hono + Drizzle + better-sqlite3 backend, port 4007
│   ├── src/
│   │   ├── server.ts            # Hono app
│   │   ├── db/                  # schema + drizzle client
│   │   ├── lib/
│   │   │   ├── llm.ts           # OpenRouter client (chat, chatJSON, embed)
│   │   │   ├── match.ts         # the matching pipeline
│   │   │   └── profile-text.ts  # canonical text for embeddings
│   │   ├── routes/              # /api/talent /api/startup /api/match /api/network /api/intros /api/affinity
│   │   └── seed/                # curated synthetic Utah dataset (TS modules)
│   └── scripts/
│       ├── load-seed.ts         # idempotent JSON → SQLite
│       ├── embed-all.ts         # batched embedding pass
│       └── smoketest.ts         # CLI smoke test of matcher + LLM
└── web/              Vite + React + Tailwind + shadcn-style UI, port 5174
    └── src/
        ├── components/          # MatchExplainDrawer, Wizard, Avatar, ScoreDonut
        ├── pages/               # Landing, Discover, TalentDetail, StartupDetail, Network, NucleusAdmin, EmbedPreview, signups
        └── lib/api.ts           # typed fetch wrapper (proxied to :4007 in dev)
```

## Run locally

```bash
# backend
cd app/server
cp .env.example .env       # set OPENROUTER_API_KEY
npm install
npm run migrate
npm run seed:load          # 35 talent + 18 startups + 20 connection edges
npm run seed:embed         # ~1.5s, computes 159 embeddings in 2 batched calls
npm run dev                # :4007

# frontend
cd app/web
npm install
npm run dev                # :5174 (proxied to :4007)
```

Visit http://localhost:5174.

## Affinity integration

Two modes:

**Live mode** (when `AFFINITY_API_KEY` is set):
- `GET /api/affinity/pull-preview` — pull persons + organizations from Affinity lists
- `POST /api/affinity/push-match` — resolve person/org by email/name lookup, attach a Note to both records, add to a configured list

**Dry-run mode** (default for the demo):
- Same endpoints return the exact request bodies that *would* be sent — visible in the admin UI when you click "Sync to Affinity" on any pending intro.

Auth uses Affinity's standard basic auth (empty username, key as password). Code paths for both modes live in `server/src/routes/affinity.ts`.

## Squarespace embed

A 12-line vanilla-JS snippet (`pages/EmbedPreview.tsx` shows the rendered preview) drops into the Squarespace Code Block on `/contact`. It iframes `nucleus.kokomo.quest/embed` and `postMessage`s back to the parent so Squarespace analytics still see conversions.

## Deploy

The site is hosted on a Tailscale-networked Mac Studio called *reef* under `kokomo.quest`. Same pattern as our other demos.

```bash
# from this Mac
rsync -av app/ kokomo@<reef>:~/kokomo/apps/nucleus/repo/
ssh kokomo@<reef> "cd ~/kokomo/apps/nucleus/repo/server && npm ci && npm run migrate && npm run seed:load && npm run seed:embed"
ssh kokomo@<reef> "cd ~/kokomo/apps/nucleus/repo/web && npm ci && npm run build"
ssh kokomo@<reef> "sudo systemctl restart nucleus"
# Cloudflare Tunnel routes nucleus.kokomo.quest → 127.0.0.1:4007
```

A systemd unit `nucleus.service` runs `node server/dist/server.js` and serves the built `web/dist/` as static files.

## Submission checklist

- [x] Working prototype (this repo + nucleus.kokomo.quest)
- [x] AI approach explanation (above + in PLAN.md)
- [x] Utah context integration (sectors, institutions, real-flavored deep-tech profiles)
- [x] Three example match scenarios (executive, student, operator) — all linkable from the landing page
- [x] Affinity integration (live + dry-run paths)
- [x] Squarespace embed (snippet + preview page)
- [x] Explainable-AI surfaces (radar, why bullets, gaps, talking points, network bridge)
- [ ] Loom backup recording — record before code freeze
- [ ] Submission form

## Bounty parameters mapped

| Brief requirement | Where it lives |
|---|---|
| Talent profile (skills, sectors, availability, stage, comp, risk, mission) | `pages/TalentSignup.tsx` (4 steps) + `db/schema.ts:talent` |
| Startup profile (sector, origin/TRL, funding, immediate needs) | `pages/StartupSignup.tsx` (3 steps) + `db/schema.ts:startup` |
| Squarespace + Affinity compat | `pages/EmbedPreview.tsx` + `routes/affinity.ts` |
| Sign up flow | `/join/talent`, `/join/startup` |
| Match generation | `/talent/:id`, `/startup/:id` (top-5 ranked) |
| Why-matched explanation | `MatchExplainDrawer.tsx` |
| Talent upskilling ("80% fit, here's the gap") | "Where the fit is partial" section in drawer |
| Ecosystem mapping (who knows who in Utah) | `/network` + the path-finder used in the drawer |
