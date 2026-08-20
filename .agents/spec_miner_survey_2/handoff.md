# Comprehensive Specification Report: Requirements R3 & R4
**Author**: `spec_miner_survey_2` (Specification Investigator)  
**Target Project**: Welcome Back Atlas  
**Subject**: In-Depth Specification Mining for R3 (Individualized Learn Tab) & R4 (Projects Tab: Timeline/Gantt, Kanban, Overlays, and AI Auto-Roadmap)  
**Date**: 2026-08-20  

---

## Executive Summary
This document provides an exhaustive, authoritative specification for **Requirement 3 (Individualized Learn Tab)** and **Requirement 4 (Projects Tab with Timeline/Gantt & Kanban)** of the **Welcome Back Atlas** web application. It specifies full data contracts, interaction state machines, UI/UX wireframes, real-time WebSocket protocol messages, edge cases, error fallbacks, and acceptance verification criteria.

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| F1 | R3: Learn Tab | 2-Pane Split Wireframe Layout | Responsive split-pane layout: Left pane displays assigned tasks/projects with completion checkboxes and filters; Right pane displays the active doc reader. | Left pane task click, resize handle, viewport dimensions. | Synchronized 2-pane view with active task & linked doc highlighted. | Fallback to stacked single column on mobile (< 768px). | ORIGINAL_REQUEST.md § R3 |
| F2 | R3: Learn Tab | Task Checklist & Topic Filter (Left Pane) | Left sidebar list of tasks with completion checkboxes, filterable by assignee (`Cam`, `Liam`, `Alex`, `All`) and topic tags (e.g. `System Design`, `Tailwind`, `WebSocket`). | Filter select, topic badge click, search query string, checkbox toggle. | Filtered list of project tasks with completion progress indicator (e.g., 2/5 subtasks). | Shows friendly "No tasks found matching filter" empty state card. | ORIGINAL_REQUEST.md § R3 |
| F3 | R3: Learn Tab | Top Resource Preview Banner Card (Right Pane) | Hero banner at top of doc reader displaying media preview (article link, video thumbnail embed, interactive sandbox link, domain badge, estimated read time). | `previewBanner` metadata object from linked doc. | Rendered card with clickable external link, thumbnail image/video player embed. | Fallbacks to default topic placeholder graphic if image/thumbnail fails to load. | ORIGINAL_REQUEST.md § R3 |
| F4 | R3: Learn Tab | AI Relevance Reasoning Section (Right Pane) | Prominent callout card explaining *why* this document matches the selected project (e.g. client proposal match, technology stack alignment, role-specific guide). | Doc metadata, task context, client requirements context. | Styled AI badge card with bulleted matching factors & relevance score/summary. | If no custom AI reasoning exists, generates instant heuristic match reason based on tags & assignee role. | ORIGINAL_REQUEST.md § R3 |
| F5 | R3: Learn Tab | Rich Markdown Doc Reader with Step-by-Step Guidelines | Full markdown renderer with formatted headers, code syntax highlighting, copy-code button, callout boxes (Tip, Warning, Info), and interactive step checkboxes. | `contentMarkdown` string, `steps` array. | Beautifully styled documentation view with sticky TOC and step completion tracking. | Sanitizes raw HTML to prevent XSS; graceful markdown parse error fallback. | ORIGINAL_REQUEST.md § R3 |
| F6 | R3: Learn Tab | "AI Generate Guide" Button & Gemini Integration | Action button allowing users to generate a customized, step-by-step technical guide for any task using Gemini API (or built-in fallback), costing AI credits. | Task ID, custom prompt/focus, Gemini API key, user credit balance. | Newly generated `LearningDoc` object with step-by-step markdown, attached to task and stored in DB. | If 0 credits: opens credit top-up modal. If Gemini API missing/error: falls back to built-in template library with notification. | ORIGINAL_REQUEST.md § R3, R5 |
| F7 | R4: Projects Tab | Timeline / Gantt Roadmap View (Default View) | Interactive horizontal time axis (Days/Weeks view) displaying project task bars with start and end dates, progress fill, and assignee avatars. | Tasks array, date zoom level ('Day' \| 'Week'), active assignee filter. | Rendered Gantt grid with today line marker, date headers, and task bars. | Handles tasks with missing dates by defaulting to `today` -> `today + 3 days`. | ORIGINAL_REQUEST.md § R4 |
| F8 | R4: Projects Tab | Draggable Date Range Bars | Users can click-and-drag task bars horizontally across the timeline to shift both `startDate` and `endDate` simultaneously while preserving duration. | Mouse drag / Touch drag event (delta X pixels converted to date offset). | Updated task dates in state, real-time tooltip with new date range, WebSocket broadcast on drop. | Snaps to nearest 1-day boundary; prevents dragging into invalid negative date domains. | ORIGINAL_REQUEST.md § R4 |
| F9 | R4: Projects Tab | Stretchable Date Range Handles (Resize Start/End) | Interactive resize handles on left (start date) and right (end date) of each Gantt bar to adjust task duration dynamically. | Drag on left/right handle (delta X pixels). | Dynamically resized bar with live date indicator tooltip, committed on mouseup. | Enforces minimum duration of 1 day (`startDate <= endDate`); automatically stops left handle if hitting right handle. | ORIGINAL_REQUEST.md § R4 |
| F10 | R4: Projects Tab | Kanban Board Toggle View | Segmented control toggle switching between Timeline/Gantt and Kanban Board with 4 standard columns: `Backlog`, `In Progress`, `In Review`, `Done`. | View mode toggle ('timeline' \| 'kanban'). | Rendered 4-column kanban board with card count badges, task cards, and quick-add buttons. | Preserves active assignee filter and search state when toggling between views. | ORIGINAL_REQUEST.md § R4 |
| F11 | R4: Projects Tab | Kanban Drag-and-Drop Card Movement | Interactive card drag-and-drop between columns to change task status in real time. | Drag card onto target column container. | Task status updated (`status` property), card moved to target column, WebSocket event emitted. | Returns card to original column with error toast if backend persistence fails. | ORIGINAL_REQUEST.md § R4 |
| F12 | R4: Projects Tab | Assignee Filter System | Top filter bar (`All | Cam | Liam | Alex`) with profile avatars to filter tasks across both Timeline and Kanban views. | Filter button click. | Re-filtered views showing only tasks assigned to the selected member (or all). | Shows empty state placeholder if an assignee has no assigned tasks. | ORIGINAL_REQUEST.md § R4 |
| F13 | R4: Projects Tab | Expanded Project Detail Overlay (Modal / Drawer Layer) | Clicking *any* task in Timeline or Kanban opens a slide-over drawer or modal above the view containing full details (description, dates, subtasks, doc link, activity). | Task click on Gantt bar or Kanban card. | Layered overlay modal/drawer with editable fields, subtask checklist, and attached doc shortcut. | Dismissible via ESC key, backdrop click, or close button; auto-saves on blur/change. | ORIGINAL_REQUEST.md § R4 |
| F14 | R4: Projects Tab | Attached Learning Doc Shortcut in Overlay | Direct interactive link inside project overlay connecting the task to its dedicated learning doc with 1-click navigation to Learn Tab. | Click "Open Learning Guide" or "Attach Guide". | Seamlessly switches active tab to Learn Tab and loads the attached document into the right pane. | If no doc attached, displays "Generate Guide with AI" button directly in overlay. | ORIGINAL_REQUEST.md § R4 |
| F15 | R4: Projects Tab | AI Auto-Roadmap Generator | Dedicated AI tool turning high-level project prompts (e.g. "Build Stripe subscription checkout with Webhook handlers") into a full set of roadmap tasks with dates & assignees. | Natural language prompt, target duration, team members list, credit check. | Generates 4-8 structured roadmap tasks with pre-populated subtasks, dates, assignees, and attached guides. | Deducts credits (e.g., 20 credits); falls back to rich deterministic roadmap generator if offline/no key. | ORIGINAL_REQUEST.md § R4 |
| F16 | Real-Time Sync | WebSocket Broadcast for Projects & Docs | Real-time synchronization of all task movements, date adjustments, status changes, subtask toggles, and doc edits across all connected clients. | Client action emitting Socket.io event (`task:update`, `task:move`, etc.). | Instant DOM update on all other connected clients without page reload. | Automatic reconnection with exponential backoff and state reconciliation on reconnect. | ORIGINAL_REQUEST.md § R1, R4 |

