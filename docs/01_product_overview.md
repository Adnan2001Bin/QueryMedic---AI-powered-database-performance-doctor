# 01. Product Overview: QueryMedic — AI Database Performance Doctor

> **Document Status**: Complete & Authoritative  
> **Target Audience**: Engineering Leadership, Product Managers, Backend Engineers, SREs, Investors  
> **System Name**: QueryMedic (`@database-doctor`)  
> **Cross-Reference**: Detailed domain fundamentals are defined in [02_domain_primer.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/02_domain_primer.md). The verifiable functional contract is specified in [03_requirements.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/03_requirements.md).

---

## 1. Executive Summary & One-Line Vision

**QueryMedic** is an automated, read-only database performance doctor for modern engineering teams. It continuously monitors relational database metadata, execution statistics, and query plans, diagnoses the deterministic root causes of latency and resource exhaustion, generates plain-language AI explanations, and validates non-destructive optimizations inside safe benchmark environments.

### The One-Line Pitch
> **"Connect your PostgreSQL or MySQL database; QueryMedic continuously detects performance regressions, explains why they happen, and delivers safely benchmarked, human-approved fixes before users complain."**

---

## 2. Core Positioning & Safety Philosophy

Most database performance incidents are handled with reactive panic. Engineering teams rely on trial-and-error—blaming application runtimes, over-provisioning compute resources, or throwing Redis caches at unindexed queries. When AI tools are introduced, they often attempt dangerous, direct modifications against production systems.

QueryMedic is built on a foundational safety doctrine:

> **AI must never directly mutate production databases by default.**  
> Real-world database reliability requires deterministic proof, human governance, and sandboxed empirical benchmarking.

```
                    ┌─────────────────────────────────────────┐
                    │     Production Relational Database      │
                    │         (PostgreSQL / MySQL)            │
                    └────────────────────┬────────────────────┘
                                         │
                             Read-Only Telemetry & Stats
                             (pg_stat_statements / plans)
                                         │
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │      Deterministic Analysis Engine      │
                    │   (AST Rules, Plan Tree, Index Graph)   │
                    └────────────────────┬────────────────────┘
                                         │
                               Structured Findings
                                         │
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │        AI Explanation & Synthesis       │
                    │  (Root Cause, Plain English, Migration) │
                    └────────────────────┬────────────────────┘
                                         │
                              Structured Action Plan
                                         │
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │         Safe Validation Engine          │
                    │  (SELECT-Only, Sandbox / Shadow Bench)  │
                    └────────────────────┬────────────────────┘
                                         │
                              Verified Improvement %
                                         │
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │       Human Review & Apply Gate         │
                    │  (One-Click Migration / CONCURRENTLY)   │
                    └─────────────────────────────────────────┘
```

---

## 3. The Problem Space

### 3.1 The "Blind Guessing" Dilemma
When an application slows down, developers rarely have immediate visibility into database internals. A query such as:

```sql
SELECT *
FROM orders
WHERE organization_id = 42
ORDER BY created_at DESC
LIMIT 50;
```

taking **1.82 seconds** in production creates immediate confusion across the organization:
- *Is the Node.js/Python event loop blocked?*
- *Is the API gateway throttling connections?*
- *Do we need to scale up our database instance from 4 vCPU to 16 vCPU ($$$)?*
- *Should we write complex application-level caching with Redis?*

In reality, the table contains 2,500,000 rows, and the engine is executing a full **Sequential Scan** followed by an in-memory or on-disk **External Sort**, because no composite index on `(organization_id, created_at DESC)` exists.

### 3.2 High Latency vs. High Cumulative Resource Drain
Most APM solutions only flag slow queries (>1,000ms). However, the most destructive database killers are often sub-second queries executed millions of times:
- **Query A**: 2.0s latency, executed 10 times/day = 20s total DB CPU time.
- **Query B**: 45ms latency, executed 500,000 times/day = **22,500s (6.25 hours)** of DB CPU time.

QueryMedic addresses this with workload-weighted impact scoring that uncovers hidden throughput bottlenecks before connection pools saturate.

### 3.3 The "AI Hallucination & Risk" Dilemma in DBA Work
General-purpose LLMs lack visibility into real query plans, index selectivity, cache hit ratios, and table statistics (`pg_class`, `pg_stats`). Asking an LLM "How do I optimize this SQL?" yields generic, sometimes catastrophic advice—such as proposing an index on high-frequency write tables that degrades write throughput by 40%, or proposing `CREATE INDEX` without `CONCURRENTLY`, which locks table writes and causes total production downtime.

---

## 4. Key Differentiators

