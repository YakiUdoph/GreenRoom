# GreenRoom Judge Guide

## 30-second explanation

GreenRoom is for independent creators who cannot continuously monitor creator tools, platform changes, and opportunities. The creator states what to watch; GreenRoom retrieves bounded first-party evidence, selects relevant persistent creator Memory, and asks one verified persistent Mind whether the change deserves this creator's attention. The result preserves an attention verdict, personal reasoning, one next action, and proof.

Live project: https://greenroom-ruby.vercel.app

## Golden-path test

1. Open the live project and read the single promise: **You create. GreenRoom keeps watch.**
2. Use a supported objective such as `Keep watch on YouTube platform changes that could affect my channel.`
3. Submit once. Do not refresh or resubmit merely because the Mind is still working.
4. Observe truthful source, Memory, and Mind lifecycle states. You may leave the lifecycle view and return.
5. If the run completes, confirm the result contains `ATTENTION`, `WHAT CHANGED`, `WHY IT MATTERS TO YOU`, and `WHAT TO DO NEXT`.
6. Open `Verify proof`; follow the first-party source URL and inspect provider/domain, Memory used, Mind verification, objective/run identity, and persistence mode.
7. Add creator feedback from Memory only if you intend to change durable project state.

External evidence and Minds availability mean a run may instead truthfully end with no relevant update, no live provider, or failure. That is expected failure-safe behavior, not a successful golden-path result.

## Supported evidence

- `AI_VIDEO` → `ADOBE_BLOG` → Adobe Blog.
- `PLATFORM_CHANGES` → `YOUTUBE_OFFICIAL_BLOG` → YouTube Official Blog.
- `CREATOR_OPPORTUNITIES` → `TWITCH_OFFICIAL_BLOG` → Twitch Official Blog.

## One persistent Mind and Memory

Udophia (`udophia@hellominds.ai`, UUID `8208493e-f36b-1410-8466-00039ce7df11`) is the only verified platform Mind. GreenRoom verifies identity before submission and reply provenance before completion. GreenRoom retains the complete creator profile but projects only relevant rules and nodes into each decision. The objective remains authoritative.

## Attention verdicts

- `ACT_NOW`: justified action now.
- `KEEP_WATCHING`: relevant but unresolved or premature.
- `IGNORE_FOR_NOW`: low-value for this creator now.

The Mind chooses; provider/domain code does not.

## Verify live evidence

A live briefing must say `evidence_mode: LIVE`, retain an allowlisted first-party URL, and include publication/retrieval timestamps. The UI links to that exact source. Historical simulated records remain labeled and are not current live proof.

## Relevant source files

- `api/live-evidence.mjs` — provider registry and validation.
- `api/briefing-worker.mjs` — live orchestration, prompt, collection, result persistence.
- `api/worker-guards.mjs` — identity, reply, objective, and Memory guards.
- `memory_engine.py`, `persistence.py` — durable Memory and storage.
- `server.py`, `async_runner.py` — API and queue lifecycle.
- `frontend/src/pages/HomePage.jsx`, `frontend/src/pages/IntelligencePage.jsx` — golden path and proof UI.

## Reproduce locally

Run the setup in `README.md`, then:

```bash
python -m unittest test_greenroom.py test_memory_persistence.py test_objective_bound_runs.py
node --test api/*.test.mjs frontend/src/lib/*.test.js
npm --prefix frontend run build
```

The tests use controlled fixtures and make no paid Minds call. A real end-to-end production run additionally needs QStash, Upstash, and Minds credentials; never put them in source control.

## Known limitations and future work

See `KNOWN_LIMITATIONS.md`. Recurring schedules, notifications, wider source coverage, creator-account connectors, and validated product demand are future work—not live claims.