---

## Edge Cases

| # | Feature | Input / Condition | Observed / Required Behavior |
|---|---|---|---|
| E1 | Timeline Date Drag | User drags task bar to the left past the minimum visible timeline start date. | Clamps drag position to timeline bounds; auto-scrolls timeline horizontally if dragging near viewport edge (auto-scroll buffer). |
| E2 | Timeline Date Stretch | User drags the right handle (End Date) to the left past the Start Date. | Enforces minimum duration invariant: clamp `endDate` at `startDate` (1-day minimum duration); does not invert start/end dates. |
| E3 | Timeline Concurrent Drag | Two users (e.g. Cam and Liam) simultaneously drag the same task bar on different devices. | Last-write-wins with optimistic UI update. Socket.io `task:update` updates all clients with server-validated timestamp. |
| E4 | Kanban Multi-Device Move | User A drags task from "Backlog" to "In Progress" while User B deletes or edits the task. | Socket.io server checks task existence. If deleted, sends `task:deleted` notification and removes card from User A's board gracefully. |
| E5 | Learn Tab Empty State | Assignee filter selected has 0 assigned tasks, or search query matches nothing. | Renders high-fidelity empty state with illustration, "No matching tasks found" text, and "Clear filters" or "Create new task" CTA button. |
| E6 | Learn Tab Task Without Doc | User clicks a task in the Left Pane that does not yet have an attached learning guide. | Right pane displays a "No Guide Attached" state with a 1-click "✨ Generate AI Guide for this Task" button pre-configured with the task title & tags. |
| E7 | AI Guide Generation (0 Credits) | User clicks "AI Generate Guide" but credit balance is 0. | Generation is blocked; an attractive "Insufficient Credits" modal appears offering a 1-click credit top-up or instructions to add a Gemini API key in Settings. |
| E8 | AI Guide Generation (No API Key / Network Error) | User requests AI Guide without a Gemini API key or when network request to Google API fails. | Seamlessly activates built-in rich template fallback engine that generates a structured, professional markdown guide matching the task's domain. Notification informs user: "Generated using built-in guide template". |
| E9 | Auto-Roadmap Generation Validation | User submits an empty or whitespace-only prompt to the AI Auto-Roadmap generator. | Inline validation error: "Please enter a project description or goals (min 10 characters)." Submit button remains disabled. |
| E10 | Project Overlay Subtask Progress Sync | User checks/unchecks subtasks inside the Project Overlay modal. | Progress bar in Overlay and Kanban/Timeline card recalculates dynamically (e.g., 3/4 = 75%). When all subtasks are checked, prompts to move task to "Done". |
| E11 | Rich Markdown XSS / Injection | Malicious or malformed markdown containing `<script>` or raw HTML tags loaded in Doc Reader. | Markdown renderer utilizes DOMPurify / ReactMarkdown with sanitized schema, preventing script execution and iframe injection while preserving safe formatting and code highlighting. |
| E12 | Mobile Viewport (< 768px) | User accesses Learn Tab or Projects Tab on a mobile/tablet screen. | Learn Tab converts 2-pane split into a Master-Detail view with a back button ("← Back to Tasks"). Timeline adds horizontal touch scroll; Kanban supports touch swipe column navigation. |

