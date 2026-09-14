# GreenRoom Foundation Status

Status date: 2026-09-14  
Starting commit: `b6ea2f2bb41c2d3dd162450cdf619bf4a0d7e0cf`

## What works and is tested

- Durable creator profile, preference, feedback, objective, run-status, result, and history contracts.
- Immutable objective snapshots, run isolation, terminal states, and duplicate-delivery idempotency.
- Bounded Adobe, YouTube, and Twitch first-party provider parsing, routing, failure behavior, and provenance.
- Relevant Memory projection without deleting the full profile.
- Udophia identity verification, reply attribution, SSE/history collection, strict malformed-response failure, and all three attention verdicts.
- Frontend current-versus-historical result isolation and honest working/terminal labels.

Baseline results before judge-readiness edits: Python `23/23` passed; Node `142/142` passed. The initial PowerShell build invocation was blocked by local script policy before Vite ran; use `npm.cmd` on Windows.

Post-change verification: Python `23/23` passed; Node `142/142` passed; Vite production build passed with 435 modules transformed in 11.45 seconds. No external provider or Minds call was made.

## Historically documented failures

`TECHNICAL_CONSTRAINTS.md` records intermittent missing verified Mind replies, especially but not exclusively on context-heavy tasks. Submission success and reply success are distinct. The upstream cause remains unknown. No test result establishes production-scale reliability.

## Dependencies and blockers

Production runs require configured QStash signing/publishing, durable Upstash Redis/KV, and Minds Builder access. Live evidence requires the supported publisher endpoints. This pass makes no external call and does not validate current deployment state.

## Reproduction

Use the setup and commands in `README.md`. Tests use fixtures/mocks; do not add real credentials or trigger paid calls for routine verification.

## Current limitations

See `KNOWN_LIMITATIONS.md`. No lint/type-check script or automated visual/mobile test exists in the tracked frontend.

## Final status

**CONDITIONAL PASS** — the implemented contracts are strongly covered by automated tests, but external Minds reliability, live deployment state, browser/mobile behavior, and product demand require separate evidence.
