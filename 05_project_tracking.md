# 05. Project Tracking & Implementation Roadmap

> **Document Status**: Living & Actively Maintained  
> **Target Audience**: Engineering Leadership, Product Managers, Developers, SREs  
> **System Name**: QueryMedic (`@database-doctor`)  
> **Companion Documents**:
> - [01_product_overview.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/01_product_overview.md) — Product Vision & Business Positioning  
> - [02_domain_primer.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/02_domain_primer.md) — Database Internals & Domain Concepts  
> - [03_requirements.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/03_requirements.md) — Verifiable EARS Requirements Contract  
> - [04_architecture.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/04_architecture.md) — System Architecture & Technical Design  

---

## 1. Executive Status Dashboard

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              QueryMedic Project Health                                 │
├───────────────────┬───────────────────┬───────────────────────┬────────────────────────┤
│ Overall Progress  │ Active Phase      │ Sprint Health         │ Target Release         │
│ 25% (Foundation)  │ Phase 1 Completed │ 🟢 ON TRACK           │ MVP Beta: Nov 2026     │
└───────────────────┴───────────────────┴───────────────────────┴────────────────────────┘
```

### Phase Completion Summary

| Phase | Description | Status | Progress | Target Date |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | Foundation & Monorepo Setup (Next.js, Fastify, Prisma, BullMQ, Auth) | 🟢 COMPLETED | 100% | Sprint 1 |
| **Phase 2** | Database Connection & Secure Vault (AES-256-GCM, Health Check) | 🟡 READY | 0% | Sprint 2 |
| **Phase 3** | Telemetry Harvesting & Catalog Collector (`pg_stat_statements`) | ⚪ PLANNED | 0% | Sprint 3 |
| **Phase 4** | Query Normalization, Fingerprinting & Impact Scoring | ⚪ PLANNED | 0% | Sprint 4 |
| **Phase 5** | Deterministic Problem Detection Engine (Index Doctor & Rules) | ⚪ PLANNED | 0% | Sprint 5 |
| **Phase 6** | Structured AI Diagnosis & Synthesis Layer (Zod Contract) | ⚪ PLANNED | 0% | Sprint 6 |
| **Phase 7** | Safe Verification & Benchmark Sandbox (SELECT-Only, Before/After) | ⚪ PLANNED | 0% | Sprint 7 |
| **Phase 8** | Web Dashboard & Query Explorer (Monaco, Plan Tree, Health Score) | ⚪ PLANNED | 0% | Sprint 8 |
| **Phase 9** | Continuous Monitoring & Regression Alerting (Slack/Webhooks) | ⚪ PLANNED | 0% | Sprint 9 |
| **Phase 10** | In-VPC Daemon Agent & MySQL 8.0 Extension | ⚪ PLANNED | 0% | Sprint 10 |

---

## 2. Granular Work Breakdown Structure (WBS)

### Phase 1: Foundation & Monorepo Infrastructure
*Goal: Establish robust multi-tenant core, Prisma schemas, Fastify API, BullMQ queues, and authentication.*

- [x] **TASK-1.1**: Author foundational specifications ([01_product_overview.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/01_product_overview.md), [02_domain_primer.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/02_domain_primer.md), [03_requirements.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/03_requirements.md), [04_architecture.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/04_architecture.md)).
- [x] **TASK-1.2**: Initialize pnpm monorepo structure (`apps/api`, `apps/web`, `apps/workers`, `packages/*`).
- [x] **TASK-1.3**: Implement PostgreSQL Prisma schema for System DB covering all 14 models (`Organization`, `User`, `DatabaseConnection`, `AuditLog`, etc.).
- [x] **TASK-1.4**: Configure Fastify server with Zod validation, JWT authentication, and CORS plugins.
- [x] **TASK-1.5**: Set up Redis connection and BullMQ queue definitions (`telemetry-harvest`, `rule-analysis`, `ai-synthesis`, `benchmark-sandbox`, `alert-dispatch`).
- [x] **TASK-1.6**: Implement multi-tenant RBAC middleware (`Workspace Admin`, `Database Engineer`, `Viewer`).

### Phase 2: Database Connection & Secure Credential Vault
*Goal: Implement read-only connection onboarding with AES-256-GCM encryption and permission verification.*

- [ ] **TASK-2.1**: Implement `packages/security` module with AES-256-GCM envelope encryption and decryption utilities.
- [ ] **TASK-2.2**: Build Fastify connection controller (`POST /api/databases/test` and `POST /api/databases`).
- [ ] **TASK-2.3**: Implement PostgreSQL permission verification probe (`pg_stat_statements` check, superuser warning).
- [ ] **TASK-2.4**: Create connection management UI form in `apps/web` with SSL mode toggles and connection status badge.
- [ ] **TASK-2.5**: Write integration tests verifying credentials cannot be extracted in plaintext from the system database.

### Phase 3: Telemetry Harvesting & Catalog Collector
*Goal: Periodically harvest `pg_stat_statements`, table sizes, index stats, and connection vital signs.*

- [ ] **TASK-3.1**: Build `PostgresAdapter` in `packages/db-adapters` using `node-postgres` with strict `statement_timeout`.
- [ ] **TASK-3.2**: Implement BullMQ `telemetry-harvest` worker to poll statistics every 10 minutes.
- [ ] **TASK-3.3**: Extract table bloat indicators (`n_dead_tup`, `n_live_tup`, relation bytes, index bytes).
- [ ] **TASK-3.4**: Harvest connection pool metrics (`pg_stat_activity`), lock contentions (`pg_locks`), and cache hit ratio.
- [ ] **TASK-3.5**: Store aggregated snapshot telemetry in `DatabaseSnapshot` and `QueryMetric` tables.

### Phase 4: Query Normalization, Fingerprinting & Workload Scoring
*Goal: Strip literal parameters from SQL, compute SHA-256 AST fingerprints, and calculate Workload Impact Scores.*

- [ ] **TASK-4.1**: Implement SQL AST normalizer in `packages/rule-engine` replacing literals with `$1` or `?`.
- [ ] **TASK-4.2**: Generate deterministic SHA-256 fingerprint hashes for each unique query structure.
- [ ] **TASK-4.3**: Implement Workload Impact Score formula:
  $$\text{Impact Score} = \text{Mean Latency} \times \text{Calls per Hour} \times \left(1 + \frac{\text{Shared Read}}{\text{Shared Hit} + 1}\right)$$
- [ ] **TASK-4.4**: Build N+1 query detection algorithm identifying high-frequency identical ASTs within 500ms sliding windows.
- [ ] **TASK-4.5**: Store normalized queries in `NormalizedQuery` table with classification (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).

### Phase 5: Deterministic Problem Detection Engine (Index Doctor & Rules)
*Goal: Run deterministic rule evaluations over query plans and catalogs prior to any AI synthesis.*

- [ ] **TASK-5.1**: Implement `EXPLAIN (FORMAT JSON)` safe plan collector for high-impact queries.
- [ ] **TASK-5.2**: Build Rule `RULE-SCAN-01`: Flag `Seq Scan` on tables exceeding 10,000 rows.
- [ ] **TASK-5.3**: Build Rule `RULE-IDX-01`: Detect missing composite indexes based on `WHERE` equality, `ORDER BY`, and range filters.
- [ ] **TASK-5.4**: Build Rule `RULE-IDX-DUP`: Detect identical and redundant prefix B-Tree indexes.
- [ ] **TASK-5.5**: Build Rule `RULE-IDX-UNUSED`: Detect indexes with 0 scans over 14+ days (excluding primary/unique keys).
- [ ] **TASK-5.6**: Build Rule `RULE-BLOAT-01`: Flag tables where dead tuples exceed 20% and 50,000 rows.
- [ ] **TASK-5.7**: Generate structured `Finding` records with deterministic evidence payloads.

### Phase 6: Structured AI Diagnosis & Synthesis Layer
*Goal: Feed deterministic findings into LLM provider to generate human-friendly explanations and safe DDL.*

- [ ] **TASK-6.1**: Implement `AIProvider` interface supporting Anthropic, Google Gemini, and OpenAI.
- [ ] **TASK-6.2**: Design structured prompt template providing query AST, table stats, existing indexes, and rule findings.
- [ ] **TASK-6.3**: Implement strict Zod schema validation for AI response payloads.
- [ ] **TASK-6.4**: Enforce output generation of safe `CREATE INDEX CONCURRENTLY` DDL and estimated improvement ranges.
- [ ] **TASK-6.5**: Create BullMQ `ai-synthesis` worker with exponential backoff retry and rate-limiting guards.

### Phase 7: Safe Verification & Benchmark Sandbox
*Goal: Run empirical before/after benchmarks in an isolated sandbox and compare against estimated improvements.*

- [ ] **TASK-7.1**: Implement AST validator enforcing strict `SELECT`-only statements for benchmark candidates.
- [ ] **TASK-7.2**: Configure benchmark execution runner with `SET default_transaction_read_only = TRUE` and `SET statement_timeout = '15000ms'`.
- [ ] **TASK-7.3**: Build baseline benchmarking step: Execute query 3x with `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`.
- [ ] **TASK-7.4**: Build remediation testing step: Apply recommended index inside sandbox, warm cache, and re-execute 3x.
- [ ] **TASK-7.5**: Calculate verified percentage improvements, row reduction, and plan node transitions (`Seq Scan` $\to$ `Index Scan`).
- [ ] **TASK-7.6**: Persist benchmark results in `RecommendationBenchmark` and transition state to `VERIFIED`.

### Phase 8: Web Dashboard & Query Explorer
*Goal: Deliver a high-polish, dark-mode Next.js UI with real-time health score, Monaco SQL editor, and visual plan trees.*

- [ ] **TASK-8.1**: Build Executive Dashboard shell with overall 0–100 Health Score gauge and severity issue counters.
- [ ] **TASK-8.2**: Build Query Explorer table with search, table filters, P95/P99 latency, and Impact Score sorting.
- [ ] **TASK-8.3**: Integrate read-only Monaco Editor with SQL syntax highlighting and query formatting.
- [ ] **TASK-8.4**: Build Visual Execution Plan component rendering hierarchical tree nodes with cost badges.
- [ ] **TASK-8.5**: Build Recommendation Detail page with "Estimated vs. Verified" comparison cards and `[ Test Recommendation ]` trigger.
- [ ] **TASK-8.6**: Build Table Capacity visualizer using Recharts with 30/60/90-day linear growth projections.

### Phase 9: Continuous Monitoring & Regression Alerting
*Goal: Detect sudden query latency spikes and dispatch automated notifications via Slack, Discord, and Webhooks.*

- [ ] **TASK-9.1**: Implement P95 latency regression detector comparing 1-hour rolling metrics against 7-day baselines.
- [ ] **TASK-9.2**: Implement connection pool saturation alert ($> 85\%$ of `max_connections`).
- [ ] **TASK-9.3**: Build Slack Block Kit and Discord embed message formatters with deep links to recommendation pages.
- [ ] **TASK-9.4**: Implement BullMQ `alert-dispatch` worker with exponential retry policies.

### Phase 10: Enterprise In-VPC Agent & Multi-Engine Extension
*Goal: Deliver zero-ingress local daemon agent for private VPCs and add MySQL 8.0 support.*

- [ ] **TASK-10.1**: Build `@database-doctor/agent` lightweight CLI daemon in Node.js/TypeScript.
- [ ] **TASK-10.2**: Implement secure outbound WebSocket pairing with token authentication between agent and cloud API.
- [ ] **TASK-10.3**: Package agent into minimal Docker image (`database-doctor/agent`).
- [ ] **TASK-10.4**: Implement `MySQLAdapter` in `packages/db-adapters` supporting `performance_schema` and `information_schema`.

---

## 3. EARS Requirements Traceability Matrix

| EARS Requirement Code | Target Epic / Story | Implementation Module | Verification Suite | Status |
| :--- | :--- | :--- | :--- | :--- |
| `EARS-1.1.1` – `1.1.3` | Multi-Tenant Isolation | `apps/api/src/modules/organizations` | Tenant isolation unit/integration tests | 🟡 In Progress |
| `EARS-1.2.1` – `1.2.3` | RBAC Permissions | `apps/api/src/plugins/auth` | RBAC endpoint permission test suite | ⚪ Planned |
| `EARS-2.1.1` – `2.1.5` | Connection & AES-256 Vault | `packages/security`, `apps/api/src/modules/databases` | Crypto round-trip & probe test suite | ⚪ Planned |
| `EARS-2.2.1` – `2.2.4` | In-VPC Daemon Agent | `packages/agent`, `apps/api/src/modules/agent` | WebSocket handshake & heartbeat tests | ⚪ Planned |
| `EARS-3.1.1` – `3.1.4` | Telemetry Harvesting | `packages/db-adapters`, `apps/workers` | BullMQ collector mock test | ⚪ Planned |
| `EARS-4.1.1` – `4.1.3` | AST Normalization & Hash | `packages/rule-engine` | SQL parser fixture tests (50+ queries) | ⚪ Planned |
| `EARS-4.2.1` – `4.2.3` | Impact Scoring Formula | `packages/rule-engine` | Mathematical scoring unit tests | ⚪ Planned |
| `EARS-4.3.1` – `4.3.3` | N+1 Cluster Detection | `packages/rule-engine` | Sliding window clustering test suite | ⚪ Planned |
| `EARS-5.1.1` – `5.1.3` | Sequential Scan Rule | `packages/rule-engine/rules/scan` | Plan node JSON fixture test | ⚪ Planned |
| `EARS-5.2.1` – `5.2.3` | Missing Composite Index | `packages/rule-engine/rules/index` | Equality-Sort-Range ordering test | ⚪ Planned |
| `EARS-5.3.1` – `5.3.3` | Duplicate/Prefix Redundancy | `packages/rule-engine/rules/index` | B-Tree prefix subset test | ⚪ Planned |
| `EARS-5.4.1` – `5.4.2` | Dormant/Unused Index | `packages/rule-engine/rules/index` | Scan count threshold test | ⚪ Planned |
| `EARS-5.5.1` – `5.5.2` | Dead Tuple Bloat Rule | `packages/rule-engine/rules/bloat` | Ratio & row threshold test | ⚪ Planned |
| `EARS-6.1.1` – `6.2.3` | AI Provider & Zod Schema | `packages/ai-engine` | Zod schema validation & mock LLM tests | ⚪ Planned |
| `EARS-7.1.1` – `7.1.3` | SELECT-Only Gatekeeper | `apps/workers/processors/benchmark` | AST mutation rejection test suite | ⚪ Planned |
| `EARS-7.2.1` – `7.2.5` | Before/After Benchmark | `apps/workers/processors/benchmark` | End-to-end sandbox benchmark test | ⚪ Planned |
| `EARS-8.1.1` – `8.2.3` | Lifecycle & Audit Log | `apps/api/src/modules/recommendations` | State machine & append-only log test | ⚪ Planned |
| `EARS-9.1.1` – `9.3.3` | Dashboard & Plan Tree UI | `apps/web` | Vitest + Playwright E2E UI tests | ⚪ Planned |
| `EARS-10.1.1` – `10.2.3`| Alerting & Webhooks | `apps/workers/processors/alert` | Webhook dispatch & retry test suite | ⚪ Planned |

---

## 4. Architectural Decision Records (ADR) Log

### ADR-001: Rule Engine First, AI Explainer Second
- **Context**: Relying purely on LLMs to diagnose database performance causes hallucinations, inaccurate indexing advice, and security risks.
- **Decision**: Deterministic rule engines evaluate ASTs and execution plan facts first. The LLM only receives verified facts to generate human-readable explanations.
- **Status**: **ACCEPTED** (2026-10-06).

### ADR-002: Envelope Encryption (AES-256-GCM) for Stored Credentials
- **Context**: Connecting to customer databases requires storing connection strings and credentials securely.
- **Decision**: All database credentials must be encrypted at rest using AES-256-GCM with unique per-record IVs and authentication tags. Master keys remain in KMS/environment variables.
- **Status**: **ACCEPTED** (2026-10-06).

### ADR-003: Strict SELECT-Only Enforcement for Benchmarking
- **Context**: Automated benchmarking (`EXPLAIN ANALYZE`) on mutating statements (`INSERT`, `UPDATE`, `DELETE`) could corrupt customer data.
- **Decision**: Benchmark candidates must be parsed with an AST parser to ensure they are strictly read-only `SELECT` statements. Mutations are rejected outright with `MUTATING_STATEMENT_PROHIBITED`.
- **Status**: **ACCEPTED** (2026-10-06).

### ADR-004: Decoupled BullMQ Worker Architecture
- **Context**: Extracting query statistics, parsing SQL ASTs, and calling LLM APIs are compute- and I/O-intensive operations that would degrade HTTP API latency.
- **Decision**: All analysis and benchmarking tasks are processed asynchronously via Redis 7 and BullMQ worker fleets.
- **Status**: **ACCEPTED** (2026-10-06).

---

## 5. Active Sprint Board (Current Focus: Sprint 1)

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Backlog         │ Ready           │ In Progress     │ Done            │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ • Telemetry     │ • Fastify API   │ • Monorepo      │ • Product Spec  │
│   Collector     │   Server Shell  │   Turborepo     │ • Domain Primer │
│ • SQL Normalizer│ • BullMQ Worker │   Structure     │ • EARS Criteria │
│ • AES-256 Vault │   Skeleton      │ • Prisma Schema │ • Architecture  │
│                 │ • Next.js Shell │   Draft         │   Document      │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

---

## 6. Project Activity Log

| Timestamp | Actor | Action | Outcome | Next Action |
| :--- | :--- | :--- | :--- | :--- |
| `2026-10-05` | Product Lead | Drafted initial product concept | Formulated 65-point vision document | Define formal specifications |
| `2026-10-05` | System Architect | Authored Product Overview | Created [01_product_overview.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/01_product_overview.md) | Author Domain Primer |
| `2026-10-05` | Database Engineer | Authored Domain Primer | Created [02_domain_primer.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/02_domain_primer.md) | Formulate EARS Requirements |
| `2026-10-05` | QA / Requirements Lead | Authored EARS Requirements | Created [03_requirements.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/03_requirements.md) | Author Architecture Document |
| `2026-10-06` | Principal Architect | Authored Technical Architecture | Created [04_architecture.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/04_architecture.md) | Setup Project Tracking System |
| `2026-10-06` | Engineering Lead | Established Project Tracking System | Created [05_project_tracking.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/05_project_tracking.md) | Initialize Repository & Monorepo |
| `2026-10-06` | Full-Stack Engineer | Completed Phase 1 (Foundation & Monorepo) | Implemented monorepo packages, Prisma schema (14 models), AES-256 crypto, Fastify API, BullMQ queues, 18 tests passing (100%) | Request permission to start Phase 2 |