---

## In-Depth Requirement Analysis

### 1. Requirement R3: Individualized Learn Tab

#### 1.1 Architectural Concept & User Experience
The **Learn Tab** serves as an intelligent, contextual engineering and design documentation hub tailored for **Cam**, **Liam**, and **Alex**. Rather than being a static wiki, it is dynamically linked to the team's active roadmap tasks. When a team member works on a task (e.g., "Implement Stripe Webhook Handler" or "Design System Token Integration"), the Learn Tab provides the exact technical specifications, architectural patterns, media previews, and step-by-step checklists required to complete the task.

#### 1.2 Layout & Component Specifications (2-Pane Wireframe)
```
+-----------------------------------------------------------------------------------------------------------------------+
|  LEARN TAB                                                                     [ ⚡ 80 AI Credits ] [ + New Doc ]     |
+-----------------------------------------------------------------------------------------------------------------------+
|  [ Filter: All | Cam | Liam | Alex ]   [ Tag: All | System Design | UI/UX | API | Auth ]   [ 🔍 Search tasks/docs... ]  |
+-------------------------------------------------------------+---------------------------------------------------------+
|  LEFT PANE: Assigned Tasks (35% Width)                     |  RIGHT PANE: Documentation Reader (65% Width)           |
|                                                             |                                                         |
|  +-------------------------------------------------------+  |  +---------------------------------------------------+  |
|  | [X] Implement Real-Time Sync               [Cam] [Done]|  |  | MEDIA PREVIEW BANNER CARD                         |  |
|  |     Tags: #websocket #nodejs #sqlite                  |  |  | [Thumbnail / Video / Link Preview]                |  |
|  |     Progress: [====================] 4/4 subtasks     |  |  | "Socket.io Architecture & SQLite WAL Tutorial"    |  |
|  +-------------------------------------------------------+  |  | Domain: dev.to/websockets | Read: 8 min           |  |
|                                                             |  +---------------------------------------------------+  |
|  +-------------------------------------------------------+  |                                                         |
|  | [ ] Design System Tokens & Avatars       [Alex] [Prog]|  |  +---------------------------------------------------+  |
|  |     Tags: #tailwind #figma #ui                        |  |  | 🤖 AI RELEVANCE REASONING (Why this doc matches)  |  |
|  |     Progress: [==========..........] 2/4 subtasks     |  |  | • Matched to Alex's Design System milestone.      |  |
|  +-------------------------------------------------------+  |  | • Tailored for Tailwind CSS v4 color tokens.      |  |
|                                                             |  | • Relevance Score: 98% Match                      |  |
|  +-------------------------------------------------------+  |  +---------------------------------------------------+  |
|  | [ ] Gemini API Integration & Fallback      [Liam] [Back]|  |                                                         |
|  |     Tags: #gemini #ai #api                            |  |  # Building Resilient AI Features with Gemini 1.5       |
|  |     Progress: [....................] 0/3 subtasks     |  |  *Last updated: Today by Liam | Difficulty: Intermediate*|
|  +-------------------------------------------------------+  |                                                         |
|                                                             |  ### Step-by-Step Implementation Guide                   |
|                                                             |  [X] Step 1: Initialize GoogleGenAI client with API key |
|                                                             |  [ ] Step 2: Implement prompt engineering & schemas     |
|                                                             |  [ ] Step 3: Implement graceful template fallback       |
|                                                             |                                                         |
|                                                             |  ```typescript                                          |
|                                                             |  import { GoogleGenerativeAI } from "@google/genai";    |
|                                                             |  const ai = new GoogleGenerativeAI(apiKey);             |
|                                                             |  ```                                                    |
|                                                             |                                                         |
|                                                             |  [ ✨ AI Generate Guide (⚡ 10 Credits) ] [ ✏️ Edit Doc ]|
+-------------------------------------------------------------+---------------------------------------------------------+
```

#### 1.3 Detailed Sub-Features of Learn Tab
1. **Left Pane — Task Linking & Filtering Engine**:
   - Fetches all project tasks from the unified store.
   - Assignee filter buttons (`All`, `Cam`, `Liam`, `Alex`) with active user badge.
   - Tag filter dropdown / horizontal chip list (dynamically generated from unique task tags).
   - Real-time text search filtering across task titles, descriptions, and tags.
   - Checkbox next to each task allows toggling task completion directly from the Learn tab without switching to Projects.
   - Active task highlighting with subtle primary border and background tint.