| Capability | Generic APM / Observability (Datadog, New Relic) | Pure LLM Code Assistants (ChatGPT, Claude) | QueryMedic |
| :--- | :--- | :--- | :--- |
| **Data Access Required** | Full metrics agent on host | Raw SQL snippet copy-pasted | Read-only database connection or zero-inbound local daemon |
| **Root Cause Depth** | "Query latency is high" (graph only) | Guesses based on SQL syntax alone | Evaluates actual `EXPLAIN (FORMAT JSON)` execution plans + table catalog statistics |
| **Deterministic Validation** | None | None (often hallucinates non-existent columns) | Deterministic rule engine executes *before* AI layer to anchor facts |
| **Safety Governance** | Read-only observation | Generates DDL with zero environment awareness | Enforces explicit human approval lifecycle (`DETECTED` $\to$ `TESTED` $\to$ `APPLIED`) |
| **Empirical Proof** | None | Hypothetical speed claims | **Differentiates "Estimated Improvement" from "Verified Benchmark Improvement"** |
| **Production Lock Prevention** | None | Emits blocking `CREATE INDEX` | Mandates online DDL (`CREATE INDEX CONCURRENTLY` in Postgres, `ALGORITHM=INPLACE` in MySQL) |

---

## 5. Product Pillars & Core Capabilities

### 5.1 Pillar 1: Non-Intrusive, Read-Only Telemetry Harvesting
- Connects using a strictly scoped, least-privilege `readonly_monitor` role.
- Extracts telemetry from native database statistics engines:
  - PostgreSQL: `pg_stat_statements`, `pg_stat_user_tables`, `pg_stat_user_indexes`, `pg_stat_activity`, `pg_locks`.
  - MySQL: `performance_schema`, `information_schema`, `sys` schema.
- Cryptographically protects credentials at rest using envelope encryption (AES-256-GCM) with tenant-isolated key derivation.
- Offers an optional in-VPC local daemon (`@database-doctor/agent`) for enterprises requiring zero inbound firewall ingress.

### 5.2 Pillar 2: Deterministic Rule Engine Before AI
QueryMedic never feeds raw database statistics blindly into an LLM. A deterministic rule engine parses query ASTs and execution plan nodes to generate structured evidence facts:
- **Scan Analysis**: Flags `Seq Scan` on tables exceeding configurable row/page thresholds.
- **Index Redundancy**: Identifies redundant prefixes (e.g., `INDEX (org_id)` when `INDEX (org_id, created_at)` already exists).
- **Index Absence**: Correlates `WHERE` equality/range predicates and `ORDER BY` clauses against existing B-Tree coverage.
- **Join Inefficiencies**: Identifies nested loop joins over unindexed foreign keys and hash joins spilling to disk.
- **N+1 Pattern Detector**: Analyzes query clusters executing identical normalized AST structures with varying primary keys within milliseconds.
- **Table & Storage Bloat**: Evaluates dead tuple percentages, vacuum lagging, and free space fragmentation.

### 5.3 Pillar 3: AI Explanation & Contextual Synthesis
The deterministic diagnostic facts are packaged into a structured schema and dispatched to an LLM provider (OpenAI, Anthropic, Google Gemini, or local Ollama instances):
- **Plain-English Root Cause**: Explains in developer-friendly terms why the query planner chose a sub-optimal path.
- **Production-Ready Remediation DDL**: Outputs safe SQL with concurrency flags and correct composite column ordering.
- **Risk & Trade-off Scoring**: Assesses the write amplification, disk footprint, and maintenance overhead of the proposed fix.

### 5.4 Pillar 4: The Empirical Benchmark & Verification Sandbox
QueryMedic enforces a rigorous boundary between theory and empirical reality:
- **Estimated Improvement**: Planner cost differential calculated from `EXPLAIN` without executing the query.
- **Verified Improvement**: Empirical wall-clock latency, buffer cache hit count, and row scan counts measured by running safe `SELECT` benchmarks in an isolated sandbox or cloned staging environment before and after applying the proposed DDL.

### 5.5 Pillar 5: Complete Lifecycle Governance & Auditing
- Tracks recommendations across explicit lifecycle states:  
  `DETECTED` $\to$ `ANALYZED` $\to$ `RECOMMENDED` $\to$ `TESTING` $\to$ `VERIFIED` $\to$ `APPROVED` $\to$ `APPLIED` (or `REJECTED`).
- Maintains an append-only audit trail recording every user action, approval, SQL script execution, and rollback.

---

## 6. High-Level System Architecture

