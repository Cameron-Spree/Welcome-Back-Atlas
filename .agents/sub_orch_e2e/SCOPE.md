# Scope: E2E Testing Track (Welcome Back Atlas)

## Architecture
The E2E Testing Track provides a comprehensive, requirement-driven, opaque-box test suite for Welcome Back Atlas. It operates on the application's external HTTP REST APIs and Socket.io WebSocket interfaces.
The test harness spins up an Express + Socket.io test server with isolated database instances and orchestrates virtual multi-user sessions for Cam, Liam, and Alex to verify real-time state synchronization, business logic, AI workflows, and credit mechanics.

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| **E1** | Test Infrastructure & Multi-Client Harness | Setup `tests/setup.ts`, `tests/e2e/helpers/testServer.ts`, `socketClient.ts`, `fixtures.ts`, Vitest config | none | IN_PROGRESS |
| **E2** | Tier 1: Feature Coverage Test Suite | Implement ≥65 test cases across R1-R5 in `tests/e2e/tier1-features/` (R1 profiles & sync, R2 dashboard & feed, R3 learn & AI docs, R4 Gantt/Kanban/overlay, R5 progress & credits) | E1 | PLANNED |
| **E3** | Tier 2: Boundary & Corner Cases Test Suite | Implement ≥65 edge/corner test cases in `tests/e2e/tier2-boundaries/` (extreme dates, invalid inputs, 0 credits, malformed events, disconnects) | E1, E2 | PLANNED |
| **E4** | Tier 3: Cross-Feature Combinations Test Suite | Implement pairwise cross-feature suites in `tests/e2e/tier3-cross-feature/` (Sync + Profile, Gantt + Kanban + Overlay, Learn + Credits, Roadmap + Progress) | E1, E2, E3 | PLANNED |
| **E5** | Tier 4: Real-World Application Workflows | Implement 5 realistic multi-user team workflows in `tests/e2e/tier4-scenarios/` (Cam, Liam, Alex multi-client collaboration, sprint management, AI doc flow) | E1, E2, E3, E4 | PLANNED |
| **E6** | Validation & TEST_READY.md Publication | Execute dry run of test suite, verify test coverage thresholds (≥150 tests), run reviewer & forensic auditor, publish `TEST_READY.md` | E1, E2, E3, E4, E5 | PLANNED |

## Interface Contracts & Test Harness APIs
- `createTestApp()`: Initializes in-memory/temp SQLite backend with seed data and Socket.io server.
- `createVirtualClient(userId, serverUrl)`: Connects a virtual Socket.io client simulating a user device, with helper methods `waitForEvent(eventName)`, `emitAsync(eventName, data)`.
- `request(app)`: Supertest REST client for HTTP assertions.

## Test Verification Standards
1. Every test file must be completely self-contained or use standard helpers.
2. Async socket operations must use bounded wait times with clear timeout messages.
3. Tests must assert both HTTP responses and WebSocket event broadcasts to all connected clients.
4. Total test case count must exceed the ≥150 test threshold across Tiers 1-4.