2. **Right Pane — Media/Resource Preview Banner Card**:
   - Displays rich media card at top of document.
   - Supports:
     * Video preview: Embedded YouTube/Vimeo/MP4 player or clickable preview card with duration.
     * Article preview: OpenGraph card with site favicon, domain, banner image, author, and reading time.
     * Interactive Code Sandbox / Design Template preview link.
3. **Right Pane — AI Relevance Section**:
   - Explains *why* this document is curated for this task and assignee.
   - Structure:
     * Matching tags (e.g. `WebSocket`, `Full-Stack`, `Security`).
     * Assignee role context (e.g. "Liam is handling backend data layers, so this guide highlights SQLite connection pooling").
     * Client specification match (e.g. "Directly fulfills Requirement R1 multi-device sync").
     * Relevance badge with visual indicator (High Match: 95%+).
4. **Right Pane — Rich Markdown Reader & Interactive Step Guide**:
   - Formatted headings (`#`, `##`, `###`), blockquotes, bullet lists, numbered lists, and markdown tables.
   - Syntax-highlighted code blocks with language badge and 1-click "Copy Code" button with visual feedback ("Copied!").
   - Interactive step checkboxes embedded in the guide: Checking a step saves completion state to the database and syncs to all clients.
   - Admonition callouts (💡 Tip, ⚠️ Warning, ℹ️ Note, 🚀 Best Practice).
5. **Right Pane — "AI Generate Guide" Flow**:
   - Button located in the header/footer of the reader pane: `[ ✨ AI Generate Guide (⚡ 10 Credits) ]`.
   - Clicking opens generation modal allowing optional prompt refinement (e.g. "Focus on error handling and unit tests").
   - Triggers API call to `/api/ai/generate-guide`:
     * Validates credit balance (deducts 10 credits).
     * If Gemini API key is configured: calls `gemini-1.5-flash` or `gemini-1.5-pro` with structured output prompt.
     * If Gemini API key is not configured or fails: seamlessly runs deterministic template generator providing high quality pre-built guide.
     * Returns generated `LearningDoc` and automatically attaches it to the active task.
     * Emits `doc:created` and `credits:updated` over Socket.io.

---

### 2. Requirement R4: Projects Tab (Timeline/Gantt, Kanban, Overlays, and AI Auto-Roadmap)

#### 2.1 Architectural Concept & User Experience
The **Projects Tab** is the central project management engine for Welcome Back Atlas. It provides dual interactive views (Timeline/Gantt and Kanban) that share 100% of the underlying task data model. Any mutation in Timeline (e.g., stretching end date by 3 days) immediately reflects in Kanban and in the Project Overlay, and broadcasts instantly to all connected team members via WebSockets.

#### 2.2 Layout & Component Specifications

##### 2.2.1 Default View: Timeline / Gantt Roadmap
```
+-----------------------------------------------------------------------------------------------------------------------+
|  PROJECTS TAB      [ 📅 Timeline (Default) | 📋 Kanban ]      [ All | Cam | Liam | Alex ]    [ ✨ AI Auto-Roadmap ]    |
+-----------------------------------------------------------------------------------------------------------------------+
|  Time Scale: [ Days | Weeks ]    Range: Aug 18 - Aug 31, 2026                         [ Today: Aug 20, 2026 ]        |
+------------------------------------+----------------------------------------------------------------------------------+
| Task Name / Assignee               | Aug 18 | Aug 19 | Aug 20 (TODAY) | Aug 21 | Aug 22 | Aug 23 | Aug 24 | Aug 25   |
+------------------------------------+--------+--------+----------------+--------+--------+--------+--------+----------+
| Cam: Real-Time WebSocket Sync      | [=======================]        |        |        |        |        |          |
|      (In Progress • 75%)           | <drag>                 <stretch> |        |        |        |        |          |
+------------------------------------+--------+--------+----------------+--------+--------+--------+--------+----------+
| Alex: Design System & Avatars      |        | [================================]        |        |        |          |
|      (In Progress • 50%)           |        | <drag>                          <stretch> |        |        |          |
+------------------------------------+--------+--------+----------------+--------+--------+--------+--------+----------+
| Liam: Gemini Credit Engine         |        |        | [=========================================]        |          |
|      (Backlog • 20%)               |        |        | <drag>                                   <stretch> |          |
+------------------------------------+--------+--------+----------------+--------+--------+--------+--------+----------+
| Team: E2E Integration Testing      |        |        |                |        |        | [========================] |
|      (Backlog • 0%)                |        |        |                |        |        | <drag>                  <s|
+------------------------------------+--------+--------+----------------+--------+--------+--------+--------+----------+
```

