# Greenroom Frontend Audit & Refinement Strategy

## Executive Summary
This audit evaluates the current Greenroom Persistent AI Chief of Staff frontend architecture, components, motion visualizers, page views, and state bindings. The primary objective is to transform Greenroom from a developer-facing AI command center into a **polished, judge-ready creator product** communicating the core thesis: **"GREENROOM WORKS WHILE YOU WORK."**

---

## 1. Page Component Classification & Consolidation

| Component | Status | Classification | Rationale & Action Plan |
| :--- | :--- | :--- | :--- |
| `Home.jsx` vs `HomePage.jsx` | Redundant | **REPLACE / IMPROVE** | Consolidate into `HomePage.jsx`. `Home.jsx` contains rich "WHILE YOU WERE AWAY" cards and evidence citations, while `HomePage.jsx` was used as the route target. Merge into a unified `HomePage.jsx` that presents the 30-second judge story: Signal → Context → Greenroom's Take → Evidence → Recommended Action → [BUILD THIS]. |
| `Mind.jsx` vs `MindPage.jsx` | Redundant | **REPLACE / IMPROVE** | Consolidate into `MindPage.jsx`. `Mind.jsx` contains skill execution controls (`search_trends`, `analyze_comments`, `score_deal`), while `MindPage.jsx` renders platform identity. Unify into a human-first "Meet Your AI Staff" layout where Greenroom Chief of Staff stands above the 3 specialist sub-minds (Scout, Community, Business). |
| `Memory.jsx` vs `MemoryPage.jsx` | Redundant | **REPLACE / IMPROVE** | Consolidate into `MemoryPage.jsx`. `Memory.jsx` contains the signature "Teach Greenroom / I Remember" input form with animated step sequence, while `MemoryPage.jsx` lacks the learning form. Merge into a unified `MemoryPage.jsx` featuring Creator DNA, Memory Timeline, "I Remember" learning feedback loop, and a Before vs. After personalization demonstration (Generic AI vs. Greenroom Context). |
| `Intelligence.jsx` vs `IntelligencePage.jsx` | Redundant | **REPLACE / IMPROVE** | Consolidate into `IntelligencePage.jsx`. `Intelligence.jsx` has a human-readable inter-mind reason thread. Merge into a human-first decision storytelling view (Scout → Greenroom → Community → Business → Recommendation) with expandable raw IMP JSON event logs. |
| `Actions.jsx` vs `ActionsPage.jsx` | Redundant | **REPLACE / IMPROVE** | Consolidate into `ActionsPage.jsx`. Present executive sign-offs with clear WHAT, WHY, EVIDENCE, CONFIDENCE, and status transitions (PENDING → APPROVED → EXECUTING → COMPLETE). |
| `System.jsx` vs `SystemPage.jsx` | Redundant | **REPLACE / IMPROVE** | Consolidate into `SystemPage.jsx`. Maintain this as the dedicated technical "under-the-hood" inspection center housing raw protocol streams, `StateStoreInspector`, and Minds SDK diagnostics. |

---

## 2. Component-Level Audit

| Component File | Classification | Reason & Planned Changes |
| :--- | :--- | :--- |
| `components/layout/Header.jsx` | **IMPROVE** | Clean up header text; replace technical runner terminology (`Step 1..5`) with human-readable skill action buttons (`Ingest Profile`, `Scan Trends`, `Synthesize Strategy`, `Score Deal`, `Learn Voice`). |
| `components/layout/Sidebar.jsx` | **KEEP** | Clean desktop side navigation with clear active tab highlighting. |
| `components/layout/Navigation.jsx` | **KEEP** | Sticky top navigation header for mobile/tablet layouts. |
| `components/layout/DemoBanner.jsx` | **IMPROVE** | Rename/refactor banner text to reflect active pipeline step execution ("Greenroom is executing skill..."). |
| `components/mind/GreenroomCore.jsx` | **KEEP / IMPROVE** | Central Living Core orb component. Ensure states (`IDLE`, `THINKING`, `COLLABORATING`, `LEARNING`, `ACTING`) reflect real backend activity. |
| `components/mind/KineticNoirCore.jsx` | **REDUCE** | Reduce rotation stiffness and glowing aura opacity to prevent visual clutter on non-mind pages. |
| `components/mind/MindTopology.jsx` | **IMPROVE** | Render clear hierarchy showing Greenroom Chief of Staff coordinating Scout Mind, Community Mind, and Business Mind. |
| `components/memory/StateStoreInspector.jsx` | **KEEP** | Used in System page for inspecting `creator_profile.json` raw state store. |
| `components/activity/ImpMessageStream.jsx` | **KEEP** | Used in System page for real-time IMP WebSocket protocol stream. |
| `components/actions/PendingApprovals.jsx` | **IMPROVE** | Refactor pending action card layout to highlight WHAT, WHY, EVIDENCE, CONFIDENCE, and execution progress. |
| `components/ui/PayloadModal.jsx` | **KEEP** | Modal dialog for inspecting raw IMP message JSON payloads. |

---

## 3. Motion & Background Audit

| Motion Component | Classification | Reason & Planned Changes |
| :--- | :--- | :--- |
| `IntelligenceShader.jsx` | **REDUCE / REMOVE** | Heavy WebGL shader previously mounted globally; remove global mounting in favor of tab-specific dynamic backgrounds. |
| `HomeBackground.jsx` | **IMPROVE** | Subtle, ambient particle field for studio command center. |
| `MindBackground.jsx` | **IMPROVE** | Interactive neural synapse canvas network reacting to cursor with spring physics. |
| `MemoryBackground.jsx` | **IMPROVE** | Memory constellation matrix with time-decay rings and floating recall nodes (`RECALL`, `PERSIST`, `VOICE_RULES`). |
| `IntelligenceBackground.jsx` | **IMPROVE** | Inter-Mind reasoning field matrix with pulse rays between mind nodes. |
| `ActionsBackground.jsx` | **IMPROVE** | Executive force field with kinetic vector streams and mouse-activated energy shockwaves. |
| `SystemBackground.jsx` | **IMPROVE** | Cybernetic protocol bus stream with terminal scanlines. |
| `CursorSpotlight.jsx` | **REDUCE** | Soften spotlight opacity and disable excessive cursor particle trails. |
| `MagneticHover.jsx` | **KEEP** | Magnetic UI hover effect wrapper. |

---

## 4. Language & Product Story Filter

- **Creator-Facing Pages (Home, Mind, Memory, Intelligence, Actions)**:
  - Replace developer jargon (`IMP_MESSAGE`, `demo_step`, `agent pipeline`) with human creator story language:
    - *"Scout Mind flagged a new trend fit for your audience."*
    - *"I've learned a new voice preference: 'Keep hooks under 15s'."*
    - *"Greenroom synthesized creative direction based on your retention metrics."*
- **System Page**:
  - Retain technical protocol terminology (`IMP v1.0`, `memory_state`, `minds_status`, `message_id`).

---

## 5. Non-Negotiable Integration Rules
1. **Backend Integration**: FastAPI backend (`server.py`), REST endpoints, WebSocket handler (`/ws`), Minds SDK manager (`minds_integration.py`), and memory engine (`memory_engine.py`) remain untouched as the sole source of truth.
2. **No Fabricated State**: Never fake memories, trends, or agent events. If backend data is empty or loading, show truthful standby states.
3. **Accessibility & Reduced Motion**: All motion components check `prefers-reduced-motion` and disable heavy animation loops when requested.
