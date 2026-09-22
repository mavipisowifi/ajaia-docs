# Ajaia LLC — AI-Native Full Stack Developer Assignment Submission

**Candidate**: AI-Native Full Stack Developer  
**Assignment**: Lightweight Collaborative Document Editor (Google Docs Inspired)  
**Timebox**: 4–6 Hours  
**Date**: September 2026  
**Google Drive Project Submission**: [https://drive.google.com/drive/folders/1_pcUaHRLBD_a5Bym1wjuGCaJcp8E26fT?usp=sharing](https://drive.google.com/drive/folders/1_pcUaHRLBD_a5Bym1wjuGCaJcp8E26fT?usp=sharing)  
**Render Production Deployment**: [https://ajaia-docs-3wdn.onrender.com](https://ajaia-docs-3wdn.onrender.com)  

---

## 1. Executive Summary

This submission presents **Ajaia Docs**, a fast, resilient, and collaborative document editor tailored for internal product, design, and engineering teams. Rather than superficially cloning Google Docs, this implementation focuses on delivering the strongest working full-stack slice within the 4–6 hour timebox:

- Authentic **US-letter canvas layout** with ruler margins, rich formatting, real-time statistics, and dynamic outline jump-scrolling.
- Two-way **file ingestion** supporting Markdown (`.md`), Plain Text (`.txt`), HTML, and JSON directly into editable DOM structures, as well as associated reference attachments.
- A functional three-tier **Role-Based Access Control (RBAC)** model (*Owner*, *Editor*, *Viewer*) with server-side enforcement and a live **Persona Switcher** for auditing.
- **Atomic crash-resilient disk persistence** (`write-ahead temp file -> atomic rename`) ensuring zero state loss without external database setup burdens.
- A zero-dependency **automated test harness** running 21 tests in under 5 seconds across unit validation, HTTP REST lifecycle, RBAC enforcement, and revision rollbacks.

---

## 2. Deliverables Checklist & Package Contents

All required deliverables have been generated and committed to the workspace:

| Item | File / Location | Description |
| :--- | :--- | :--- |
| **Google Drive Submission Folder** | [Google Drive Folder](https://drive.google.com/drive/folders/1_pcUaHRLBD_a5Bym1wjuGCaJcp8E26fT?usp=sharing) | Folder containing code archive, documentation, tests, and submission package. |
| **Render Live Deployment** | [https://ajaia-docs-3wdn.onrender.com) | Live production application hosted on Render. |
| **Source Code** | `/src`, `/server.ts` | Clean, modular TypeScript frontend (React 18 + Tailwind) and backend (Express). |
| **Setup & Run Instructions** | [`README.md`](./README.md) | Step-by-step local installation, running, testing, and production commands. |
| **Architecture Decision Record** | [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Technical decisions, rationale, prioritized features, trade-offs, and system diagram. |
| **AI-Native Workflow Note** | [`AI_WORKFLOW_NOTE.md`](./AI_WORKFLOW_NOTE.md) | Tools used, where AI accelerated delivery, rejected suggestions, and verification methods. |
| **Submission Manifest** | [`SUBMISSION.md`](./SUBMISSION.md) | Complete inventory of completed features, scope cuts, and next steps. |
| **Walkthrough Video Link** | [`WALKTHROUGH_VIDEO.txt`](./WALKTHROUGH_VIDEO.txt) | Video URL and 4-minute demo timeline. |
| **Automated Test Suite** | `/test/*.test.ts` | 21 passing automated tests across 8 suites. |

---

## 3. Live Reviewer Deployment (Render)

Reviewers can inspect and test the live application directly:

- **Live Production Deployment URL**: [https://ajaia-docs-3wdn.onrender.com](https://ajaia-docs-3wdn.onrender.com)
- **Google Drive Project Submission Folder**: [https://drive.google.com/drive/folders/1_pcUaHRLBD_a5Bym1wjuGCaJcp8E26fT?usp=sharing](https://drive.google.com/drive/folders/1_pcUaHRLBD_a5Bym1wjuGCaJcp8E26fT?usp=sharing)

*No database installation, credentials, or paid third-party API keys are required to evaluate the live product.*

---

## 4. Local Setup and Run Instructions

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm**: `v9.0.0` or higher

### Step-by-Step Commands
```bash
# 1. Clone repository and install dependencies
npm install

# 2. Configure environment (optional Gemini API key for AI features)
cp .env.example .env

# 3. Launch development server (Express server with Vite middleware on port 3000)
npm run dev

# 4. Run automated test suite (21 tests across 8 suites)
npm test

# 5. Type-check and linting
npm run lint

# 6. Production build and execution
npm run build
npm start
```

---

## 5. Seeded Test Personas & Reviewing Sharing Flows

To enable reviewers to test multi-user sharing and RBAC without logging in and out, a **Persona Switcher** is pinned to the top navigation bar:

| Persona | Role | Email | Pre-seeded Ownership & Permissions |
| :--- | :--- | :--- | :--- |
| **Elena Rostova** | Lead Product Designer | `elena@ajaia.internal` | Owner of *Q3 Product Strategy* and *Design Systems RFC*. Full edit, share, and delete rights. |
| **Marcus Vance** | Staff Systems Architect | `marcus@ajaia.internal` | Owner of *Real-Time Sync RFC*; Editor on *Q3 Product Strategy*. |
| **Sarah Chen** | UX Researcher | `sarah@ajaia.internal` | Owner of *User Discovery Findings*; Viewer on *Q3 Product Strategy*. |
| **David Kim** | Product Operations | `david@ajaia.internal` | Viewer on *Q3 Product Strategy* and *User Discovery Findings*. Canvas is locked, read-only mode enforced. |

### How Reviewers Can Test RBAC in 60 Seconds:
1. Open the app as **Elena** (Owner): Type content, modify title, format text, and open the **Share Modal** to grant David *Editor* access.
2. Switch persona to **David** (Viewer on *User Discovery Findings*):
   - Notice the yellow **Read-Only Banner** informing the user of viewer status.
   - Notice formatting buttons are disabled and `contentEditable="false"` prevents typing.
   - Direct API update attempts return `403 Forbidden: Viewers cannot modify document content`.
3. Switch persona to **Marcus** (Editor on *Q3 Product Strategy*):
   - Notice Marcus can edit content and create revisions.
   - Notice the **Delete Document** button is hidden, and attempting to delete via API returns `403 Forbidden: Only the owner can delete this document`.

---

## 6. Detailed Feature Implementation Breakdown

### 1. Document Creation & Editing
- **Creation**: Start from a blank slate or pre-built templates (*Engineering RFC*, *Product Brief*, *Meeting Notes*).
- **Inline Renaming**: Editable title input with instant autosave, trimmed whitespace, and a 250-character limit.
- **Rich Formatting Toolbar**: Bold, italic, underline, strikethrough, headings (H1, H2, H3), blockquotes, code blocks, bulleted lists, numbered lists, text alignment, hyperlinks, and clear formatting.
- **Measurement Ruler & Page Margins**: Authentic Google Docs US-Letter sheet styling (`max-w-[850px]`, `min-h-[1100px]`, subtle page dropshadow).
- **Dynamic Outline**: Automatically detects `h1`, `h2`, `h3` tags in document content, providing one-click jump-scrolling with active heading highlights.
- **Document Statistics Dock**: Real-time word count, character count, estimated reading time, and cloud save state indicator.

### 2. File Upload & Ingestion
- **Modal Uploader**: Supports drag-and-drop or file browser picker.
- **Document Ingestion**: Parses `.md` (via `marked`), `.txt`, `.html`, and `.json` directly into editable document drafts.
- **Sample Files**: Built-in one-click sample files (*Engineering RFC.md*, *Meeting Notes.txt*) for rapid reviewer testing.
- **Reference Attachments**: Upload supplementary documents/images (up to 15MB) stored under `/public/uploads/` and tracked in the document's metadata.
- **Two-Way Export**: Download active documents as Markdown (`.md`), HTML (`.html`), or Plain Text (`.txt`).

### 3. Sharing & Access Control
- **Owner Control**: Only document owners can invite collaborators or alter permissions.
- **User Picker & Email Input**: Invite existing team members from a dropdown or enter any valid email address with role validation (`editor` vs. `viewer`).
- **Visual Distinction**: Separate tabs for *Owned by me* and *Shared with me* with role badges (`Owner`, `Editor`, `Viewer`).

### 4. Resilient Persistence
- **Debounced Autosave**: Changes autosave 700ms after the last keystroke, with clear visual states (*Saving changes...*, *Saved to Cloud*).
- **Atomic Disk Swapping**: Data is written to a temporary file before being atomically renamed into `/data/documents.json`, preventing file truncation or corruption during container reboots.
- **Version History & Rollback**: Automatic revision snapshots upon major updates; version timeline drawer allows one-click rollback to prior snapshots.

---

## 7. Architecture Note: What Was Prioritized and Why

For full architectural details, see [`ARCHITECTURE.md`](./ARCHITECTURE.md). Key decisions:

1. **Native ContentEditable & Selection APIs vs. Heavy Frameworks (Slate/ProseMirror)**:
   - *Prioritized*: Custom wrapper around standard DOM selection APIs and semantic HTML tags.
   - *Rationale*: Eliminates hundreds of kilobytes of runtime schema validation, ensures instant initial page loads, and provides lossless copy-paste interoperability from real Google Docs, Word, or Markdown.
2. **Atomic Filesystem Persistence vs. External Database**:
   - *Prioritized*: Self-contained atomic disk storage (`fs.writeFileSync(tmp) -> fs.renameSync(tmp, dest)`).
   - *Rationale*: Guarantees zero file corruption during container reboots while eliminating Docker daemon or external cloud SQL credentials for reviewers.
3. **Multi-Persona Simulator for RBAC Auditing**:
   - *Prioritized*: Top-bar persona switcher connecting directly to server-side authorization checks.
   - *Rationale*: Enables reviewers to test owner/editor/viewer permission boundaries in seconds without juggling multiple browser sessions or setting up OAuth apps.
4. **Zero-Dependency Native Automated Test Harness**:
   - *Prioritized*: Node.js native test runner (`node:test` + `node:assert/strict`) run via `tsx`.
   - *Rationale*: Runs in under 5 seconds with zero configuration overhead, providing fast verification of edge cases and RBAC walls.

---

## 8. AI-Native Workflow Note

For full workflow details, see [`AI_WORKFLOW_NOTE.md`](./AI_WORKFLOW_NOTE.md). Key highlights:

- **AI Tools Used**: Google Gemini models (Antigravity & Gemini 3.8 Flash) for architectural boilerplate, test assertion generation, TypeScript schema definitions, and server-side AI assistance.
- **Where AI Accelerated Delivery**:
  - Generated realistic seed documents and team personas in minutes.
  - Accelerated drafting of 21 comprehensive automated tests across unit validation, HTTP REST endpoints, and RBAC lifecycle.
  - Rapidly generated semantic HTML parsing logic and Tailwind layout rules.
- **What AI-Generated Output Was Changed or Rejected**:
  - *Rejected Heavy Editor Frameworks*: Rejected an initial suggestion to install Slate.js or Draft.js, opting instead for a lightweight native `contentEditable` approach to prevent bundle bloat.
  - *Rejected In-Memory State*: Rejected simple React memory state in favor of atomic disk persistence to ensure data survives container restarts.
  - *Enforced Server-Side Authorization*: Corrected early AI scaffolding that relied on client-only checks by implementing strict server-side RBAC validation with `403 Forbidden` responses.
- **Verification Methods**: Verified via 21 passing automated tests (`npm test`), full TypeScript compilation (`tsc --noEmit`), multi-persona manual auditing, and file ingestion/export fidelity tests.

---

## 9. Status: What is Working vs. What Was Deprioritized

### ✅ What is Working End-to-End
- Document creation (blank & templates), inline renaming, rich text formatting, and dynamic outline jump-scrolling.
- Debounced autosave (700ms) with visual status dock, persisting across browser refreshes and container restarts.
- File upload & ingestion for `.md`, `.txt`, `.html`, and `.json`, plus associated reference attachments.
- Two-way export to Markdown, HTML, and Plain Text.
- Sharing modal with email validation and role assignment (`editor` vs. `viewer`).
- Server-enforced RBAC with read-only locks for viewers and owner-only deletion.
- Version history timeline drawer with one-click revision rollback.
- 21 automated tests passing via `npm test`.

### ⏸️ What Was Intentionally Deprioritized (Scope Cuts)
- **Real-Time Multi-Cursor Collaboration (OT / CRDTs)**: Live blinking cursors and character-level concurrent operational transforms were deprioritized in favor of a stable debounced autosave + revision history model, avoiding race conditions within the timebox.
- **External SQL / Cloud DB Provisioning**: Replaced by an atomic write-ahead local filesystem store to eliminate external setup dependencies for reviewers.
- **Production SSO / OAuth**: Replaced by the Persona Switcher to allow immediate verification of permissions without authentication barriers.

### 🔮 What I Would Build Next (With Another 2–4 Hours)
1. **Real-Time Collaboration via Yjs & WebSockets**: Live collaborator avatars, active selection highlights, and character-level concurrent editing.
2. **Inline Comments & Suggestion Mode**: Text-anchored comment threads with `@colleague` mentions and tracked-changes suggestion mode.
3. **Cloud Object Storage (GCS/S3)**: Connect the file upload pipeline to Google Cloud Storage with signed URLs for large attachments.

---

## 10. Automated Test Results Summary

```
TAP version 13
# Subtest: HTTP API Integration & RBAC Tests (5 tests) - pass
  ok 1 - GET /api/users - should return the list of seeded collaborators
  ok 2 - POST /api/documents - should reject title longer than 250 characters with 400 Bad Request
  ok 3 - POST /api/documents - should create a new document with owner and revision snapshot
  ok 4 - RBAC Flow - Creation, Sharing, Permissions & Deletion Lifecycle
  ok 5 - GET /api/unknown-route - should return 404 with structured error JSON
# Subtest: Document Features & Revision History Tests (2 tests) - pass
  ok 1 - File Ingestion - should convert raw markdown into rich HTML structure
  ok 2 - Revision History & Rollback - should track revisions and allow rollbacks
# Subtest: Validation Unit Tests (14 tests) - pass
  ok 1 - validateDocumentTitle (5 boundary tests)
  ok 2 - validateEmail (2 regex format tests)
  ok 3 - validateRole (2 whitelist validation tests)
  ok 4 - getUserRole (4 RBAC resolution tests)
  ok 5 - Seeded Team Members (1 persona fixture test)

1..3
# tests 21
# suites 8
# pass 21
# fail 0
# duration_ms 4887
```

---

## 11. Walkthrough Video Script & Timing

The video walkthrough covers the end-to-end product flow:

- **0:00 – 0:45 | Core Editing & Canvas Experience**: US-letter layout, rich formatting, inline renaming, dynamic outline jump-scrolling, word count statistics, and debounced autosave.
- **0:45 – 1:40 | File Ingestion & Attachments**: Drag-and-drop Markdown file parsing into rich DOM nodes, reference attachments, and multi-format export.
- **1:40 – 2:40 | Sharing, RBAC & Read-Only Enforcement**: Sharing modal, persona switcher, locked canvas (`contentEditable="false"`), disabled controls, and server-side 403 prevention for viewers.
- **2:40 – 3:20 | Persistence & Revision Rollback**: Browser refresh persistence, revision history inspection, and one-click rollback.
- **3:20 – 4:00 | Engineering Quality, Trade-Offs & AI Workflow**: Running `npm test`, architectural decisions, rejected AI suggestions, and deliberate scope discipline.