##### 2.2.2 Toggle View: Kanban Board
```
+-----------------------------------------------------------------------------------------------------------------------+
|  PROJECTS TAB      [ 📅 Timeline | 📋 Kanban (Active) ]      [ All | Cam | Liam | Alex ]    [ ✨ AI Auto-Roadmap ]    |
+-----------------------------------------------------------------------------------------------------------------------+
|  BACKLOG (3)                 |  IN PROGRESS (2)            |  IN REVIEW (1)              |  DONE (4)                  |
|  [ + Add Task ]              |  [ + Add Task ]             |  [ + Add Task ]             |  [ + Add Task ]            |
+------------------------------+-----------------------------+-----------------------------+----------------------------+
| +--------------------------+ | +-------------------------+ | +-------------------------+ | +------------------------+ |
| | Gemini Credit Engine     | | | Real-Time Sync Engine   | | | Profile Switcher UI     | | | Initial Project Setup  | |
| | Assignee: [Liam]         | | | Assignee: [Cam]         | | | Assignee: [Alex]        | | | Assignee: [Cam]        | |
| | Due: Aug 24 • #ai #api   | | | Due: Aug 20 • #socket   | | | Due: Aug 19 • #react    | | | Due: Aug 18 • #setup   | |
| | Subtasks: 1/4 [===.....] | | | Subtasks: 3/4 [======.] | | | Subtasks: 3/3 [=======] | | | Subtasks: 2/2 [======] | |
| | 📖 Doc: Gemini Guide     | | | 📖 Doc: WebSocket Arch  | | | 📖 Doc: Avatars Guide   | | | 📖 Doc: Architecture   | |
| +--------------------------+ | +-------------------------+ | +-------------------------+ | +------------------------+ |
|                              |                             |                             |                            |
| +--------------------------+ | +-------------------------+ |                             |                            |
| | E2E Testing Suite        | | | Design System Tokens    | |                             |                            |
| | Assignee: [Cam]          | | | Assignee: [Alex]        | |                             |                            |
| | Due: Aug 26 • #qa        | | | Due: Aug 22 • #tailwind | |                             |                            |
| | Subtasks: 0/3 [........] | | | Subtasks: 2/4 [====...] | |                             |                            |
| +--------------------------+ | +-------------------------+ |                             |                            |
+------------------------------+-----------------------------+-----------------------------+----------------------------+
```

##### 2.2.3 Expanded Project Detail Overlay (Modal / Drawer Layer)
```
+---------------------------------------------------------------------------------------------------+
|  [X Close]                     TASK DETAILS: "Real-Time WebSocket Sync"                [🗑️ Delete] |
+---------------------------------------------------------------------------------------------------+
|  Title: [ Implement Real-Time WebSocket Multi-Device Sync Engine_________________________ ]       |
|                                                                                                   |
|  Assignee: [ (Avatar) Cam v ]     Status: [ In Progress v ]     Priority: [ 🔥 High v ]           |
|                                                                                                   |
|  Dates: Start [ 2026-08-18 📅 ]  -->  End / Due [ 2026-08-20 📅 ]  (Duration: 3 days)             |
|                                                                                                   |
|  Description:                                                                                     |
|  +---------------------------------------------------------------------------------------------+  |
|  | Build Node.js + Express + Socket.io backend with SQLite persistent storage. Broadcast all    |  |
|  | task movements, profile switches, and doc updates in real time.                              |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
|  Checklist Subtasks (3/4 Completed • 75%):                                                        |
|  [X] 1. Initialize Socket.io server with CORS and rooms                                          |
|  [X] 2. Set up SQLite schema with better-sqlite3 WAL mode                                        |
|  [X] 3. Implement client SocketContext and reconnection handler                                   |
|  [ ] 4. Add optimistic UI updates and conflict resolution                                        |
|  [ + Add Subtask ]                                                                                |
|                                                                                                   |
|  Attached Learning Guide:                                                                         |
|  +---------------------------------------------------------------------------------------------+  |
|  | 📖 Socket.io Architecture & SQLite WAL Tutorial                                             |  |
|  | Matched for Cam: Full-Stack Real-Time Sync • Read time: 8 min                                |  |
|  | [ ↗️ Open in Learn Tab ]   [ 🔄 Change Attached Doc ]                                         |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
|  Activity & Comments:                                                                             |
|  • [Cam] (10m ago): "Finished SQLite schema migration and verified WAL mode."                     |
|  • [Liam] (2m ago): "Tested WebSocket broadcast from second browser window, worked flawlessly!"   |
|  [ Write a comment...                                                            ] [ Post ]       |
|                                                                                                   |
|  [ Save Changes ]                                                          [ Cancel ]             |
+---------------------------------------------------------------------------------------------------+
```

#### 2.3 Interactive Behaviors & Mathematical Specs

##### 2.3.1 Gantt Timeline Drag & Stretch Math
Let $W_{day}$ be the width in pixels allocated to 1 day on the timeline grid (e.g. $40\text{px}$ in day mode, $14\text{px}$ in week mode).  
Let $T_{origin}$ be the timestamp of the timeline start date (midnight UTC).  
Let $T_{start}$ and $T_{end}$ be the task's start and end timestamps.

1. **Bar Placement Calculation**:
   $$\text{leftPx} = \frac{T_{start} - T_{origin}}{86400000} \times W_{day}$$
   $$\text{widthPx} = \left(\frac{T_{end} - T_{start}}{86400000} + 1\right) \times W_{day}$$

2. **Horizontal Bar Drag (Shift Date Range)**:
   - On pointer down: record initial $\text{clientX}_0$, initial $T_{start, 0}$, initial $T_{end, 0}$.
   - On pointer move: $\Delta X = \text{clientX} - \text{clientX}_0$.
   - $\Delta \text{Days} = \text{round}\left(\frac{\Delta X}{W_{day}}\right)$.
   - $T_{start, new} = T_{start, 0} + (\Delta \text{Days} \times 86400000)$.
   - $T_{end, new} = T_{end, 0} + (\Delta \text{Days} \times 86400000)$.
   - Optimistically update bar position during drag; emit `task:update` on pointer up.

