# Track 03 — Nucleus · Utah Innovation Connections Hub

**Prize:** $5,000 · **Solo build** · **Code freeze:** Sat May 9, 2:00 PM (~24h)
**Subdomain:** `nucleus.kokomo.quest`
**Demo URL:** https://nucleus.kokomo.quest

## Judging recap

| Weight | Criterion | Implication |
|---|---|---|
| 40% | UX — intuitive, clear, trustworthy | Spend the most time here. Polish, microcopy, "why matched" surfaces. |
| 30% | Match quality vs LinkedIn | Hybrid: hard filters + multi-vector embeddings + LLM rerank/explain. |
| 20% | Integration (Squarespace + Affinity) | Real Affinity API call paths + Squarespace embed snippet. Don't hand-wave. |
| 10% | Innovation | Ecosystem map ("who knows who in Utah") + gap analysis ("you're 80% fit"). |

## Strategic angle

**Lead with deep tech / university spinout matching**, not generic SaaS. Nick (Nucleus) called out two real incubating companies — model the demo data after them:

1. **NeuroTouch Bio** (synthetic) — neural prosthetic interface, U of U spinout, needs CEO + regulatory affairs.
2. **SiliCell Compute** (synthetic) — bio-computer (silicon + stem-cell tissue), BYU/U of U partnership, needs CTO + commercialization lead.

Showing a real-feeling Exec → NeuroTouch match with a clear "why" beats any number of generic matches.

## Architecture

```
Layout:    ~/kokomo/apps/nucleus/repo/{server,web}    (matches ohana/dailypakt/tt/startup-utah)
Backend:   Hono + @hono/node-server, port 4007, /api/*
DB:        Drizzle + better-sqlite3, SQLite file in server/
Frontend:  React 18 + Vite + Tailwind + shadcn/ui + Framer Motion
LLM:       OpenRouter — primary: anthropic/claude-sonnet-4-6 for explanations; openai/text-embedding-3-large for vectors
Hosting:   Built on Mac → rsync to reef → systemd unit → Cloudflare Tunnel → nucleus.kokomo.quest
Process:   systemd unit (nucleus.service)
```

## Data model (Drizzle)

```ts
talent { id, name, headline, bio, sectors[], skills[], functions[],
         availability, stagePreference, riskTolerance, comp_shape,
         missionTags[], affiliations[],  // U of U / BYU / USU / company history
         skillsEmbedding[], missionEmbedding[], experienceEmbedding[] }

startup { id, name, oneliner, description, sector, origin,
          trl, fundingStage, fundingRaisedUsd,
          immediateNeeds[],  // CEO, CTO, regulatory, biz_dev, sales, etc.
          missionTags[], utahRoots[],
          missionEmbedding[], descriptionEmbedding[], needsEmbedding[] }

connection { fromId, toId, kind, evidence }   // ecosystem map: shared U of U lab, prior coworker, mutual investor
match { talentId, startupId, score, dimensions{}, explanation, gaps[], generatedAt }
```

## Matching pipeline

1. **Hard filters:** availability ∩ startup-need shape; stage preference ∩ startup stage; comp shape compatible.
2. **Multi-vector similarity:** weighted sum of cosine similarity across (skills↔needs, mission↔mission, experience↔description). Weights tuned per role type (exec ≠ intern).
3. **Boosters:** Utah-roots overlap (+5–15%), prior deep-tech experience for deep-tech startups (+10%), shared affiliations (+5%).
4. **LLM rerank + explain (Claude via OpenRouter):** top 20 → ranked top 5 with structured JSON: `{score, why_matched: [3 bullets], gaps: [up to 2], talking_points: [2]}`.
5. **Cache** explanations by (talentId, startupId) hash so the demo is instant.

## Synthetic dataset

- **~40 talent profiles** across the role taxonomy: 6 execs/cofounders, 4 fractional COO/CFO, 6 engineers, 4 sales, 3 marketing, 5 students/interns, 6 advisors/board, 6 mentors. Skew toward Utah-rooted: U of U / BYU alumni, ex-Pluralsight/Domo/Qualtrics/Recursion/Sarcos.
- **~18 startup profiles**: NeuroTouch Bio, SiliCell Compute, plus realistic Utah-flavored startups across Life Sciences / AI / Defense / Cyber / Energy / Advanced Manufacturing / Fintech / Software.
- **~80 connections** to feed the ecosystem map (shared lab, ex-coworker, investor cluster).
- All synthetic, generated via a one-time Claude call I write into a script + check into `server/seed/`.

## Required user flows (demo script)

