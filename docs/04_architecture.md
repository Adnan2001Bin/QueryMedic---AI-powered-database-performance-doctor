# 04. System Architecture & Technical Design

> **Document Status**: Complete & Authoritative  
> **Target Audience**: System Architects, Principal Engineers, Backend/Frontend Developers, DevOps/SRE  
> **System Name**: QueryMedic (`@database-doctor`)  
> **Companion Documents**:
> - [01_product_overview.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/01_product_overview.md) — Product Vision & Business Positioning  
> - [02_domain_primer.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/02_domain_primer.md) — Database Internals & Domain Concepts  
> - [03_requirements.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/03_requirements.md) — Verifiable EARS Requirements Contract  
> - [05_project_tracking.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/05_project_tracking.md) — Execution Roadmap & Milestone Tracking  

---

## 1. Architectural Goals & Non-Functional Requirements (NFRs)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               Architectural Principles                                 │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ 1. Zero Production Risk  │ 2. Determinism First     │ 3. Strict Least Privilege        │
│ Never mutate live DBs;   │ Rules prove facts;       │ Enforce read-only roles and      │
│ sandboxed benchmarks     │ AI explains & synthesizes│ AES-256-GCM credential isolation│
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

| Quality Attribute | Architectural Strategy | Quantitative Target |
| :--- | :--- | :--- |
| **Security at Rest** | Envelope encryption with AES-256-GCM for stored connection credentials; unique IV per ciphertext. | 0 plaintext credentials stored in database. |
| **Zero Sensitive Data Ingestion** | AST parameter scrubbing strips all SQL literals before storage; only normalized queries and catalog metadata are persisted. | 0 customer PII/row data stored. |
| **Target Database Overhead** | Collector queries run with strict session-level timeouts and batch limits; read-only roles only. | $< 1\%$ CPU overhead on monitored database. |
| **Asynchronous Decoupling** | All heavy workloads (collection, AST parsing, AI calls, benchmarking) are queued via Redis 7 + BullMQ. | HTTP API response times $< 80\text{ ms}$ (P95). |
| **Provider Pluggability** | Engine adapters (`DatabaseAdapter`) and AI providers (`AIProvider`) use TypeScript abstract interfaces. | Adding new DB (MySQL) or LLM requires 0 changes to core domain logic. |
| **Verification Credibility** | Benchmarks distinguish mathematical planner estimates from empirically executed tests in isolated sandboxes. | 100% of benchmark claims validated via `EXPLAIN (ANALYZE, BUFFERS)`. |

---

## 2. System Component Topology

The system uses a domain-driven monorepo architecture separating the **Web Dashboard**, the **API Gateway Server**, **Asynchronous Background Workers**, the **AI Gateway**, and an optional **In-VPC Daemon Agent**.

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Presentation Layer"]
        UI["Web Dashboard (Next.js 15, React 19, Tailwind, Monaco, TanStack Query)"]
    end

    subgraph APILayer ["API Gateway & Control Plane"]
        API["Fastify API Server (Node.js 22 LTS, TypeScript, Zod, JWT Auth)"]
    end

    subgraph DataPlane ["Persistence & Job Queue"]
        SysDB[("System Database\nPostgreSQL 16 + Prisma")]
        RedisQ[("Job Queue & Cache\nRedis 7 + BullMQ")]
    end

    subgraph WorkerFleet ["Distributed Worker Fleet (BullMQ)"]
        W_Collect["Collector Worker\n(pg_stat_statements & catalogs)"]
        W_Rule["Rule Engine Worker\n(AST Parsing & Deterministic Rules)"]
        W_AI["AI Synthesis Worker\n(Structured JSON Diagnostics)"]
        W_Bench["Benchmark Worker\n(SELECT Sandbox & Verification)"]
        W_Alert["Alert Worker\n(Slack, Discord, Email Webhooks)"]
    end

    subgraph TargetEnvironments ["Monitored Customer Environments"]
        DirectDB[("Customer DB (Direct)\nPostgreSQL (read-only role)")]
        VPCDB[("Customer DB (Private VPC)\nPostgreSQL / MySQL")]
        Agent["In-VPC Daemon Agent\n(@database-doctor/agent)"]
        SandboxDB[("Benchmark Sandbox / Clone\nEphemeral DB / Neon Branch")]
    end

    subgraph ExternalAI ["AI Provider Gateway"]
        LLM["AI Model Providers\n(Anthropic Claude / Google Gemini / OpenAI)"]
    end

    %% Interactions
    UI -->|HTTPS / WSS| API
    API --> SysDB
    API --> RedisQ

    RedisQ --> W_Collect
    RedisQ --> W_Rule
    RedisQ --> W_AI
    RedisQ --> W_Bench
    RedisQ --> W_Alert

    W_Collect -->|Direct Read-Only SQL| DirectDB
    W_Collect <-->|WSS Job Dispatch| Agent
    Agent -->|Local SQL| VPCDB

    W_Collect --> SysDB
    W_Rule --> SysDB
    W_Rule -->|Trigger AI Analysis| RedisQ

    W_AI --> LLM
    W_AI --> SysDB

    W_Bench -->|SELECT-Only Benchmarks| SandboxDB
    W_Bench --> SysDB

    W_Alert -->|Webhook HTTP Post| UI