3. **Left Handle Resize (Start Date Stretch)**:
   - $\Delta X = \text{clientX} - \text{clientX}_0$.
   - $\Delta \text{Days} = \text{round}\left(\frac{\Delta X}{W_{day}}\right)$.
   - $T_{start, candidate} = T_{start, 0} + (\Delta \text{Days} \times 86400000)$.
   - Invariant enforcement: $T_{start, new} = \min(T_{start, candidate}, T_{end})$.
   - Width updates: $\text{widthPx}_{new} = \left(\frac{T_{end} - T_{start, new}}{86400000} + 1\right) \times W_{day}$.

4. **Right Handle Resize (End Date Stretch)**:
   - $\Delta X = \text{clientX} - \text{clientX}_0$.
   - $\Delta \text{Days} = \text{round}\left(\frac{\Delta X}{W_{day}}\right)$.
   - $T_{end, candidate} = T_{end, 0} + (\Delta \text{Days} \times 86400000)$.
   - Invariant enforcement: $T_{end, new} = \max(T_{end, candidate}, T_{start})$.
   - Width updates: $\text{widthPx}_{new} = \left(\frac{T_{end, new} - T_{start}}{86400000} + 1\right) \times W_{day}$.

##### 2.3.2 Kanban Drag & Drop State Transitions
Valid column states: $S \in \{\text{'backlog'}, \text{'in\_progress'}, \text{'in\_review'}, \text{'done'}\}$.
- Dragging card from Column $A$ to Column $B$:
  * Updates task `status = B`.
  * If $B = \text{'done'}$, automatically sets progress to 100% and checks all subtasks (with confirmation or undo snackbar).
  * If $B = \text{'in\_progress'}$ and progress is 0%, updates progress to 25%.
  * Re-orders column list and emits `task:moved` event over WebSocket with `{ taskId, newStatus, newIndex }`.

##### 2.3.3 AI Auto-Roadmap Generation Flow
1. User clicks **"✨ AI Auto-Roadmap"** in Projects tab header.
2. Modal opens with:
   - Prompt input textarea: e.g. "Build a customer feedback analytics dashboard with sentiment analysis for Cam, Liam, and Alex".
   - Target duration selector: (e.g. 1 week, 2 weeks, 1 month).
   - Assignee distribution checkboxes: `[X] Cam`, `[X] Liam`, `[X] Alex`.
   - Cost preview: "⚡ Costs 20 Credits (Current Balance: 100)".
3. User clicks **"Generate Roadmap"**:
   - Client sends POST request to `/api/ai/generate-roadmap`.
   - Server deducts 20 credits from workspace balance.
   - If Gemini API key present: passes prompt to Gemini API with structured JSON schema:
     ```json
     {
       "tasks": [
         {
           "title": "string",
           "description": "string",
           "assignee": "cam" | "liam" | "alex",
           "status": "backlog" | "in_progress",
           "priority": "low" | "medium" | "high" | "urgent",
           "durationDays": number,
           "startOffsetDays": number,
           "tags": ["string"],
           "subtasks": ["string"],
           "suggestedDocTitle": "string",
           "docRelevanceReason": "string"
         }
       ]
     }
     ```
   - If Gemini API key omitted or error occurs: falls back to intelligent built-in roadmap template generator containing domain-specific project archetypes (Full-Stack Web App, Mobile App, AI Integration, E-Commerce, Design System).
4. Roadmap Preview dialog renders generated tasks with interactive edit/select toggles.
5. User clicks **"Accept & Add to Roadmap"**:
   - Backend saves all generated tasks to database in a single SQLite transaction.
   - Server emits `roadmap:created` broadcast to all connected clients.
   - Client view updates instantly to display the new roadmap bars on the Timeline.

---

## Concrete Data Models & Schema Contracts

