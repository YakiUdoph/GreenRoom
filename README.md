# Greenroom — Autonomous Persistent Creator Engine

> **GREENROOM WORKS WHILE YOU WORK.**  
> **GREENROOM REMEMBERS WHY.**

Greenroom is an autonomous, persistent creator intelligence engine built on the official Animoca Brands Minds Builder API (`@animocabrands/minds-client-lib`). Designed for solo content creators, Greenroom operates asynchronously in the background to monitor audience retention signals, filter market trends, evaluate brand sponsorship matches, and maintain long-term creator voice rules.

Live Deployment: [greenroom-ruby.vercel.app](https://greenroom-ruby.vercel.app)

---

## Architecture & Operational Model

Greenroom operates as an asynchronous background intelligence layer rather than a synchronous conversational chatbot:

1. **Solo Creator Problem**: Individual creators often miss high-value sponsorship opportunities and trend alignment because continuous audience and market monitoring is time-prohibitive while producing content.
2. **Asynchronous Engine**: Greenroom runs background intelligence cycles without requiring open browser sessions or active chat prompts.
3. **Execution Workflow**: Job execution requests are enqueued via **Upstash QStash**, executed by the multi-agent system via the official Animoca Minds API, persisted to **Upstash Redis**, and delivered as a structured executive briefing upon creator return.

---

## Production System Architecture

```text
Solo Creator (Offline / Content Production)
  |
POST /api/briefing/trigger  --->  Returns status: "QUEUED" (run_id: run_abc123)
  |
Upstash QStash Queue (Serverless Background Job Dispatch)
  |
POST /api/briefing/worker   --->  Webhook with Upstash Signature Verification
  |
Greenroom Core Mind + Specialist Agents (Scout, Community, Business)
  |
Official Animoca Brands Mind Builder API (@animocabrands/minds-client-lib)
  |
Upstash Redis (DURABLE PersistenceStore)
  |
Creator Dashboard  --->  GET /api/briefing/latest  --->  Ranked "While You Were Away" Briefing
```

---

## Official Animoca Minds Builder API Integration

Greenroom integrates directly with the Animoca Brands Minds Builder platform:

- **Mind UUID**: `8208493e-f36b-1410-8466-00039ce7df11`
- **Mind Email**: `udophia@hellominds.ai`
- **Mind Wallet**: `0xB675Ec9857776678aE540cF3248d898f015987Cb`
- **API Endpoint**: `https://api.build.hellominds.ai`
- **Client Library**: `@animocabrands/minds-client-lib` via Node bridge (`minds_bridge.mjs`).
- **Strict Verification (`verify_real_mind`)**: Validates API response attributes against platform records.
- **Messaging Flow**: Uses official client library lifecycle: `ensureConversation` -> `getLatestHistoryFingerprint` -> `sendMessage` -> `waitForReply`.

---

## Multi-Mind Topology & Inter-Agent Communication

Greenroom uses an Inter-Mind Messaging Protocol (IMP v1.0) to coordinate autonomous agent roles:

1. **Greenroom Core Mind (`GreenroomCore`)**: Chief of Staff and central orchestrator managing memory aggregation, briefing synthesis, and Animoca Mind interactions (`remote_mind_id: 8208493e-f36b-1410-8466-00039ce7df11`).
2. **Scout Mind (`ScoutMind`)**: Market researcher executing trend analysis and filtering signal from noise against creator preferences.
3. **Community Mind (`CommunityMind`)**: Audience intelligence analyst processing comment sentiment, retention drop-offs, and community requests.
4. **Business Mind (`BusinessMind`)**: Commercial strategist scoring brand sponsorship opportunities against target CPM benchmarks ($45/CPM default).
5. **Signal Abstraction**: Clean `SignalProvider` interface with `DemoSignalProvider` (for isolated offline evaluation with explicit `is_demo: True` attributes) and `RealSignalProvider`.

---

## Persistence & Long-Term Creator Memory

- **PersistenceStore Abstraction (`persistence.py`)**:
  - **`DURABLE`**: Activated when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (or Vercel KV) are present.
  - **`EPHEMERAL`**: Fallback for stateless serverless `/tmp` environments.
  - **`LOCAL FILE`**: Active during local execution (`creator_profile.json`, `latest_briefing.json`).
- **Briefing Provenance**: Tracks `run_id`, `created_at`, `completed_at`, `status`, `signal_source`, `analysis_provider`, `mind_id`, `mind_verified`, `persistence_mode`, and `execution_mode`.
- **Multi-Run Memory Continuity**: Creator feedback automatically updates long-term memory. When a creator approves or rejects recommendations, constraint rules are extracted and persisted to adapt all subsequent analysis runs.

---

## Production Strictness & Environment Modes

- **Production Mode (`DEMO_MODE=false`)**: Requires a valid `MINDS_BUILDER_API_KEY`. If credentials are missing or API operations fail, Greenroom raises `MindsConfigurationError` or `MindsExecutionError`. Production mode never falls back to mock simulation.
- **Explicit Mock Mode (`DEMO_MODE=true`)**: Reserved for offline development without API credentials. Every mock output and UI indicator is explicitly tagged (`[MOCK DEMO MODE]`).
- **Data Provenance Integrity**: Demo data sources are explicitly identified in both backend API outputs and frontend interfaces.

---

## Environment Configuration

Create a `.env` file in the project root:

```env
# Official Animoca Brands Minds Builder API Credentials
MINDS_BUILDER_API_KEY=your_builder_api_key_here

# Upstash Redis / Vercel KV for DURABLE Persistence
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Upstash QStash for Background Job Queueing
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=your_qstash_current_signing_key
QSTASH_NEXT_SIGNING_KEY=your_qstash_next_signing_key

# Optional Offline Mock Mode (set to true for offline testing without API credentials)
DEMO_MODE=false
```

---

## Installation & Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/YakiUdoph/GreenRoom.git
cd GreenRoom
```

### 2. Install Dependencies
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd frontend && npm install && cd ..
```

### 3. Run Verification Test Suite (32 Python + 5 Node Tests)
```bash
python test_greenroom.py
```

### 4. Launch Application Server
```bash
python server.py
```

Access the local dashboard at `http://127.0.0.1:8000`.

---

## System Workflow & Verification

1. **Dashboard Initialization**: Access `http://127.0.0.1:8000` to inspect initial creator memory rules ($45 CPM target, content constraints).
2. **Creator Objective Creation**: Set an objective (e.g. *"Find a content opportunity for my beginner AI developer audience this week"*), automatically paired with stored memory context.
3. **Background Execution**: Trigger background work to coordinate specialist Minds asynchronously via QStash.
4. **Briefing Inspection**: Review the generated **"While You Were Away"** briefing on the home dashboard, featuring multi-mind findings and evidence grounding.
5. **Reject & Teach**: Submit feedback (e.g. *"Too clickbait. That's not how I want to grow."*) to extract persistent constraint rules, update decision history, and verify that future recommendations automatically filter non-compliant topics.
