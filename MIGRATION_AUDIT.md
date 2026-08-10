# Greenroom Frontend Migration — Audit Report (Phase 1)

## 1. Overview & Current Architecture
- **Current Entry Point:** `static/index.html` served by FastAPI via `app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")` in `server.py`.
- **Logic:** Vanilla JavaScript in `static/app.js` using global DOM manipulation and standard `fetch` API.
- **Styling:** `static/styles.css` combined with Tailwind CSS CDN script tag in `index.html`.

## 2. Frontend Entry Point & HTML Structure
- **File:** `static/index.html` (283 lines)
- **Header:** Title, status badge (`#connection-status`), 5-Minute hackathon control runner buttons (Min 1-5, Run 5-Min Demo, Reset).
- **Progress Banner:** `#demo-banner` (Step title, spinner, progress dots for Min 1-5).
- **3-Column Dashboard Layout:**
  - **Left Column (5 cols):** `#activity-stream` — Inter-Mind Message Log (IMP stream) showing color-coded agent messages, confidence badges, action badges, and a JSON payload inspector trigger (`🔍`).
  - **Center Column (4 cols):** Executive Action Queue:
    - `#card-sponsorship`: Sponsorship outreach pitch draft card (match score, title, description, pitch draft box, "Approve & Send", "Modify Pitch").
    - `#card-script`: Strategy & Script Concept card (creative direction body, `#punchy-tag` badge).
    - `#feedback-input`: Minute 5 Proof of Learning feedback input box & "Execute & Learn" button.
  - **Right Column (3 cols):** `#state-store` — Persistent Memory State Store Inspector:
    - Creator name & brand voice attribute pills.
    - Learned Voice Rules box (`#state-learned-rules`).
    - Scout Filter / Rejected Topics (`#state-rejected-topics`).
    - Business CPM benchmarks (`#state-cpm`, `#state-min-deal`).
    - Persistent Memory Nodes (`#state-memory-nodes`).
- **Modal Inspector:** `#modal-payload` — Formatted JSON modal for inspecting full `IMPMessage` objects.

## 3. JavaScript Functionality Audit (`static/app.js`)
- **Initialization:** On `DOMContentLoaded`:
  - `initWebSocket()`
  - `fetchInitialState()`
  - `fetchMindsStatus()`
- **REST Endpoints Consumption:**
  - `GET /api/minds/status` $\rightarrow$ Updates `#connection-status` badge (Green = Connected, Yellow = Mock Demo Mode, Red = Disconnected).
  - `GET /api/state` $\rightarrow$ Retrieves `creator_profile.json` memory state.
  - `GET /api/imp/history` $\rightarrow$ Retrieves recent IMP message history array.
  - `POST /api/demo/step/{step_id}` $\rightarrow$ Triggers demo step execution (1..5). Step 5 sends `{ feedback }` payload.
  - `POST /api/demo/reset` $\rightarrow$ Resets IMP bus and memory state to zero-state.
  - `POST /api/action/approve` $\rightarrow$ Submits approval for sponsorship outreach.
- **WebSocket Gateway (`/ws`):**
  - Connects to `ws://{host}/ws` (or `wss:`).
  - Handles `data.type === 'INITIAL_SNAPSHOT'`: sets initial `impMessages`, `currentMemoryState`, calls `renderAll()`.
  - Handles `data.type === 'IMP_MESSAGE'`: appends `data.data` to `impMessages`, updates `currentMemoryState` from `data.memory_state`, calls incremental render functions (`renderIMPStream`, `renderStateStore`, `renderActiveCards`).
  - Automatically reconnects on close every 2 seconds.

## 4. REST Endpoints & WebSocket Contracts (Backend Integrity)
| Protocol | Endpoint | Method / Type | Payload Request / Response |
| :--- | :--- | :--- | :--- |
| **REST** | `/api/state` | `GET` | Returns full memory state JSON object |
| **REST** | `/api/minds/status` | `GET` | Returns Minds status object (`mode`, `connected`, `is_mock`, `real_platform_mind`, `active_minds_agents`) |
| **REST** | `/api/imp/history?limit=50` | `GET` | Returns array of recent `IMPMessage` objects |
| **REST** | `/api/demo/reset` | `POST` | Resets state; returns `{ status, message, state, minds_status }` |
| **REST** | `/api/demo/step/{step_id}` | `POST` | Body: Optional `{ feedback: string }`. Returns `{ status, step_result, state, minds_status }` |
| **REST** | `/api/demo/full` | `POST` | Triggers full 5-minute runner on backend. Returns `{ status, results, state, minds_status }` |
| **REST** | `/api/action/feedback` | `POST` | Body: `{ feedback: string }`. Returns `{ status, result, state, minds_status }` |
| **REST** | `/api/action/approve` | `POST` | Body: `{ action_name: string }`. Returns `{ status, approval, message }` |
| **WS** | `/ws` | `WebSocket` | Inbound messages: `INITIAL_SNAPSHOT`, `IMP_MESSAGE` |

## 5. Migration Strategy & Target Architecture
- **Tech Stack:** React (Vite) + JavaScript (JSX) + Tailwind CSS + Lucide React icons.
- **Location:** `/frontend`
- **State Model:** Simple centralized store (`frontend/src/stores/greenroomStore.js` or Zustand / Context).
- **API Layer:** `frontend/src/lib/api.js` (centralized fetch wrapper).
- **WebSocket Layer:** `frontend/src/hooks/useGreenroomSocket.js` + `frontend/src/lib/websocket.js`.
- **Vite Proxy:** Configured in `frontend/vite.config.js` to proxy `/api` and `/ws` to `http://127.0.0.1:8000`.
- **Backend Protection:** Zero modifications to Python backend files during Phase 1 migration.