1. **Talent sign-up** (`/join/talent`) — 4-step wizard: identity → skills/sectors → availability/comp/risk → mission. After step 4, instant match preview ("we found 3 startups that fit you").
2. **Startup sign-up** (`/join/startup`) — 3-step wizard: about → tech/stage → immediate needs. Instant talent preview after.
3. **Match feed** (`/talent/:id` or `/startup/:id`) — ranked list with score badges and a tap-to-expand "Why matched" drawer.
4. **Why matched drawer** — radar chart (5 dimensions: Skills · Sector · Stage · Mission · Network), three "why" bullets (LLM), one or two gap bullets ("you're 80% fit — here's how to close it"), suggested intro talking points, one-tap "Request intro via Nucleus."
5. **Ecosystem map** (`/network`) — force-directed graph of talent ↔ startup ↔ Utah affiliations; click an edge to see the path ("You → Dr. Lee (U of U) → NeuroTouch Bio").
6. **Nucleus admin** (`/nucleus`) — staff view with bulk match queue, Affinity sync button, "send intro email" composer.

## Integrations (20% of score — earn it)

### Affinity (CRM)

- Real REST calls against `https://api.affinity.co/v2/` if a sandbox key exists; otherwise dry-run mode that prints exact request bodies.
- Two flows:
  - **Pull:** `/api/affinity/import` — pull persons + organizations from a chosen list, map fields → our schema, generate embeddings.
  - **Push:** `/api/affinity/push-match` — when staff approves a match, POST a Note to both person + org records linking the match, and add both to a "Hackathon Matched" list.
- Field mapping config UI (admin) so the demo shows we understand Affinity's custom-field model.
- README documents exactly how Nucleus would plug their key in (env var, list IDs).

### Squarespace

- A drop-in **embed snippet** (vanilla JS) that replaces the current Typeform-style intake on `nucleusutah.org/contact` with our form via iframe + postMessage handshake.
- Demo this by previewing the snippet inside our `/embed-preview` page styled like nucleusutah.org.

## Build timeline (~24h, hour-by-hour)

| Hour | Block | Output |
|---|---|---|
| 0–2 | Repo scaffold, Hono + Vite, Tailwind/shadcn, routing, env wiring (OpenRouter key), Drizzle schema | `npm run dev` works locally |
| 2–4 | Synthetic data generation script (Claude → JSON) + seed loader + embedding generation | DB seeded with 40 talent + 18 startups + 80 connections + vectors |
| 4–7 | Matching engine: hard filters → vector scoring → LLM rerank/explain → cache | `GET /api/match/talent/:id` returns ranked list w/ explanations |
| 7–10 | Sign-up wizards (talent + startup) with instant preview | Two clickable signup flows |
| 10–14 | Match feed + Why-matched drawer (radar + bullets + gaps + talking points) | The hero UI of the demo |
| 14–16 | Ecosystem map (force graph) | `/network` is shippable |
| 16–18 | Nucleus admin view, intro email composer, match approval | `/nucleus` staff flow |
| 18–20 | Affinity integration (real or stubbed) + Squarespace embed preview | Integration story closed |
| 20–22 | Visual polish, microcopy, mobile pass, motion (Framer), brand colors | Investor-ready feel |
| 22–23 | Deploy (rsync to reef, systemd, Cloudflare Tunnel, DNS), Loom backup | nucleus.kokomo.quest live |
| 23–24 | Submission: README, demo video, screenshots, example match write-ups | Done before 2pm Sat |

## Demo script (3 min, 6 beats)

1. **Hook (15s):** "University tech commercialization fails at the market match, not the research. Here's what we built."
2. **Talent sign-up (30s):** Sarah, ex-Recursion biotech exec, signs up → instant match preview shows NeuroTouch Bio at 92%.
3. **Why matched (45s):** Open the drawer. Radar shows 5 dims. Three bullets cite specific overlaps ("led FDA Class III submission at Recursion → NeuroTouch needs regulatory CEO"). Gap: "limited neural-interface domain depth → suggested mentor: Dr. Lee, U of U."
4. **Reverse view (30s):** Switch to NeuroTouch's startup view — Sarah is their #1, plus a fractional regulatory advisor.
5. **Ecosystem map (20s):** Show Sarah → Dr. Lee → NeuroTouch graph; click edge for path explanation.
6. **Integration (30s):** Click "Sync to Affinity" → show real (or stubbed) API call landing on the person/org records, plus the Squarespace embed preview rendering inside the existing `nucleusutah.org` chrome.
7. **Close (10s):** "From manual match by Nucleus staff to explainable AI-assisted match in 30 seconds — without breaking your existing pipeline."

## Open questions / TODO before kickoff

- [ ] Confirm `kokomo.quest` Cloudflare Tunnel pattern matches 02-goed (assume yes).
- [ ] OpenRouter key — copy from existing project on Mac.
- [ ] Affinity sandbox key — Slack `bounty-nucleus` Saturday morning to ask Nick. Build with dry-run as fallback.
- [ ] Confirm port 4007 is unused on reef.
- [ ] Pull a couple of real-looking Utah deep-tech logos (with synthetic names) for visual credibility — do not use real company names without consent.
