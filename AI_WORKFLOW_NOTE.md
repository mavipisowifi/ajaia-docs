# AI-Native Workflow Note: Ajaia Docs

## 1. Which AI Tools Were Used

In building this application within the tight 4-6 hour constraint, I utilized:
1. **Google Gemini Models (Antigravity & Gemini 3.8 Flash)**: Used as the core engineering copilot for architectural boilerplate scaffolding, drafting test assertions (`node:test`), generating TypeScript types/interfaces, and powering the in-app AI assistant server endpoint.
2. **Context-Aware Coding Agents**: Used for iterative file updates, rapid cross-file refactoring (e.g. syncing RBAC types between `types.ts`, `server.ts`, and React components), and running verification loops (`tsc --noEmit` and test execution).

---

## 2. Where AI Materially Sped Up the Work

- **Boilerplate & Seed Data Generation**: Creating rich, realistic seed documents (Technical Specifications, Discovery Notes, RFCs) and representative team personas (*Elena, Marcus, Sarah, David*) with cross-document shares and realistic revision logs would have taken 45–60 minutes manually. AI generated coherent seed fixtures in minutes.
- **Test Matrix Generation**: Scaffolded 21 comprehensive automated tests across three distinct suites (`test/validation.test.ts`, `test/api.test.ts`, `test/features.test.ts`), covering tricky edge cases like 250-character title boundary conditions, regex email validity, multipart file ingestion, and multi-tier RBAC permission escalation.
- **Semantic HTML Converter Scaffolding**: Rapidly drafted the Markdown-to-HTML parser and sanitization rules for incoming files (`.md`, `.txt`, `.html`, `.json`).
- **CSS / UI Component Polish**: Rapid implementation of the Google Docs aesthetic—including the measurement ruler, US-Letter page margins, floating bottom status dock, and dropdown menus—accelerated by AI utility-class synthesis.

---

## 3. What AI-Generated Output Was Changed or Rejected

- **Rejected: Overly Complex WYSIWYG Frameworks (Draft.js / Slate.js)**:
  - *Initial AI Suggestion*: The agent initially suggested installing heavy external rich-text editor libraries like Slate or Draft.js.
  - *My Engineering Decision*: I rejected this because heavy editor frameworks introduce opaque AST state trees, balloon bundle sizes, and break easy copy-paste interoperability. Instead, I directed the implementation toward a lightweight, native `contentEditable` architecture using standard DOM selection and semantic tags (`h1`, `h2`, `h3`, `ul`, `ol`, `blockquote`, `pre`), which mapped cleanly to Markdown/HTML ingestion and ensured zero bundle bloat.
- **Rejected: In-Memory Only or Ephemeral Mock State**:
  - *Initial AI Suggestion*: AI initially suggested simple React memory state without disk persistence to save time.
  - *My Engineering Decision*: I rejected this because the assignment explicitly requires robust persistence and testable multi-user state. I implemented an atomic filesystem persistence layer (`fs.writeFileSync(tmp) -> fs.renameSync(tmp, dest)`) to prevent data corruption during container restarts while avoiding third-party database overhead for reviewers.
- **Corrected: Unchecked Role Escalation & Partial Authorization**:
  - *Issue*: Early AI-generated sharing code allowed any authenticated caller to modify collaborator roles.
  - *Correction*: Enforced strict server-side RBAC validation: only document **Owners** can invite or modify roles; **Viewers** are blocked (`403 Forbidden`) from modifying content, uploading attachments, or restoring revisions; **Editors** can modify content but cannot delete documents or alter shares.

---

## 4. How Correctness, UX Quality, and Implementation Reliability Were Verified

1. **Automated Regression Suite (`npm test`)**:
   - 21 automated integration and unit tests running against an ephemeral HTTP socket verify API contracts, input bounds, status codes (`200`, `201`, `400`, `403`, `404`, `413`), and RBAC permission barriers.
2. **Type Safety & Linter Verification (`npm run lint`)**:
   - Zero-tolerance TypeScript checks (`tsc --noEmit`) to verify that all component props, API payloads, and database models are strictly typed without `any` regressions.
3. **Interactive Multi-Persona Auditing**:
   - Verified the end-to-end UX by switching personas directly in the UI:
     - As **Elena (Owner)**: Confirmed full edit, share, and delete capabilities.
     - As **David (Viewer)**: Confirmed that formatting tools are disabled, the canvas is set to `contentEditable="false"`, warning banners appear, and direct API edit attempts return `403`.
4. **File Ingestion & Export Fidelity**:
   - Tested drag-and-drop ingestion of Markdown and Plain Text files, verifying correct DOM rendering, outline generation, and one-click export back to `.md`, `.html`, and `.txt`.
