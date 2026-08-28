# GreenRoom

**GreenRoom keeps watch while you create.**

GreenRoom is persistent AI staff for creators. Tell it what you're working toward, it remembers what matters to you, watches real sources for useful changes, and turns those changes into decisions.

Live: https://greenroom-ruby.vercel.app

## What GreenRoom does

GreenRoom keeps creator goals, preferences, feedback, and prior decisions connected across asynchronous runs. Each result answers: what changed, why it matters to you, and what to do next.

## What works live

- Domain: `AI_VIDEO` creator-tool intelligence
- Provider: `ADOBE_BLOG`
- First-party evidence with publication and retrieval provenance
- Durable objective-bound runs, Memory, feedback, and result history

AI video is the first live vertical, not GreenRoom's identity. Unsupported categories return a truthful no-provider state.

## How it works

Creator goal → watch → verified evidence → relevant Memory → Your Mind → decision → feedback → Memory.

GreenRoom owns objectives, evidence, provenance, Memory selection, orchestration, persistence, and feedback. Minds supplies the personalized `WHY IT MATTERS` and `WHAT TO DO NEXT`.

## Why Minds is integral

GreenRoom uses the official Minds Builder client and verifies the configured persistent creator Mind before accepting a reply. A missing, late, invalid, or mismatched reply cannot become a completed personalized decision. The GreenRoom Decision Skill remains part of the verified reasoning path.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Run-specific IDs, objective fingerprints, evidence provenance, and terminal states prevent stale results from crossing run boundaries.

## Local setup

Prerequisites: Python, Node.js 22+, npm, and credentials for the integrations being exercised.

```bash
python -m venv .venv
pip install -r requirements.txt
npm install
npm --prefix frontend install
python server.py
npm --prefix frontend run dev
```

Copy `.env.example` to an ignored local environment file. Production execution requires QStash, durable Upstash Redis, and Minds Builder credentials. `DEMO_MODE=true` is explicitly simulated and must never be represented as live.

## Tests

```bash
python test_memory_persistence.py
python test_objective_bound_runs.py
node --test api/*.test.mjs frontend/src/lib/*.test.js
npm --prefix frontend run build
```

## Limitations

- Live coverage currently supports AI-video creator tools through Adobe Blog only.
- Unsupported creator domains have no live provider yet.
- Source and Minds availability remain external dependencies.
- GreenRoom does not infer pricing, availability, adoption, or performance without evidence.
- The product thesis still needs creator validation.

## Roadmap

See [ROADMAP.md](ROADMAP.md).
