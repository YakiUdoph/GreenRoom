# Greenroom — The Persistent Multi-Mind Creator Engine

> Built natively on Google Antigravity for the **Creative Minds Jam** Hackathon.

**Greenroom** is an always-on, persistent multi-agent creator staff built using Minds technology. Instead of acting as another context-less chatbot wrapper or static SaaS analytics dashboard, Greenroom creates an autonomous, self-learning digital staff that accumulates long-term knowledge regarding a creator’s identity, audience behavior, performance benchmarks, and commercial goals.

---

## 🌟 Key Differentiators & Architecture

* **Memory over Ephemerality:** Implements context relevance scoring backed by semantic matching and a 720-hour recency decay window.
* **Inter-Mind Protocol (IMP v1.0):** Asynchronous JSON event bus streaming real-time agent communications over WebSockets.
* **No SaaS Wrapper Clutter:** The UI acts purely as an **Agentic Window** into the background operations, thought streams, and state transitions of the multi-agent system.
* **Proof of Learning:** Demonstrates deterministic rule adaptation where user feedback modifies persistent profile states (`creator_profile.json`) across execution loops.

---

## 🤖 The Multi-Mind Staff Topology

Greenroom divides complex creator operations across four specialized stateful agents:

1. **Greenroom Core Mind (Chief of Staff):** Central task-routing, memory aggregation, and strategic synthesis engine.
2. **Scout Mind (Trend & Niche Signals):** Autonomous researcher running signal vs. noise filters against emerging trends.
3. **Community Mind (Audience Intelligence):** Cluster analysis on comment streams, sentiment drift, and audience pain points.
4. **Business Mind (Monetization & Outreach):** Sponsorship fit calculation, deal valuation, and automated pitch drafting.

---

## 🛠️ Tech Stack & System Components

* **Orchestration & IDE:** Google Antigravity
* **Backend Framework:** Python 3.10+, FastAPI, Uvicorn
* **Protocols & Memory Engine:** `imp_protocol.py`, `memory_engine.py` (`creator_profile.json`)
* **Agent System Prompts:** `agent_prompts.py`
* **Demo Orchestration:** `demo_runner.py`
* **Frontend UI:** HTML5, Tailwind CSS, JavaScript (WebSockets)

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
pip install fastapi uvicorn
```

### 3. Run Automated System Test Suite
Verify that the persistent memory engine, IMP bus, and Minute 1–5 workflows execute properly:
```bash
python test_greenroom.py
```

### 4. Launch Local Command Center
Start the FastAPI server and open the browser interface:
```bash
python server.py
```
Open your browser and navigate to `http://127.0.0.1:8000`.

---

## 🎬 5-Minute Demo Flow

1. **Minute 1 — Morning Intelligence Brief:** Core Mind aggregates trend signals (Scout) and community sentiment (Community Mind) into an actionable creator directive.
2. **Minute 2 — Opportunity Radar & Trend Matching:** Scout Mind flags high-signal niche opportunities matching the creator profile.
3. **Minute 3 — Deep Audience Sentiment Analysis:** Community Mind analyzes fan feedback, content friction points, and engagement clusters.
4. **Minute 4 — Sponsorship Fit & Automated Pitch Generation:** Business Mind identifies brand integration opportunities, calculates deal value, and generates tailor-made pitch briefs.
5. **Minute 5 — Autonomous Feedback Loop & Memory Consolidation:** System incorporates user feedback into `creator_profile.json`, refining future strategy models deterministically.
