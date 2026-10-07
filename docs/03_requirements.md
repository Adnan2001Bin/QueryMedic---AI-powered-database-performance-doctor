# 03. System Requirements & EARS Acceptance Criteria

> **Document Status**: Complete & Authoritative  
> **Target Audience**: Product Managers, Software Architects, QA Engineers, Frontend/Backend Developers  
> **System Name**: QueryMedic (`@database-doctor`)  
> **Specification Standard**: Easy Approach to Requirements Syntax (EARS)  
> **Prerequisites**: Readers must be familiar with the domain concepts defined in [02_domain_primer.md](file:///E:/Web_Development/QueryMedic%20—%20AI-powered%20database%20performance%20doctor/02_domain_primer.md).

---

## 1. Requirement Taxonomy & EARS Syntax Rules

Every acceptance criterion in this document represents a verifiable contract testable from the user's, API consumer's, or client agent's boundary. Each criterion strictly adheres to one of the five EARS patterns:

1. **Ubiquitous**: `The system shall [action].` (Applies universally across all states).
2. **Event-Driven**: `WHEN [trigger event], the system shall [action].`
3. **State-Driven**: `WHILE [state / precondition], the system shall [action].`
4. **Unwanted Behavior**: `IF [error condition / invalid input], THEN the system shall [mitigation / response].`
5. **Optional Feature**: `WHERE [optional configuration / capability enabled], the system shall [action].`

---

## 2. Actor & Role Definitions

| Actor | Description |
| :--- | :--- |
| **Workspace Admin** | Organization owner with full authority over databases, billing, user access, and approval workflows. |
| **Database Engineer / SRE** | Technical user with permissions to connect databases, run benchmarks, approve recommendations, and export DDL. |
| **Developer / Viewer** | Team member with read-only access to dashboards, query metrics, and diagnostic explanations. |
| **Background Worker** | Internal asynchronous BullMQ processor executing telemetry collection, rule analysis, and benchmarking tasks. |
| **VPC Daemon Agent** | In-VPC client process (`@database-doctor/agent`) communicating telemetry to the cloud gateway via secure outbound WebSocket/HTTPS. |

---

## 3. Epics & User Stories with EARS Acceptance Criteria

```
┌────────────────────────────────────────────────────────────────────────┐
│                        QueryMedic Epic Breakdown                       │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 1. Multi-Tenancy  │ 2. Connection &   │ 3. Telemetry Harvesting &      │
│    & RBAC         │    Security Vault │    Catalog Snapshotting        │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ 4. Normalization  │ 5. Deterministic  │ 6. AI Diagnosis & Structured   │
│    & Fingerprints │    Rule Engine    │    Explanation Engine          │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ 7. Safe Benchmark │ 8. Recommendation │ 9. Dashboard, Query Explorer   │
│    Sandbox        │    Lifecycle      │    & Health Score              │
├───────────────────┴───────────────────┴────────────────────────────────┤
│ 10. Regression Alerts & Incident Webhooks                              │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Epic 1: Organization, Multi-Tenancy & Access Governance

#### User Story 1.1: Multi-Tenant Tenant Isolation
*As an Enterprise Security Architect, I want all database metadata, query text, and diagnostic reports isolated by organization, so that no tenant can inspect another organization's telemetry.*

- **EARS-1.1.1 (Ubiquitous)**: The system shall scope every database connection, snapshot, query metric, finding, and audit record to an immutable `organization_id`.
- **EARS-1.1.2 (Event-Driven)**: WHEN an authenticated user requests any database entity, the system shall verify that the user's active session token contains an explicit role binding to the owning `organization_id`.
- **EARS-1.1.3 (Unwanted Behavior)**: IF an incoming API request specifies an entity identifier not belonging to the caller's active `organization_id`, THEN the system shall return an HTTP `404 Not Found` response without leaking entity existence.

#### User Story 1.2: Role-Based Action Permissions
*As a Workspace Admin, I want to restrict who can approve remediation DDL and trigger benchmark executions, so that junior team members do not trigger unauthorized tests.*

- **EARS-1.2.1 (State-Driven)**: WHILE a user possesses only the `Developer / Viewer` role, the system shall disable and reject all requests to trigger benchmark tests, approve recommendations, or mutate connection configurations.
- **EARS-1.2.2 (Event-Driven)**: WHEN a `Workspace Admin` or `Database Engineer` submits a recommendation approval, the system shall record the user's identifier, IP address, and timestamp in an immutable append-only audit log.
- **EARS-1.2.3 (Unwanted Behavior)**: IF a user lacking the `Database Engineer` or `Workspace Admin` role attempts to invoke the benchmark execution endpoint, THEN the system shall return an HTTP `403 Forbidden` response with reason code `INSUFFICIENT_PERMISSIONS`.

---

### Epic 2: Database Connection & Secure Credential Vault

#### User Story 2.1: PostgreSQL Direct Connection Onboarding
*As an SRE, I want to connect my PostgreSQL database via host credentials or URI with automated privilege verification, so that I can confirm QueryMedic has the exact minimum read permissions required.*

- **EARS-2.1.1 (Event-Driven)**: WHEN a user submits a PostgreSQL connection form (specifying host, port, database name, username, password, and SSL mode), the system shall initiate a transient connection test using a timeout of no more than 5,000 milliseconds.
- **EARS-2.1.2 (Event-Driven)**: WHEN the connection test succeeds, the system shall execute verification queries against `pg_stat_statements`, `pg_stat_user_tables`, and `pg_stat_user_indexes` to confirm read access.
- **EARS-2.1.3 (Unwanted Behavior)**: IF the database user possesses `SUPERUSER` privileges, THEN the system shall display a security warning badge stating `OVER_PRIVILEGED_USER` and recommend switching to a least-privilege `readonly_monitor` role.
- **EARS-2.1.4 (Unwanted Behavior)**: IF the extension `pg_stat_statements` is not installed or enabled in `shared_preload_libraries`, THEN the system shall flag the connection with status `EXTENSION_MISSING` and display copyable SQL commands (`CREATE EXTENSION IF NOT EXISTS pg_stat_statements;`) to enable it.
- **EARS-2.1.5 (Ubiquitous)**: The system shall encrypt all database passwords and connection strings at rest using AES-256-GCM authenticated encryption with unique initialization vectors (IV) before persisting them to the application database.

#### User Story 2.2: In-VPC Daemon Agent Pairing
*As a DevSecOps Lead with private VPC databases, I want to install a lightweight daemon agent inside my Kubernetes cluster or EC2 instances, so that I do not have to expose public database ports or share passwords with a cloud service.*

- **EARS-2.2.1 (Event-Driven)**: WHEN a user selects "Connect via Agent", the system shall generate an agent deployment token valid for 60 minutes and display an executable Docker command (`docker run -e AGENT_TOKEN=... database-doctor/agent`).
- **EARS-2.2.2 (Event-Driven)**: WHEN the agent connects to the cloud gateway over an outbound TLS WebSocket connection using a valid token, the system shall register the agent, pair it with the target database, and transition connection status to `ONLINE`.
- **EARS-2.2.3 (State-Driven)**: WHILE an agent maintains an active WebSocket heartbeat, the system shall dispatch telemetry collection and plan analysis jobs exclusively through the agent's channel without ever storing customer database credentials in the cloud database.
- **EARS-2.2.4 (Unwanted Behavior)**: IF the agent fails to send a heartbeat ping for longer than 60 seconds, THEN the system shall mark the database connection as `AGENT_DISCONNECTED` and notify workspace admins.

---

### Epic 3: Telemetry Harvesting & Catalog Snapshotting

#### User Story 3.1: Automated Periodic Metadata Collection
*As a Database Engineer, I want QueryMedic to automatically harvest table sizes, index stats, and query execution metrics on an automated cadence, so that I have up-to-date performance visibility.*

- **EARS-3.1.1 (Event-Driven)**: WHEN a scheduled collection job triggers (default: every 10 minutes), the system shall enqueue a BullMQ task to query `pg_stat_statements`, table catalogs, and health indicators.
- **EARS-3.1.2 (Event-Driven)**: WHEN harvesting PostgreSQL table metadata, the system shall extract `schemaname`, `relname`, `n_live_tup`, `n_dead_tup`, table byte size via `pg_total_relation_size()`, and index byte size.
- **EARS-3.1.3 (Event-Driven)**: WHEN harvesting index metadata, the system shall extract `indexrelname`, `idx_scan`, `idx_tup_read`, `idx_tup_fetch`, and column definition ordinals from `pg_index` and `pg_stat_user_indexes`.
- **EARS-3.1.4 (Unwanted Behavior)**: IF an individual telemetry collection query exceeds a hard query timeout of 10,000 milliseconds, THEN the system shall terminate the query with `statement_timeout`, record a `COLLECTION_TIMEOUT` warning, and prevent saturation of target database resources.

---

### Epic 4: Query Normalization, Fingerprinting & Workload Profiling

#### User Story 4.1: SQL Normalization & Canonical Fingerprinting
*As a Backend Developer, I want queries with different parameter values grouped under a single canonical fingerprint, so that I can see the true aggregate volume and latency of each query pattern.*

- **EARS-4.1.1 (Event-Driven)**: WHEN raw SQL statements are ingested, the system shall parse the statement, replace all literal constants, string literals, and numeric values with canonical placeholders (`$1`, `$2` or `?`), and strip superfluous whitespace.
- **EARS-4.1.2 (Event-Driven)**: WHEN a query has been normalized, the system shall compute a SHA-256 fingerprint hash over the normalized string to serve as the immutable `query_fingerprint`.
- **EARS-4.1.3 (Ubiquitous)**: The system shall aggregate `calls`, `total_exec_time`, `mean_exec_time`, `rows`, `shared_blks_hit`, and `shared_blks_read` under the matching `query_fingerprint` record.

#### User Story 4.2: Workload Impact Scoring
*As an Engineering Lead, I want queries ranked by total system impact rather than raw peak latency, so that my team fixes high-volume bottlenecks that drain CPU before one-off slow queries.*

- **EARS-4.2.1 (Event-Driven)**: WHEN query metrics are updated, the system shall compute the query's **Impact Score** using the formula:
  $$\text{Impact Score} = \text{mean\_latency\_ms} \times \left(\frac{\text{calls}}{\text{time\_window\_hours}}\right) \times \left(1 + \frac{\text{shared\_blks\_read}}{\text{shared\_blks\_hit} + 1}\right)$$
- **EARS-4.2.2 (Ubiquitous)**: The system shall categorize every query into an impact tier based on its calculated score:
  - `CRITICAL`: Impact Score $\ge 100,000$
  - `HIGH`: Impact Score between $25,000$ and $99,999$
  - `MEDIUM`: Impact Score between $5,000$ and $24,999$
  - `LOW`: Impact Score $< 5,000$
- **EARS-4.2.3 (Event-Driven)**: WHEN rendering the Query Explorer, the system shall sort queries by Impact Score descending by default.

#### User Story 4.3: N+1 Query Cluster Detection
*As a Backend Developer using ORMs, I want the system to alert me when an application loop generates hundreds of repetitive single-row queries, so that I can replace them with a single batched join.*

- **EARS-4.3.1 (Event-Driven)**: WHEN telemetry contains multiple query executions originating from the same application connection within a rolling 500ms sliding window, the system shall compare their normalized AST fingerprints.
- **EARS-4.3.2 (Event-Driven)**: WHEN an identical single-record lookup query (`WHERE id = ?` or `WHERE parent_id = ?`) executes $\ge 25$ times within a single sliding window, the system shall flag the cluster as an `N_PLUS_ONE` finding.
- **EARS-4.3.3 (Ubiquitous)**: The system shall correlate the parent query with its child executions and display the estimated query count reduction achieved by converting to `WHERE ... IN (...)` or `JOIN`.

---

### Epic 5: Deterministic Problem Detection Engine (Rules First)

#### User Story 5.1: Sequential Scan on Large Tables
*As a DBA, I want the system to flag sequential table scans deterministically without relying on probabilistic LLMs, so that all detected issues are backed by hard catalog facts.*

- **EARS-5.1.1 (Event-Driven)**: WHEN analyzing query execution plans obtained via `EXPLAIN (FORMAT JSON)`, the system shall inspect all plan nodes for `Node Type: "Seq Scan"`.
- **EARS-5.1.2 (Event-Driven)**: WHEN a `Seq Scan` is detected on a relation whose total row count exceeds 10,000 rows (or whose table size exceeds 10 MB), the system shall trigger Rule `RULE-SCAN-01` and generate a `SEQUENTIAL_SCAN` finding.
- **EARS-5.1.3 (Ubiquitous)**: The system shall extract the scanned relation name, filter condition (`Filter`), number of rows removed by filter (`Rows Removed by Filter`), and total execution cost from the plan JSON.

#### User Story 5.2: Missing Composite Index Detection
*As a Database Engineer, I want the system to analyze `WHERE` and `ORDER BY` clauses against existing indexes, so that it can identify missing multi-column indexes with correct column ordering.*

- **EARS-5.2.1 (Event-Driven)**: WHEN a query plan contains a `Seq Scan` followed by a `Sort` node, the system shall extract the equality columns, range columns, and sort expressions from the query AST.
- **EARS-5.2.2 (Event-Driven)**: WHEN no existing index on the target table shares the same leading column sequence, the system shall trigger Rule `RULE-IDX-01` and output a candidate composite index specification following the rule:
  1. Equality columns first (alphabetical by column name)
  2. Sort columns next (preserving `ASC`/`DESC` directions)
  3. Range filter columns last
- **EARS-5.2.3 (Ubiquitous)**: The candidate index output shall specify `CREATE INDEX CONCURRENTLY` for PostgreSQL and `ALGORITHM=INPLACE, LOCK=NONE` for MySQL.

#### User Story 5.3: Duplicate & Redundant Index Detection
*As an SRE, I want QueryMedic to detect duplicate indexes and redundant prefixes, so that I can reclaim storage and reduce write amplification.*

- **EARS-5.3.1 (Event-Driven)**: WHEN analyzing the table index catalog, the system shall compare the column sequences of all B-Tree indexes on the same relation.
- **EARS-5.3.2 (Event-Driven)**: WHEN Index $A$ and Index $B$ contain the exact same column list in identical order, the system shall trigger Rule `RULE-IDX-DUP` with severity `MEDIUM` and recommend dropping the younger index.
- **EARS-5.3.3 (Event-Driven)**: WHEN the columns of Index $A$ form a strict leftmost prefix of Index $B$ (e.g., $A = (org\_id)$ and $B = (org\_id, created\_at)$) and Index $A$ is not declared as `UNIQUE`, the system shall trigger Rule `RULE-IDX-REDUNDANT` and recommend dropping Index $A$.

#### User Story 5.4: Unused & Dormant Index Detection
*As a DBA, I want to identify indexes that have had zero scans over an extended period, so that I can eliminate unnecessary write overhead.*

- **EARS-5.4.1 (Event-Driven)**: WHEN an index on a table with more than 100,000 rows has recorded `idx_scan = 0` continuously across a minimum observation window of 14 days, the system shall generate an `UNUSED_INDEX` finding.
- **EARS-5.4.2 (Unwanted Behavior)**: IF an index enforces a `PRIMARY KEY` or `UNIQUE` constraint, THEN the system shall exclude that index from unused index drop recommendations regardless of `idx_scan` count.

#### User Story 5.5: Dead Tuple & Table Bloat Detection
*As an SRE, I want alerts when table bloat exceeds healthy thresholds, so that I can schedule vacuuming before performance degrades.*

- **EARS-5.5.1 (Event-Driven)**: WHEN a PostgreSQL table's dead tuple ratio $\frac{n\_dead\_tup}{n\_live\_tup + n\_dead\_tup}$ exceeds 20% and $n\_dead\_tup > 50,000$, the system shall trigger Rule `RULE-BLOAT-01` and generate a `TABLE_BLOAT` finding.
- **EARS-5.5.2 (Event-Driven)**: WHEN generating a `TABLE_BLOAT` finding, the system shall recommend running `VACUUM (ANALYZE)` or tuning PostgreSQL autovacuum settings (`autovacuum_vacuum_scale_factor`, `autovacuum_vacuum_cost_limit`).

---

### Epic 6: AI Diagnostic Synthesis & Structured Explanation Engine

#### User Story 6.1: Provider-Agnostic AI Abstraction Layer
*As a Systems Architect, I want the AI layer decoupled behind an abstraction interface, so that QueryMedic can switch between Anthropic, Google Gemini, OpenAI, or local models without modifying business logic.*

- **EARS-6.1.1 (Ubiquitous)**: The system shall route all AI diagnostic generation through a strictly typed `AIProvider` interface defining `analyzeQuery(input)`, `explainPlan(input)`, and `explainRecommendation(input)`.
- **EARS-6.1.2 (Ubiquitous)**: The system shall format the payload sent to the LLM as a strictly structured JSON envelope containing: normalized SQL, table row count, table byte size, existing indexes, parsed execution plan nodes, and triggered deterministic rule IDs.
- **EARS-6.1.3 (Unwanted Behavior)**: IF the configured AI provider returns a rate limit HTTP `429` or connection error, THEN the system shall retry with exponential backoff up to 3 times before failing the BullMQ task and logging an alert.

#### User Story 6.2: Strict Structured Output Schema Compliance
*As a Frontend Developer, I want AI diagnostic responses returned in a strict JSON schema, so that the UI can reliably render structured components without string parsing.*

- **EARS-6.2.1 (Event-Driven)**: WHEN requesting a diagnostic synthesis from an LLM, the system shall enforce JSON schema generation matching the following exact contract:
  ```json
  {
    "title": "string",
    "severity": "CRITICAL | HIGH | MEDIUM | LOW",
    "root_cause": "string",
    "explanation": "string",
    "remediation_type": "CREATE_INDEX | DROP_INDEX | REWRITE_QUERY | VACUUM | CONFIG_CHANGE",
    "recommended_sql": "string",
    "risk_level": "LOW | MEDIUM | HIGH",
    "risk_explanation": "string",
    "estimated_improvement_pct": {
      "min": 0,
      "max": 100
    },
    "confidence_score": 0.95
  }
  ```
- **EARS-6.2.2 (Unwanted Behavior)**: IF the LLM output fails schema validation against the Zod contract, THEN the system shall discard the response, log a validation failure event, and re-prompt the LLM with a schema repair payload.
- **EARS-6.2.3 (Ubiquitous)**: The system shall display the AI-generated explanation alongside an explicit visual disclaimer distinguishing `Estimated Improvement` from `Verified Improvement`.

---

### Epic 7: Safe Verification & Benchmarking Sandbox

#### User Story 7.1: Safe SELECT-Only Benchmark Gatekeeper
*As a Security Lead, I want QueryMedic to enforce strict read-only execution during automated benchmarking, so that no benchmark can ever modify, delete, or corrupt database data.*

- **EARS-7.1.1 (Ubiquitous)**: The system shall parse all candidate benchmark queries with an AST SQL parser and verify that the root statement type is strictly `SELECT`.
- **EARS-7.1.2 (Unwanted Behavior)**: IF an engineer or worker attempts to submit a benchmark containing `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `GRANT`, or data-modifying Common Table Expressions (`WITH ... INSERT ...`), THEN the system shall abort execution immediately with error `MUTATING_STATEMENT_PROHIBITED`.
- **EARS-7.1.3 (State-Driven)**: WHILE executing benchmark queries, the system shall configure session-level guards:
  ```sql
  SET statement_timeout = '15000ms';
  SET default_transaction_read_only = TRUE;
  ```

#### User Story 7.2: Empirical Before / After Benchmark Execution
*As a Performance Engineer, I want QueryMedic to test proposed index fixes in a safe staging or sandboxed clone, so that I have empirical proof of latency reduction before approving production deployment.*

- **EARS-7.2.1 (Event-Driven)**: WHEN an authorized user clicks `[ Test Recommendation ]`, the system shall enqueue a verification job against the designated benchmark target environment (staging clone or isolated sandbox).
- **EARS-7.2.2 (Event-Driven)**: WHEN the benchmark worker executes the test, it shall execute the baseline query 3 times with `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` to record baseline latency and buffer hits.
- **EARS-7.2.3 (Event-Driven)**: WHEN baseline execution is complete, the worker shall apply the recommended DDL inside the sandbox, warm the index cache, and re-execute the query 3 times with `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`.
- **EARS-7.2.4 (Event-Driven)**: WHEN both benchmark passes complete, the system shall compute:
  - **Empirical Latency Improvement**: $\frac{\text{Mean Latency}_{\text{before}} - \text{Mean Latency}_{\text{after}}}{\text{Mean Latency}_{\text{before}}} \times 100\%$
  - **Buffer Cache Hit Ratio Delta**
  - **Rows Examined vs Returned Delta**
  - **Plan Node Transition** (e.g., `Seq Scan` $\to$ `Index Scan`)
- **EARS-7.2.5 (Event-Driven)**: WHEN the test completes, the system shall transition the recommendation state to `VERIFIED` and display the empirical metrics in the UI.

---

### Epic 8: Recommendation Lifecycle Governance & Audit Trail

#### User Story 8.1: State Machine Enforcement
*As an Engineering Manager, I want recommendations governed by a formal state machine, so that changes follow a compliant, auditable lifecycle from detection to deployment.*

- **EARS-8.1.1 (Ubiquitous)**: The system shall govern every recommendation through explicit lifecycle states:
  $$\text{DETECTED} \longrightarrow \text{ANALYZED} \longrightarrow \text{RECOMMENDED} \longrightarrow \text{TESTING} \longrightarrow \text{VERIFIED} \longrightarrow \text{APPROVED} \longrightarrow \text{APPLIED}$$
  with terminal rejection possible from any pre-applied state to `REJECTED`.
- **EARS-8.1.2 (Unwanted Behavior)**: IF a user attempts to transition a recommendation directly from `DETECTED` to `APPLIED` without transitioning through `RECOMMENDED` and `APPROVED`, THEN the system shall reject the transition with error `INVALID_LIFECYCLE_TRANSITION`.
- **EARS-8.1.3 (Event-Driven)**: WHEN a user clicks `[ Reject Recommendation ]`, the system shall require an optional text rationale, mark the status as `REJECTED`, and suppress re-alerting for that specific fingerprint for 30 days.

#### User Story 8.2: Immutable Audit Log
*As a Compliance Officer, I want every action taken against a database logged immutably, so that our team can pass SOC2 and security audits.*

- **EARS-8.2.1 (Ubiquitous)**: The system shall maintain an append-only `audit_logs` table recording `id`, `organization_id`, `user_id`, `database_id`, `action_type`, `sql_statement`, `ip_address`, `status`, and `created_at`.
- **EARS-8.2.2 (Event-Driven)**: WHEN any recommendation is tested, approved, rejected, applied, or rolled back, the system shall insert an immutable record into the audit log within the same database transaction.
- **EARS-8.2.3 (Ubiquitous)**: The system shall disallow any API endpoint or internal worker from updating or deleting rows in `audit_logs`.

---

### Epic 9: Production Health Dashboard & Query Explorer

#### User Story 9.1: Database Health Vital Signs & Score (0–100)
*As an Engineering VP, I want a single high-level health score for each database with component breakdowns, so that I can immediately gauge our overall database risk.*

- **EARS-9.1.1 (Event-Driven)**: WHEN the system processes a telemetry snapshot, it shall calculate an aggregate **Database Health Score** (integer between 0 and 100) based on weighted sub-scores:
  - **Query Performance (30% weight)**: Penalized by high-impact and slow queries.
  - **Index Efficiency (25% weight)**: Penalized by missing composite indexes and duplicate B-Trees.
  - **Connection Saturation (15% weight)**: Ratio of active connections to `max_connections`.
  - **Storage & Bloat (15% weight)**: Ratio of dead tuples and table fragmentation.
  - **Locks & Transactions (15% weight)**: Frequency of long-running transactions (>300s) and lock waits.
- **EARS-9.1.2 (Ubiquitous)**: The system shall display the overall Health Score alongside a color-coded status badge:
  - Green (`HEALTHY`): Score $\ge 85$
  - Yellow (`DEGRADED`): Score between $70$ and $84$
  - Red (`CRITICAL`): Score $< 70$
- **EARS-9.1.3 (Ubiquitous)**: The dashboard shall display count badges of open issues categorized by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).

