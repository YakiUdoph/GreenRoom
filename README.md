# Greenroom — Persistent Creator Engine

> Built on Google Antigravity & the **Official Animoca Brands Minds Builder API** ([build.hellominds.ai](https://build.hellominds.ai)).

**Greenroom** is an always-on multi-agent creator staff built using the official Animoca Brands Minds Builder API. Instead of acting as another context-less chatbot wrapper or static SaaS analytics dashboard, Greenroom creates an autonomous digital staff that accumulates long-term knowledge regarding a creator’s identity, audience behavior, performance benchmarks, and commercial goals.

---

## 🌟 Architecture & Official Minds Builder API Integration

### Real Platform Mind:
- **Platform Mind UUID:** Bound to official platform Mind UUID `8208493e-f36b-1410-8466-00039ce7df11`.
- **Mind Email:** `udophia@hellominds.ai`
- **Mind Wallet:** `0xB675Ec9857776678aE540cF3248d898f015987Cb`
- **Builder API Endpoint:** `https://api.build.hellominds.ai`
- **Authentication:** `MINDS_BUILDER_API_KEY` sent via HTTP header `X-Api-Key`.

### Clear Architecture Separation:
1. **Real Platform Mind (`8208493e-f36b-1410-8466-00039ce7df11`):** The real remote platform Mind created on Animoca Brands Builder, handling strategy completions and remote interactions.
2. **Greenroom Local Specialist Orchestration:** In-process Python specialist agents (`ScoutMind`, `CommunityMind`, `BusinessMind`) that execute domain-specific skills (trend signal filtering, audience sentiment analysis, sponsorship deal scoring) locally before feeding structured context to the Core Mind.
3. **Local Creator Profile Persistence (`creator_profile.json`):** Stores long-term creator memory, voice rules, recency decay scoring, and learned preferences locally.

---

## 🛑 Strict Mode Execution Rules

* **Production Mode Strictness (`DEMO_MODE=false`):** If `MINDS_BUILDER_API_KEY` is missing or a remote API call fails, Greenroom raises a `MindsConfigurationError` or `MindsExecutionError`. It **never** silently falls back to local simulation in production mode.
* **Explicit Mock Mode (`DEMO_MODE=true`):** Local simulated execution is strictly isolated behind `DEMO_MODE=true`. When active, every output payload, execution log, and status endpoint is visibly labeled with `[MOCK DEMO MODE]`.
* **Dynamic Production Metrics:** In production mode, all trend fit scores, sentiment scores, and sponsor deal valuations are computed dynamically from actual input text, keyword boundary rules, or remote Mind completions (static numbers exist strictly in explicit `DEMO_MODE` mock fixtures).

---

## 🤖 Greenroom Staff Topology

1. **Greenroom Core Mind (`GreenroomCore`):** Chief of Staff & Strategic Router Engine managing memory aggregation and agent orchestration (`remote_mind_id: 8208493e-f36b-1410-8466-00039ce7df11`).
2. **Scout Mind (`ScoutMind`):** Local Trend & Niche Signal Researcher executing the `search_trends` skill.
3. **Community Mind (`CommunityMind`):** Local Audience Intelligence Analyst executing the `analyze_comments` skill.
4. **Business Mind (`BusinessMind`):** Local Monetization & Sponsorship Strategist executing the `score_deal` skill.

---

## 🛠️ Tech Stack & System Tools

* **Orchestration & IDE:** Google Antigravity
* **Platform API:** Animoca Brands Minds Builder API (`https://api.build.hellominds.ai`)
* **Official Client Tooling:** `@animocabrands/minds-cli` & `@animocabrands/minds-client-lib`
* **Backend Framework:** Python 3.10+, FastAPI, Uvicorn, Pydantic, `python-dotenv`
* **Minds Integration & Persistence:** `minds_integration.py`, `memory_engine.py` (`creator_profile.json`)
* **Protocols & Prompts:** `imp_protocol.py`, `agent_prompts.py`
* **Demo Orchestration & Testing:** `demo_runner.py`, `test_greenroom.py`
* **Frontend UI:** HTML5, Tailwind CSS, JavaScript (WebSockets)

---

## 🔐 Environment Configuration

Create a `.env` file in the root directory (gitignored):

```env
# Official Animoca Brands Minds Builder API Credentials
MINDS_BUILDER_API_KEY=your_builder_api_key_here

# Explicit Local Demo Mock Flag (Optional, set to true for offline testing without API key)
DEMO_MODE=false
```

> **Note on Loud Failure:** If `MINDS_BUILDER_API_KEY` is not provided and `DEMO_MODE` is `false` or unset, Greenroom will raise a `MindsConfigurationError` on startup/execution to prevent unannounced mock fallback.

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
5. **Minute 5 — Autonomous Feedback Loop & Memory Consolidation ("The Magic Moment"):** System processes user feedback (*"Too formal, keep it punchy"*), syncing learned voice rules to remote Mind completions and `creator_profile.json`.
