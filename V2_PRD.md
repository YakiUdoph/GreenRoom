# GreenRoom V2 Product Requirements

## Status and scope

This document amends, but does not replace, `PRD.md`. The V1 trust requirements for verified evidence, persistent Memory, immutable objective-bound runs, verified Udophia execution, honest failure, and exact-run delivery remain mandatory.

V2's first slice validates one product mechanism. It is not a general analytics dashboard, chatbot, news feed, OAuth integration, or cosmetic redesign.

## Product promise

GreenRoom understands a creator's business, notices what may be limiting it, combines that internal context with relevant verified external changes, and returns the one decision that deserves attention.

The core question changes from “Does this external change matter to me?” to:

> Given what is happening inside my creator business and outside it, what deserves my attention and what should I do next?

## Primary user and job

The initial user is an independent YouTube creator who can export real YouTube Studio analytics and wants a concise, persistent decision layer rather than another dashboard.

The job is to connect a transparent performance signal to a relevant first-party YouTube change, evaluate that connection against the creator's stated goal and constraints, and recommend one realistic next action.

## Killer mechanism

```text
REAL YOUTUBE ANALYTICS
        +
CREATOR GOAL AND CONSTRAINTS
        +
PERSISTENT CREATOR CONTEXT
        +
VERIFIED FIRST-PARTY EVIDENCE
        ↓
VERIFIED UDOPHIA ATTENTION DECISION
        ↓
ONE PRACTICAL NEXT ACTION
```

A successful demo must show that the external update matters more, less, or not yet because of an actually computed creator signal. A generic summary of the update is not sufficient.

## Creator business context

GreenRoom maintains four explicitly separated kinds of context:

1. **Creator profile — creator supplied:** display name, primary platform, optional channel identifier or URL, and optional niche/category.
2. **Goals — creator supplied:** primary goal, optional measurable target, optional target unit, and optional target date.
3. **Constraints — creator supplied:** upload-frequency preference, budget sensitivity, platform focus, and other explicit boundaries or preferences.
4. **Observed signals — GreenRoom computed:** transparent calculations derived only from a specific normalized analytics import.

The UI must label creator-supplied facts as “You told GreenRoom” and computed observations as “GreenRoom observed from your data.” Computed observations never overwrite creator statements.

## CSV import requirements

The first V2 data connection is manual YouTube Studio analytics CSV import. Google OAuth is explicitly out of scope.

The importer must:

- accept CSV only and reject unsupported file types;
- enforce a documented file-size and row-count limit before parsing;
- handle UTF-8 BOM, quoted cells, commas, and known YouTube Studio header variants;
- validate that a supported row identity and at least one supported metric are present;
- map recognized headers explicitly rather than guessing unknown columns;
- preserve missing and unavailable fields as `null`, never zero;
- reject malformed numeric, percentage, duration, and date values with row/column diagnostics;
- normalize only fields actually present;
- persist normalized analytics separately from external evidence and creator-supplied Memory;
- record filename, import timestamp, row count, recognized columns, unavailable expected columns, schema version, and a content hash;
- avoid persisting raw CSV unless an explicit retention decision is made.

Importing analytics must not claim that a YouTube account is connected.

## Supported normalized analytics

Where present, V2 normalizes:

- video identifier and/or title;
- publication date;
- views;
- impressions;
- impressions click-through rate;
- average view duration;
- watch time;
- subscribers gained;
- subscribers lost;
- net subscribers, either supplied or transparently derived when both inputs exist.

Unknown or absent values are unavailable. They must not be inferred.

## Signal engine

The deterministic signal engine operates on normalized records, never arbitrary CSV text. The first implementation may calculate only:

- `CTR_TREND`;
- `VIEW_TREND`;
- `SUBSCRIBER_CONVERSION_TREND` when both subscriber and relevant denominator data are available;
- `AVERAGE_VIEW_DURATION_TREND`.