#### User Story 9.2: Interactive Query Explorer & Visual Plan Tree
*As a Backend Developer, I want to search and inspect queries with syntax-highlighted SQL and graphical execution plans, so that I can understand where execution time is spent.*

- **EARS-9.2.1 (Event-Driven)**: WHEN a user opens the Query Explorer, the system shall provide search and filter controls for query text, table name, impact tier, and minimum execution count.
- **EARS-9.2.2 (Ubiquitous)**: The system shall render SQL statements using an embedded read-only Monaco Editor with SQL syntax highlighting and automatic formatting.
- **EARS-9.2.3 (Event-Driven)**: WHEN viewing a query's execution plan, the system shall render a hierarchical visual tree of plan nodes with color-coded badges highlighting cost bottlenecks, disk spills, and sequential scans.

#### User Story 9.3: Table Growth & Capacity Projection
*As an SRE, I want historical growth tracking and 30-day capacity projections for large tables, so that our team can plan storage scaling and table partitioning before disk exhaustion.*

- **EARS-9.3.1 (Event-Driven)**: WHEN recording daily table snapshots, the system shall store `table_bytes`, `index_bytes`, and estimated `row_count`.
- **EARS-9.3.2 (Event-Driven)**: WHEN viewing a table detail page, the system shall calculate the linear 30-day growth rate ($\Delta \text{ MB/day}$) and render a Recharts projection graph forecasting storage consumption over the next 30, 60, and 90 days.
- **EARS-9.3.3 (Event-Driven)**: WHEN a table's projected 30-day growth exceeds 50% of the remaining storage volume, the system shall generate a `CAPACITY_WARNING` finding.

