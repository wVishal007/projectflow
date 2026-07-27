# ProjectFlow Architecture

## System Architecture

```mermaid
graph TB
    subgraph Client["Browser"]
        B[SPA (React)]
    end

    subgraph Server["Single Service (Docker/Render)"]
        S[Express Server<br/>:3001]
        M[Middleware Pipeline]
        API[API Routes<br/>/api/v1/*]
        STAT[Static Files<br/>client/dist/]
        SPA[SPA Catch-all<br/>index.html]
        R[Route Layer]
        C[Controllers]
        SV[Services]
        P[Prisma Client]
    end

    subgraph DB["Database"]
        PG[PostgreSQL 16<br/>:5432]
    end

    B -->|"GET /dashboard"| S
    B -->|"GET /api/v1/*"| S
    B -->|"GET /assets/*"| S

    S --> STAT
    S --> API
    S --> SPA

    API --> M
    M --> R --> C --> SV --> P
    P --> PG

    STAT -.->|serves build files| B
    SPA -.->|returns index.html| B

    style Client fill:#e1f5fe,stroke:#01579b
    style Server fill:#f3e5f5,stroke:#7b1fa2
    style DB fill:#e8f5e9,stroke:#2e7d32
```

**Request flow:**
1. Browser requests `GET /dashboard` → Express checks static files → not found → SPA catch-all returns `index.html`
2. React loads, renders Dashboard component
3. Dashboard makes `GET /api/v1/analytics/overview` → Express routes to API middleware → controller → service → Prisma → PostgreSQL
4. JSON response returned to SPA

---

## Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant RL as Rate Limiter
    participant SEC as Security
    participant LOG as Request Logger
    participant AUTH as Auth Middleware
    participant VAL as Validation
    participant CTRL as Controller
    participant SVC as Service
    participant PR as Prisma
    participant DB as PostgreSQL

    C->>RL: HTTP Request
    Note over RL,SEC: Middleware Pipeline (order)
    RL-->>C: 429 if exceeded
    RL->>SEC: 1. Security Headers

    SEC->>LOG: 2. Request ID & Logger
    LOG->>AUTH: 3. JWT Verification

    alt Public Route
        AUTH->>VAL: Skip auth
    else Protected Route
        AUTH-->>C: 401 if invalid
        AUTH->>VAL: Continue
    end

    VAL->>CTRL: 4. Zod Schema Validation
    CTRL->>SVC: 5. Business Logic
    SVC->>PR: 6. Database Query
    PR->>DB: SQL
    DB-->>PR: Result
    PR-->>SVC: Prisma Response
    SVC-->>CTRL: Processed Data
    CTRL-->>C: JSON Response
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Controller
    participant S as Auth Service
    participant PR as Prisma
    participant J as JWT Utils

    Note over C,J: Register
    C->>A: POST /auth/register { name, email, password }
    A->>S: register()
    S->>PR: Check existing email
    PR-->>S: User or null
    alt Email exists
        S-->>C: 409 Conflict
    else
        S->>S: Hash password (bcrypt, 12 rounds)
        S->>PR: Create user
        PR-->>S: User
        S->>J: Generate access + refresh tokens
        J-->>S: Tokens
        S-->>C: 201 { accessToken, refreshToken, user }
    end

    Note over C,J: Login
    C->>A: POST /auth/login { email, password }
    A->>S: login()
    S->>PR: Find by email
    PR-->>S: User or null
    alt Not found or wrong password
        S-->>C: 401 AuthError
    else
        S->>J: Generate tokens
        J-->>S: Tokens
        S-->>C: 200 { accessToken, refreshToken, user }
    end

    Note over C,J: Token Refresh
    C->>A: POST /auth/refresh { refreshToken }
    A->>J: Verify refresh token
    alt Invalid or expired
        J-->>C: 401 AuthError
    else
        J->>J: Generate new token pair
        J-->>C: 200 { accessToken, refreshToken }
    end
