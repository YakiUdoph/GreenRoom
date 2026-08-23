# GreenRoom Agent Guardrails

These rules apply to Codex, Antigravity, and future coding agents working in this repository. `PRD.md` is the canonical product definition.

## Product

- GreenRoom is persistent creator decision intelligence.
- Do not turn it into generic content generation, a generic chatbot, or a collection of dashboards.
- Do not add features without PRD justification.
- Prefer removing complexity over adding pages, controls, and technical proof surfaces.
- Distinguish product thesis from validated user evidence.

## Minds

- Udophia (`udophia@hellominds.ai`, UUID `8208493e-f36b-1410-8466-00039ce7df11`) is the only verified platform Mind unless repository evidence changes.
- Never invent Minds or represent local classes/roles as separate platform Minds.
- Never fake a successful Mind response.
- Never substitute simulated data for a real Mind response while claiming it is live.
- Use official Minds Builder infrastructure only.
- Validate identity and reply provenance before reporting completion.

## Memory

- Persistent Memory must not be deleted to solve prompt or execution problems.
- Retrieve relevant Memory selectively; retain the complete durable profile.
- The immutable active objective remains authoritative.
- Creator feedback and prior decisions must remain inspectable and must not rewrite historical provenance.

## Evidence

- Simulated evidence must always be labeled `Demo Dataset (Simulated)`.
- Never fabricate live URLs, prices, adoption, availability, or market research.
- A real Mind processing simulated evidence does not convert that evidence into live research.

## Runs

- Never return another run's briefing as the current run.
- Run isolation is non-negotiable.
- Revalidate objective ID and fingerprint at execution boundaries.
- Respect `FAILED` and `COMPLETED` as terminal states.
- Preserve idempotency for duplicate queue delivery and collection.
- Treat `latest_briefing` as a convenience pointer, never an authority.

## Security

- Never commit or print API keys, signing keys, tokens, cookies, wallet secrets, or environment contents.
- `.env` files remain ignored.
- Persist only safe SDK metadata and sanitized diagnostics.
- Preserve production signature verification and strict configuration failures.

## Design

- Preserve the existing visual language unless explicitly asked to redesign.
- Do not add navigation or pages without product justification.
- Mobile responsiveness is required.
- Loading, error, empty, working, and result-ready states must describe real backend state.
- Hide implementation details that do not help a creator decide what to do.

## Drift log

If a technical constraint requires deviation from the PRD, the implementing agent must:

1. Identify the exact PRD conflict.
2. Explain the evidence and why the conflict cannot be avoided.
3. Make the smallest reversible change.
4. Record the deviation, affected files, and validation evidence below.
5. Never silently redefine GreenRoom.

### Recorded deviations

- None recorded. Add dated entries here before merging a deviation.
