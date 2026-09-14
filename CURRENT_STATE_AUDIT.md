# GreenRoom Current-State Audit

Audit date: 2026-09-14  
Starting commit: `b6ea2f2bb41c2d3dd162450cdf619bf4a0d7e0cf`  
Audit branch: `judge-readiness-playbook`

This document describes the current tracked implementation. Historical audit files and untracked planning/redesign files are evidence, not the authority for live product claims.

## 1. What GreenRoom actually does today

GreenRoom lets a creator persist profile context, preferences, feedback, and objectives; start an objective-bound background run; retrieve fresh evidence from a supported first-party source; select relevant creator Memory; ask one verified persistent Mind to decide whether that evidence deserves this creator's attention; persist the run-specific result; and retain creator feedback for later decisions.

It is a bounded decision-support workflow, not a general chatbot, content generator, or continuous web-wide monitoring service.

## 2. What is genuinely live

- Objective creation, immutable objective snapshots, run IDs, status tracking, result retrieval, and feedback APIs.
- Durable production persistence through Upstash Redis/KV when configured; local-file and ephemeral modes are separately identified.
- Signed QStash background delivery, delayed collection, idempotency, terminal-state enforcement, and run isolation.
- First-party evidence retrieval for three supported domains.
- Official Minds Builder client integration with identity checks for Udophia.
- Verified-reply collection through bounded SSE plus history recovery.
- Strict parsing of the three attention verdicts and creator-specific decision sections.
- Run-specific source, objective, Memory-selection, Mind, and persistence provenance.

Live capability depends on valid production configuration and the availability of the external source, QStash, Redis/KV, and Minds services.

## 3. What is simulated, mock, or test-only

- Tests use fake Redis, fake Minds clients, fixed source payloads, and controlled clocks. These validate behavior but are not live product runs.
- Historical persisted briefings may contain explicitly labeled pre-live evidence and remain historical only.
- The untracked `greenroom-redesign/` tree is not part of the tracked production application or root build.

The executable simulated-candidate classifier, simulated Minds prompt, legacy worker branch, deterministic briefing generator, and fabricated homepage result were removed in the real-product pass. GreenRoom does not substitute simulated intelligence when live execution fails. Homepage empty states contain no fabricated recommendations.

## 4. Current supported evidence domains and providers

| Domain | Provider | Source |
|---|---|---|
| `AI_VIDEO` | `ADOBE_BLOG` | Adobe Blog query index |
| `PLATFORM_CHANGES` | `YOUTUBE_OFFICIAL_BLOG` | YouTube Official Blog RSS |
| `CREATOR_OPPORTUNITIES` | `TWITCH_OFFICIAL_BLOG` | Twitch Official Blog HTML |

Routing is bounded objective classification. Unsupported objectives return `UNSUPPORTED_DOMAIN` without calling a provider or substituting simulated evidence. Each provider applies origin, format, recency, relevance, size, request, and time limits appropriate to its source.

## 5. Exact role of Minds

Udophia (`udophia@hellominds.ai`, UUID `8208493e-f36b-1410-8466-00039ce7df11`) is the only verified platform Mind. GreenRoom verifies the Mind's ID, email, wallet, and enabled state before submission. The live worker gives that Mind the immutable objective, selected relevant preferences, and one verified evidence item. The Mind must choose `ACT_NOW`, `KEEP_WATCHING`, or `IGNORE_FOR_NOW` and supply `WHY IT MATTERS` and `WHAT TO DO NEXT`.

GreenRoom—not Minds—owns evidence retrieval, Memory storage and selection, objective binding, orchestration, parsing, persistence, result delivery, and feedback. A send acknowledgment is not treated as a reply. A missing, late, mismatched, or malformed reply fails rather than becoming a completed personalized result.

## 6. Exact role of persistent Memory

GreenRoom durably retains the complete creator profile, objectives, learned rules, memory nodes, feedback, decision history, and briefing references. For each run it deterministically selects a compact relevant projection—currently up to three learned rules and three memory nodes—using the objective and evidence. Selection provenance records safe rule hashes and node IDs. Memory supports the immutable objective; it cannot replace it. Feedback adds future context without rewriting historical briefings.

## 7. Existing attention-verdict mechanism

The verified Mind, not provider/domain rules, chooses exactly one of:

- `ACT_NOW`: a concrete action is justified now.
- `KEEP_WATCHING`: the update may matter but is unresolved, premature, unavailable, or insufficiently actionable.
- `IGNORE_FOR_NOW`: the update is currently low-value for this creator.

