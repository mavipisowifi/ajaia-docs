# Architecture Decision Record (ADR): Ajaia Docs

## 1. Executive Summary

Ajaia Docs is a collaborative document editor built to balance the familiarity and structural polish of Google Docs with the specific needs of modern engineering and product teams (technical specifications, Markdown/HTML interoperability, attachment context, and role-based permissions).

This document outlines key technical decisions made during implementation, detailing **what was prioritized, why it was chosen, and the trade-offs involved**.

---

## 2. Technical Decisions & Prioritizations

### Decision 1: Native Semantic HTML & Selection API vs. Heavy Frameworks (Slate/ProseMirror)

- **What was chosen**: Custom React wrapper around standard browser `contentEditable` with `document.execCommand` / Selection API and semantic HTML elements (`h1`, `h2`, `h3`, `blockquote`, `ul`, `ol`, `p`, `pre`).
- **Why it was prioritized**:
  1. **Performance & Lightweight Footprint**: Avoids hundreds of kilobytes of runtime schema validation and abstract syntax tree (AST) reconciliation overhead.
  2. **Interoperability**: Markdown and HTML files ingested into the editor map 1:1 to browser DOM nodes without complex lossy AST transformation layers.
  3. **Clipboard Compatibility**: Users can copy formatted tables, code snippets, or lists directly from external tools (Google Docs, Notion, GitHub issues) and retain structure.
- **Trade-off**: For complex multi-cursor collaborative editing (like Google Docs OT or Yjs CRDTs), native `contentEditable` requires cursor offset mapping. For the current phase, debounced auto-save with document revision snapshotting provides high reliability without the distributed state complexity of operational transformations.

---

### Decision 2: Atomic Filesystem Persistence with Write-Ahead Swaps

- **What was chosen**: File-based persistence in `/data/documents.json` utilizing temporary write-ahead files and atomic replacement (`fs.writeFileSync(tmp) -> fs.renameSync(tmp, dest)`).
- **Why it was prioritized**:
  1. **Zero External Infrastructure Dependency**: Reviewers and developers can clone and execute `npm run dev` or `npm test` instantly with zero Docker daemon setup, cloud provisioning, or SQL connection strings.
  2. **Crash & Restart Resilience**: Writing directly to the active JSON file risks corrupting the document store if the Node.js process is terminated mid-write (e.g. container cold-start migration). The atomic rename guarantees that the OS treats the replacement as an indivisible operation.
- **Trade-off**: Does not support horizontal scaling across multiple container pods without a shared persistent volume or distributed database (e.g., Firestore / Cloud SQL). The architecture isolates data access functions (`loadDocuments`, `saveDocuments`) so swapping to an ORM or Cloud SDK requires modifying only two helper functions.

---

### Decision 3: Explicit Role-Based Access Control (RBAC) with Persona Switching

- **What was chosen**: Strict three-tier permission model (**Owner**, **Editor**, **Viewer**) verified on the server-side, coupled with a frontend persona switcher.
- **Why it was prioritized**:
  1. **Reviewer Testability**: In typical enterprise apps, testing multi-user authorization requires opening multiple browsers or creating dummy accounts. The persona switcher allows reviewers to verify permission walls (e.g., Viewer locked out from editing, Editor permitted to edit but forbidden from deleting, Owner possessing exclusive deletion and sharing rights) with zero friction.
  2. **Defense in Depth**: Even if client-side UI controls are manipulated, every REST endpoint (`PUT /api/documents/:id`, `DELETE /api/documents/:id`, `POST /api/documents/:id/share`, `POST /api/documents/:id/revisions/:revId/restore`) validates the actor's permission token and returns `403 Forbidden` if unauthorized.
- **Trade-off**: The simulated persona switcher is intended for local verification and review environments. In production, this layer connects to corporate SSO / OpenID Connect (OIDC) session tokens.

---

### Decision 4: Multi-Format File Ingestion (Markdown, Plain Text, HTML, JSON)

