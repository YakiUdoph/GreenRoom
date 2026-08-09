# Greenroom — The Persistent Multi-Mind Creator Engine

> Built natively on Google Antigravity & the **Official Minds SDK** for the **Creative Minds Jam** Hackathon.

**Greenroom** is an always-on, persistent multi-agent creator staff built using Minds technology and the official `minds-sdk` framework. Instead of acting as another context-less chatbot wrapper or static SaaS analytics dashboard, Greenroom creates an autonomous, self-learning digital staff that accumulates long-term knowledge regarding a creator’s identity, audience behavior, performance benchmarks, and commercial goals.

---

## 🌟 Key Architecture & Minds SDK Integration

* **Official Minds SDK Layer (`minds_integration.py`):** Instantiates 4 autonomous Minds agents with registered skills, LLM completions, and native Minds state persistence.
* **Registered Minds Skills:** Agent capabilities are encapsulated as official registered skills:
  * `search_trends`: Autonomous trend signal vs. noise filtering (Scout Mind)
  * `analyze_comments`: Audience sentiment & engagement hook extraction (Community Mind)
  * `score_deal`: Sponsorship brand-fit scoring & pitch generation (Business Mind)
* **Native Agent Memory Persistence ("The Magic Moment"):** Demonstrates deterministic rule adaptation where Minute 5 user feedback (*"Too formal, keep it punchy"*) updates persistent context natively across the Minds agent topology and `creator_profile.json`.
* **Inter-Mind Protocol (IMP v1.0):** Asynchronous JSON event bus streaming real-time agent communications over WebSockets directly to the visual command center.
* **Agentic Window UI:** Clean FastAPI WebSocket dashboard acting purely as a window into real-time agent thought streams, skill executions, and state transitions.

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
* **Agent Framework:** Official `minds-sdk` (Minds API & Persistent Context Engine)
* **Backend Framework:** Python 3.10+, FastAPI, Uvicorn, Pydantic, `python-dotenv`
* **Minds Integration & Persistence:** `minds_integration.py`, `memory_engine.py` (`creator_profile.json`)
* **Protocols & Prompts:** `imp_protocol.py`, `agent_prompts.py`
* **Demo Orchestration & Testing:** `demo_runner.py`, `test_greenroom.py`
* **Frontend UI:** HTML5, Tailwind CSS, JavaScript (WebSockets)

---

## 🔐 Environment Configuration

Create a `.env` file in the root directory to configure your Minds API credentials:

```env
MINDS_API_KEY=your_minds_api_key_here
MINDS_BASE_URL=https://api.minds.ai
```

*(Note: If `MINDS_API_KEY` is not provided, Greenroom seamlessly operates via the native Minds local engine, ensuring complete test suite and offline demo stability.)*

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

### 3. Run Automated System Test Suite
Verify Minds SDK initialization, registered skill execution, persistent memory state sync, IMP event bus, and Minute 1–5 workflows:

```bash
python test_greenroom.py
```

### 4. Launch Local Command Center
Start the FastAPI server:

```bash
python server.py
```

Open your browser and navigate to:
* **Visual Command Center:** `http://127.0.0.1:8000`
* **Minds SDK Status Endpoint:** `http://127.0.0.1:8000/api/minds/status`

---

## 🎬 5-Minute Demo Flow

1. **Minute 1 — Morning Intelligence Brief (Zero-State Ingestion):** Core Mind ingests initial creator script analytics and retention metrics into persistent memory.
2. **Minute 2 — Opportunity Radar & Trend Matching (`ScoutMind`):** Scout Mind executes the `search_trends` registered skill to flag high-signal niche opportunities.
3. **Minute 3 — Deep Audience Sentiment Analysis (`CommunityMind`):** Community Mind executes `analyze_comments` to analyze audience retention drivers and code setup demands.
4. **Minute 4 — Sponsorship Fit & Automated Pitch Generation (`BusinessMind`):** Business Mind executes `score_deal` to evaluate brand match score and generate targeted pitch proposals.
5. **Minute 5 — Autonomous Feedback Loop & Memory Consolidation ("The Magic Moment"):** System processes user feedback (*"Too formal, keep it punchy"*), updating native Minds agent context and `creator_profile.json` so all future outputs automatically reflect the learned voice preference.
