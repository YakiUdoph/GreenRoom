# GreenRoom Technical Constraints

This document records empirical foundation-test results without credentials or unsupported root-cause claims.

## Builder authentication

The configured `MINDS_BUILDER_API_KEY` authenticated successfully during known-good tests. Missing credentials fail explicitly in the stable integration.

## Mind identity

`getMind` returned and enabled verification of Udophia at `udophia@hellominds.ai`, UUID `8208493e-f36b-1410-8466-00039ce7df11`. Identity checks also include the configured wallet field in production source. No other remote platform Mind was verified.

## Conversation creation

`ensureConversation` successfully created or returned conversations. A 64-character alias constraint was encountered during testing. Run-specific aliases must therefore be designed and tested within that limit.

## Message submission

`sendMessage` succeeded repeatedly for real Udophia conversations. A successful send is not proof that a Mind reply was generated.

## SSE

`waitForReply` exposed verified replies in known-good interactions. Bounded waits also timed out in other interactions. Timeout is evidence of no verified reply within the window, not proof of a specific SDK, platform, hosting, or prompt defect.

## History

`getHistory` confirmed Mind replies persisted for known-good interactions. Failed cases sometimes contained only the outbound human row. History is a verification and recovery channel; it must not treat an outbound echo as a Mind response.

## Prompt and task behavior

- Simple semantic requests produced successful real replies in approximately 11–31 seconds across diagnostics.
- A 299-character request replied in approximately 23.4 seconds.
- A separate compact natural task replied in approximately 30.4 seconds.
- Context-heavy creator-intelligence tasks around 2.4K–2.8K characters showed inconsistent reply generation.
- Compact tasks also showed some inconsistency.
- Prompt length alone is therefore **not** an established root cause.
- The exact upstream cause remains unknown.

## QStash

Production orchestration has executed through signed QStash delivery. Source and tests cover signature verification, delayed continuation, idempotency claims, and regional publish fallback. QStash has not been established as the cause of inconsistent Mind reply generation.

## Persistence

Production supports Upstash Redis and compatible KV environment aliases. Local file and ephemeral modes are separately labeled. Run-specific briefings and recent-run status are distinct from the compatibility-only `latest_briefing` pointer. That pointer can lag the newest completed run and must not be used to identify or deliver the current creator-facing result.

## Run isolation

Tests cover immutable objective snapshots, mismatched fingerprint rejection, duplicate delivery, terminal state behavior, and prevention of Run A briefing delivery for Run B. A failed run must never reuse previous successful briefing state.

## Environment configuration

Runtime source uses `MINDS_BUILDER_API_KEY`, QStash token/signing keys, and Upstash Redis REST URL/token (or supported KV aliases). Environment files are ignored and must not be printed or committed.

## Alias limits

Minds conversation aliases must be no more than 64 characters. Any future alias format must be deterministic, run-specific, collision-conscious, and covered by tests.

## Observed latency

Known successful diagnostic replies clustered around 11–31 seconds. This is a small test sample, not a production service-level objective. End-to-end background latency also includes queue dispatch, send latency, collection scheduling, persistence, and client polling.

## Known unknowns

- The upstream reason some submitted messages produced no verified reply.
- Reliability under realistic concurrency and sustained production volume.
- Appropriate retry/deadline policy for creator expectations.
- Whether task semantics, context composition, platform state, or another variable dominates failure probability.
- Production-level latency distribution and error budget.

## Design consequences

- Keep creator Memory durable, but project only relevant context into execution.
- Keep external tasks bounded and independently observable.
- Separate send success, verified reply, parse success, persistence, and delivery in telemetry.
- Use SSE and history as complementary verification paths.
- Fail safely when output is absent or invalid.
- Preserve asynchronous UX so the creator is not trapped on a loading screen.
- Do not claim the unresolved reliability constraint is solved until repeated production-like evidence supports that conclusion.