```

---

## Database ERD

```mermaid
erDiagram
    User ||--o{ Project : owns
    User ||--o{ Task : assigned
    User ||--o{ Comment : writes
    User ||--o{ Activity : generates
    Project ||--o{ Task : contains
    Task ||--o{ Comment : has
    Task ||--o{ Activity : logs

    User {
        uuid id PK
        string email UK
        string name
        string passwordHash
        string avatarUrl nullable
        datetime createdAt
        datetime updatedAt
    }

    Project {
        uuid id PK
        string name
        string description nullable
        string color "default #3B82F6"
        uuid ownerId FK
        datetime createdAt
        datetime updatedAt
    }

    Task {
        uuid id PK
        string title
        string description nullable
        enum status "TODO | IN_PROGRESS | IN_REVIEW | DONE | CANCELLED"
        enum priority "LOW | MEDIUM | HIGH | URGENT"
        datetime dueDate nullable
        uuid projectId FK
        uuid assigneeId FK nullable
        datetime completedAt nullable
        datetime createdAt
        datetime updatedAt
    }

    Comment {
        uuid id PK
        string content
        uuid taskId FK
        uuid authorId FK
        datetime createdAt
        datetime updatedAt
    }

    Activity {
        uuid id PK
        string action "created | updated | status_changed | completed | deleted"
        json details nullable
        uuid taskId FK
        uuid userId FK
        datetime createdAt
    }
```

---

## Module Architecture

```mermaid
graph LR
    subgraph Middleware["Middleware Pipeline"]
        direction TB
        M1[requestId]
        M2[requestLogger]
        M3[securityMiddleware]
        M4[rateLimiter]
        M5[authenticate]
        M6[authorize]
        M7[validate]
        M8[errorHandler]
    end

    subgraph Auth["Auth Module"]
        AR[auth.routes] --> AC[auth.controller]
        AC --> AS[auth.service]
        AS --> PR[Prisma Client]
    end

    subgraph Projects["Projects Module"]
        PRJ[projects.routes] --> PC[projects.controller]
        PC --> PS[projects.service]
        PS --> PR
    end

    subgraph Tasks["Tasks Module"]
        TR[tasks.routes] --> TC[tasks.controller]
        TC --> TS[tasks.service]
        TS --> PR
    end

    subgraph Comments["Comments Module"]
        CR[comments.routes] --> CC[comments.controller]
        CC --> CS[comments.service]
        CS --> PR
    end

    subgraph Analytics["Analytics Module"]
        ANR[analytics.routes] --> ANC[analytics.controller]
        ANC --> ANS[analytics.service]
        ANS --> PR
    end

    subgraph SPA["Static Serving"]
        STAT[express.static<br/>client/dist/]
        CATCH[SPA fallback<br/>index.html]
    end

    subgraph Utils["Shared Utilities"]
        JWT[jwt.utils]
        PWD[password.utils]
        PG[pagination.utils]
        QB[queryBuilder.utils]
        SAN[sanitize.utils]
        LOG[logger.utils]
    end

    Middleware -.-> Auth
    Middleware -.-> Projects
    Middleware -.-> Tasks
    Middleware -.-> Comments
    Middleware -.-> Analytics

    Auth --> Utils
    Projects --> Utils
    Tasks --> Utils
    Comments --> Utils
    Analytics --> Utils
```

---

## Deployment Architecture

### Docker (Two containers)

```mermaid
graph TB
    subgraph Docker["Docker Compose"]
        direction TB
        PG[("PostgreSQL 16<br/>:5432")]
        S[("Express Server (API + SPA)<br/>:3001")]
    end

    subgraph Volumes["Persistent Storage"]
        PGV[pgdata:/var/lib/postgresql/data]
    end

    U[User Browser] -->|"HTTP :3001"| S
    S -->|DATABASE_URL| PG
    PG --> PGV

    style Docker fill:#fff3e0,stroke:#e65100
    style Volumes fill:#f3e5f5,stroke:#7b1fa2
```

### Render (Single Web Service)

```mermaid
graph TB
    subgraph Render["Render Cloud"]
        direction TB
        WS[("Web Service<br/>(Express + SPA)")]
        RDS[("Managed PostgreSQL")]
    end

    U[User] -->|HTTPS| WS
    WS -->|Internal URL| RDS

    style Render fill:#e3f2fd,stroke:#1565c0
```

---

## CI/CD Pipeline

```mermaid
graph LR
    PUSH([Push to main/PR]) --> CHECKOUT[Checkout]
    CHECKOUT --> NODE[Setup Node 22]
    NODE --> INSTALL[Install Dependencies]
    INSTALL --> LINT[Lint & Typecheck]
    LINT --> TEST[Run Tests]
    TEST --> BUILD[Build Server + Client]
    BUILD --> DONE([Done])

    style PUSH fill:#4caf50,color:#fff
    style DONE fill:#4caf50,color:#fff
    style CHECKOUT fill:#2196f3,color:#fff
    style NODE fill:#2196f3,color:#fff
    style INSTALL fill:#2196f3,color:#fff
    style LINT fill:#ff9800,color:#fff
    style TEST fill:#ff9800,color:#fff
    style BUILD fill:#ff9800,color:#fff
```

---

## Technology Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, React Router 7, TanStack React Query, Recharts |
| Backend    | Node.js, Express 4, TypeScript, Prisma ORM, Zod Validation |
| Database   | PostgreSQL 16                       |
| Auth       | JWT (access + refresh tokens), bcrypt |
| Deployment | Docker Compose (2 containers) or Render single web service |
| CI/CD      | GitHub Actions                      |
| Testing    | Vitest, Supertest, Jest DOM         |

## Port Mapping

| Service       | Internal Port | External Port |
|---------------|---------------|---------------|
| Express (API + SPA) | 3001    | 3001          |
| PostgreSQL    | 5432          | 5432          |

In production (Render), the Express server uses port `10000` (set automatically) and is accessed via HTTPS on the default ports (443/80).
