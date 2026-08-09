# Greenroom — Persistent Multi-Mind Creator Engine

> Built on Google Antigravity & the **Official Minds SDK** for the **Creative Minds Jam** Hackathon.

**Greenroom** is an always-on multi-agent creator staff built using the official `minds-sdk` framework. Instead of acting as another context-less chatbot wrapper or static SaaS analytics dashboard, Greenroom creates an autonomous digital staff that accumulates long-term knowledge regarding a creator’s identity, audience behavior, performance benchmarks, and commercial goals.

---

## 🌟 Architecture & Minds SDK Integration Breakdown

### Official Minds APIs Used:
- **Client & Remote Mind Invocation:** Uses `minds-sdk` (`from minds.client import Minds` / `from minds_sdk import Client`) initializing `Minds(api_key=..., base_url=...)`.
- **Remote Completion API:** Executes actual agent completions via `client.minds.completion(mind=..., prompt=...)` or `client.completion(mind=..., prompt=...)`.
- **Remote Mind Identifiers:** Binds topology to platform Mind IDs: `greenroom-core-mind`, `scout-mind-v1`, `community-mind-v1`, and `business-mind-v1`.

### Local Engine & Persistent Profile Components:
- **Creator Profile & Memory Engine (`creator_profile.json`):** Manages local long-term knowledge, context relevance scoring with a 720-hour recency decay window, and learned preference persistence.
- **Inter-Mind Protocol (IMP v1.0):** Asynchronous JSON event bus streaming inter-agent events over WebSockets.
- **Visual Agentic Command Center:** FastAPI dashboard providing an operational window into agent thought streams and state transitions.

---

## 🛑 Strict Mode Execution Rules

* **Production Mode Strictness (`DEMO_MODE=false`):** If `MINDS_API_KEY` is missing or a remote API error occurs, Greenroom raises a `MindsConfigurationError` or `MindsExecutionError`. It **never** silently falls back to local simulation in production.
* **Explicit Mock Mode (`DEMO_MODE=true`):** Local simulated execution is strictly isolated behind `DEMO_MODE=true`. When active, every output payload, execution log, and status endpoint is visibly labeled with `[MOCK DEMO MODE]`.
* **Dynamic Production Metrics:** In production mode, all trend fit scores, sentiment scores, and sponsor deal valuations are computed dynamically from actual input text, keyword boundary rules, or remote Mind completions (static numbers exist strictly in explicit `DEMO_MODE` mock fixtures).

---

## 🤖 The Multi-Mind Staff Topology

Greenroom divides complex creator operations across four specialized stateful agents:

1. **Greenroom Core Mind (`GreenroomCore`):** Chief of Staff & Strategic Router Engine managing memory aggregation and agent orchestration (`remote_mind_id: greenroom-core-mind`).
2. **Scout Mind (`ScoutMind`):** Trend & Niche Signal Researcher executing the `search_trends` skill (`remote_mind_id: scout-mind-v1`).
3. **Community Mind (`CommunityMind`):** Audience Intelligence Analyst executing the `analyze_comments` skill (`remote_mind_id: community-mind-v1`).
4. **Business Mind (`BusinessMind`):** Monetization & Sponsorship Strategist executing the `score_deal` skill (`remote_mind_id: business-mind-v1`).

---

## 🛠️ Tech Stack & System Components

* **Orchestration & IDE:** Google Antigravity
* **Agent Framework:** Official `minds-sdk` (Remote Minds API Client)
* **Backend Framework:** Python 3.10+, FastAPI, Uvicorn, Pydantic, `python-dotenv`
* **Minds Integration & Persistence:** `minds_integration.py`, `memory_engine.py` (`creator_profile.json`)
* **Protocols & Prompts:** `imp_protocol.py`, `agent_prompts.py`
* **Demo Orchestration & Testing:** `demo_runner.py`, `test_greenroom.py`
* **Frontend UI:** HTML5, Tailwind CSS, JavaScript (WebSockets)

---

## 🔐 Environment Configuration

Create a `.env` file in the root directory:

```env
# Remote Minds API Credentials
MINDS_API_KEY=your_minds_api_key_here
MINDS_BASE_URL=https://api.minds.ai

# Explicit Local Demo Mock Flag (Optional, set to true for offline testing without API key)
DEMO_MODE=false
```

> **Note on Loud Failure:** If `MINDS_API_KEY` is not provided and `DEMO_MODE` is `false` or unset, Greenroom will raise a `MindsConfigurationError` on startup/execution to prevent unannounced mock fallback.

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
```

### 3. Run System Test Suite
```bash
python test_greenroom.py
```

### 4. Launch Local Command Center
```bash
python server.py
```

Open your browser and navigate to:
* **Visual Command Center:** `http://127.0.0.1:8000`
* **Minds Status Endpoint:** `http://127.0.0.1:8000/api/minds/status`

---

## 🎬 5-Minute Demo Flow

1. **Minute 1 — Zero-State Profile Ingestion:** Core Mind ingests initial creator script analytics and retention metrics into persistent profile state.
2. **Minute 2 — Autonomous Trend Filtering (`ScoutMind`):** Scout Mind executes `search_trends` to filter high-signal niche opportunities against creator boundaries.
3. **Minute 3 — Deep Audience Sentiment Analysis (`CommunityMind`):** Community Mind executes `analyze_comments` to evaluate audience retention drivers and code setup requests.
4. **Minute 4 — Sponsorship Fit & Automated Pitch Generation (`BusinessMind`):** Business Mind executes `score_deal` to evaluate brand match score and generate targeted pitch proposals.
5. **Minute 5 — Autonomous Feedback Loop & Memory Consolidation ("The Magic Moment"):** System processes user feedback (*"Too formal, keep it punchy"*), syncing learned voice rules to remote Minds agent completions and `creator_profile.json`.
