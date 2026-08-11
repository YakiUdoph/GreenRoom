# Greenroom — Persistent Creator-Growth Mind 🟢

> **Greenroom** is an autonomous, persistent creator-growth Mind built on the official **Animoca Brands Minds Builder API** (`@animocabrands/minds-client-lib`).

Live Deployment: [greenroom-ruby.vercel.app](https://greenroom-ruby.vercel.app)

---

## 🎯 Hackathon Positioning & Framework Alignment

Greenroom was built strictly around the 5 core judging principles of the **Creative Minds Jam**:

1. **One User:** Solo creators who publish regularly without a dedicated growth or partnerships team.
2. **One Problem:** Solo creators lose high-value growth and sponsorship opportunities because they cannot continuously monitor audience trends and community signals while creating content or offline.
3. **One Job:** Greenroom continuously monitors audience signals, remembers creator strategy & boundaries, ranks top opportunities, and delivers a **"While You Were Away" briefing**.
4. **"Async is the product":** Greenroom works while nobody is watching. It does not require active chat typing or open browser tabs.
5. **Why it's not a chatbot:** A chatbot only operates when a user types at it in a live session. Greenroom enqueues jobs via **Upstash QStash**, executes background analysis via official Animoca Minds API calls, persists results durably to **Upstash Redis**, and presents a completed, ranked briefing upon creator return.

---

## 🏗️ Production System Architecture

```text
Solo Creator (Offline / Creating)
  ↓
POST /api/briefing/trigger  --->  Returns status: "QUEUED" (run_id: run_abc123) Immediately!
  ↓
Upstash QStash Queue (Serverless Background Job Dispatch)
  ↓
POST /api/briefing/worker   --->  Webhook with Upstash Signature Verification
  ↓
Greenroom Core Mind + Specialist Agents (Scout, Community, Business)
  ↓
Official Animoca Brands Mind Builder API (@animocabrands/minds-client-lib)
  ↓
Upstash Redis (DURABLE PersistenceStore)
  ↓
Creator Returns  --->  GET /api/briefing/latest  --->  Ranked "While You Were Away" Briefing
```

---

## 🔒 Official Animoca Minds Builder API Integration

- **Mind UUID:** `8208493e-f36b-1410-8466-00039ce7df11`
- **Mind Email:** `udophia@hellominds.ai`
- **Mind Wallet:** `0xB675Ec9857776678aE540cF3248d898f015987Cb`
- **API Endpoint:** `https://api.build.hellominds.ai`
- **Client Library:** `@animocabrands/minds-client-lib` via Node bridge (`minds_bridge.mjs`).
- **Strict Verification (`verify_real_mind`):** Requires the API response itself to match platform fields.
- **Documented Conversation Flow:** Production messaging uses `@animocabrands/minds-client-lib`: `ensureConversation` -> `getLatestHistoryFingerprint` -> `sendMessage` -> `waitForReply({ afterFingerprint, sentMessageText })`.

---

## 🤖 Greenroom Topology & Signal Abstraction

1. **Greenroom Core Mind (`GreenroomCore`):** Chief of Staff & Strategic Router Engine managing memory aggregation, briefing synthesis, and Animoca Mind orchestration (`remote_mind_id: 8208493e-f36b-1410-8466-00039ce7df11`).
2. **Scout Mind (`ScoutMind`):** Local Trend & Niche Signal Researcher executing signal vs noise filtering against creator rules.
3. **Community Mind (`CommunityMind`):** Local Audience Intelligence Analyst evaluating comment sentiment and retention drivers.
4. **Business Mind (`BusinessMind`):** Local Monetization & Partnership Strategist scoring brand sponsorship match against CPM target benchmarks.
5. **SignalProvider Abstraction:** Clean `SignalProvider` base class with `DemoSignalProvider` (returns simulated signals tagged explicitly with `is_demo: True` and `[DEMO DATASET]` UI labels) and `RealSignalProvider` (`STUB / NOT CONFIGURED`).

---

## 🧠 Persistence & Memory Continuity

- **PersistenceStore Abstraction (`persistence.py`):**
  - **`DURABLE`:** Activated when `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` (or Vercel KV) are set.
  - **`EPHEMERAL`:** Fallback for serverless `/tmp` environments without Redis credentials.
  - **`LOCAL FILE`:** Active during local development (`creator_profile.json`, `latest_briefing.json`).
- **Briefing Provenance:** Persists `run_id`, `created_at`, `completed_at`, `status`, `signal_source`, `analysis_provider`, `mind_id`, `mind_verified`, `persistence_mode`, `execution_mode` (`QSTASH_BACKGROUND_JOB`).
- **Multi-Run Continuity:** Creator feedback items persist to memory. When a creator marks recommendations *Useful* or *Dismiss*, subsequent autonomous runs display visual continuity notes (`"Adjusted using your previous feedback..."`).

---

## 🛑 Demo Mode vs Production Strictness

* **Production Mode (`DEMO_MODE=false`):** Requires a valid `MINDS_BUILDER_API_KEY`. If credentials are missing or the Mind API call fails, Greenroom raises `MindsConfigurationError` or `MindsExecutionError`. It **never** silently falls back to local simulation in production mode.
* **Explicit Mock Mode (`DEMO_MODE=true`):** Used for offline development. Every output payload and status badge is visibly labeled with `[MOCK DEMO MODE]`.
* **Truthful Signal Labeling:** Demo signals are explicitly labeled as `Demo Dataset (Simulated)` in both API responses and UI badges.

---

## 🔐 Environment Configuration

Create a `.env` file in the root directory (gitignored):

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

# Explicit Local Demo Mock Flag (Optional, set to true for offline testing without API key)
DEMO_MODE=false
```

---

## 🚀 Quickstart & Local Setup

### 1. Repository Setup
```bash
git clone https://github.com/YakiUdoph/GreenRoom.git
cd GreenRoom
```

### 2. Environment Setup & Dependencies
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
npm install
```

### 3. Run System Test Suite (27 Tests)
```bash
python test_greenroom.py
```

### 4. Launch Command Center
```bash
python server.py
```

---

## 🎬 2-Minute Judge Demo Flow

1. Open `http://127.0.0.1:8000`.
2. View initial creator profile memory ($45 CPM, rejected topics).
3. Click **"Simulate Creator Offline (Async Run)"**.
4. Observe job enqueued with `status: QUEUED` and completed asynchronously via background job.
5. Review the **"While You Were Away" briefing** with 3 ranked opportunity cards, memory grounding badges, and the **Judge Proof Panel**.
6. Refresh the page to verify briefing reload persistence from `PersistenceStore`.
7. Submit feedback (*"Emphasize open-source terminal setup steps"*) and run cycle 2 to observe **Multi-Run Memory Continuity**.
