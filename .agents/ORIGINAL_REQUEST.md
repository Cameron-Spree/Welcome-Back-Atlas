# Original User Request

## Initial Request — 2026-08-20T16:37:57Z

# Teamwork Project Prompt

> Goal: Build Welcome Back Atlas web app for Cam, Liam, and Alex
> Requested team: Focused full-stack team (optimized for efficient resource/credit usage)

Build **Welcome Back Atlas**, a real-time collaborative web application designed for **Cam**, **Liam**, and **Alex**. The app features 1-click profile switching, real-time WebSocket multi-device sync, an individualized AI-curated "Learn" documentation tab with relevance reasoning, a Projects tab with Timeline/Gantt (default) and Kanban views with expanded detail overlays, a Progress tab, and a Gemini API integration with credit tracking. Keep execution efficient and focused to conserve token usage.

Working directory: `/Users/admin/Documents/Apps n stuff/Welcome Back Atlas`
Integrity mode: development

---

## Requirements

### R1. Multi-User Profile System & Real-Time Sync
- Provide 1-click user switching between **Cam**, **Liam**, and **Alex** with distinct avatars, status indicators, and stored settings.
- Implement real-time WebSocket synchronization (Node.js + Express + Socket.io + persistent JSON/SQLite DB) so edits made on one device instantly update across all connected browsers without manual page reloads.

### R2. First Screen / Home Greeting Dashboard
- Display signature header: `"Welcome back, [Cam | Liam | Alex]"` dynamic to active user profile.
- Render user profile card with status toggle (Online, Focused, Away), global search bar, assigned upcoming roadmap tasks, quick-jump learning cards, and live team activity feed.

### R3. Individualized Learn Tab (2-Pane Wireframe Layout)
- **Left Pane**: List of assigned tasks/projects with completion checkboxes, filterable by assignee (`Cam`, `Liam`, `Alex`) or topic tags.
- **Right Pane**: 
  - Top preview banner card (media/resource preview link).
  - Doc info & **AI Relevance Section**: Explains why the document matches the project (e.g. client info match, or curated articles/videos/tutorials for technical tasks like system design or social media templates).
  - Rich Markdown documentation reader with step-by-step guidelines.
  - "AI Generate Guide" button powered by Gemini API (or built-in fallback) that costs credits.

### R4. Projects Tab (Timeline/Gantt & Kanban with Overlay)
- **Default View**: Timeline / Gantt roadmap with draggable/stretchable date range bars across days/weeks.
- **Toggle View**: Kanban board with columns (`Backlog`, `In Progress`, `In Review`, `Done`).
- **Assignee Filters**: Filter view by `All | Cam | Liam | Alex`.
- **Expanded Project Overlay**: Clicking *any* task in either Timeline or Kanban opens a modal/drawer layer above the view containing full details (description, assignee, dates, checklist, attached learning doc link, status updates).
- Include an "AI Auto-Roadmap" generator to turn project prompts into roadmap tasks.

### R5. Progress Tab & Gemini API Credit System
- **Progress Tab**: Display team completion velocity, individual task burn-up for Cam, Liam, and Alex, and learning streaks.
- **Settings & Credits**: Gemini API key input in Settings with visual AI credit counter (e.g., 100 starter credits), top-up modal, and automatic fallback when key is omitted.

---

## Acceptance Criteria

### Build & Server Verification
- [ ] Running `npm run dev` boots the Node.js Express/Socket.io backend and React Vite frontend.
- [ ] Frontend compiles with zero TypeScript/JSX lint errors and loads cleanly in browser.

### Feature & Real-Time Verification
- [ ] Switching active user to Cam, Liam, or Alex updates all greetings, avatar displays, and assigned task filters.
- [ ] Socket.io broadcasts task updates, moves, and date changes in real time across multiple open browser windows.
- [ ] Clicking a project in Timeline or Kanban opens the expanded overlay layer above the view with full details.
- [ ] Learn tab displays the 2-pane layout with AI relevance explanations and guide generator.
- [ ] Settings allows API key management and credit balance tracking.
