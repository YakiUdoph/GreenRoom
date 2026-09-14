# GreenRoom V2 Architecture Amendment

## Architectural intent

V2 adds a creator-analytics plane to the passing V1 decision pipeline. It reuses the existing trust boundaries rather than replacing them.

```text
CSV UPLOAD
   ↓ validate and normalize
ANALYTICS IMPORT + NORMALIZED ROWS  (durable, separate namespace)
   ↓ deterministic, versioned calculations
OBSERVED CREATOR SIGNALS            (durable, source-bound)
   ↓ relevant signal selection
OBJECTIVE + EXPLICIT MEMORY + SIGNALS + LIVE EVIDENCE
   ↓ verified Udophia
V2 ATTENTION DECISION
   ↓ exact-run persistence
TODAY / YOUR BUSINESS / HISTORY
```

## Proposed creator-business data model

The data model uses explicit provenance and nullable unavailable fields. Timestamps are ISO 8601 UTC strings. IDs are opaque and stable within GreenRoom.

### CreatorBusinessContext

```json
{
  "schema_version": "creator_business_context_v1",
  "creator_profile": {
    "display_name": "string|null",
    "primary_platform": "YOUTUBE|null",
    "channel_identifier": "string|null",
    "channel_url": "string|null",
    "niche": "string|null",
    "source": "CREATOR_SUPPLIED",
    "updated_at": "timestamp"
  },
  "goals": [{
    "goal_id": "goal_*",
    "title": "string",
    "target_value": "number|null",
    "target_unit": "SUBSCRIBERS|VIEWS|PERCENT|OTHER|null",
    "target_date": "date|null",
    "source": "CREATOR_SUPPLIED",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }],
  "constraints": [{
    "constraint_id": "constraint_*",
    "type": "UPLOAD_FREQUENCY|BUDGET_SENSITIVITY|PLATFORM_FOCUS|BOUNDARY|PREFERENCE",
    "value": "string|number|object",
    "source": "CREATOR_SUPPLIED",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }],
  "latest_analytics_import_id": "import_*|null"
}
```

This structure should be introduced through a migration/adapter from existing profile fields. Legacy values must not automatically become verified creator facts when their origin is an application default.

## Normalized YouTube analytics schema

### AnalyticsImport

```json
{
  "import_id": "import_*",
  "schema_version": "youtube_analytics_import_v1",
  "platform": "YOUTUBE",
  "source_type": "YOUTUBE_STUDIO_CSV",
  "granularity": "CONTENT|DATE",
  "filename": "export.csv",
  "imported_at": "timestamp",
  "content_sha256": "hex",
  "row_count": 42,
  "aggregate_rows_excluded": 1,
  "recognized_columns": [{
    "source_header": "Impressions click-through rate (%)",
    "normalized_field": "impressions_ctr"
  }],
  "unavailable_expected_columns": ["subscribers_lost"],
  "warnings": [],
  "parser_version": "youtube_csv_v1"
}
```

### YouTubeAnalyticsRow

```json
{
  "row_id": "row_*",
  "import_id": "import_*",
  "source_row_number": 2,
  "granularity": "CONTENT|DATE",
  "video_id": "string|null",
  "title": "string|null",
  "published_at": "timestamp|null",
  "observation_date": "date|null",
  "metrics": {
    "views": "integer|null",
    "impressions": "integer|null",
    "impressions_ctr": "decimal_fraction|null",
    "average_view_duration_seconds": "number|null",
    "watch_time_hours": "number|null",
    "subscribers_gained": "integer|null",
    "subscribers_lost": "integer|null",
    "subscribers_net": "integer|null"
  },
  "field_provenance": {
    "subscribers_net": {
      "source": "CSV_COLUMN|DERIVED|UNAVAILABLE",
      "calculation": "subscribers_gained - subscribers_lost|null"
    }
  },
  "warnings": []
}
```

Rules:

- Every metric carries `VALUE`, explicit `ZERO`, or `UNAVAILABLE`; unavailable values are `null` and are never normalized to zero.
- CTR is stored internally as a decimal fraction (`0.052`, not `5.2`) with display conversion at the UI boundary.
- Duration and average view duration are stored in seconds; watch time preserves the export's hours unit. Original header/unit mapping stays in import provenance.
- Net subscribers is normalized only from an explicit supported column in this pass and is unavailable at daily granularity.
- A row requires `video_id` or `title`; aggregate rows such as “Total” must be identified explicitly and excluded from per-video trend calculations unless a future calculation declares them valid.
- The normalized record does not retain unknown CSV columns by default.
- Content type is accepted only from explicit export metadata. Duration is not used to fabricate Shorts/long-form metadata.