```typescript
// ============================================================================
// Types & Interfaces for R3 (Learn Tab) & R4 (Projects Tab)
// ============================================================================

export type AssigneeId = 'cam' | 'liam' | 'alex';
export type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type DocType = 'tutorial' | 'architecture' | 'template' | 'video' | 'api_spec';
export type BannerMediaType = 'video' | 'article' | 'image' | 'interactive';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assignedTo?: AssigneeId;
}

export interface TaskComment {
  id: string;
  author: AssigneeId;
  text: string;
  createdAt: string; // ISO 8601
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  assignee: AssigneeId;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string; // ISO 8601 'YYYY-MM-DD'
  endDate: string;   // ISO 8601 'YYYY-MM-DD'
  progress: number;  // 0 - 100
  tags: string[];
  subtasks: Subtask[];
  attachedDocId: string | null;
  comments: TaskComment[];
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocStep {
  id: string;
  stepNumber: number;
  title: string;
  descriptionMarkdown: string;
  completed: boolean;
  codeSnippet?: {
    language: string;
    code: string;
  };
}

export interface PreviewBanner {
  type: BannerMediaType;
  url: string;
  thumbnailUrl: string;
  domain: string;
  title: string;
  estimatedReadTimeMinutes?: number;
  videoDurationSeconds?: number;
}

export interface AiRelevanceInfo {
  score: number; // 0 - 100 percentage
  summary: string;
  keyFactors: string[];
  matchedRequirements: string[];
}

export interface LearningDoc {
  id: string;
  title: string;
  taskId: string | null; // Linked task ID
  assignee: AssigneeId | 'all';
  tags: string[];
  readTimeMinutes: number;
  docType: DocType;
  previewBanner: PreviewBanner;
  aiRelevance: AiRelevanceInfo;
  contentMarkdown: string;
  steps: DocStep[];
  isAiGenerated: boolean;
  generatedAt?: string;
  creditCost: number;
  createdAt: string;
  updatedAt: string;
}

// Client UI State Interfaces
export interface LearnTabState {
  selectedAssignee: AssigneeId | 'all';
  selectedTag: string | null;
  searchQuery: string;
  activeTaskId: string | null;
  activeDocId: string | null;
  isGeneratingGuide: boolean;
}

export interface ProjectsTabState {
  viewMode: 'timeline' | 'kanban';
  selectedAssignee: AssigneeId | 'all';
  searchQuery: string;
  selectedPriority: TaskPriority | 'all';
  timelineScale: 'day' | 'week';
  timelineStartDate: string;
  activeOverlayTaskId: string | null; // When non-null, Drawer/Modal is open
  isGeneratingRoadmap: boolean;
}

export interface TimelineDragInteraction {
  isDragging: boolean;
  interactionType: 'move' | 'resize_start' | 'resize_end';
  taskId: string | null;
  startX: number;
  currentX: number;
  initialStartDate: string;
  initialEndDate: string;
  dayWidthPx: number;
}
```

---

## Real-Time WebSocket Protocol Messages

| Event Name | Direction | Payload Schema | Description |
|---|---|---|---|
| `task:created` | Client $\rightarrow$ Server $\rightarrow$ Clients | `{ task: ProjectTask, initiator: AssigneeId }` | New task created in Projects or via Auto-Roadmap. |
| `task:updated` | Client $\rightarrow$ Server $\rightarrow$ Clients | `{ taskId: string, updates: Partial<ProjectTask>, initiator: AssigneeId }` | Task dates dragged/stretched, title, description, or priority updated. |
| `task:moved` | Client $\rightarrow$ Server $\rightarrow$ Clients | `{ taskId: string, status: TaskStatus, orderIndex: number, initiator: AssigneeId }` | Task card dragged to different Kanban column or reordered. |
| `task:deleted` | Client $\rightarrow$ Server $\rightarrow$ Clients | `{ taskId: string, initiator: AssigneeId }` | Task removed from project. |
| `task:subtask_toggled` | Client $\rightarrow$ Server $\rightarrow$ Clients | `{ taskId: string, subtaskId: string, completed: boolean, initiator: AssigneeId }` | Subtask checklist item toggled; recalculates overall task progress. |
| `doc:created` | Client $\rightarrow$ Server $\rightarrow$ Clients | `{ doc: LearningDoc, initiator: AssigneeId }` | New doc created manually or via Gemini AI guide generator. |
| `doc:updated` | Client $\rightarrow$ Server $\rightarrow$ Clients | `{ docId: string, updates: Partial<LearningDoc>, initiator: AssigneeId }` | Markdown or doc details updated. |
| `doc:step_toggled` | Client $\rightarrow$ Server $\rightarrow$ Clients | `{ docId: string, stepId: string, completed: boolean, initiator: AssigneeId }` | Interactive documentation step toggled. |
| `roadmap:batch_created` | Client $\rightarrow$ Server $\rightarrow$ Clients | `{ tasks: ProjectTask[], docs: LearningDoc[], initiator: AssigneeId }` | Batch roadmap generated from prompt committed to DB. |
| `credits:deducted` | Server $\rightarrow$ Clients | `{ newBalance: number, amountDeducted: number, reason: string, user: AssigneeId }` | AI credits balance updated across all connected devices. |

---

## Acceptance Verification Criteria (R3 & R4)

### Requirement R3: Individualized Learn Tab
- [ ] **2-Pane Layout**: Learn tab renders a 2-pane wireframe layout with task list on left and doc reader on right. On mobile (< 768px), collapses into clean master-detail view.
- [ ] **Assignee & Tag Filtering**: Switching filter to Cam, Liam, or Alex filters the left task list to matching assignments. Clicking a tag chip filters tasks by topic.
- [ ] **Task Selection & State**: Clicking any task in the left pane updates the active document loaded in the right pane.
- [ ] **Interactive Checkboxes**: Toggling a completion checkbox in the left pane updates task progress and broadcasts via Socket.io.
- [ ] **Top Preview Banner Card**: Doc reader displays a media banner with thumbnail, domain, and external resource link.
- [ ] **AI Relevance Box**: Doc displays a highlighted AI relevance section explaining why the document was chosen for the task.
- [ ] **Rich Markdown Rendering**: Renders headers, code blocks with syntax highlighting, copy-code button, callouts, and step checklists.
- [ ] **AI Guide Generator**: Clicking "AI Generate Guide" deducts credits (or informs user), calls Gemini API (or built-in fallback), creates a comprehensive guide, and attaches it to the task.

