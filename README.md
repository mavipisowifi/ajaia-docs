# Ajaia Docs — Collaborative Document Editor

A lightweight, enterprise-grade collaborative document editor inspired by Google Docs and built for internal product, design, and engineering teams. Features authentic US-letter canvas typography, dynamic outline jump-scrolling, drag-and-drop file ingestion, granular role-based access control (RBAC), and revision history rollback.

---

## 🌐 Live Reviewer Deployment & Submission Links

Reviewers can access and test the deployed application live:

- **Render Production Deployment URL**: [https://ajaia-docs.onrender.com](https://ajaia-docs.onrender.com)
- **Google Drive Project Submission**: [https://drive.google.com/drive/folders/1_pcUaHRLBD_a5Bym1wjuGCaJcp8E26fT?usp=sharing](https://drive.google.com/drive/folders/1_pcUaHRLBD_a5Bym1wjuGCaJcp8E26fT?usp=sharing)
- **Cloud Run Primary Mirror**: [https://ais-pre-npveal477sv22bczhih6gf-446656988501.asia-southeast1.run.app](https://ais-pre-npveal477sv22bczhih6gf-446656988501.asia-southeast1.run.app)
- **Development App URL**: [https://ais-dev-npveal477sv22bczhih6gf-446656988501.asia-southeast1.run.app](https://ais-dev-npveal477sv22bczhih6gf-446656988501.asia-southeast1.run.app)

*No local database setup or external configuration is required to inspect the application live.*

---

## 🚀 Setup & Run Instructions

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm**: `v9.0.0` or higher

### 1. Installation
Clone the repository and install all required dependencies:
```bash
git clone <repo-url>
cd ajaia-docs
npm install
```

### 2. Environment Configuration
Copy the sample environment file to `.env`:
```bash
cp .env.example .env
```
*(Optional)* Add a `GEMINI_API_KEY` to enable live Gemini 3.8 Flash AI suggestions. If omitted or kept as placeholder, a built-in assistant engine provides deterministic contextual responses without throwing errors.

### 3. Running in Development
Start the Express server with Vite middleware integration:
```bash
npm run dev
```
The application will be live at `http://localhost:3000`.

### 4. Running Automated Tests
Run the comprehensive automated test suite (21 tests across unit validation, HTTP API, RBAC enforcement, and revision rollbacks):
```bash
npm test
```

### 5. Type Checking & Linting
Validate TypeScript contracts without emitting files:
```bash
npm run lint
```

### 6. Production Build & Execution
Compile the frontend assets via Vite and bundle the Node.js backend using `esbuild`:
```bash
npm run build
npm start
```

### 7. Deploying to Render
A pre-configured `render.yaml` Blueprint is provided at the repository root:
1. Push this repository to GitHub or GitLab.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** -> **Blueprint** (or **Web Service**).
3. Connect the repository:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Render automatically configures port routing and provisions an SSL-secured endpoint at `https://<your-app>.onrender.com`.

---

## 🏗️ Architecture Note: What Was Prioritized and Why

For an in-depth breakdown, see [`ARCHITECTURE.md`](./ARCHITECTURE.md). Summary of key technical trade-offs:

1. **Native ContentEditable & Selection APIs vs Heavy Frameworks**:
   - *Prioritized*: Direct DOM selection APIs with semantic HTML generation over heavy runtime frameworks (like ProseMirror or Slate).
   - *Why*: Delivers near-instant initial render times, zero framework bundle bloat, effortless copy/paste interoperability from real Google Docs/Word, and clean HTML serialization for persistent storage.

2. **Atomic Filesystem Persistence with Write-Ahead Temp Swap**:
   - *Prioritized*: Self-contained atomic disk storage (`fs.writeFileSync(tmp) -> fs.renameSync()`) backed by in-memory indexing.
   - *Why*: Guarantees zero partial file corruption during container reboots without burdening reviewers with Docker compose or external database credentials (PostgreSQL/Redis).

3. **Multi-Persona Simulator for RBAC Auditing**:
   - *Prioritized*: A top-bar persona switcher enabling reviewers to toggle between 4 seeded team members (*Elena Rostova [Designer]*, *Marcus Vance [Architect]*, *Sarah Chen [Researcher]*, *David Kim [Ops]*).
   - *Why*: Allows reviewers to immediately test role boundaries (Owner vs. Editor vs. Viewer permissions, edit locks, deletion blocks, and share revocation) in one click without juggling multiple browser incognito sessions.

4. **Zero-Dependency Native Automated Test Harness**:
   - *Prioritized*: Node.js native test runner (`node:test` + `node:assert/strict`) executed via `tsx`.
   - *Why*: Completely eliminates heavy test framework dependencies (Jest/Mocha), boots in milliseconds, and runs identically across Linux, macOS, and containerized CI environments.

---

## 🛡️ Validation & Error Handling Strategy

The system enforces validation at both the API boundary and client interface:

### Backend Validation (`server.ts`)
- **Document Titles**: Validated against text type, trimmed of leading/trailing whitespace, defaults safely to `"Untitled document"` when empty, and strictly capped at 250 characters.
- **Content Integrity**: Validated as string payloads with length bounds to prevent memory denial-of-service.
- **Role Verification**: RBAC endpoints reject invalid roles; only `'editor'` and `'viewer'` are permitted.
- **Email Validation**: Sharing invites enforce standard RFC 5322 regex checks (`^[^\s@]+@[^\s@]+\.[^\s@]+$`).
- **File Upload Protection**: Multer limits file sizes to 15MB. Requests exceeding this receive `413 Payload Too Large`.
- **RBAC Boundaries**:
  - `403 Forbidden` returned if a non-owner attempts to delete a document or alter sharing settings.
  - `403 Forbidden` returned if a viewer attempts to edit document content or restore a revision snapshot.
  - `404 Not Found` returned for non-existent documents or unregistered routes under `/api/*`.
- **Centralized Error Middleware**: Express error handler captures unhandled exceptions and returns standardized JSON payloads (`{ error: string }`).

### Frontend Error Handling (`src/App.tsx`, `src/services/api.ts`)
- **Visual Status Dock**: Displays real-time state: *Saved to Cloud*, *Saving changes...*, *Error saving changes*, or *Protected (Read-Only)*.
- **Enforced Read-Only Mode**: Viewers have formatting toolbars disabled and editor canvas locked (`contentEditable="false"`) with an alert banner preventing accidental edits.
- **Network Resilience**: API errors surface meaningful human-readable feedback.

---

## 🧪 Automated Test Suite

The test suite is organized into three suites in the `/test` directory:

| Test Suite | File | Focus Area |
| :--- | :--- | :--- |
| **Validation Unit Tests** | `test/validation.test.ts` | Title trimming, length limits, email regex validation, role verification, RBAC mapping. |
| **HTTP API & RBAC Lifecycle** | `test/api.test.ts` | End-to-end integration tests over ephemeral HTTP socket testing creation, sharing, viewer edit blocking, permission escalation, and owner-only deletion. |
| **Document Features & Rollback** | `test/features.test.ts` | Markdown file ingestion to HTML DOM conversion, version history snapshotting, and viewer restore blocking vs owner rollback. |

Run tests anytime with:
```bash
npm test
```

---

## 👥 Seeded Team Personas

| Name | Role | Email | Default Ownership / Shares |
| :--- | :--- | :--- | :--- |
| **Elena Rostova** | Lead Product Designer | `elena@ajaia.internal` | Owner of *Q3 Product Strategy* & *Design Systems RFC* |
| **Marcus Vance** | Staff Systems Architect | `marcus@ajaia.internal` | Owner of *Real-Time Sync RFC*; Editor on *Product Strategy* |
| **Sarah Chen** | UX Researcher | `sarah@ajaia.internal` | Owner of *User Discovery Findings*; Viewer on *Product Strategy* |
| **David Kim** | Product Operations | `david@ajaia.internal` | Viewer on *Product Strategy* & *User Discovery* |