### CreatorSignal

```json
{
  "signal_id": "signal_*",
  "schema_version": "creator_signal_v1",
  "type": "VIDEO_CTR_VARIATION|VIDEO_IMPRESSION_VARIATION|VIEW_MOMENTUM|WATCH_TIME_MOMENTUM|AVD_MOMENTUM",
  "direction": "IMPROVING|DECLINING|STABLE|INSUFFICIENT_DATA|null",
  "classification": "IMPROVING|DECLINING|STABLE|ZERO_BASELINE|VARIATION_OBSERVED|NO_OBSERVED_VARIATION|INSUFFICIENT_DATA",
  "period": {
    "basis": "EXPLICIT_COMPLETE_CALENDAR_DAYS|ELIGIBLE_CONTENT_OBSERVATIONS",
    "current": {"from": "timestamp|null", "to": "timestamp|null", "observation_count": 3},
    "comparison": {"from": "timestamp|null", "to": "timestamp|null", "observation_count": 3}
  },
  "current_value": "number|null",
  "comparison_value": "number|null",
  "absolute_delta": "number|null",
  "percentage_delta": "number|null",
  "unit": "DECIMAL_FRACTION|COUNT|SECONDS|RATIO",
  "calculation": {
    "method": "string",
    "version": "creator_signal_thresholds_v1",
    "threshold": "number|null",
    "minimum_observations": 3
  },
  "supporting_observations": [{"row_id": "row_*", "field": "impressions_ctr"}],
  "data_sufficiency": "SUFFICIENT|INSUFFICIENT",
  "confidence": "BOUNDED|LOW",
  "source_import_id": "import_*",
  "generated_at": "timestamp"
}
```

`confidence` describes data sufficiency under the declared calculation, not statistical or causal confidence.

## Persistence design

Analytics must not be embedded into `greenroom:creator_profile`, `memory_nodes`, external evidence snapshots, or briefing prose as the source of truth.

Proposed durable Redis keys:

```text
greenroom:creator_business_context
greenroom:analytics_import:{import_id}
greenroom:analytics_rows:{import_id}
greenroom:creator_signals:{import_id}
greenroom:analytics_import_index
```

V2 run status adds an immutable `creator_context_snapshot` containing only selected goal/constraint IDs and selected signal snapshots. V2 briefing provenance adds `analytics_import_id`, `analytics_content_sha256`, selected signal IDs, signal-calculation versions, and supporting row references. The complete analytics dataset is not copied into each run.

Write order for an import:

1. parse and validate entirely before durable mutation;
2. persist import metadata and normalized rows under a new immutable import ID;
3. compute and persist signals for that import;
4. update the import index and latest pointer last;
5. never overwrite a prior import in place.

Partial writes must not become the active import. Re-importing identical bytes should be idempotent by content hash.

## Import boundary

Recommended new modules:

- `youtube_analytics.py`: header registry, parsing, normalization, validation, and import provenance;
- `creator_signals.py`: pure deterministic signal calculations;
- persistence methods for immutable import/row/signal records and an import index;
- FastAPI endpoints for CSV upload, latest import summary, and creator-business context.

The importer should use Python's standard `csv` module initially. It avoids a large dependency and supports quoted fields safely. Upload handling may require `python-multipart`; confirm whether Vercel's Python build supports it before choosing multipart over a raw `text/csv` request body.

## Locked signal formulas and thresholds

Signal engine V1 uses two equal, non-overlapping 14-day windows for date-granularity momentum. The current window ends on the newest explicit observation date that is also a complete day (no later than yesterday); the previous window is the immediately preceding 14 calendar days. All 28 dates must have explicit rows. An absent row is missing coverage, while a present numeric zero is real zero activity.

Future-dated rows never anchor a window. If no explicit observation exists on or before yesterday, momentum is `INSUFFICIENT_DATA`.

For `VIEW_MOMENTUM` and `WATCH_TIME_MOMENTUM`, each window value is the sum of its daily values. For `AVD_MOMENTUM`, each window value is:

```text
sum(daily_average_view_duration_seconds × daily_views)
────────────────────────────────────────────────────────
                    sum(daily_views)
```

Daily AVD is never arithmetic-averaged. A zero view denominator is insufficient data.

When the previous value is nonzero, percentage change is `(current - previous) / previous`. `>= +20%` is `IMPROVING`, `<= -20%` is `DECLINING`, and the interior is `STABLE`. These are product thresholds under `creator_signal_thresholds_v1`, not statistical-significance claims. When the previous value is zero, percentage change and directional classification are withheld using `ZERO_BASELINE`; the absolute difference and explanation remain available.

