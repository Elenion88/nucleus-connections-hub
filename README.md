# Track 03 — The Nucleus Institute · Utah Innovation Connections Hub

- **Prize:** $5,000
- **Team:** 1–4 · open to anyone
- **Sponsor:** The Nucleus Institute — https://www.thenucleus.institute
- **Brief URL:** https://aibuilderday.com/bounty-nucleus
- **Full brief (Google Doc):** https://docs.google.com/document/d/1nKa_D3_7u8jZaTjvAALm59FxsUZJopKGu-ErLnCj3z4/edit

## Problem statement

Utah has a rapidly growing innovation ecosystem driven by University of Utah, BYU, and Utah State — producing high-potential deep tech startups in biotech, advanced materials, energy, and AI. **Critical bottleneck:** university tech commercialization fails most often not at the research stage but at the **market-problem match**. Early-stage and university spinout companies struggle to find experienced operators (C-suite, commercialization experts, sales, technical operators), while many qualified individuals lack visibility into meaningful startup opportunities. Current job boards and networking sites provide insufficient matching.

## Core challenge

Build an **AI-powered platform that intelligently matches talent to startups.**

**Talent pool:**
- Executives, CoFounders, COO, Fractional Operators
- Engineers, Sales, Marketing
- Students, Interns
- Board Members, Advisors (for equity/$), Mentors (for free)

**Startup core sector focus:** Life Sciences · AI · Defense/Aerospace · Cyber · Energy · Advanced Manufacturing · Fintech · Software

## Current solution & its failures

Today: `https://www.nucleusutah.org/contact` — a Squarespace 'connections hub' that uses Typeform to feed into their CRM (Affinity).

Issues: no automatic matching, very manual process.

## Required features

### A. Dual-sided user profiles

**Talent Profiles:** Skills (technical + functional), industry/domain expertise, stage preference (idea/pre-seed/growth), availability (full-time/fractional/advisory/internship), risk tolerance, mission/interest alignment.

**Startup Profiles:** Technology domain (sector), origin (e.g. university lab, bootstrapped), stage of commercialization (TRL or funding stage), immediate needs (CEO/CTO/biz dev/regulatory), funding status (grants/venture).

### B. Nucleus integration parameters

The platform must be **compatible with their existing software:**
- Squarespace (website)
- Affinity (CRM)

### C. UX requirements

Must clearly demonstrate:
- How a user signs up
- How matches are generated
- How results are explained (**transparency matters**)

Strong preference for:
- **Explainable AI** ("Why was I matched?")
- Simple, intuitive interface
- Trust-building elements

### Optional high-value features

- Talent upskilling recommendations ("You're 80% fit — here's how to close the gap")
- Ecosystem mapping (who knows who in Utah)

## Data guidelines

Teams may use synthetic datasets, simulate Utah startup/talent profiles, or incorporate public datasets. **Do not rely on proprietary or sensitive personal data.**

## Deliverables

- **A. Working Prototype or Demo** — web app, Figma prototype, or functional backend
- **B. AI Approach Explanation** — what models/tools (LLMs, embeddings, etc.) and why this beats traditional systems
- **C. Utah Context Integration** — how it's uniquely tailored to Utah
- **D. Example Matches** — at least 2–3 realistic scenarios:
  - Executive → deep tech startup
  - Student → research spinout
  - Operator → scaling company

## Judging criteria

| Weight | Criterion |
|---|---|
| 40% | **User Experience** — intuitive, clear, trustworthy |
| 30% | Match Quality & Intelligence — feels meaningfully better than LinkedIn or job boards |
| 20% | Integration — seamlessly fits Nucleus workflows (Squarespace + Affinity) |
| 10% | Innovation & Creativity — novel approaches, unexpected insights |

UX is the heaviest weight — polish and trust signals matter more than raw matching tech.

## Strategic notes

- Smaller team allowed (1–4) and open to anyone — lowest barrier to entry of the bigger-prize tracks.
- **Integration with Squarespace + Affinity** is 20% of the score — easy to under-invest here. A working webhook/embed/API integration story will separate winners.
- Explainability is called out twice — invest in "why this match" UI surfaces.

## Notes from Friday's bounty pitch (Nick, Nucleus)

Source transcript: [`../transcripts/01-friday-bounty-pitches.md`](../transcripts/01-friday-bounty-pitches.md)

### Why this bounty exists (the anchor problem)

Nucleus works closely with researchers and professors at U of U, BYU, and Utah State who are creating **"really cool"** tech but **don't know how to be business people**. Nucleus is constantly trying to play matchmaker between PhDs and potential cofounders, sales leads, and operators — and they keep doing it manually.

Two examples Nick called out as currently incubating:

1. **Neural prosthetic interface** — implanted into the body, lets the brain not just *control* a prosthetic but **feel and touch** through it. Being turned into a startup right now.
2. **Bio-computer** — silicon + tissue grown from stem cells, dramatically more energy-efficient computer chip.

These are the kinds of companies your platform needs to surface and match to the right operators. **Deep tech / hard tech is the prototypical use case**, not generic SaaS.

### Tyler's one-liner summary

> "Matchmaking service for how do you help these really awesome PhD people commercialize the company. They're really bright, but man, they don't know how to do anything associated with the business — and we need to help them find people who know how to do it."

### Strategic implication

The "bad job-board UX" framing is universal, but **the unfair-angle for this bounty is deep tech / university spinout matching**. Showing your tool nailing an exec → biotech-spinout match (using a synthetic profile inspired by the neural-prosthetic or bio-computer companies) is more on-brand than showing a generic SWE → SaaS startup match.

### Current Nucleus stack (you must integrate-friendly)

Squarespace site → Typeform → **Affinity CRM** → manual matching by Nucleus staff. The 20% integration score on the rubric is about not breaking that pipeline.

## Transcripts

Per-bounty audio goes in `transcripts/`. Friday pitch covering all 5 tracks: [`../transcripts/01-friday-bounty-pitches.md`](../transcripts/01-friday-bounty-pitches.md).