---

### Epic 10: Regression Alerting & Integrations

#### User Story 10.1: Query Latency Regression Detection
*As an On-Call Engineer, I want QueryMedic to detect sudden performance regressions following new deployments, so that I can roll back or optimize before customer churn occurs.*

- **EARS-10.1.1 (Event-Driven)**: WHEN a query's rolling 1-hour P95 latency increases by $\ge 100\%$ compared to its 7-day historical baseline (and minimum call volume $>100$), the system shall trigger a `LATENCY_REGRESSION` alert.
- **EARS-10.1.2 (Event-Driven)**: WHEN generating a regression alert, the system shall compare the historical query plan against the current query plan to identify plan regressions (e.g., plan flipped from `Index Scan` to `Seq Scan`).

#### User Story 10.2: Multi-Channel Incident Notifications
*As an SRE Lead, I want alerts dispatched to Slack, Discord, and custom webhooks, so that our team receives actionable alerts in our existing communication channels.*

- **EARS-10.2.1 (Event-Driven)**: WHEN a `CRITICAL` finding or `LATENCY_REGRESSION` is triggered, the system shall dispatch structured notification payloads to all enabled notification destinations (Slack Webhook, Discord Webhook, Email).
- **EARS-10.2.2 (Ubiquitous)**: The notification payload shall include: database name, query identifier, previous vs current latency, root cause summary, and a direct deep link to the recommendation verification page.
- **EARS-10.2.3 (Unwanted Behavior)**: IF an external webhook endpoint returns an HTTP 5xx error or times out after 5,000 milliseconds, THEN the system shall retry dispatch using an exponential backoff queue up to 5 attempts before marking delivery as `FAILED`.
