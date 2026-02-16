# Smart Bookmark App - System Design Document

**Version:** 1.0  
**Date:** February 16, 2026  
**Author:** Development Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Component Architecture](#component-architecture)
4. [Data Model](#data-model)
5. [API Design](#api-design)
6. [Authentication & Security](#authentication--security)
7. [Real-Time Architecture](#real-time-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Performance & Scalability](#performance--scalability)
10. [Technology Decisions](#technology-decisions)

---

## Executive Summary

The Smart Bookmark App is a cloud-native, real-time bookmark management system designed with a focus on **security**, **scalability**, and **user experience**. The system implements a modern serverless architecture leveraging edge computing for optimal performance and PostgreSQL for reliable data persistence.

**Key Characteristics:**
- **Authentication:** OAuth 2.0 (Google) - eliminates password-based security vulnerabilities
- **Data Isolation:** Row-Level Security (RLS) policies at database level
- **Real-Time Sync:** WebSocket-based pub/sub for instant cross-tab updates
- **Deployment:** Serverless (Vercel Edge Functions) - automatic scaling, zero ops overhead
- **Compliance:** Single Responsibility Principle, Domain-Driven Design patterns

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Web Browser     │  │  Web Browser     │  │  Mobile      │  │
│  │  (Tab 1)         │  │  (Tab 2)         │  │  Browser     │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                    │           │
│           └──────────┬──────────┴────────┬──────────┘           │
│                      │                   │                      │
└──────────────────────┼───────────────────┼─────────────────────┘
                       │                   │
                       ▼                   ▼
        ┌──────────────────────────────────────────┐
        │      PRESENTATION LAYER                  │
        │  (Next.js App Router - Server/Client)    │
        │  ├─ Pages (Routing)                      │
        │  ├─ Components (React)                   │
        │  └─ Hooks (State Management)             │
        └──────────────┬───────────────────────────┘
                       │
        ┌──────────────┴───────────────────────────┐
        │        VERCEL EDGE/SERVERLESS             │
        └──────────────┬───────────────────────────┘
                       │
        ┌──────────────┴────────────────────────────────────┐
        │           API LAYER                               │
        │  ┌────────────────────────────────────────────┐   │
        │  │  RESTful API Routes (Next.js)              │   │
        │  │  ├─ GET  /api/bookmarks                    │   │
        │  │  ├─ POST /api/bookmarks                    │   │
        │  │  └─ DELETE /api/bookmarks/[id]             │   │
        │  │  ├─ POST /api/auth/logout                 │   │
        │  │  └─ Middleware (Auth, CORS, Validation)    │   │
        │  └────────────────────────────────────────────┘   │
        └──────────────┬───────────────────────────────────┘
                       │
        ┌──────────────┴────────────────────────────────────┐
        │         BACKEND SERVICES                          │
        │  ┌────────────────────────────────────────────┐   │
        │  │  Supabase Backend                          │   │
        │  │  ├─ Auth Service (OAuth 2.0)              │   │
        │  │  ├─ PostgreSQL Database                    │   │
        │  │  ├─ Realtime Engine (WebSocket)           │   │
        │  │  └─ RLS Policies (Security)                │   │
        │  └────────────────────────────────────────────┘   │
        └────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend Components (React)

```
App Layout
├── Navigation
│   ├── Logo
│   ├── User Profile / Email
│   └── Logout Button
│
└── Dashboard (Protected Route)
    ├── AddBookmark Form
    │   ├── URL Input Field
    │   ├── Title Input Field
    │   └── Submit Button
    │
    ├── BookmarkList (Real-Time Subscribed)
    │   ├── LoadingState (Skeleton)
    │   ├── EmptyState
    │   └── BookmarkGrid
    │       ├── BookmarkCard (each)
    │       │   ├── Title Display
    │       │   ├── URL Display (clickable)
    │       │   ├── Created At Timestamp
    │       │   └── Delete Button
    │       │
    │       └── ErrorState (with Retry)
    │
    └── Toast Notifications (Global)
        ├── Success Messages
        ├── Error Messages
        └── Info Messages
```

### Design Patterns Used

| Pattern | Implementation | Benefit |
|---------|-----------------|----------|
| **Custom Hooks** | `useAuth()`, `useBookmarks()`, `useRealtimeSubscription()` | Encapsulation, reusability, separation of concerns |
| **Context API** | `AuthContext` for session state | Single source of truth for authentication |
| **Compound Components** | `<BookmarkCard>` with composable children | Flexible, maintainable component structure |
| **Higher-Order Component** | `withAuth()` wrapper for protected routes | Clean route protection logic |
| **Observer Pattern** | Supabase Realtime subscriptions | Decoupled real-time event handling |

---

## Data Model

### Database Schema

```sql
── AUTHENTICATION (Managed by Supabase Auth)
   └── auth.users
       ├── id (UUID, PK)
       ├── email (VARCHAR, UNIQUE)
       ├── email_confirmed_at (TIMESTAMP)
       ├── created_at (TIMESTAMP)
       └── [OAuth provider info]

── BUSINESS DATA
   └── bookmarks (Main Domain Entity)
       ├── id (UUID, PK) - Default: gen_random_uuid()
       ├── user_id (UUID, FK → auth.users.id)
       ├── title (VARCHAR(255), NOT NULL) - Bookmark name
       ├── url (VARCHAR(2048), NOT NULL) - Full URL
       ├── created_at (TIMESTAMP) - Default: NOW()
       └── updated_at (TIMESTAMP) - Default: NOW()

── INDEXES
   └── idx_bookmarks_user_id ON bookmarks(user_id)
       └── Optimizes queries filtering by user_id
```

### Entity Relationship Diagram

```
┌─────────────────────┐
│   auth.users        │
├─────────────────────┤
│ • id (UUID) [PK]    │
│ • email (VARCHAR)   │
│ • created_at        │
└───────┬─────────────┘
        │ 1
        │ (OneToMany)
        │
        │ N
┌───────▼──────────────────────┐
│   bookmarks                    │
├────────────────────────────────┤
│ • id (UUID) [PK]               │
│ • user_id (UUID) [FK] ◀────────┤
│ • title (VARCHAR)              │
│ • url (VARCHAR)                │
│ • created_at (TIMESTAMP)       │
│ • updated_at (TIMESTAMP)       │
└────────────────────────────────┘
```

### Data Constraints & Validations

| Field | Type | Constraints | Validation Rule |
|-------|------|-------------|-----------------|
| **url** | VARCHAR(2048) | NOT NULL, CHECK (length > 0) | RFC 3986 compliant URL format |
| **title** | VARCHAR(255) | NOT NULL, CHECK (length > 0) | 1-255 characters, no special chars only |
| **user_id** | UUID | NOT NULL, FK, CASCADE DELETE | Must exist in auth.users |
| **created_at** | TIMESTAMP | NOT NULL, immutable | Auto-generated server-side |

---

## API Design

### REST API Endpoints

#### Authentication Flow

```
POST /auth/oauth/callback
├── Purpose: Handle Google OAuth callback
├── Method: POST
├── Query Params:
│   ├── code: string (authorization code from Google)
│   └── state: string (CSRF token verification)
├── Response:
│   ├── 200 OK: Session established, redirect to /dashboard
│   └── 400 Bad Request: Invalid code or state
└── Side Effects: Creates session cookie, redirects user
```

#### Bookmarks CRUD Operations

```
GET /api/bookmarks
├── Purpose: Retrieve all bookmarks for authenticated user
├── Authentication: Required (JWT session)
├── Query Params: None
├── Response Body:
│   ├── Status: 200 OK
│   └── Body: Array<{id, title, url, created_at, updated_at}>
├── Error Cases:
│   ├── 401 Unauthorized: No valid session
│   └── 500 Internal Server Error
└── Performance: O(n) where n = user's bookmarks
   Cache Strategy: None (real-time sync priority)

─────────────────────────────────────────────────────────────

POST /api/bookmarks
├── Purpose: Create new bookmark for authenticated user
├── Authentication: Required (JWT session)
├── Request Body:
│   ├── title: string (required, 1-255 chars)
│   └── url: string (required, valid URL format)
├── Response Body (201 Created):
│   ├── id: UUID
│   ├── user_id: UUID
│   ├── title: string
│   ├── url: string
│   ├── created_at: ISO 8601 string
│   └── updated_at: ISO 8601 string
├── Error Cases:
│   ├── 400 Bad Request: Invalid input (validation failure)
│   ├── 401 Unauthorized: No valid session
│   ├── 413 Payload Too Large: Request body too large
│   └── 500 Internal Server Error
├── Validations:
│   ├── title: /^.{1,255}$/ (non-empty, max 255 chars)
│   ├── url: RFC 3986 + protocol check (http|https)
│   └── Duplicate check: Not enforced (allow duplicates)
└── Database Query: INSERT INTO bookmarks (...)

─────────────────────────────────────────────────────────────

DELETE /api/bookmarks/[id]
├── Purpose: Delete bookmark owned by authenticated user
├── Authentication: Required (JWT session)
├── Path Params:
│   └── id: UUID (bookmark identifier)
├── Response Body:
│   ├── Status: 204 No Content (success)
│   └── Status: 404 Not Found (bookmark not found)
├── Error Cases:
│   ├── 401 Unauthorized: No valid session
│   ├── 403 Forbidden: Bookmark belongs to another user
│   ├── 404 Not Found: Bookmark with id doesn't exist
│   └── 500 Internal Server Error
├── Security: RLS policy verified at DB level
└── Idempotency: Multiple calls to non-existent ID return 404

─────────────────────────────────────────────────────────────

POST /api/auth/logout
├── Purpose: End user session and clear authentication
├── Authentication: Required (JWT session)
├── Request Body: Empty
├── Response: 200 OK
└── Side Effects: Clear session cookie, redirect to /
```

### API Response Format (Standardized)

```javascript
// Success Response (2xx)
{
  "data": { /* payload */ },
  "status": "success"
}

// Error Response (4xx, 5xx)
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid URL format",
    "details": [{
      "field": "url",
      "issue": "Missing protocol (http/https)"
    }]
  },
  "status": "error"
}
```

### Rate Limiting

```
- Default: 100 requests per 15 minutes per IP (Vercel)
- Per-user: 50 bookmarks per hour create limit
- Per-user: 1000 bookmarks maximum per account
Implementation: X-RateLimit headers in response
```

---

## Authentication & Security

### OAuth 2.0 Flow (Google)

```
┌──────────────┐                                    ┌──────────┐
│   Browser    │                                    │  Google  │
│   (Client)   │                                    │ OAuth    │
└──────┬───────┘                                    └────┬─────┘
       │                                                 │
       │  1. Click "Login with Google"                  │
       ├────────────────────────────────────────────────►
       │                                                 │
       │  2. Redirect to Google OAuth Consent Screen    │
       │◄────────────────────────────────────────────────┤
       │                                                 │
       │  3. User grants permissions                    │
       │  (email, profile scope)                        │
       │                                                 │
       ├────────────────────────────────────────────────►
       │                                                 │
       │  4. Redirect back with authorization code      │
       │◄────────────────────────────────────────────────┤
       │                                                 │
       ▼
┌──────────────────────────────┐
│  Supabase Auth Service       │
│  (Backend)                   │
├──────────────────────────────┤
│ 1. Receive auth code         │
│ 2. Exchange for ID token     │
│ 3. Validate signature        │
│ 4. Extract user identity     │
│ 5. Create/retrieve user      │
│ 6. Issue session JWT         │
└──────────────┬───────────────┘
               │
               ▼
       ┌──────────────────┐
       │ Session Created  │
       │ (JWT in cookie)  │
       └──────────────────┘
```

### Security Architecture

#### 1. **Transport Security**
- **HTTPS Only:** All traffic encrypted in transit (TLS 1.3)
- **HSTS Headers:** Enforced by Vercel + Supabase
- **CSP Headers:** Prevent XSS attacks

#### 2. **Authentication Security**
- **No Passwords:** OAuth eliminates password-related vulnerabilities
- **JWT Tokens:** Stateless, cryptographically signed
- **Secure Cookies:** HttpOnly, Secure, SameSite=Strict flags
- **CSRF Protection:** State parameter in OAuth flow

#### 3. **Authorization Security**
- **Row-Level Security (RLS):** PostgreSQL policies enforce data isolation at DB level
  ```sql
  -- Policy: Users can only view their own bookmarks
  CREATE POLICY "Users can view own bookmarks" ON bookmarks
    FOR SELECT USING (auth.uid() = user_id);
  ```
- **No client-side auth checks:** Backend always validates session + ownership
- **Principle of Least Privilege:** API only exposes necessary endpoints

#### 4. **Data Security**
- **Encrypted at Rest:** Supabase PostgreSQL encryption
- **Backup & Recovery:** Automatic daily backups (Supabase managed)
- **PII Minimization:** Only store email + bookmarks (no sensitive data)

#### 5. **Input Validation**
- **Client-side:** URL format regex, title length check
- **Server-side (enforced):** 
  - URL: RFC 3986 compliance, protocol check
  - Title: Length bounds, special character filtering
  - ID: UUID format validation
- **SQL Injection Prevention:** Parameterized queries via Supabase SDK

#### 6. **Audit & Monitoring**
- **Session Logs:** Supabase tracks auth events
- **Error Tracking:** Sentry integration (optional future enhancement)
- **Rate Limiting:** DDoS protection via Vercel

### OWASP Top 10 Compliance

| Vulnerability | Mitigation |
|---------------|-----------|
| **A01:2021 – Broken Access Control** | RLS policies at DB level, API ownership checks |
| **A02:2021 – Cryptographic Failures** | HTTPS, TLS 1.3, encrypted at rest |
| **A03:2021 – Injection** | Parameterized queries, input validation |
| **A04:2021 – Insecure Design** | OAuth (no password), session-based auth |
| **A05:2021 – Security Misconfiguration** | Managed cloud services (Supabase, Vercel) |
| **A07:2021 – Cross-Site Scripting (XSS)** | React escaping, CSP headers |
| **A09:2021 – Using Components with Known Vulnerabilities** | Dependabot, npm audit |

---

## Real-Time Architecture

### WebSocket-Based Event Sync

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT 1                      CLIENT 2                      │
│  (Browser Tab 1)              (Browser Tab 2)               │
├──────────────┐                ├──────────────┐               │
│ React State  │                │ React State  │               │
│ bookmarks:[] │                │ bookmarks:[] │               │
└──────┬───────┘                └──────┬───────┘               │
       │                               │                       │
       │ Create Bookmark               │                       │
       │ POST /api/bookmarks           │                       │
       │                               │                       │
       └───────────────────┬───────────┘                       │
                           │                                   │
                           ▼                                   │
                    ┌──────────────────┐                       │
                    │  Supabase API    │                       │
                    │  Insert into DB  │                       │
                    └────────┬─────────┘                       │
                             │                                 │
                    ┌────────▼─────────┐                       │
                    │  PostgreSQL DB   │                       │
                    │ bookmarks table  │                       │
                    └────────┬─────────┘                       │
                             │                                 │
     ┌───────────────────────┼───────────────────────┐        │
     │   Realtime Engine     │   (Pub/Sub Broker)    │        │
     │   Trigger INSERT      │                       │        │
     │   event notification  │                       │        │
     └───────────────────────┼───────────────────────┘        │
                             │                                 │
     ────────────────────────┼────────────────────────        │
     │                       │                       │        │
     ▼                       ▼                       ▼        │
  ┌──────────┐         ┌──────────┐         ┌──────────┐    │
  │WebSocket │         │WebSocket │         │WebSocket │    │
  │CONNECTION│         │CONNECTION│         │CONNECTION│    │
  │CLIENT 1  │         │CLIENT 2  │         │CLIENT 3  │    │
  └────┬─────┘         └────┬─────┘         └────┬─────┘    │
       │                    │                    │            │
       │ Receive event      │ Receive event     │ (No sub)   │
       │ {INSERT, data}     │ {INSERT, data}    │            │
       │                    │                   │            │
       ▼                    ▼                   │            │
┌─────────────────┐  ┌─────────────────┐      │            │
│ Update React    │  │ Update React    │      │            │
│ State           │  │ State           │      │            │
│ bookmarks: [{   │  │ bookmarks: [{   │      │            │
│  id, title, url │  │  id, title, url │      │            │
│ }]              │  │ }]              │      │            │
└─────────────────┘  └─────────────────┘      │            │
       │                    │                  │            │
       ▼                    ▼                  ▼            │
   UI Updates            UI Updates        (Not affected)  │
   (instant)             (instant)                          │
└─────────────────────────────────────────────────────────────┘

Key Benefits:
✓ No polling - efficient bandwidth
✓ Instant synchronization - user perceived latency < 100ms
✓ Cross-tab awareness - changes visible immediately everywhere
✓ Subscription-based - only relevant events delivered
```

### Subscription Implementation

```javascript
// React Hook: useRealtimeSubscription.js
const useRealtimeSubscription = (userId) => {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    // Subscribe to realtime events for user's bookmarks
    const channel = supabase
      .channel(`public:bookmarks:user_id=eq.${userId}`) // Only this user's bookmarks
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBookmarks((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setBookmarks((prev) =>
              prev.map((b) => (b.id === payload.new.id ? payload.new : b))
            );
          }
        }
      )
      .subscribe();

    return () => channel.unsubscribe(); // Cleanup on unmount
  }, [userId]);

  return bookmarks;
};
```

---

## Deployment Architecture

### Vercel Edge Deployment

```
┌─────────────────────────────────────────────────────────────┐
│  Global CDN (Vercel Edge Network)                           │
│  ┌─────────────┬─────────────┬──────────────┐               │
│  │  US-EAST    │  EU-WEST    │  ASIA-SOUTH  │               │
│  │  (Replica)  │  (Replica)  │  (Replica)   │               │
│  └─────────────┴─────────────┴──────────────┘               │
│         │              │            │                       │
│         └──────────────┼────────────┘                       │
│                        │                                    │
│              Smart Routing to Nearest                       │
│                  Edge Function                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │ Edge Middleware       │
             │ (Auth validation)     │
             │ (Rate limiting)       │
             │ (Request logging)     │
             └───────────┬───────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
         ┌─────────────┐     ┌──────────────┐
         │GET/DELETE   │     │POST to       │
         │Request      │     │Database      │
         └──────┬──────┘     └──────┬───────┘
                │                  │
         ┌──────▼──────────────────▼────┐
         │  Supabase API Gateway        │
         │  (Managed Backend Services)  │
         └──────┬───────────────────────┘
                │
         ┌──────▼──────────────────┐
         │  PostgreSQL Database    │
         │  (Regional Replica)     │
         │  (Automated Backups)    │
         └─────────────────────────┘
```

### Continuous Deployment Pipeline

```
┌─────────────────────┐
│  Developer Pushes   │
│  Code to GitHub     │
│  main branch        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  GitHub Actions     │
│  Trigger            │
│  (on: push)         │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌─────────┐  ┌──────────┐
│Linting/ │  │Run Tests │
│Format   │  │(Jest)    │
│Check    │  │(E2E)     │
└────┬────┘  └────┬─────┘
     │            │
     └──────┬─────┘
            │
     ┌──────▼──────┐
     │Build Next.js│
     │Artifacts    │
     └──────┬──────┘
            │
     ┌──────▼──────────────┐
     │ Deploy to Vercel    │
     │ Production          │
     │ (Auto-scaling)      │
     └──────┬──────────────┘
            │
     ┌──────▼──────────────┐
     │ Run Smoke Tests     │
     │ Against Live URL    │
     └──────┬──────────────┘
            │
     ┌──────▼──────────────┐
     │ Deployment Complete │
     │ (Live URL Ready)    │
     └─────────────────────┘
```

---

## Performance & Scalability

### Performance Metrics & Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **Page Load (First Paint)** | < 1.5s | Next.js optimization, CDN caching |
| **Time to Interactive** | < 2.5s | Code splitting, lazy loading |
| **API Response Time** | < 200ms | Database indexing, connection pooling |
| **Real-Time Update Latency** | < 100ms | WebSocket instead of polling |
| **Database Query** | < 50ms (p99) | Indexed queries on user_id |

### Scalability Architecture

#### Vertical Scaling (Handled by Cloud Providers)

**Vercel:**
- Auto-scaling Edge Functions based on traffic
- No configuration needed - scales transparently
- Handles millions of requests/month

**Supabase:**
- PostgreSQL auto-scaling compute resources
- Connection pooling (PgBouncer) for concurrent connections
- Read replicas available for high-traffic scenarios

#### Horizontal Scaling Considerations (Future)

If single Supabase instance reaches limits:

```
Load Balancer
│
├─→ Supabase Project 1 (US)   - Region sharding
├─→ Supabase Project 2 (EU)   - Geographic distribution
└─→ Supabase Project 3 (APAC) - Latency optimization
```

### Database Optimization

#### Query Optimization

```sql
-- Optimized query with index
EXPLAIN ANALYZE
SELECT * FROM bookmarks
WHERE user_id = '...'
ORDER BY created_at DESC
LIMIT 50;

-- Index present:
-- Seq Scan: FALSE (uses index idx_bookmarks_user_id)
-- Cost: 0.15 - 0.42 rows (indexed)
-- vs. 50.55 - 1752.55 without index
```

#### Connection Management

- **Connection Pool:** 20 connections (default Supabase)
- **Timeout:** 60 seconds (idle connections closed)
- **Max Concurrent:** Scales with Edge Functions auto-scaling

#### Caching Strategy

```
┌─────────────────┐
│ User Request    │
└────────┬────────┘
         │
         ▼
    ┌─────────────┐
    │ CDN Cache?  │
    │ (Static)    │
    └─┬───────┬───┘
      │ HIT   │ MISS
      │       ▼
      │    ┌─────────────┐
      │    │ Lambda Edge │
      │    │ Functions   │
      │    └────┬────────┘
      │         │
      │         ▼
      │    ┌──────────────┐
      │    │ Database     │
      │    │ Query        │
      │    └────┬─────────┘
      │         │ (no caching for bookmarks
      │         │  due to real-time sync)
      │         │
      └─────┬───┘
            │
            ▼
      ┌──────────────┐
      │ Send Result  │
      │ to User      │
      └──────────────┘
```

**Caching Rules:**
- Static assets (CSS, JS): 30 days (CDN cache)
- API responses: No caching (real-time priority)
- Session tokens: In-memory (browser only)

---

## Technology Decisions

### Framework & Runtime

| Technology | Decision | Justification |
|------------|----------|---------------|
| **Next.js 14** | Selected | ✓ Built-in API routes (avoid separate backend)<br>✓ Server/Client Components (render flexibility)<br>✓ Automatic code splitting & optimization<br>✓ File-based routing (intuitive structure)<br>✓ Native TypeScript support (JavaScript chosen)<br>✓ Vercel native support (zero-config deploy) |
| **React 18** | Selected | ✓ Component-based UI (modular, testable)<br>✓ Hooks API (modern state management)<br>✓ Concurrent rendering<br>✓ Server Components (Next.js 13+) |
| **Node.js Runtime** | Selected | ✓ Available on Vercel Edge Functions<br>✓ Ecosystem maturity<br>✓ Developer familiarity |

### Backend & Database

| Technology | Decision | Justification |
|------------|----------|---------------|
| **Supabase** | Selected | ✓ PostgreSQL (ACID compliance, RLS at DB level)<br>✓ OAuth integration (Google + others)<br>✓ Built-in Realtime (subscription model)<br>✓ JWT-based auth (stateless)<br>✓ Row-Level Security (security-first design)<br>✓ Managed service (no ops overhead)<br>✓ Generous free tier (ideal for this project) |
| **PostgreSQL** | Selected | ✓ ACID guarantees (data integrity)<br>✓ Advanced features (JSON, arrays, composite types)<br>✓ Proven at scale (used by major companies)<br>✓ RLS policies (application-layer security)<br>✓ Full-text search (future feature ready) |

### Authentication

| Technology | Decision | Justification |
|------------|----------|---------------|
| **OAuth 2.0 (Google)** | Selected | ✓ No passwords (eliminates entire vulnerability class)<br>✓ User trust (delegated to Google)<br>✓ 2FA support (Google's responsibility)<br>✓ Simple integration (Google + Supabase handle complexity)<br>✓ Standards-based (RFC 6749) |
| **JWT (JSON Web Tokens)** | Selected | ✓ Stateless authentication (scalable)<br>✓ Cryptographically signed (tamper-proof)<br>✓ Claims-based authorization<br>✓ Works with serverless (no session store needed) |

### Frontend Styling

| Technology | Decision | Justification |
|------------|----------|---------------|
| **Tailwind CSS** | Selected | ✓ Utility-first (rapid UI development)<br>✓ Small bundle size (tree-shaking)<br>✓ Responsive design built-in<br>✓ No runtime overhead<br>✓ Excellent documentation<br>✓ Strong community & plugins |

### Testing

| Technology | Decision | Justification |
|------------|----------|---------------|
| **Jest** | Selected for Unit Tests | ✓ Facebook-maintained (actively developed)<br>✓ Zero-config for Next.js<br>✓ Snapshot testing<br>✓ Fast parallel execution |
| **React Testing Library** | Selected for Component Tests | ✓ Tests user behavior (not implementation)<br>✓ Encouraged by React team<br>✓ Good accessibility testing support |
| **Playwright** | Selected for E2E Tests | ✓ Multi-browser support (Chrome, Firefox, Safari)<br>✓ Fast & reliable<br>✓ Network interception<br>✓ Visual regression testing ready |

### Deployment

| Technology | Decision | Justification |
|------------|----------|---------------|
| **Vercel** | Selected | ✓ Edge Functions (global deployment)<br>✓ Next.js native (optimal performance)<br>✓ Automatic CI/CD (GitHub integration)<br>✓ Environment variables management<br>✓ Serverless (no ops, auto-scaling)<br>✓ Free tier sufficient<br>✓ Zero cold start (Edge)<br>✓ Built-in monitoring & analytics |

---

## Monitoring & Observability

### Logging Strategy

```
Request Flow Logging:
  ┌─────────────────────────────────┐
  │ Client Side                     │
  └─────────────┬───────────────────┘
                │ fetch() with timing
                ▼
  ┌─────────────────────────────────┐
  │ Edge Function                   │
  │ - Request received              │
  │ - Auth validated                │
  │ - DB query time                 │
  │ - Response status               │
  └─────────────┬───────────────────┘
                │
                ▼
  ┌─────────────────────────────────┐
  │ Vercel Logs (Built-in)          │
  └─────────────────────────────────┘
```

### Key Metrics to Monitor

- **Response Times:** API latency, database queries
- **Error Rates:** 4xx, 5xx status codes
- **User Metrics:** DAU, MAU, session duration
- **Database Health:** Connection pool usage, query performance
- **RealTime Events:** Subscription count, event throughput

---

## Disaster Recovery & Business Continuity

### Backup Strategy

| Component | Strategy | RTO/RPO |
|-----------|----------|---------|
| **Database** | Supabase automated daily backups | RTO: 1h, RPO: 24h |
| **Code** | GitHub version control | RTO: 15m, RPO: 0 (per commit) |
| **Configuration** | Infrastructure as Code (.env files) | RTO: 30m, RPO: 0 |
| **Static Assets** | CDN + GitHub | RTO: 5m, RPO: 0 |

### Failure Scenarios & Recovery

```
Scenario 1: Database Down
├─ Detection: API returns 5xx errors
├─ Impact: Users cannot create/delete bookmarks
├─ Recovery: Supabase automatic failover (multi-AZ)
│  Timeline: Auto-recovery in minutes
└─ User Experience: Retry button shown

Scenario 2: API Route Error
├─ Detection: 500 Internal Server Error
├─ Impact: Specific endpoint unavailable
├─ Recovery: Auto-redeploy from Git (1-2 min)
└─ User Experience: Toast notification with retry

Scenario 3: Regional Outage
├─ Detection: Multiple concurrent failures
├─ Impact: Users in affected region experience issues
├─ Recovery: Vercel auto-routes to healthy regions
└─ User Experience: Transparent failover to nearest region
```

---

## Future Enhancements & Architectural Considerations

### Planned Features (Beyond Current Scope)

1. **Collections/Folders**
   - New table: `collections` (user_id, name, created_at)
   - Foreign key: bookmarks.collection_id

2. **Sharing & Collaboration**
   - New table: `bookmark_shares` (bookmark_id, shared_with_user_id, permissions)
   - RLS policies for shared access

3. **Full-Text Search**
   - PostgreSQL tsvector for title/URL search
   - Elasticsearch integration (if scale reaches >1M bookmarks)

4. **Browser Extension**
   - Manifest v3 compatible
   - One-click bookmark saving

5. **Mobile App**
   - React Native (share codebase logic)
   - Offline support (sync queue)

### Architectural Scalability Path

```
Current State (MVP)          →    Growth Phase         →    Scale Phase
────────────────────────────────────────────────────────────────────────
1. Supabase (Single)         →    Read Replicas       →    Regional Sharding
2. Vercel (Auto-scaling)     →    Remains (optimized) →    Multi-region
3. No caching               →    Redis cache layer   →    CDN + Cache invalidation
4. No search               →    Full-text search    →    Elasticsearch
5. PostgreSQL indexes      →    Query optimization  →    Columnar storage
```

---

## Security Audit Checklist

- [x] HTTPS/TLS enabled for all traffic
- [x] OAuth 2.0 (no password storage)
- [x] JWT session tokens (stateless)
- [x] Row-Level Security at database level
- [x] SQL parameterized queries (no SQL injection)
- [x] Input validation (client + server)
- [x] Rate limiting enabled
- [x] CORS restrictions
- [x] CSP headers configured
- [x] HttpOnly, Secure, SameSite cookies
- [x] No API credentials in code (env vars only)
- [x] Audit logs for auth events
- [x] OWASP Top 10 compliance reviewed

---

## Conclusion

The Smart Bookmark App architecture is designed with **security**, **scalability**, and **developer experience** in mind. By leveraging managed cloud services (Supabase, Vercel), the system eliminates operational overhead while providing enterprise-grade reliability. The serverless, real-time architecture ensures responsive user experiences and effortless scaling from day one.

**Key Architectural Tenets:**
1. **Security First:** OAuth 2.0, RLS policies, parameterized queries
2. **Real-Time Priority:** WebSocket subscriptions over polling
3. **Scalability by Default:** Managed services auto-scale seamlessly
4. **Developer Velocity:** API routes, file-based routing, zero-config deploy
5. **Maintainability:** Single-source-of-truth data model, clear component hierarchy

---

**Document Version:** 1.0  
**Last Updated:** February 16, 2026  
**Status:** Ready for Development
