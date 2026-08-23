# GreenRoom Product Requirements Document

## 1. Product name

GreenRoom.

## 2. One-line proposition

Persistent decision intelligence for solo creators.

## 3. Product thesis

Creators should not have to reconstruct their goals, preferences, constraints, and prior decisions every time they use AI. A persistent decision layer can reduce decision overload by remembering this context and returning only what changed, why it matters, and what to do next. This thesis requires external validation; it is not yet proven product-market fit.

## 4. Problem statement

Independent creators manage content production, changing tools, audience choices, growth, monetization, and workflows with limited time. Existing tools usually optimize one task or retain only a conversation, leaving cross-session decision continuity to the creator.

## 5. Primary user

Solo and independent digital creators. Secondary exploration may later include creator managers, agencies, studios, and small teams.

## 6. Jobs to be done

- Remember how I work and what I will not do.
- Keep an objective active without repeated explanation.
- Filter signals against my actual context.
- Tell me what changed, why it matters, and one practical next step.
- Learn from approvals, rejections, and decisions.
- Let me leave while background work continues.

## 7. Existing alternatives

Generic chat assistants, note systems, creator dashboards, social schedulers, analytics tools, project managers, and specialist content-generation tools.

## 8. Why alternatives are insufficient

They commonly fragment context across tools, optimize execution rather than decisions, require repeated prompting, or lack durable objective-bound memory and feedback continuity.

## 9. Core product loop

Creator profile and memory → objective → relevant context selection → background intelligence → run-specific decision briefing → creator action/feedback → updated memory.

## 10. User journey

1. The creator records identity, audience, preferences, and constraints.
2. The creator sets or selects an objective.
3. GreenRoom persists an immutable run snapshot.
4. The creator starts background work and may leave the lifecycle UI.
5. GreenRoom orchestrates the run and reports honest state.
6. A successful run returns a concise briefing.
7. The creator approves, rejects, or teaches GreenRoom.
8. Future runs selectively recall relevant memory.

## 11. Functional requirements

- Manage creator context, objectives, learned rules, and decision history.
- Start and inspect asynchronous runs.
- Verify the configured real Mind before claiming Minds execution.
- Persist run-specific status and briefing data.
- Present useful loading, failure, empty, and result-ready states.
- Capture feedback without rewriting historical run provenance.

## 12. Non-functional requirements

- Honest provenance and failure behavior.
- Mobile-responsive creator interface.
- Bounded external calls and observable latency.
- Idempotent queue deliveries.
- Secure secret handling.
- Accessible, comprehensible states and controls.

## 13. Minds-native requirements

- Udophia (`8208493e-f36b-1410-8466-00039ce7df11`) is the only verified platform Mind unless repository evidence changes.
- Use official Minds Builder infrastructure.
- Validate identity and attribute replies to the configured conversation.
- Never manufacture a successful reply or describe local roles as remote Minds.
- Preserve safe conversation/message provenance.

## 14. Persistent Memory requirements

- Retain the complete creator profile durably.
- Store learned rules, memory nodes, feedback, constraints, and prior decisions.
- Select relevant memory for execution rather than serializing everything.
- Never delete Memory as a workaround for prompt or reliability problems.
- Make memory understandable and editable by the creator.

## 15. Objective requirements

- Every run binds to an immutable objective ID, title, constraints, and fingerprint.
- Supporting memory cannot replace the active objective.
- A mismatched queued or persisted snapshot must fail.

## 16. Background execution requirements

- Production orchestration uses signed QStash delivery.
- The browser may close the lifecycle modal without cancelling durable work.
- Collection may use verified SSE and durable history.
- Transient waiting must not be presented as completion.

## 17. Decision briefing requirements

- Preserve the frontend contract for title/category, `what_changed`, `why_it_matters`, and `recommended_action`.
- Keep briefing content concise and actionable.
- Attach source, Mind, objective, run, and persistence provenance.
- Never fabricate missing semantic fields.

## 18. Feedback and memory loop

Approval or rejection may add a human-readable rule or decision-history event. New rules influence later relevant-context selection. Feedback must not retroactively change old briefing records.

## 19. Run isolation requirements

- Run B cannot read, complete with, display, or deliver Run A's briefing.
- `latest_briefing` is convenience only.
- Duplicate submissions and collectors cannot create duplicate sends or briefings.
- `FAILED` and `COMPLETED` are terminal.

## 20. Evidence integrity requirements

- Simulated evidence is always labeled `Demo Dataset (Simulated)`.
- Real Mind execution does not make simulated inputs live research.
- Do not claim live URLs, prices, availability, adoption, or market discovery without a real source integration.

## 21. Failure behavior

Missing configuration, identity mismatch, send failure, deadline expiry, invalid response, queue error, objective mismatch, or persistence mismatch must produce an explicit non-success state. Older successful output cannot mask a newer failed run.

## 22. Security requirements

- Never commit or print API keys, signing keys, tokens, or environment files.
- Verify QStash signatures on production worker requests.
- Persist only safe SDK metadata.
- Sanitize diagnostics and avoid storing giant prompts or response bodies in error indexes.

## 23. Non-goals

GreenRoom is not a general chatbot, content generator, social scheduler, moderation product, live-research engine, or fictional multi-Mind showcase. New dashboards, pages, or integrations require product justification.

## 24. Current technical constraints

Real Udophia interactions have succeeded, but creator-intelligence reply generation was inconsistent across foundation tests. Context-heavy tasks were often less reliable, while compact tasks were not universally reliable either. The upstream cause is unknown. Conversation aliases are limited to 64 characters. See [TECHNICAL_CONSTRAINTS.md](TECHNICAL_CONSTRAINTS.md).

## 25. Demo success criteria

- A judge understands the proposition within 15 seconds.
- Creator context and an objective are visibly persistent.
- Background status is honest and non-blocking.
- Any completed briefing is attributable, run-specific, and actionable.
- Simulated evidence is clearly disclosed.
- A failure is shown as failure, never replaced with stale success.

## 26. Product success metrics

Proposed metrics, pending baseline: weekly active objectives, briefing completion rate, verified-reply latency, action/approval rate, recommendation rejection reasons, repeat usage, remembered-context usefulness, stale-result incidents (target zero), and creator-reported decision time saved.

## 27. Monetization hypothesis

A paid Pro tier may be viable for recurring objectives, integrations, notifications, and richer decision history. This is a hypothesis requiring willingness-to-pay interviews and beta behavior; no validated pricing claim exists.

## 28. Post-hackathon roadmap

Execution reliability and observability → creator beta and interviews → first real creator-data integration → recurring objectives and notifications → paid beta. See [ROADMAP.md](ROADMAP.md).

## 29. Open questions and validation required

- Which recurring creator decisions carry the highest cost?
- What context do creators most value being remembered?
- Which external signal source creates enough value to justify integration?
- What response latency is acceptable for asynchronous work?
- How should creators inspect, correct, or expire memory?
- What evidence produces trust rather than recommendation fatigue?
- Does the Minds execution reliability meet production thresholds after hardening?

This PRD is the canonical product definition. Future implementation must not silently redefine the product thesis; deviations must be documented in `AGENTS.md`'s drift log.
