# GreenRoom Architecture

```text
CREATOR OBJECTIVE
        ↓
VERIFIED EVIDENCE
        ↓
RELEVANT MEMORY
        ↓
ONE PERSISTENT MIND
        ↓
ATTENTION VERDICT
        ↓
WHY IT MATTERS
        ↓
WHAT TO DO NEXT
        ↓
PERSISTED RESULT
        ↓
FEEDBACK → MEMORY
```

## Actual implementation

1. `frontend/src/lib/objectiveRun.js` persists an objective and starts its bound run.
2. `server.py` reloads the durable objective, creates an immutable SHA-256 fingerprint, and delegates to `async_runner.py`.
3. Production QStash delivery reaches `api/briefing-worker.mjs`, where signature, configuration, objective, idempotency, and terminal-state guards are enforced.
4. `api/live-evidence.mjs` routes supported objectives to bounded Adobe Blog, YouTube Official Blog, or Twitch Official Blog retrieval.
5. `api/worker-guards.mjs` selects up to three relevant learned rules and three memory nodes from the complete durable profile.
6. The worker verifies Udophia's ID, email, wallet, and enabled state through `@animocabrands/minds-client-lib`, then submits the objective, relevant Memory, and verified evidence.
7. Bounded collection checks SSE and can recover a verified reply from Minds history. Echoes, wrong aliases, old fingerprints, and unsupported reply shapes are rejected.
8. Strict parsing accepts only the three attention verdicts plus non-empty decision sections.
9. The result is stored under its exact run ID with objective, evidence, Memory-selection, Mind, and persistence provenance. `latest_briefing` is never the delivery authority.
10. The frontend retrieves and verifies the exact run briefing. Feedback becomes later Memory without rewriting history.

## Trust boundaries

GreenRoom controls binding, provider allowlists, evidence validation, Memory selection, orchestration, parsing, persistence, and delivery. First-party publishers control source availability; QStash controls delivery timing; Upstash provides production durability; Udophia supplies the personalized verdict and explanation. Any unavailable, mismatched, malformed, or late outcome remains non-success.

The production worker has one submission path: supported live evidence to the verified persistent Mind. It has no simulated or deterministic briefing fallback. See [CURRENT_STATE_AUDIT.md](CURRENT_STATE_AUDIT.md).
