# Dispatch Log — spec_miner_survey_2

## 2026-08-20T16:39:09Z
**Source**: Orchestrator (9d0d75c9-4b91-4778-bbef-3dccff3bf06e)
**Objective**:
Perform an in-depth specification analysis for Requirements R3 and R4:
1. R3: Individualized Learn Tab (2-Pane Wireframe Layout):
   - Left Pane: List of assigned tasks/projects with completion checkboxes, filterable by assignee (Cam, Liam, Alex) or topic tags.
   - Right Pane: Top preview banner card (media/resource preview link), Doc info & AI Relevance Section (explains why doc matches project e.g. client info match, curated articles/videos/tutorials for technical tasks like system design or social media templates), Rich Markdown documentation reader with step-by-step guidelines, "AI Generate Guide" button powered by Gemini API (or built-in fallback) costing credits.
2. R4: Projects Tab (Timeline/Gantt & Kanban with Overlay):
   - Default View: Timeline / Gantt roadmap with draggable/stretchable date range bars across days/weeks.
   - Toggle View: Kanban board with columns (Backlog, In Progress, In Review, Done).
   - Assignee Filters: All | Cam | Liam | Alex.
   - Expanded Project Overlay: Clicking *any* task in either Timeline or Kanban opens modal/drawer layer above the view containing full details (description, assignee, dates, checklist, attached learning doc link, status updates).
   - AI Auto-Roadmap generator to turn project prompts into roadmap tasks.

Requirements:
- Break down every feature into concrete data models, state management, UI wireframe specs, interactive behaviors (drag/stretch timeline, kanban drag/move, overlay drawer/modal, markdown rendering, AI generation flows), edge cases, and acceptance criteria.
- Write your comprehensive specification report to: /Users/admin/Documents/Apps n stuff/Welcome Back Atlas/.agents/spec_miner_survey_2/handoff.md
- Update progress.md with your liveness and completion.
- Send a completion message to the orchestrator when finished.
