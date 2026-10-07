# 🩺 QueryMedic — AI-Powered Database Performance Doctor

> **Continuous, read-only database performance diagnosis, deterministic root cause discovery, and safe, verified optimization for modern engineering teams.**

---

## 📁 Project Architecture & Workspace Layout

```
QueryMedic/
├── apps/
│   ├── api/                    # Fastify 5 API Gateway (TypeScript, Zod, JWT, RBAC)
│   ├── web/                    # Next.js 15 App Router Dashboard (React 19, Tailwind)
│   └── workers/                # BullMQ Worker Fleet (Redis 7 background processors)
│
├── packages/
│   ├── database/               # Prisma Schema (14 models) & PostgreSQL client
│   ├── security/               # AES-256-GCM envelope encryption & scrypt hashing
│   ├── db-adapters/            # DatabaseAdapter abstraction (PostgreSQL & MySQL)
│   ├── rule-engine/            # Deterministic problem detection rules (AST based)
│   └── ai-engine/              # AIProvider abstraction & Zod diagnostic schemas
│
├── docs/                       # Comprehensive System Specifications
│   ├── 01_product_overview.md  # Vision, positioning, and safety philosophy
│   ├── 02_domain_primer.md     # Relational database mechanics & domain mental models
│   ├── 03_requirements.md      # Verifiable contract: 10 Epics with EARS criteria
│   ├── 04_architecture.md      # System topology, sequence diagrams & data schemas
│   └── 05_project_tracking.md  # Living milestone roadmap, WBS, and ADRs
│
└── docker/
    └── docker-compose.yml      # Local dev environment (PostgreSQL 16, Redis 7)
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Generate Prisma Database Client
```bash
pnpm db:generate
```

### 3. Run Test Suite
```bash
pnpm test
```

### 4. Build All Packages
```bash
pnpm build
```

### 5. Start Development Servers
```bash
# Start API Gateway (http://localhost:4000)
pnpm dev:api

# Start Web Dashboard (http://localhost:3000)
pnpm dev:web

# Start Background Worker Fleet
pnpm dev:workers
```

---

## 📚 Documentation Index
- [Product Overview](docs/01_product_overview.md)
- [Domain Primer](docs/02_domain_primer.md)
- [System Requirements & EARS Acceptance Criteria](docs/03_requirements.md)
- [Technical Architecture](docs/04_architecture.md)
- [Project Tracking & Implementation Roadmap](docs/05_project_tracking.md)