- **What was chosen**: Server-side parsing pipeline converting `.md` (via `marked`), `.txt`, `.html`, and `.json` into editable document nodes or reference attachments.
- **Why it was prioritized**:
  1. **Engineering Workflows**: Engineering and product teams rarely draft documents completely from scratch; they frequently need to import existing READMEs, RFCs, release notes, or raw meeting notes.
  2. **Two-Way Utility**: In addition to importing files into active documents, the application provides one-click export into clean Markdown (`.md`), HTML (`.html`), and Plain Text (`.txt`).
- **Trade-off**: Binary files (PDFs, images) are attached as reference downloads rather than parsed into editable text, preserving visual fidelity.

---

### Decision 5: Built-in Native Test Harness (`node:test` + `tsx`)

- **What was chosen**: Node.js built-in test runner (`node:test`, `node:assert/strict`) run via `tsx`.
- **Why it was prioritized**:
  1. **Minimal Dependencies & Execution Speed**: Runs in under 3 seconds without Babel/Jest configuration bloat.
  2. **Full TypeScript Support**: Direct execution of TypeScript test files with no transpilation step.
  3. **High Test Surface**: 21 tests covering unit validators, HTTP lifecycle, RBAC enforcement, file import conversions, and revision rollbacks.
- **Trade-off**: Does not include headless browser UI testing (e.g. Playwright/Cypress), which would introduce significant CI run-time overhead.

---

## 3. System Architecture Diagram

```
+--------------------------------------------------------------------------+
|                              CLIENT (Browser)                            |
|                                                                          |
|  +------------------------+  +---------------------+  +---------------+  |
|  |     Navbar & Persona   |  |   Toolbar & Status  |  |  Side Outline |  |
|  +------------------------+  +---------------------+  +---------------+  |
|  |                                                                    |  |
|  |                EditorCanvas (US-Letter Sheet Layout)               |  |
|  |          - Real-time word count & reading time                     |  |
|  |          - Debounced Auto-Save (700ms)                             |  |
|  |          - Read-only enforcement for 'viewer' role                 |  |
|  +--------------------------------------------------------------------+  |
|         |                            |                         |         |
|         v                            v                         v         |
|  +-------------------+      +------------------+     +----------------+  |
|  |  ShareModal (RBAC)|      | FileUploadModal  |     | VersionHistory |  |
|  +-------------------+      +------------------+     +----------------+  |
+--------------------------------------------------------------------------+
                                       |
                           HTTP REST / multipart
                                       |
                                       v
+--------------------------------------------------------------------------+
|                              EXPRESS SERVER                              |
|                                                                          |
|  +--------------------------------------------------------------------+  |
|  |                RBAC & Input Validation Middleware                  |  |
|  |   - Title length (<= 250), content string check                    |  |
|  |   - Email regex, valid role ('editor' | 'viewer')                  |  |
|  |   - Multer 15MB file size limit & mime check                       |  |
|  |   - Owner vs Editor vs Viewer permission gate                      |  |
|  +--------------------------------------------------------------------+  |
|         |                     |                    |            |        |
|         v                     v                    v            v        |
|  +---------------+   +-----------------+   +------------+  +-----------+ |
|  | Document CRUD |   | Sharing Manager |   | File Parse |  | AI Assist | |
|  | & Revisions   |   | (Role grants)   |   | (Markdown) |  | (Gemini)  | |
|  +---------------+   +-----------------+   +------------+  +-----------+ |
|         |                                                       |        |
|         v                                                       v        |
|  +-------------------------------------+             +----------------+  |
|  | Atomic Disk Storage (documents.json)|             | Google GenAI   |  |
|  | + /public/uploads/ (Attachments)    |             | (Gemini Flash) |  |
|  +-------------------------------------+             +----------------+  |
+--------------------------------------------------------------------------+
```

---

## 4. Future Scaling Roadmap

1. **Real-time Concurrent Collaboration**: Integrate Yjs or Automerge with WebSockets to enable multi-cursor presence and real-time character-level collaboration across distributed clients.
2. **Cloud Object Storage**: Transition `/public/uploads` to Google Cloud Storage (GCS) or S3 signed URLs for multi-gigabyte attachments.
3. **Database Migration**: Move `/data/documents.json` to Google Cloud Firestore or PostgreSQL with Row-Level Security (RLS) for multi-region distribution.