### Requirement R4: Projects Tab
- [ ] **Timeline/Gantt Default View**: Projects tab loads Timeline view by default with date grid across days/weeks, today line, and task range bars.
- [ ] **Draggable Date Bars**: Clicking and dragging a task bar horizontally updates `startDate` and `endDate` while preserving duration, snapping to day grid.
- [ ] **Stretchable Date Handles**: Dragging left handle updates `startDate`; dragging right handle updates `endDate`. Enforces `startDate <= endDate`.
- [ ] **Kanban Board Toggle**: Toggling to Kanban displays 4 columns (`Backlog`, `In Progress`, `In Review`, `Done`).
- [ ] **Kanban Drag-and-Drop**: Dragging a card between columns updates task status in real time and syncs across connected clients.
- [ ] **Assignee Filter**: Top filter `All | Cam | Liam | Alex` filters tasks across both Timeline and Kanban views.
- [ ] **Expanded Project Overlay**: Clicking any task bar on Timeline or card on Kanban opens a modal/drawer layer with full details, checklist, comments, and attached doc link.
- [ ] **1-Click Learn Tab Link**: Clicking the attached doc link in the overlay navigates directly to the Learn tab with that document loaded.
- [ ] **AI Auto-Roadmap Generator**: Entering a project prompt generates 4-8 structured roadmap tasks with dates, assignees, subtasks, and docs, and adds them to the timeline.

---

## 5-Component Handoff Report

### 1. Observation
- The authoritative specification is defined in `/Users/admin/Documents/Apps n stuff/Welcome Back Atlas/ORIGINAL_REQUEST.md`.
- Requirement R3 explicitly mandates:
  - 2-Pane wireframe layout: Left pane (assigned tasks with completion checkboxes, filterable by Cam, Liam, Alex or topic tags); Right pane (top preview banner card, doc info & AI relevance section, rich markdown reader with step guidelines, "AI Generate Guide" button costing credits).
- Requirement R4 explicitly mandates:
  - Default view: Timeline / Gantt roadmap with draggable/stretchable date range bars across days/weeks.
  - Toggle view: Kanban board with `Backlog`, `In Progress`, `In Review`, `Done` columns.
  - Assignee filters: `All | Cam | Liam | Alex`.
  - Expanded Project Overlay: Clicking *any* task in either Timeline or Kanban opens a modal/drawer layer above the view containing full details (description, assignee, dates, checklist, attached learning doc link, status updates).
  - AI Auto-Roadmap generator to turn project prompts into roadmap tasks.
- Tech stack context from Orchestrator: Node.js (Express + Socket.io + SQLite/better-sqlite3) backend and React (Vite + TypeScript + Tailwind CSS + Lucide icons) frontend.

### 2. Logic Chain
1. **R3 State & Linking Architecture**: Because the Learn tab left pane lists tasks while the right pane renders documentation, each task in the database should have an optional `attachedDocId` foreign key linking to a `LearningDoc`. When no doc exists, the right pane provides a 1-click AI generation prompt for that specific task.
2. **R4 Timeline & Gantt Engine**: A robust draggable/stretchable Gantt view requires clean mathematical projection from mouse pixel offsets ($\Delta X$) to calendar day deltas ($\Delta \text{Days} = \text{round}(\Delta X / W_{day})$). Clamping invariants ($T_{start} \le T_{end}$) must be enforced in both UI interactions and backend schema validation.
3. **Unified Task State Machine**: Both Timeline and Kanban views consume the exact same `ProjectTask` data collection. Status changes in Kanban immediately adjust task status column, while date changes in Timeline immediately adjust start/end dates. The Project Overlay acts as a single source of truth for full task mutations.
4. **Resilient AI Generation**: AI Guide and Auto-Roadmap generation must check credit balances (deducting e.g. 10 or 20 credits) and provide a deterministic fallback to built-in template libraries when no Gemini API key is supplied or when network errors occur, ensuring zero failure states during evaluation.
5. **Real-Time Collaboration**: All state mutations (drag, drop, stretch, subtask toggle, doc edit) must emit lightweight Socket.io events to achieve instantaneous multi-device synchronization without page reloads.

### 3. Caveats
- No application source code was modified during this survey (per read-only specification miner role).
- Drag-and-drop on mobile touch devices requires touch-action CSS (`touch-action: none` on drag handles) and pointer events to ensure smooth timeline stretching on tablets/mobile.
- Date calculations should strictly utilize UTC or consistent local date strings (`YYYY-MM-DD`) to avoid timezone shift anomalies across different client environments.

### 4. Conclusion
The specifications for R3 (Learn Tab) and R4 (Projects Tab) have been fully mined, decomposed, and formalized into complete data contracts, UI wireframes, interaction mathematics, WebSocket protocols, edge cases, and acceptance tests. The orchestrator and implementation workers have a clear, deterministic blueprint to construct the features.

### 5. Verification Method
- Independent review of `/Users/admin/Documents/Apps n stuff/Welcome Back Atlas/.agents/spec_miner_survey_2/handoff.md`.
- Cross-reference against `/Users/admin/Documents/Apps n stuff/Welcome Back Atlas/ORIGINAL_REQUEST.md` lines 27 to 41.
- Invalidation condition: If any requirement from R3 or R4 (e.g., draggable date bars, 2-pane learn layout, AI relevance section, Kanban toggle, overlay drawer, or auto-roadmap generator) is missing or underspecified, this specification must be updated.
