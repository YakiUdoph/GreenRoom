# GreenRoom

## You create. GreenRoom keeps watch.

GreenRoom keeps watch for creators, remembers what matters to them, and brings back the changes and opportunities worth their attention.

Live project: https://greenroom-ruby.vercel.app

## The problem

Independent creators responsible for their own growth and monetization cannot continuously monitor platform changes, creator tools, and opportunities while also doing the work of creating. Information is abundant; creator attention is scarce. GreenRoom's target-user and product thesis still require external validation.

## What GreenRoom does

A creator gives GreenRoom an objective. GreenRoom checks a supported first-party source, retrieves relevant persistent Memory, and asks one persistent Mind whether the verified change deserves this creator's attention. A completed result explains what changed, why it matters to this creator, and what to do next.

GreenRoom is not a generic chatbot, content generator, or web-wide news aggregator. Current watches are user-triggered; recurring autonomous monitoring is roadmap work.

## The killer mechanism

```text
EXTERNAL EVENT -> VERIFIED FIRST-PARTY EVIDENCE -> RELEVANT CREATOR MEMORY
-> ONE PERSISTENT MIND -> ATTENTION VERDICT -> WHY IT MATTERS
-> WHAT TO DO NEXT -> PERSISTED RESULT -> FEEDBACK -> MEMORY
```

The Mind chooses `ACT_NOW`, `KEEP_WATCHING`, or `IGNORE_FOR_NOW` from the objective, relevant Memory, and evidence. Verdicts are not hardcoded by domain or provider.

## Why Minds is essential

Minds is not decorative. GreenRoom's value depends on persistent creator context across decisions. Without persistence, GreenRoom could still retrieve information, but it would be materially worse at deciding whether the same event matters to a particular creator.

Udophia (`udophia@hellominds.ai`, UUID `8208493e-f36b-1410-8466-00039ce7df11`) is the only verified platform Mind. The live worker verifies its identity, sends the immutable objective, selected Memory, and verified evidence through the official Minds Builder client, then accepts only a verified, correctly attributed reply. GreenRoom owns retrieval, Memory, orchestration, parsing, persistence, feedback, and run isolation; Udophia supplies the personalized verdict and decision explanation.

## What is live today

| Domain | Provider | First-party source |
|---|---|---|
| `AI_VIDEO` | `ADOBE_BLOG` | Adobe Blog query index |
| `PLATFORM_CHANGES` | `YOUTUBE_OFFICIAL_BLOG` | YouTube Official Blog RSS |
| `CREATOR_OPPORTUNITIES` | `TWITCH_OFFICIAL_BLOG` | Twitch Official Blog |

Also live when production dependencies are configured: durable objectives and Memory, signed QStash background runs, relevant-Memory selection, Udophia identity/reply verification, run-specific results, feedback, and history. Unsupported objectives return an honest no-provider state.

GreenRoom does not substitute simulated intelligence when live execution fails. Homepage empty states contain no fabricated recommendations.

## Example flow

1. Enter: `Keep watch on YouTube platform changes that could affect my channel.`
2. GreenRoom binds the saved objective to a run and checks the YouTube Official Blog.
3. It selects relevant creator preferences and asks Udophia to judge the verified update.
4. A successful result shows `ATTENTION`, `WHAT CHANGED`, `WHY IT MATTERS TO YOU`, and `WHAT TO DO NEXT`.
5. Open `Verify proof` to inspect source, provider/domain, Memory, Mind status, and run provenance.

The current result depends on fresh evidence and external Minds availability. No verdict is guaranteed.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md). Immutable objective fingerprints, run-specific persistence, idempotent queue claims, and terminal states prevent cross-run result delivery.

## Proof / how to verify

Start with [JUDGE.md](JUDGE.md) for the 30-second explanation and exact golden path. The result's `Verify proof` area links to the first-party article and exposes retained provenance.

## Run locally

Prerequisites: Python 3.12+, Node.js 22+, and npm.

```bash
python -m venv .venv
pip install -r requirements.txt
npm install
npm --prefix frontend install
python server.py
npm --prefix frontend run dev
```

Copy `.env.example` to an ignored local file only when exercising configured integrations. Production execution requires QStash, durable Upstash Redis/KV, and Minds Builder credentials. Local test configuration must never be represented as live execution.

## Tests

```bash
python -m unittest test_greenroom.py test_memory_persistence.py test_objective_bound_runs.py
node --test api/*.test.mjs frontend/src/lib/*.test.js
npm --prefix frontend run build
```

No frontend lint or type-check script is configured. See [FOUNDATION.md](FOUNDATION.md) for evidenced results.

## Known limitations

Coverage is limited to the three source/domain pairs above. Source, queue, persistence, and Minds availability are external dependencies. GreenRoom has no creator-account connectors, cannot infer missing eligibility or rollout facts, and does not yet run recurring scheduled watches. See [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md).

## Roadmap

Reliability measurement and creator validation come before broader coverage, recurring watches, notifications, or creator-account connectors. See [ROADMAP.md](ROADMAP.md). Roadmap items are not implemented features.
