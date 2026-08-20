# E2E Test Infra: Welcome Back Atlas

## Test Philosophy
- **Opaque-Box & Requirement-Driven**: Tests are strictly derived from `ORIGINAL_REQUEST.md` and user-facing requirements, independent of internal module implementation.
- **Methodology**: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing.
- **Progressive Testability**: Verification uses external entry points (REST HTTP endpoints, Socket.io multi-client connections, virtual concurrent sessions for Cam, Liam, and Alex).
- **Zero Mock Shortcuts**: All real-time event broadcasts, database transactions, credit balances, and AI fallback generations are asserted against authentic system behavior.

---

## Feature Inventory & Requirement Mapping

| # | Feature | Requirement Source | Tier 1 (Min 5) | Tier 2 (Min 5) | Tier 3 (Pairwise) |
|---|---------|-------------------|:--------------:|:--------------:|:-----------------:|
| 1 | Multi-User Profile Switcher (Cam, Liam, Alex) | R1 | 5 | 5 | ✓ |
| 2 | Real-Time WebSocket Multi-Device Synchronization | R1 | 5 | 5 | ✓ |
| 3 | Home Greeting Dashboard & Profile Status (Online, Focused, Away) | R2 | 5 | 5 | ✓ |
| 4 | Global Search & Live Team Activity Feed | R2 | 5 | 5 | ✓ |
| 5 | Individualized Learn Tab 2-Pane Split Wireframe | R3 | 5 | 5 | ✓ |
| 6 | AI Relevance Reasoning & Rich Markdown Reader | R3 | 5 | 5 | ✓ |
| 7 | AI Guide Generation Flow & Step Checklists | R3 | 5 | 5 | ✓ |
| 8 | Timeline / Gantt Roadmap with Draggable/Stretchable Bars | R4 | 5 | 5 | ✓ |
| 9 | Kanban Board & Column Drag-and-Drop Movement | R4 | 5 | 5 | ✓ |
| 10 | Expanded Project Detail Overlay Modal & Learn Shortcut | R4 | 5 | 5 | ✓ |
| 11 | AI Auto-Roadmap Generator | R4 | 5 | 5 | ✓ |
| 12 | Progress Analytics (Team Velocity, Individual Burn-Up, Streaks) | R5 | 5 | 5 | ✓ |
| 13 | Gemini API Key Management & Credit Top-Up / Fallback | R5 | 5 | 5 | ✓ |

---

## Test Architecture & Directory Layout

```
Welcome Back Atlas/
├── tests/
│   ├── setup.ts                               # Vitest global environment setup
│   └── e2e/
│       ├── helpers/
│       │   ├── testServer.ts                  # In-memory/temp SQLite test server runner & supertest agent
│       │   ├── socketClient.ts                # Multi-client virtual socket manager for Cam, Liam, Alex
│       │   └── fixtures.ts                    # Test seed data, factories, and deterministic generators
│       ├── tier1-features/
│       │   ├── r1-profiles-sync.test.ts        # R1: Profile switching, persistence, real-time broadcasts
│       │   ├── r2-dashboard-feed.test.ts      # R2: Header greetings, status toggle, search, activity feed
│       │   ├── r3-learn-ai-doc.test.ts        # R3: 2-pane layout, filters, AI relevance, step toggle, guide generation
│       │   ├── r4-projects-gantt-kanban.test.ts # R4: Gantt dates, Kanban status moves, overlay modal, auto-roadmap
│       │   └── r5-progress-credits.test.ts    # R5: Velocity metrics, burn-up, streaks, credit deductions, topup
│       ├── tier2-boundaries/
│       │   ├── r1-boundary-sync.test.ts       # R1: Rapid user switches, socket reconnects, malformed events
│       │   ├── r2-boundary-search.test.ts     # R2: Empty query, special regex chars, long query, offline status
│       │   ├── r3-boundary-ai-doc.test.ts     # R3: Max-length topic, empty doc steps, missing task link, 0 relevance
│       │   ├── r4-boundary-gantt-dates.test.ts # R4: Start date > End date, past dates, empty checklists, unknown columns
│       │   └── r5-boundary-credits.test.ts    # R5: 0 credit requests, negative topup, large recharge, empty API key
│       ├── tier3-cross-feature/
│       │   ├── sync-and-profile.test.ts       # Socket sync + Multi-device profile switching & status reflection
│       │   ├── gantt-kanban-overlay.test.ts   # Gantt date shift -> Kanban column move -> Overlay detail update
│       │   ├── learn-task-credits.test.ts     # Generate AI guide -> deduct credits -> link to task -> toggle steps
│       │   └── roadmap-progress-feed.test.ts  # Auto-roadmap generate -> feed stream -> team velocity & burnup shift
│       └── tier4-scenarios/
│           ├── multi-user-sprint-workflow.test.ts       # Scenario 1: Cam, Liam, Alex collaborative sprint lifecycle
│           ├── real-world-curated-learning-workflow.test.ts # Scenario 2: Documentation creation & task learning flow
│           ├── ai-roadmap-planning-workflow.test.ts     # Scenario 3: Product roadmap generation to delivery execution
│           ├── concurrent-collaborative-editing.test.ts # Scenario 4: Concurrent multi-socket updates & conflict safety
│           └── credit-lifecycle-recovery.test.ts        # Scenario 5: Credit depletion, topup refill, heuristic fallback
```