```

---

## 3. Core Subsystems & Domain Modules

### 3.1 API Server & Domain Organization (`apps/api`)
The API server is structured into high-cohesion domain modules rather than technical layers:

```
apps/api/src/modules/
├── auth/                 # JWT issuing, session validation, password hashing
├── organizations/        # Multi-tenant isolation, members, role bindings (RBAC)
├── databases/            # Connection manager, AES-256 vault, health checks
├── telemetry/            # Ingestion endpoints, snapshot scheduler
├── queries/              # Query explorer, AST normalizer, fingerprint registry
├── analysis/             # Deterministic rule engine triggers, findings manager
├── recommendations/      # Recommendation state machine, candidate DDL generator
├── benchmarks/           # SELECT-only benchmark sandbox runner, before/after metrics
├── alerts/               # Latency regression detector, webhook dispatchers
└── audit/                # Immutable audit log recorder
```

### 3.2 Target Database Adapter Abstraction (`packages/db-adapters`)
To support PostgreSQL first and seamlessly introduce MySQL 8.0+ without refactoring, all target interactions implement a common contract:

```typescript
export interface ExecutionPlanNode {
  nodeType: string;
  relationName?: string;
  totalCost: number;
  planRows: number;
  actualRows?: number;
  actualDurationMs?: number;
  filter?: string;
  rowsRemovedByFilter?: number;
  children?: ExecutionPlanNode[];
}