The live prompt forbids fixed provider/domain verdict mappings and unsupported assumptions. Parsing rejects missing or unknown verdicts and missing decision sections. Completed briefings persist the verdict and expose a human-readable label in the frontend.

## 8. Current golden path

1. Creator enters what GreenRoom should watch.
2. GreenRoom persists the objective and verifies the exact durable record.
3. GreenRoom creates an immutable objective fingerprint and queues a signed background run.
4. The worker classifies the supported domain and retrieves bounded first-party evidence.
5. GreenRoom selects relevant persistent Memory.
6. GreenRoom verifies Udophia and submits the objective, Memory, and evidence.
7. QStash schedules bounded reply collection; SSE is attempted and history is the recovery channel.
8. A verified reply is strictly parsed into an attention verdict, why it matters, and what to do next.
9. The result and provenance are persisted under the exact run ID and objective fingerprint.
10. The frontend retrieves that exact run's briefing; creator feedback can become later Memory.

## 9. Current failure paths

- Blank objective: prevented by the current required form and input guard.
- Unsupported objective: terminal `UNSUPPORTED_DOMAIN`; no provider call and no substituted result.
- No relevant fresh evidence: terminal `NO_RELEVANT_UPDATE`; older results remain historical only.
- Source HTTP, timeout, or malformed response: terminal `FAILED` with sanitized error data.
- Missing production queue or durable persistence configuration: trigger rejected explicitly.
- Missing Minds client, identity mismatch, send failure, collection deadline, or malformed reply: terminal `FAILED`.
- Duplicate queue delivery: durable claims and terminal-state checks prevent duplicate sends/completions.
- Objective or fingerprint mismatch: rejected before cross-run delivery.
- Delayed run: remains in a truthful pending state and can be resumed after leaving the lifecycle view.

## 10. Judge-readiness weaknesses

- The homepage now uses the desired promise, a single primary action, supported objective examples, and a truthful current-status card. It contains no fabricated result preview.
- A judge has no single repository guide with an exact, low-risk verification flow.
- Proof is split across the Intelligence page rather than presented as a compact expandable verification block.
- The lifecycle modal exposes transport and implementation jargon and includes stale scripted claims (including a `$45 CPM benchmark`) that are unrelated to current state.
- `docs/ARCHITECTURE.md`, `ROADMAP.md`, and parts of the in-product Docs page lag the three-provider implementation.
- Some UI copy says only AI video is supported even though two additional live domains exist.
- Some in-product documentation describes a raw-evidence fallback on Mind failure that the normal live worker does not implement.
- There is no canonical `JUDGE.md`, root `ARCHITECTURE.md`, `FOUNDATION.md`, or `KNOWN_LIMITATIONS.md`.
- There is no configured frontend lint/type-check script and no automated browser/mobile suite in the tracked frontend.
- External reply reliability and production-scale latency remain unproven.

## 11. Claims we can prove

- GreenRoom supports three bounded first-party evidence providers for the domains listed above.
- GreenRoom uses one verified persistent platform Mind, Udophia, through the official Minds Builder client.
- Relevant persistent creator Memory is selected and supplied to the Mind for a live decision.
- The Mind chooses one of three attention verdicts from objective, Memory, and verified evidence.
- Completed results preserve source URLs, publication/retrieval timestamps, provider/domain metadata, Memory-selection provenance, Mind identity, objective fingerprint, and run ID.
- Runs are asynchronous, durable when production dependencies are configured, idempotent, terminal-state safe, and isolated from other runs.
- Unsupported, empty-evidence, timeout, source-failure, and malformed-Mind outcomes do not become fake successful briefings.
- Existing automated tests cover the above contracts with mocks and fixtures.

## 12. Claims we must not make

- That GreenRoom continuously or autonomously monitors the whole creator ecosystem on a schedule; runs are user-triggered and recurring monitoring is roadmap work.
- That unsupported domains, arbitrary websites, or all Adobe/YouTube/Twitch changes are covered.
- That simulated candidates or homepage examples are live findings.
- That a successful test fixture is a live Minds or provider call.
- That Udophia always replies, or that production reliability, latency, concurrency, and scale are proven.
- That GreenRoom knows creator eligibility, country, pricing, rollout access, audience size, adoption, popularity, or performance unless the selected evidence and Memory actually contain it.
- That multiple platform Minds or agents collaborate; only Udophia is verified.
- That creator demand, product-market fit, willingness to pay, or the target user has been validated without real research evidence.
- That roadmap features—recurring watches, notifications, additional providers, creator-account connectors, or paid tiers—exist today.
