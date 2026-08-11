# Greenroom — Persistent Creator Growth Mind

> Built for Creative Minds Jam / Animoca Brands Minds. Built on Google Antigravity & the **Official Animoca Brands Minds Builder API** ([build.hellominds.ai](https://build.hellominds.ai)).

**Greenroom** is a persistent creator-growth Mind that keeps working when the creator logs off — monitoring new audience/community signals against what it remembers about the creator, ranking the highest-value opportunities, and leaving a ready-to-act **"While You Were Away" briefing** for when they return.

---

## 🎯 Hackathon Positioning & Framework Fit

### USER
A solo creator who publishes regularly but does not have a dedicated growth/community team.

### PAIN
After publishing, the creator cannot continuously watch audience/community signals and decide what deserves attention. Valuable growth opportunities disappear while the creator is making content, sleeping, working, or offline.

### MIND
Greenroom monitors, remembers, evaluates, and prioritizes the creator's next growth actions.

### DEMO
The creator leaves Greenroom. New signals are processed autonomously. The creator later returns. A ranked **"While You Were Away" briefing** is already waiting on screen.

### ASYNC
Greenroom performs useful work asynchronously on the server — NOT while the creator sits and types chat messages.

---

## 💡 Why This Must Be a Mind (Not a Chatbot)

> *"If it only works while someone types at it, it is a chatbot. Build for the hours nobody's watching."*

A standard AI chatbot waits for a prompt, responds in a vacuum, and forgets context between sessions. **Greenroom is a Mind**:
1. **Persistent Memory:** It holds long-term creator context, niche boundaries, CPM target benchmarks, and learned voice/format preferences in `creator_profile.json`.
2. **Autonomous Execution:** It runs server-side background analysis cycles (`AsyncJobRunner`), evaluating incoming signals without requiring active browser presence.
3. **Structured Briefing Delivery:** When the creator opens Greenroom, a ranked **"While You Were Away"** briefing is waiting with explicit memory grounding (*why* an item was prioritized).

---

## 🌟 Architecture & Official Minds Client-Lib Integration

### Real Platform Mind:
- **Platform Mind UUID:** Bound to official platform Mind UUID `8208493e-f36b-1410-8466-00039ce7df11`.
- **Mind Email:** `udophia@hellominds.ai`
- **Mind Wallet:** `0xB675Ec9857776678aE540cF3248d898f015987Cb`
- **Builder API Endpoint:** `https://api.build.hellominds.ai`
- **Authentication:** `MINDS_BUILDER_API_KEY` sent via HTTP header `X-Api-Key`.

### Official Client-Lib Node Bridge (`minds_bridge.mjs`):
- Production Mind interactions run through an internal Node bridge script importing the official `@animocabrands/minds-client-lib` SDK (`createMindsClient`).
- **Strict Verification (`verify_real_mind`):** Requires the API response itself to contain all 4 matching fields: `mindId == 8208493e-f36b-1410-8466-00039ce7df11`, `email == udophia@hellominds.ai`, `walletAddress == 0xB675Ec9857776678aE540cF3248d898f015987Cb`, and `isEnabled == true`.
- **Documented Conversation Flow:** Production messaging uses `@animocabrands/minds-client-lib`: `ensureConversation` -> `getLatestHistoryFingerprint` -> `sendMessage` -> `waitForReply({ afterFingerprint, sentMessageText })`.

---

## 🤖 Greenroom Topology & Signal Abstraction

1. **Greenroom Core Mind (`GreenroomCore`):** Chief of Staff & Strategic Router Engine managing memory aggregation, briefing synthesis, and Animoca Mind orchestration (`remote_mind_id: 8208493e-f36b-1410-8466-00039ce7df11`).
2. **Scout Mind (`ScoutMind`):** Local Trend & Niche Signal Researcher executing signal vs noise filtering against creator rules.
3. **Community Mind (`CommunityMind`):** Local Audience Intelligence Analyst evaluating comment sentiment and retention drivers.
4. **Business Mind (`BusinessMind`):** Local Monetization & Partnership Strategist scoring brand sponsorship match against CPM target benchmarks.
5. **SignalProvider Abstraction:** Clean `SignalProvider` base class with `DemoSignalProvider` (returns simulated signals tagged explicitly with `is_demo: True` and `[DEMO DATASET]` UI labels) and `RealSignalProvider`.

---

## 🧠 Persistence & Memory Continuity

- **Local Creator Profile Persistence (`creator_profile.json`):** Stores creator niche, brand voice attributes, monetization benchmarks ($45 target CPM), rejected topics (*"Crypto trading bots"*, *"Generic AI news clickbait"*), and learned voice rules.
- **Briefing Store (`latest_briefing.json`):** Stores the latest ranked "While You Were Away" briefing so page refreshes/reloads immediately present the finished work.
- **Multi-Run Continuity:** When a creator provides feedback (*"Emphasize open-source terminal setup steps"* or marks an item as *Useful*), the rule is saved to persistent state. The next autonomous cycle dynamically incorporates that learned preference into its signal ranking and memory grounding.

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

### 3. Run System Test Suite (25 Tests)
```bash
python test_greenroom.py
```

### 4. Launch Command Center
```bash
python server.py
```

Open browser to `http://127.0.0.1:8000`.

---

## 🎬 2-Minute Judge Demo Guide

1. **Scene 1 — Problem Statement (0:00–0:15):** Explain that solo creators lose growth opportunities because they can't monitor community signals 24/7.
2. **Scene 2 — Creator Memory (0:15–0:30):** Show that Greenroom already remembers the creator's niche, CPM targets, and rejected topics.
3. **Scene 3 — Creator Offline / Async Trigger (0:30–0:50):** Click **"Simulate Creator Offline (Async Run)"**. Show Greenroom executing autonomously in the background without live chat typing.
4. **Scene 4 — Creator Return / "While You Were Away" Briefing (0:50–1:25):** Show the finished briefing on screen. Highlight the 3 ranked items (`HIGH PRIORITY`, `MEDIUM PRIORITY`, `WATCH`), what changed, why it matters, and explicit **Memory Grounding** badges.
5. **Scene 5 — Continuity & Proof of Learning (1:25–1:45):** Provide feedback (*"Emphasize open-source terminal setup steps"*). Re-trigger an async run and show how Run 2 adapts based on persisted memory.
6. **Scene 6 — Official Animoca Mind Proof (1:45–2:00):** Expand the technical drawer to show verified Mind UUID `8208493e-f36b-1410-8466-00039ce7df11` connection and Inter-Mind Protocol (IMP) logs.

---

## 📊 MVP Scope & Future Vision

### IN V1 MVP:
- Creator Memory & Profile Persistence (`creator_profile.json`).
- Autonomous Server-Side Background Execution (`AsyncJobRunner`).
- Ranked **"While You Were Away"** Briefing with Memory Grounding.
- Item Feedback & Multi-Run Continuity.
- Official Animoca Minds Client Integration (`@animocabrands/minds-client-lib`).
- Truthful Signal Abstraction (`DemoSignalProvider` & `RealSignalProvider`).

### OUT OF V1 (Future Vision):
- Automatic social posting.
- Direct fan DM automation.
- Full account management suites.