export interface DatabaseAdapter {
  testConnection(): Promise<{ ok: boolean; latencyMs: number; version: string }>;
  verifyPermissions(): Promise<{ hasStatStatements: boolean; isReadOnly: boolean; warnings: string[] }>;
  collectQueryStatistics(limit: number): Promise<RawQueryStatistic[]>;
  collectTableCatalogs(): Promise<TableCatalogMetric[]>;
  collectIndexCatalogs(): Promise<IndexCatalogMetric[]>;
  collectHealthVitals(): Promise<DatabaseHealthVitals>;
  explainQuery(sql: string, params?: unknown[]): Promise<ExecutionPlanNode>;
  explainAnalyzeBenchmark(sql: string, params?: unknown[]): Promise<BenchmarkRunResult>;
  executeTemporaryDDL?(ddl: string): Promise<void>;
}
```

### 3.3 AI Layer Abstraction (`packages/ai-engine`)
The AI engine decouples LLM vendor APIs from QueryMedic's core logic:

```typescript
export interface AIProvider {
  name: 'anthropic' | 'gemini' | 'openai' | 'local';
  diagnoseFinding(input: FindingDiagnosticInput): Promise<StructuredDiagnosis>;
  explainQueryPlan(input: PlanExplanationInput): Promise<PlanExplanation>;
  explainCapacityTrend(input: CapacityTrendInput): Promise<CapacityExplanation>;
}
```

The payload sent to `diagnoseFinding` contains **strictly structured facts**:
1. Normalized SQL text (parameter literals stripped).
2. Table metadata (total row count, total relation bytes, dead tuple percentage).
3. Existing index definitions on the target relation.
4. Parsed JSON execution plan tree nodes.
5. Triggered deterministic rule IDs (e.g., `RULE-SCAN-01`, `RULE-IDX-01`).

The response is strictly parsed and verified via **Zod**:

```typescript
export const StructuredDiagnosisSchema = z.object({
  title: z.string().min(5),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  rootCause: z.string().min(20),
  explanation: z.string().min(30),
  remediationType: z.enum(['CREATE_INDEX', 'DROP_INDEX', 'REWRITE_QUERY', 'VACUUM', 'CONFIG_CHANGE']),
  recommendedSql: z.string(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  riskExplanation: z.string(),
  estimatedImprovementPct: z.object({
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
  }),
  confidenceScore: z.number().min(0).max(1),
});
```

---

## 4. End-to-End Data Flows & Sequence Diagrams

### 4.1 Telemetry Harvesting & Problem Detection Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Scheduler as BullMQ Scheduler
    participant W_Collect as Collector Worker
    participant TargetDB as Monitored PostgreSQL
    participant W_Rule as Rule Engine Worker
    participant W_AI as AI Synthesis Worker
    participant LLM as AI Provider API
    participant SysDB as QueryMedic System DB

    Scheduler->>W_Collect: Dispatch "harvest-telemetry" (db_id)
    W_Collect->>TargetDB: Query pg_stat_statements (Limit 200, Timeout 10s)
    W_Collect->>TargetDB: Query pg_stat_user_tables & pg_stat_user_indexes
    TargetDB-->>W_Collect: Return raw metrics & catalog rows
    W_Collect->>SysDB: Upsert normalized queries & metrics snapshots
    W_Collect->>W_Rule: Enqueue "evaluate-rules" (snapshot_id)

    W_Rule->>TargetDB: EXPLAIN (FORMAT JSON) for top impacted queries
    TargetDB-->>W_Rule: Return plan tree JSON
    W_Rule->>W_Rule: Execute deterministic rules (Seq Scan, Missing Index)
    
    alt Deterministic Issues Found
        W_Rule->>SysDB: Insert Finding (Status: DETECTED)
        W_Rule->>W_AI: Enqueue "synthesize-finding" (finding_id)
        W_AI->>LLM: Send structured facts payload + JSON Schema prompt
        LLM-->>W_AI: Return Structured JSON Diagnosis
        W_AI->>SysDB: Update Finding with AI Explanation (Status: RECOMMENDED)
    else No Issues
        W_Rule->>SysDB: Log clean health evaluation
    end
```

### 4.2 Safe Verification & Benchmarking Sandbox Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Engineer as Database Engineer
    participant UI as Web Dashboard
    participant API as Fastify API Gateway
    participant W_Bench as Benchmark Worker
    participant Sandbox as Safe Sandbox / Staging Clone
    participant SysDB as QueryMedic System DB

    Engineer->>UI: Click [ Test Recommendation ]
    UI->>API: POST /api/recommendations/:id/test
    API->>API: AST Parser: Verify SQL is strictly SELECT (Reject mutations)
    API->>SysDB: Update Recommendation Status -> TESTING
    API->>W_Bench: Enqueue "run-benchmark" (recommendation_id)

    W_Bench->>Sandbox: Execute 3x Baseline EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    Sandbox-->>W_Bench: Baseline Latency: 1,820ms, 2.4M rows scanned (Seq Scan)

    W_Bench->>Sandbox: Apply Proposed Index (CREATE INDEX CONCURRENTLY ...)
    Sandbox-->>W_Bench: Index created successfully

    W_Bench->>Sandbox: Execute 3x Test EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    Sandbox-->>W_Bench: Test Latency: 143ms, 52 rows fetched (Index Scan)

    W_Bench->>W_Bench: Calculate Verified Improvement: ((1820 - 143) / 1820) = 92.1%
    W_Bench->>SysDB: Store Benchmark Record & Update Status -> VERIFIED
    W_Bench-->>UI: WebSocket event: "benchmark:completed"
    UI->>Engineer: Render Before/After Visualizer (1,820ms -> 143ms, +92.1% Verified)
```

---

## 5. System Relational Data Model (System DB)

The QueryMedic management database uses PostgreSQL with Prisma ORM.

```mermaid
erDiagram
    Organization ||--o{ User : contains
    Organization ||--o{ DatabaseConnection : owns
    Organization ||--o{ AuditLog : records

    DatabaseConnection ||--o{ DatabaseSnapshot : produces
    DatabaseConnection ||--o{ NormalizedQuery : tracks
    DatabaseConnection ||--o{ Finding : identifies
    DatabaseConnection ||--o{ AlertConfiguration : configures

    DatabaseSnapshot ||--o{ TableCatalog : snapshots
    DatabaseSnapshot ||--o{ IndexCatalog : snapshots

    NormalizedQuery ||--o{ QueryMetric : records_over_time
    NormalizedQuery ||--o{ Finding : associates_with

    Finding ||--o| Recommendation : generates
    Recommendation ||--o{ RecommendationBenchmark : validates

    Organization {
        uuid id PK
        string name
        string slug UK
        string plan_tier
        timestamp created_at
    }

    DatabaseConnection {
        uuid id PK
        uuid organization_id FK
        string name
        string engine
        string host
        int port
        string database_name
        string username
        text encrypted_password
        text password_iv
        text password_tag
        string ssl_mode
        string connection_mode
        string agent_token UK
        string status
        int health_score
        timestamp last_scanned_at
    }

    NormalizedQuery {
        uuid id PK
        uuid database_id FK
        string query_fingerprint UK
        text normalized_sql
        string main_table
        string statement_type
        timestamp first_seen_at
    }

    QueryMetric {
        uuid id PK
        uuid query_id FK
        bigint calls
        float total_exec_time_ms
        float mean_exec_time_ms
        float p95_exec_time_ms
        bigint rows_processed
        bigint shared_blks_hit
        bigint shared_blks_read
        float impact_score
        timestamp snapshot_at
    }

    Finding {
        uuid id PK
        uuid database_id FK
        uuid query_id FK
        string rule_code
        string finding_type
        string severity
        string status
        jsonb deterministic_evidence
        timestamp created_at
        timestamp resolved_at
    }

    Recommendation {
        uuid id PK
        uuid finding_id FK
        string title
        text root_cause
        text explanation
        string remediation_type
        text recommended_sql
        string risk_level
        text risk_explanation
        float estimated_min_pct
        float estimated_max_pct
        float verified_pct
        string status
        uuid approved_by_user_id FK
        timestamp applied_at
    }

    RecommendationBenchmark {
        uuid id PK
        uuid recommendation_id FK
        string environment_type
        float baseline_latency_ms
        string baseline_plan_summary
        float test_latency_ms
        string test_plan_summary
        float improvement_pct
        jsonb baseline_plan_json
        jsonb test_plan_json
        timestamp executed_at
    }

    AuditLog {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        string action_type
        string target_entity
        uuid target_id
        jsonb metadata
        string ip_address
        timestamp created_at
    }
```

---

## 6. Security & Cryptographic Architecture

### 6.1 Envelope Encryption for Target Credentials
All passwords and database URIs are encrypted using authenticated **AES-256-GCM** before persistence:
- **Master Encryption Key (MEK)**: A 256-bit cryptographically secure key supplied via environment variable or cloud KMS (AWS KMS / HashiCorp Vault).
- **Initialization Vector (IV)**: A unique, cryptographically random 96-bit IV generated per encryption operation.
- **Authentication Tag**: A 128-bit GCM authentication tag verifying ciphertext integrity and detecting tampering.

```
Plaintext Password + Master Key + Random IV (12 bytes)
           │
           ▼
[ AES-256-GCM Encryption ]
           │
           ├── Ciphertext (Base64)
           ├── IV (Base64)
           └── Auth Tag (Base64)
           │
           ▼
Stored in database_connections table
```

### 6.2 AST Scrubbing & Privacy Boundary
Application code never stores real query parameters:
1. When telemetry is harvested, PostgreSQL's `pg_stat_statements` natively parameterizes constants into `$1, $2`.
2. When the user pastes custom SQL or queries are captured via the agent, a client-side SQL parser walks the AST and substitutes string literals, numbers, and UUIDs with `?`.
3. Customer row data is **never** queried or persisted; only execution metadata (`calls`, `mean_exec_time`, `rows`, buffer counts) is stored.

---

## 7. Distributed Queue Topology (BullMQ + Redis 7)

```mermaid
flowchart LR
    subgraph BullMQRack ["BullMQ Queue Topology"]
        Q1["telemetry-harvest\n(Concurrency: 10, Timeout: 30s)"]
        Q2["rule-analysis\n(Concurrency: 20, Priority-aware)"]
        Q3["ai-synthesis\n(Concurrency: 5, Rate-limited)"]
        Q4["benchmark-sandbox\n(Concurrency: 2, Isolated)"]
        Q5["alert-dispatch\n(Concurrency: 15, Retry: 5x exponential)"]
    end

    Cron["Scheduled Trigger\n(Every 10 min)"] --> Q1
    Q1 --> Q2
    Q2 --> Q3
    Manual["User [Test] Click"] --> Q4
    Regression["Latency Spike Event"] --> Q5
```

| Queue Name | Primary Responsibility | Concurrency | Retry Policy | Timeout |
| :--- | :--- | :--- | :--- | :--- |
| `telemetry-harvest` | Polls target DBs for statistics & snapshots | 10 | 2 retries, 10s delay | 30 seconds |
| `rule-analysis` | Computes Impact Scores, runs deterministic rules | 20 | 3 retries, 5s delay | 60 seconds |
| `ai-synthesis` | Calls LLM API with structured schemas | 5 | 3 retries, exponential backoff | 45 seconds |
| `benchmark-sandbox` | Executes safe SELECT benchmarks in test DB | 2 | 0 retries (fail fast) | 90 seconds |
| `alert-dispatch` | Sends notifications to Slack/Discord/Webhooks | 15 | 5 retries, exponential backoff | 15 seconds |

---

## 8. Technology Stack Manifest

```
┌────────────────────────────────────────────────────────────────────────┐
│                        QueryMedic Technology Stack                     │
├─────────────────────┬────────────────────┬─────────────────────────────┤
│ Component           │ Technology         │ Rationale                   │
├─────────────────────┼────────────────────┼─────────────────────────────┤
│ Frontend Framework  │ Next.js 15 (App R) │ Fast SSR, Server Actions    │
│ Frontend UI         │ Tailwind + shadcn  │ High aesthetic velocity     │
│ State & Querying    │ TanStack Query v5  │ Seamless cache invalidation │
│ SQL Editor          │ Monaco Editor      │ Rich SQL IDE experience     │
│ Charting            │ Recharts           │ Responsive SVG performance  │
├─────────────────────┼────────────────────┼─────────────────────────────┤
│ API Server          │ Fastify + Node 22  │ High throughput, low latency│
│ Language            │ TypeScript 5.6     │ End-to-end type safety      │
│ Validation          │ Zod                │ Runtime schema enforcement  │
│ System Database     │ PostgreSQL 16      │ Robust relational storage   │
│ ORM                 │ Prisma             │ Type-safe migrations        │
│ Queue & Cache       │ Redis 7 + BullMQ   │ Robust distributed tasks    │
├─────────────────────┼────────────────────┼─────────────────────────────┤
│ Target DB Drivers   │ pg (node-postgres) │ Battle-tested PostgreSQL    │
│ SQL Parser          │ node-sql-parser    │ AST inspection & scrubbing  │
│ AI Providers        │ Anthropic / Gemini │ Structured JSON synthesis   │
└─────────────────────┴────────────────────┴─────────────────────────────┘
```

---

## 9. Monorepo Repository Structure

```
query-medic/
├── apps/
│   ├── web/                    # Next.js 15 Frontend Dashboard
│   │   ├── src/app/            # App Router pages (auth, dashboard, queries, recommendations)
│   │   ├── src/components/     # UI components (MonacoEditor, PlanVisualizer, HealthGauge)
│   │   └── src/hooks/          # TanStack Query custom hooks
│   ├── api/                    # Fastify API Server
│   │   ├── src/modules/        # Domain modules (auth, databases, analysis, etc.)
│   │   ├── src/plugins/        # Fastify plugins (JWT, CORS, Swagger, BullMQ)
│   │   └── src/server.ts       # Server entrypoint
│   └── workers/                # BullMQ Worker Fleet
│       ├── src/processors/     # Telemetry, Rule, AI, Benchmark, and Alert processors
│       └── src/worker.ts       # Worker process entrypoint
├── packages/
│   ├── db-adapters/            # PostgreSQL & MySQL adapter implementations
│   ├── rule-engine/            # Deterministic detection rules & AST analyzers
│   ├── ai-engine/              # LLM provider abstraction & structured Zod schemas
│   ├── security/               # AES-256-GCM encryption & parameter scrubbers
│   └── database/               # Shared Prisma schema, client, and migrations
├── docker/
│   ├── docker-compose.yml      # Local dev stack (API, Web, Redis, Postgres, Sample DB)
│   └── Dockerfile.agent        # In-VPC Daemon Agent container
├── package.json
└── tsconfig.base.json
```