```
                                  ┌────────────────────────────────────────┐
                                  │            Next.js Dashboard           │
                                  │   (TypeScript, Tailwind, shadcn/ui,    │
                                  │    TanStack Query, Monaco Editor)      │
                                  └───────────────────┬────────────────────┘
                                                      │ HTTPS / WSS
                                                      ▼
                                  ┌────────────────────────────────────────┐
                                  │          Fastify API Gateway           │
                                  │    (Zod Validation, JWT Auth, RBAC)    │
                                  └───────────────────┬────────────────────┘
                                                      │
                       ┌──────────────────────────────┼──────────────────────────────┐
                       ▼                              ▼                              ▼
        ┌─────────────────────────────┐┌─────────────────────────────┐┌─────────────────────────────┐
        │     PostgreSQL System DB    ││        Redis 7 + BullMQ     ││    LLM Provider Service     │
        │  (Prisma ORM, Multi-Tenant  ││ (Distributed Job Queues for ││ (Anthropic, Gemini, OpenAI, │
        │  Snapshots, Findings, Audit)││  Collectors, Rules, Tests)  ││  Structured JSON Schemas)   │
        └─────────────────────────────┘└──────────────┬──────────────┘└─────────────────────────────┘
                                                      │
                                                      ▼
                                       ┌─────────────────────────────┐
                                       │     Worker Engine Nodes     │
                                       ├─────────────────────────────┤
                                       │ • Metadata Collector        │
                                       │ • AST Normalizer & Hasher   │
                                       │ • Rule Engine (Deterministic│
                                       │ • Benchmark Sandbox Worker  │
                                       │ • Alert Dispatcher          │
                                       └──────────────┬──────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       │                                                             │
                       ▼                                                             ▼
        ┌─────────────────────────────┐                               ┌─────────────────────────────┐
        │   Direct Target Connection  │                               │    On-Premises VPC Agent    │
        │   (Read-Only Target DB)     │                               │ (`@database-doctor/agent`)  │
        └─────────────────────────────┘                               └─────────────────────────────┘
```

---

## 7. Target Audience & Ideal Customer Profile (ICP)

### Primary ICP: High-Growth SaaS Engineering Teams (10–50 Engineers)
- **Environment**: Cloud-hosted PostgreSQL (AWS RDS, Aurora, Neon, Supabase, Railway, GCP Cloud SQL).
- **Pain Point**: Rapid product velocity leads to unindexed tables and ORM-generated query regressions. The engineering team has no dedicated Database Administrator (DBA), leaving backend developers to firefight database alerts during sprint cycles.
- **Budget**: $79 – $249 / month self-serve SaaS.

### Secondary ICP: Transaction-Heavy E-Commerce & Marketplaces
- **Environment**: High-throughput read/write environments (orders, inventory, fulfillment, payment ledgers).
- **Pain Point**: Write amplification caused by redundant indexes; query latency spikes during flash sales and peak checkout windows.

### Tertiary ICP: Software Consultancies & Managed Agencies
- **Environment**: Managing 15–50 distinct client databases across varied cloud providers.
- **Pain Point**: Lack of centralized multi-tenant visibility into client database degradation; requires automated monthly health reports and proactive optimization audits.

---

## 8. Phased Development Roadmap

```
  Phase 1: Foundation (Auth, Multi-Tenant SaaS Shell, BullMQ Queue Pipeline)
     │
  Phase 2: Secure PostgreSQL Connection & Telemetry Ingestion (AES-256, pg_stat_statements)
     │
  Phase 3: Query Normalization, Fingerprinting & Workload Impact Scoring
     │
  Phase 4: Deterministic Problem Detection Engine (Missing/Duplicate Indexes, Seq Scans)
     │
  Phase 5: Structured AI Diagnosis & Plain-Language Explanation Engine
     │
  Phase 6: Safe Benchmark Engine (Empirical Before/After Sandbox Testing)
     │
  Phase 7: Production Health Dashboard & Query Explorer (Health Score, Monaco SQL)
     │
  Phase 8: Continuous Monitoring, Regression Alerting & Integrations (Slack/Webhooks)
     │
  Phase 9: In-VPC Local Daemon Agent (`@database-doctor/agent` for Private VPCs)
     │
  Phase 10: Multi-Engine Adapter Layer (MySQL 8.0+ Support)
```

---

## 9. MVP Definition (The 7 Core Deliverables)

To validate the market hypothesis with absolute technical credibility, the initial MVP delivers a tightly scoped, high-impact loop:

1. **PostgreSQL Connection**: Secure, read-only connectivity with automatic permission validation.
2. **Telemetry Ingestion**: Background extraction of `pg_stat_statements`, table catalogs, and index statistics.
3. **Query Plan Extraction**: Safe retrieval and parsing of `EXPLAIN (FORMAT JSON)` for slow queries.
4. **Deterministic Index Doctor**: Automated detection of missing composite indexes and duplicate B-Trees.
5. **Structured AI Diagnosis**: Plain-English root cause synthesis, estimated impact range, and safe `CREATE INDEX CONCURRENTLY` remediation SQL.
6. **Before/After Benchmark Validation**: Sandboxed comparison verifying actual latency reduction against estimated gains.
7. **Executive Health Dashboard**: Real-time 0–100 Health Score, breakdown of critical/high issues, and interactive Query Explorer.