`VIDEO_CTR_VARIATION` and `VIDEO_IMPRESSION_VARIATION` calculate range and median across eligible content observations. They have no trend direction. V1 includes only groups with an explicit CSV content type and at least two observations; untyped videos are excluded rather than classified from duration. The signal says only whether observed values vary and never treats impressions as an isolated quality verdict.

## V2 decision mechanism

`api/v2-decision.mjs` is the bounded Slice 2 contract. Creator-stated facts, selected Memory, observed analytics, and external evidence remain separately labeled evidence classes through prompt construction and persistence. Creator context fields carry `CREATOR_SUPPLIED`, `MEMORY`, or `OBSERVED_ANALYTICS` provenance; the required platform and goal are creator-supplied in this slice.

Signal selection is deterministic under `objective_evidence_signal_selection_v1`. It selects only sufficient signals whose declared metric domain overlaps the explicit goal, constraints, or verified evidence, records available/selected/omitted IDs, and never maps profile data to an attention verdict. Raw CSV and supporting analytics rows are not accepted by the prompt builder.

The verified Mind response has exactly six sections: `ATTENTION`, `WHAT I NOTICED`, `WHY THIS MATTERS TO YOU`, `WHAT I'D DO NEXT`, `CONNECTION`, and `UNCERTAINTY`. `CONNECTION` is `SUPPORTED`, `POSSIBLE`, or `NONE` and never asserts causation. Personalization is proven with validated `[REF:...]` references to supplied goals, constraints, selected signals, or selected Memory; generic prose without valid provenance is rejected before persistence.

The V2 run fingerprint binds the context version and field values, analytics import hash, selected signal IDs and calculation versions, selected Memory provenance, external evidence fingerprint/provider, verified Udophia identity, and decision-contract version. Finalization writes only a fully validated run-specific record at `greenroom:v2_decision:{run_id}`. Invalid Mind output creates no decision record and receives no deterministic prose fallback.

## Existing modules to reuse

| Existing file/module | Reuse in V2 |
|---|---|
| `persistence.py` | Extend the `PersistenceStore` contract and implement local/ephemeral/Upstash analytics namespaces. Preserve durable mode labeling. |
| `memory_engine.py` | Reuse durable creator profile, objectives, explicit preferences, and feedback. Add an adapter to the new creator-business model; do not treat legacy defaults as imported analytics. |
| `server.py` | Add bounded import/context endpoints and extend immutable run snapshot assembly. Reuse request validation and exact-run retrieval. |
| `async_runner.py` | Reuse QStash enqueueing, immutable snapshot binding, recent-run index, and terminal lifecycle. |
| `api/live-evidence.mjs` | Reuse the bounded `PLATFORM_CHANGES` / `YOUTUBE_OFFICIAL_BLOG` provider and its freshness/relevance provenance. Do not broaden coverage. |
| `api/worker-guards.mjs` | Reuse objective validation, Mind identity verification, reply selection, strict schema guards, and relevant Memory selection. Extend selection with bounded, precomputed creator signals. |
| `api/briefing-worker.mjs` | Reuse signature checks, idempotent claim, verified Udophia submission, SSE/history collection, failure handling, and exact-run persistence. Extend prompt and briefing contracts; never send raw CSV. |
| `frontend/src/lib/offlineRun.js` | Reuse exact run/objective delivery checks and pending-state semantics; extend fingerprint verification to include the V2 context snapshot. |
| `frontend/src/lib/briefingHistory.js` | Reuse genuine completed-run filtering, chronological ordering, verdict labels, and historical binding verification. |
| `frontend/src/stores/greenroomStore.js` | Reuse the small subscription store; add creator-business/import state without making it an authority. |
| `frontend/src/lib/api.js` | Add import and creator-business endpoints while retaining the existing request/error contract. File upload needs a request path that does not force JSON content type. |
| `frontend/src/pages/HomePage.jsx` | Evolve into Today only after the data and decision contracts exist. Preserve truthful empty/working/failure states. |
| `frontend/src/pages/MemoryPage.jsx` | Evolve into Your Business with explicit creator-supplied versus observed sections. |
| `frontend/src/pages/IntelligencePage.jsx` | Evolve into History using existing exact-run loading and proof UI. |
| `frontend/src/components/onboarding/CreatorOnboardingModal.jsx` | Replace the long legacy form with the three-step goal/constraints/import flow after backend import support exists. |

## V2 worker input and output

The worker receives a run snapshot that identifies the selected analytics import and contains a bounded set of immutable CreatorSignal snapshots. It revalidates the objective fingerprint and context fingerprint before submission.

The Udophia prompt contains compact, labeled sections:

```text
CREATOR OBJECTIVE
CREATOR-SUPPLIED CONSTRAINTS
OBSERVED CREATOR SIGNALS
VERIFIED EXTERNAL EVIDENCE
KNOWN UNCERTAINTY
```

Each observed signal includes its direction, values, period, sufficiency, calculation version, and signal ID. The prompt states that observations are correlations/context, not causes.

The reply parser should require the V2 sections and the existing verdict enum. Persisting a V2 briefing requires valid internal evidence references and external source references. There is no local generated-decision fallback.

## Security and privacy

- Treat analytics as private creator business data even when channel metrics are publicly observable.
- Never log raw CSV, normalized row payloads, channel identifiers, or prompt bodies.
- Enforce content type, byte limit, row limit, CSV structure, numeric bounds, and formula-prefix handling.
- Sanitize filenames to metadata only; never use them as filesystem or Redis paths.
- Hash bytes for idempotency without exposing file contents.
- Store secrets only in environment configuration; analytics never enter environment variables.
- Keep raw analytics out of external evidence and public source metadata.
- Send Udophia only the minimum relevant computed signals, not the full dataset.
- Define retention/deletion behavior before accepting beta data. Deletion must be explicit and must not silently rewrite historical decision provenance.
- A single-user persistence namespace is acceptable only for the current controlled demo. Multi-user use requires authenticated tenant isolation before launch.
- CSV spreadsheet formulas are not executed; exported or displayed cells beginning with formula control characters must be escaped.

## Blockers and unknowns

1. **Real export variants:** obtain redacted, genuine YouTube Studio CSV samples for the intended report types and locales. Header names, aggregate rows, decimal separators, date formats, and units must be confirmed rather than guessed.
2. **Trend semantics:** decide whether the killer demo compares videos by publish order/date or daily channel observations. Different YouTube exports imply different valid calculations.
3. **Minimum data policy:** choose and document minimum comparable observations and stability thresholds per metric before labeling trends.
4. **Legacy defaults:** current fallback profiles contain illustrative creator facts. A migration must distinguish verified creator input from defaults so V2 never presents seeded facts as user truth.
5. **Upload transport:** verify multipart support and Vercel request-size/runtime limits; otherwise use a bounded raw `text/csv` endpoint.
6. **Privacy lifecycle:** decide retention, replacement, export, and deletion expectations for creator analytics before real beta use.
7. **Tenant isolation:** current storage uses global Redis keys. Real multi-creator use is blocked until authentication and per-creator key namespaces exist.
8. **Signal-to-event relevance:** define deterministic selection rules that prevent an unrelated performance signal from being included merely because both concern YouTube.
9. **Mind response contract:** validate that the expanded but bounded V2 prompt remains reliable within Udophia's observed latency and strict parsing constraints.
10. **Real acceptance data:** the final proof requires a creator-authorized real CSV and permission to process its analytics. No sample may be fabricated for the claim.

## Smallest implementation sequence

Follow this order without beginning UI redesign early:

1. Obtain and inventory one creator-authorized CSV plus redacted format fixtures; lock report shape, locale, units, limits, and trend semantics.
2. Add importer contract tests, then implement `youtube_analytics.py` as a pure parser/normalizer.
3. Extend persistence with immutable import metadata, normalized rows, signals, and index keys; test local and mocked durable round trips.
4. Add pure signal tests for sufficient, insufficient, missing, zero, malformed, aggregate-row, and chronological-window cases; implement `creator_signals.py`.
5. Add a bounded CSV upload endpoint and import-summary endpoint with safe errors and no raw-data logging.
6. Add creator-business context schema/migration that labels creator-supplied versus legacy/default data.
7. Bind selected import and signal snapshots into the immutable run fingerprint; add cross-run and idempotency tests.
8. Extend the verified Udophia prompt and strict V2 reply parser; test forbidden inventions, uncertainty, identity failure, timeout, and malformed replies without paid calls.
9. Persist V2 decision evidence/provenance and verify refresh against exact run, objective, context, import, and signal identifiers.
10. Build Your Business, then Today, then History using the established backend contracts; rename navigation last.
11. Verify responsive states and accessibility.
12. Run one authorized real-data, real-evidence, verified-Udophia acceptance flow and preserve a redacted proof artifact.

## Recommendation

**CONDITIONAL GO**

The V1 execution and trust foundation is reusable, and the first V2 slice is technically bounded. Implementation should begin only after one genuine YouTube export shape and its valid trend semantics are selected, and creator authorization/privacy handling is agreed. Multi-user release remains blocked on authentication and tenant-isolated persistence, but that does not block a controlled single-creator killer demo.
