# Requirements: AI Resume Adapt IDE

## 1. Project Overview
A user-friendly web application inspired by **DevToys** and **Cursor**. The app allows users to "adapt" a **Main Resume** into a tailored **Job-Specific Resume** using AI. The core interaction is a collaborative, diff-based review flow where AI-suggested changes are reviewed and "committed" by the user.

## 2. Technical Stack & Vibe
* **Aesthetic:** "Sleek Utility" – Deep Purple (#6246ea) and Dark Charcoal background.
* **Format:** All internal data and exports handled as **Markdown**.
* **Core SDKs:** `llama-cloud-services` (Parsing), `diff` (Review Flow).
* **UI Influence:** Windows DevToys (Sidebar/Cards) and Cursor IDE (Inline Diffs).
* **Database:** Persists one `Main Resume` and multiple `Job Postings`.

---

## 3. Ingestion & Onboarding (Phase 0)
Users can initialize their "Main Resume" via three pathways. All files are processed into clean Markdown before saving to the DB.

### Pathway A: PDF/DOCX Upload
* **Service:** LlamaParse (LlamaCloud).
* **Config:** `resultType: "markdown"`, `language: "en"`.
* **Logic:** 
    * User uploads file -> Sent to `LlamaParseReader`.
    * LlamaParse extracts text, tables, and headers into structured MD.
    * Output is presented to the user for one-time verification.

### Pathway B: Manual Paste
* **Logic:** Direct textarea input.
* **AI Cleanup:** A dedicated "Cleanup Agent" formats the raw text into the project's standard Markdown schema (H1 for name, H2 for sections).

---

## 4. UI Component Architecture
### A. The Explorer (Left Sidebar)
* **Project Brand:** Small logo/icon at the top left.
* **Search Bar:** Filter through saved job postings.
* **Main Resume Section:** A pinned "Main Resume" item with a subtle purple glow.
* **Job Postings List:** A vertical list of jobs (e.g., `Meta - Sr. Engineer`) with status badges: `DRAFT`, `MERGED`, `EXPORTED`.

### B. The Workbench (Center Pane)
* **JD Staging Area:** A collapsible textarea at the top (hidden when editing main resume). 
    * *Input:* Paste Job Description here. 
    * *Trigger:* An "Adapt Resume" button with a ✨ icon.
* **The Diff Editor:** The heart of the app.
    * **Always Editable:** Main resume editor is always available for direct editing.
    * **Auto-save:** Changes are automatically saved with debouncing (500ms delay).
    * **Monospace Font:** (e.g., JetBrains Mono, Fira Code).
    * **Visual Diffs:** * `Removal`: Muted red background with strikethrough.
        * `Addition`: Vibrant green background (Cursor-style).
* **Floating Action Bar (Agent UI):** Appears during active diff review at the bottom of the editor.
    * Buttons: `Undo (Esc)`, `Regenerate`, `Keep (Cmd+Enter)`.

### C. The Preview (Right Pane)
* **Live Renderer:** A read-only HTML preview of the current Markdown state.
* **Sync Scroll:** The preview should scroll in sync with the Markdown editor.

---

## 5. AI Adapt Engine Logic
### System Role
"You are a Senior Career Refactor Agent. Your task is to modify a Markdown-formatted Base Resume to align with a provided Job Description."

### Transformation Rules
1.  **Keyword Injection:** Align technical skills exactly with JD terminology.
2.  **Bullet Prioritization:** Reorder experience to lead with JD-relevant accomplishments.
3.  **Markdown Integrity:** Strictly maintain the existing document structure.
4.  **No Hallucinations:** Never add fake dates or job titles.

---

## 6. V1 Roadmap

### Phase 0: Ingestion (The Gateway)
* [ ] Setup `llama-cloud-services` with API Key.
* [ ] Implement File Upload (PDF/DOCX) using LlamaParse.
* [ ] Create "Save to Main Resume" workflow to persist the initial Markdown.
* [ ] Implement AI Cleanup Agent for manual paste formatting.

### Phase 1: IDE Shell ✅
* [x] Initialize UI with Tailwind (Deep Purple/Charcoal).
* [x] Build 3-column layout (Sidebar, Workbench, Preview).
* [x] Main Resume Storage: CRUD for the "Main Resume" Markdown with auto-save.
* [x] User-friendly terminology: "Adapt Resume" instead of "Refactor", "Main Resume" instead of "Master", "Job Postings" instead of "Forks".

### Phase 2: The Adapt Pipeline ✅
* [x] JD Input UI: Build the DevToys-style collapsible input textarea.
* [x] Connect JD Input to the Adapt AI Agent (Gemini API).
* [x] Implement `diff` library to generate the visual comparison.
* [x] Basic Output: Render the AI response directly into the editor.

### Phase 3: Review & Export ✅
* [x] Build the Floating Agent Bar for Accept/Reject flow (Keep/Undo/Regenerate).
* [x] Diff Rendering: Stylize additions (green) and deletions (red) in the editor.
* [x] Resolve Flow: Implement "Keep" and "Undo" logic to finalize the Markdown.
* [x] Keyboard Shortcuts: Esc for Undo, Cmd+Enter for Keep.
* [x] Add "Export as .md" and "Copy to Clipboard" features.
* [x] Job Posting Management: Save each tailored resume version as a unique DB entry linked to a JD.
* [x] Status Management: Auto-update status (DRAFT → MERGED → EXPORTED).

---

## 7. Recent Improvements
* **Always-available Editor:** Main resume editor is always visible and editable, no button needed to start editing.
* **Smart UI Hiding:** Job Description area automatically hides when editing main resume to reduce clutter.
* **Debounced Auto-save:** Prevents cursor jumping by using local state and debouncing API calls (500ms).
* **Welcome Messages:** Helpful onboarding messages guide users when starting fresh.
* **Better Placeholders:** Clear instructions in empty states help users understand what to do.