---

## Real-World Application Scenarios (Tier 4)

| # | Scenario | Detailed Narrative | Features Exercised | Complexity |
|---|----------|--------------------|--------------------|------------|
| 1 | **Multi-User Sprint Execution** | Cam (Dev) logs in, changes status to 'Focused', shifts Gantt bar dates on 'API Refactor'. Liam (Lead) moves task to 'In Review' on Kanban. Alex (Designer) reviews task overlay, completes subtask checklist item, and triggers live activity feed broadcast across all 3 client windows. | F1, F2, F3, F4, F8, F9, F10, F12 | High |
| 2 | **Curated Learning & AI Documentation** | Liam accesses Learn Tab, filters tasks by Liam, clicks unassigned topic, generates AI guide costing 5 credits (verified balance decrement), reviews AI relevance summary, reads markdown steps, and checks off step 1 & 2 which updates progress. | F1, F5, F6, F7, F12, F13 | High |
| 3 | **AI Auto-Roadmap Planning & Delivery** | Alex enters project goal "Mobile Responsive Overhaul", auto-generates 5 roadmap tasks across backlog and in_progress, adjusts timeline dates, navigates to overlay detail to attach learning doc, and observes team velocity chart update. | F1, F2, F8, F10, F11, F12 | High |
| 4 | **Concurrent Multi-Device Live Sync** | Cam on Client A and Liam on Client B concurrently edit task descriptions and checklist items; Socket.io broadcasts ensure both clients converge with updated state and live feed events without race conditions. | F1, F2, F8, F9, F10 | High |
| 5 | **Credit Lifecycle, Fallback & Top-Up** | Cam spends down starter 100 credits via guide/roadmap generation. When credits drop below required amount, system gracefully validates insufficient balance or top-up requirement, user tops up +100 credits via Settings, and fallback generation continues reliably. | F6, F7, F11, F13 | High |

---

## Coverage Thresholds & Target Metrics

- **Tier 1 (Feature Coverage)**: ≥5 test cases per feature (13 features × 5 = ≥65 tests)
- **Tier 2 (Boundary & Corner Cases)**: ≥5 test cases per feature (13 features × 5 = ≥65 tests)
- **Tier 3 (Cross-Feature Pairwise)**: ≥4 comprehensive multi-subsystem suites (≥16 interaction tests)
- **Tier 4 (Real-World Application Scenarios)**: 5 comprehensive multi-user end-to-end scenarios
- **Total Expected Test Suite**: **≥150 rigorous test cases**

---

## Execution Command
- Test runner: `npm test` or `npx vitest run tests/e2e`
- Expected: All test suites run cleanly with zero failures and exit code 0.