Every signal records its type, direction, period, current value, comparison value, unit, calculation method, supporting observation references, minimum-data rule, sufficiency/confidence label, source import ID, and generation timestamp.

Allowed directions are `IMPROVING`, `DECLINING`, `STABLE`, and `INSUFFICIENT_DATA`. V2 does not claim statistical significance or causation. Insufficient or incomparable observations produce `INSUFFICIENT_DATA`, not a directional result.

The initial comparison method should be deliberately simple: compare two non-overlapping chronological windows of equal observation count, using a documented aggregate appropriate to the metric. Thresholds and minimum counts must be versioned and tested before implementation.

## Udophia decision input

The existing verified Udophia path is extended with a bounded `creator_signals` section. It receives only:

1. the immutable creator objective snapshot;
2. relevant explicit constraints/preferences;
3. relevant computed signals and their sufficiency/uncertainty;
4. verified live external evidence;
5. instructions forbidding unsupported inference.

The Mind must not calculate trends from CSV rows. It must not invent demographics, revenue, subscriber counts, eligibility, metrics, causes, rollout access, competitor behavior, sponsorship suitability, or causal relationships.

## V2 decision contract

The persisted decision retains `ACT_NOW`, `KEEP_WATCHING`, or `IGNORE_FOR_NOW` and adds these required creator-facing sections:

- **WHAT I NOTICED:** the grounded connection between internal signal and external evidence;
- **WHY THIS MATTERS TO YOU:** explicit connection to the creator's goal or constraint;
- **WHAT I'D DO NEXT:** one realistic action;
- **EVIDENCE:** referenced creator signal IDs and external source IDs/URLs;
- **UNCERTAINTY:** missing, insufficient, or unverified information.

Technical provenance includes the exact run, objective fingerprint, analytics import ID/hash, signal IDs and calculation versions, selected Memory provenance, external provider/source metadata, verified Mind metadata, reply source, and persistence mode. Run IDs stay behind “Why GreenRoom decided this.”

## Information architecture

### Today

The primary surface answers “What deserves my attention?” It shows a truthful greeting, counts derived only from persisted genuine decisions, and at most the highest-priority current decision. If no decision exists, “Nothing important happened today” is a successful empty state.

### Your Business

Shows the creator's goal, channel, current focus, constraints, computed observations, and recent import. Creator-supplied and computed data are visibly separated. Facts may be edited; computed signals may be inspected but not rewritten as user claims.

### History

Shows chronological genuine persisted decisions with date, verdict, short title, reason, and evidence indicator. Selecting an item loads its exact run-bound decision. Simulated history is excluded.

Creator-facing navigation labels become Today, Your Business, and History. The underlying durable Memory architecture remains intact.

## Onboarding

Onboarding remains three short steps:

1. primary goal and optional target/date;
2. working constraints and preferences;
3. YouTube Studio CSV upload, explained as real performance context for attention decisions.

No connection status is shown without a real connection.

## Acceptance criteria

The slice is accepted only when a creator supplies a real goal, real constraints, and a real YouTube Studio export; GreenRoom computes at least one sufficiently supported signal; retrieves a relevant real YouTube first-party update; submits the bounded context to verified Udophia; persists a grounded V2 decision; and reloads that exact decision without substitution.

The acceptance artifact must show the normalized rows, calculation proof, selected context, external source, decision provenance, and uncertainty without exposing secrets or unrelated private analytics.

## Non-goals and prohibited claims

The first slice does not include OAuth, continuous monitoring, internet-wide coverage, automatic revenue intelligence, sponsorship eligibility, competitor intelligence, predictive growth, causal analytics, or autonomous action. It must not fabricate missing analytics, creator facts, counts, decisions, or connections.

## Success measures for the slice

- Import success/error rate by supported export shape.
- Percentage of imports producing at least one sufficient signal.
- Percentage of V2 decisions containing both internal and external evidence references.
- Exact-run persistence success rate.
- Creator assessment of whether the internal/external connection changed what they would do next.

These are measurement proposals, not validated outcomes.

