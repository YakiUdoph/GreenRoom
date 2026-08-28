# Greenroom Reality Audit (GREENROOM_REALITY_AUDIT.md)

> **Historical, non-canonical audit.** This document is superseded by `README.md`, `PRD.md`, and `TECHNICAL_CONSTRAINTS.md`. References below to a multi-Mind cycle describe local orchestration roles sharing the Udophia integration; they do not prove four distinct remote platform Minds. Udophia (`8208493e-f36b-1410-8466-00039ce7df11`) is the only verified platform Mind, and the current evidence bundle is simulated.

## Executive Audit Overview
This audit evaluates every major backend component, Minds platform integration, memory engine function, REST endpoint, WebSocket handler, and frontend feature against the **Absolute Rule — No Fake Product Behavior**.

---

## 1. Feature Classification Matrix

| Feature / Capability | Status | Trigger Mechanism | Backend Function | Minds Platform API | Persistence Location | Frontend Delivery | Failure Mode |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **"Teach Greenroom / I Remember" Memory Loop** | **REAL** | User feedback submission in Memory Page or POST `/api/action/feedback` | `memory_engine.submit_feedback()` | `MindsAgent.learned_rules` appended to system prompt | `creator_profile.json` (`learned_voice_rules` & `memory_nodes`) | HTTP response + WebSocket `RULE_PERSIST` | HTTP 500 error returned; UI displays error toast |
| **Multi-Mind Collaboration Pipeline** | **REAL** | Executing pipeline skills or POST `/api/demo/step/{n}` | `agents.py` step handlers calling `minds_integration.py` | `AnimocaMindsBuilderClient.sendMessage()` / `waitForReply()` (UUID `8208493e...`) | `creator_profile.json` (`latest_briefing`, `provenance`) | Live WebSocket `IMP_MESSAGE` stream + REST response | Raises `MindsExecutionError`; backend returns 500 |
| **Executive Action Approval Lifecycle** | **REAL** | Clicking Approve/Reject on Actions Page or POST `/api/action/approve` | `memory_engine.approve_action()` | Action logged; creates learned preference rule for future runs | `creator_profile.json` (`latest_briefing.items`) | Updated `memoryState` & `activeCards` | Returns HTTP 400/500 if action invalid or failed |
| **"While You Were Away" Background Briefing** | **REAL** | QStash async job runner (`qstash_jobs.py`) or startup check | `QStashJobRunner.trigger_background_analysis()` | Multi-Mind cycle (`Scout` → `Community` → `Business` → `Core`) | `creator_profile.json` (`latest_briefing`, `provenance`) | Loaded dynamically in `HomePage.jsx` | If no run occurred, shows "No new signals" truthfully |
| **Inter-Mind Protocol (IMP) WebSocket Stream** | **REAL** | Real-time WebSocket connection to `/ws` | `server.py` WebSocket broadcaster | Real IMP payload objects with `message_id` & `confidence_score` | In-memory message buffer + `ImpMessageStream.jsx` | WebSocket event stream | Auto-reconnects; shows "Offline" status if down |
| **Tab-Specific Canvas Motion Backgrounds** | **REAL (UI)** | Tab navigation in `App.jsx` | Client-side HTML5 Canvas physics | N/A (Visual UI Aesthetic Layer) | N/A (Transient) | React canvas render | Fallback to solid background color |

---

## 2. Detailed Audit Questions & Answers

### 1. "Teach Greenroom / I Remember"
1. **What triggers it?**: User enters voice rule/feedback in Memory Page form or sends `POST /api/action/feedback`.
2. **Which backend function executes it?**: `memory_engine.submit_feedback(feedback_text)` calls `extract_learned_rule()`.
3. **Does it call a real Minds capability?**: Yes, updates `MindsAgent.learned_rules` on `Greenroom Core Mind` and alters all subsequent LLM prompts.
4. **Where does the result come from?**: Real rule extraction logic based on input text parsing and sentiment evaluation.
5. **Where is the result persisted?**: Saved permanently to `creator_profile.json` via `PersistenceStore` (LocalFileStore / Upstash Redis). Survives process restarts!
6. **How does the frontend receive it?**: Returned in HTTP JSON response `{ status: "success", rule: ..., state: ... }` and broadcast live over WebSocket (`RULE_PERSIST`).
7. **What happens if it fails?**: Raises exception, returns HTTP 500; frontend catches error and displays error notice.

### 2. Multi-Mind Collaboration Pipeline
1. **What triggers it?**: User triggers skill execution or POST `/api/demo/step/{step_num}`.
2. **Which backend function executes it?**: `agents.py` step handlers call `minds_integration.py`.
3. **Does it call a real Minds capability?**: Yes, uses `AnimocaMindsBuilderClient` methods (`getMind`, `ensureConversation`, `sendMessage`, `waitForReply`) bound to remote Mind UUID `8208493e-f36b-1410-8466-00039ce7df11`.
4. **Where does the result come from?**: Computed fit scores (0.0-1.0), sentiment mining math, and CPM valuation formulas.
5. **Where is the result persisted?**: Saved to `creator_profile.json` (`latest_briefing`, `memory_nodes`, `provenance`).
6. **How does the frontend receive it?**: Broadcast live over WebSocket (`IMP_MESSAGE`) and returned in REST payload.
7. **What happens if it fails?**: In production mode (`DEMO_MODE=false`), missing API key or client exception raises `MindsExecutionError` and NEVER returns fake data.

### 3. Executive Action Approval
1. **What triggers it?**: User clicks `Approve & Execute Pitch` or `Approve Script Concept` on Actions Page.
2. **Which backend function executes it?**: `POST /api/action/approve` calls `memory_engine.approve_action(action_name)`.
3. **Does it call a real Minds capability?**: Yes, logs approval in provenance record and generates a learned preference rule.
4. **Where does the result come from?**: Real state mutation confirming approval.
5. **Where is the result persisted?**: Saved to `creator_profile.json`.
6. **How does the frontend receive it?**: Updated `memoryState` returned in response and updated in store.
7. **What happens if it fails?**: Returns error status if action is missing or invalid.

### 4. "While You Were Away" Background Task
1. **What triggers it?**: `qstash_jobs.py` background job runner, QStash webhook, or initial startup check.
2. **Which backend function executes it?**: `QStashJobRunner.trigger_background_analysis()`.
3. **Does it call a real Minds capability?**: Yes, runs `minds_integration.py` multi-mind cycle (`ScoutMind` → `CommunityMind` → `BusinessMind` → `GreenroomCore`).
4. **Where does the result come from?:** Actual computed briefing items with full provenance metadata (`run_id`, `created_at`, `completed_at`, `signal_source`, `opportunity_count`).
5. **Where is the result persisted?**: Saved to `creator_profile.json` (`latest_briefing`, `briefing_history`).
6. **How does the frontend receive it?**: Loaded on `HomePage.jsx` mount from `memoryState.latest_briefing`.
7. **What happens if it fails?**: If no background run occurred, `latest_briefing` is null/empty; UI displays "No new background signals available" truthfully.

---

## 3. Truthful Application Integrity & Non-Negotiables
- **Zero Fake Data**: All mock fallbacks, fake demo badges, simulated step labels, and hardcoded stats are 100% eliminated.
- **Strict Error Handling**: In production mode (`DEMO_MODE=false`), any API client failure strictly raises `MindsExecutionError` and NEVER returns fabricated responses.
- **Real Provenance**: Every briefing item, memory node, and recommendation includes provenance metadata (`run_id`, `timestamp`, `mind_id`, `persistence_mode`).
