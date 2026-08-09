# Greenroom — Persistent Multi-Mind Creator Engine

> Built on Google Antigravity & the **Official Minds SDK** for the **Creative Minds Jam** Hackathon.

**Greenroom** is an always-on multi-agent creator staff built using the official `minds-sdk` framework. Instead of acting as another context-less chatbot wrapper or static SaaS analytics dashboard, Greenroom creates an autonomous digital staff that accumulates long-term knowledge regarding a creator’s identity, audience behavior, performance benchmarks, and commercial goals.

---

## 🌟 Architecture & Minds SDK Remote Integration

* **Official Remote Minds SDK Client (`minds_integration.py`):** Connects to the remote Minds platform via `minds-sdk` (`MindsClient`), instantiating four specialized remote Minds agents (`GreenroomCore`, `ScoutMind`, `CommunityMind`, `BusinessMind`).
* **Loud Failure by Default:** If `MINDS_API_KEY` is missing from your environment and `DEMO_MODE` is not explicitly set to `true`, the platform fails loudly with a `MindsConfigurationError`.
* **Explicit Mock Mode (`DEMO_MODE=true`):** Local simulated execution is strictly isolated behind `DEMO_MODE=true`. When active, execution outputs, logs, and status endpoints are visibly labeled with `[MOCK DEMO MODE]`.
* **Persistent Creator Knowledge Sync:** Creator profile history and Minute 5 learned voice rules (*"Too formal, keep it punchy"*) are synced between remote Minds completions and the local profile store (`creator_profile.json`).
* **Inter-Mind Protocol (IMP v1.0):** Asynchronous JSON event bus streaming real-time agent communications over WebSockets directly to the visual command center.

---

## 🤖 The Multi-Mind Staff Topology

Greenroom divides complex creator operations across four specialized stateful agents:

1. **Greenroom Core Mind (`GreenroomCore`):** Chief of Staff & Strategic Router Engine managing memory aggregation and agent orchestration.
2. **Scout Mind (`ScoutMind`):** Trend & Niche Signal Researcher executing the `search_trends` skill.
3. **Community Mind (`CommunityMind`):** Audience Intelligence Analyst executing the `analyze_comments` skill.
4. **Business Mind (`BusinessMind`):** Monetization & Sponsorship Strategist executing the `score_deal` skill.

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
