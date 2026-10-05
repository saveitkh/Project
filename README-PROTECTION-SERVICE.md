# TikTok LIVE Pre-Test & Account Protection Service

A production-oriented (not a mockup) Next.js + Prisma service that helps
creators/brands reduce preventable risk before and during TikTok LIVE
selling, test scripts and product claims, and organize evidence if an
incident occurs.

## Core promise

> We help LIVE creators identify and reduce preventable risks before going
> LIVE, test their content and presentation, monitor authorized information
> during LIVE, and prepare evidence if an incident occurs.

This service does **not** control TikTok's enforcement decisions and never
claims to. It never bypasses restrictions, spoofs identity/location/device,
evades detection, manipulates engagement metrics, or uses unofficial/private
TikTok APIs.

## Running locally

```bash
cp .env.example .env        # fill in SESSION_SECRET (openssl rand -base64 32)
npm install                 # also runs `prisma generate` via postinstall
npx prisma migrate dev      # creates prisma/dev.db (SQLite) and applies the schema
npm run dev                 # http://localhost:3000
```

Sign up at `/signup`, then use `/pre-live`, `/pre-live/practice`,
`/pre-live/product`, `/pre-live/practice-live`, `/protection/incidents`,
`/protection/plans`. Promote a user to admin directly in the DB (there is no
self-serve admin signup) to view `/admin`.

## Testing

```bash
npm test            # vitest run — 46 tests covering risk engine, product
                     # review, readiness scoring, practice-session
                     # progression, incident reporting, report generation
                     # (incl. an XSS-escaping test and a real PDF-byte
                     # check), auth, authorization, input validation, and
                     # API-failure handling for the (unconfigured) live-
                     # monitoring integration.
npm run build        # next build — full typecheck + production build
```

## Architecture

- **Framework**: Next.js 14 (App Router), TypeScript.
- **Database**: Prisma + SQLite for local/dev (`prisma/schema.prisma`); swap
  the datasource provider + `DATABASE_URL` for Postgres in production — no
  application code depends on SQLite-specific behavior.
- **Auth**: bcrypt password hashing + signed JWT session cookie (httpOnly).
  No third-party auth provider, no OAuth with TikTok — this logs into *this
  service*, not into TikTok.
- **Risk engine** (`lib/protection/riskEngine.ts`): deterministic, rule-based
  text analysis against general, publicly documented advertising/compliance
  norms. It is explicitly NOT a claim to know TikTok's private moderation
  algorithm — see the disclaimer constant exported from that file and
  surfaced throughout the UI.
- **File storage**: local disk under `/uploads` for evidence/product
  documents (dev-grade; see Limitations).
- **PDF reports**: generated with `pdf-lib` — a real PDF binary, not an HTML
  screenshot. Non-Latin scripts (e.g., Khmer) fall back to a placeholder
  character in the PDF only, because the bundled standard font only
  supports WinAnsi encoding; the HTML/JSON report view always has the exact
  original text. See `docs/DEPLOYMENT.md` for the production deployment
  path (Nginx, Postgres migration, process management, `/api/health`).

## Known limitations (stated plainly, not hidden)

1. **No official TikTok API is integrated.** `lib/protection/liveMonitoring.ts`
   reports `UNAVAILABLE` for all LIVE-monitoring data until a real, officially
   authorized integration is configured via `TIKTOK_OFFICIAL_API_*` env vars.
   Nothing fakes a connection.
2. **File storage is local disk**, not production object storage. Fine for
   a single-instance deployment; replace with S3-compatible storage with
   access control before scaling horizontally.
3. **The risk engine is a heuristic**, not a classifier trained on real
   moderation outcomes. It is intentionally transparent (readable rules,
   not a black box) rather than maximally "accurate" against an algorithm
   nobody outside TikTok can observe.
4. **Automated test coverage is at the business-logic layer** (the `lib/`
   modules), not full DB-integration or end-to-end browser tests. The
   manual end-to-end pass documented in this PR's summary exercised the
   real HTTP API against the real SQLite DB (signup → pre-LIVE audit with
   the spec's own Khmer example → readiness score → PDF download → incident
   → evidence → appeal draft → admin dashboard with role enforcement) and
   all of it worked; adding that as repeatable integration tests is a
   reasonable next step, not yet done here.
5. **PDF Khmer/non-Latin rendering** uses a placeholder character; see
   above.

## Final verification

| Feature | Status | Data Source | Limitation |
|---|---|---|---|
| Pre-LIVE Test | REAL | CUSTOMER-PROVIDED input → CALCULATED findings | Heuristic engine, not TikTok's algorithm |
| Speaking Practice | REAL | CUSTOMER-PROVIDED input → CALCULATED findings | Same heuristic engine; stateless, no login required |
| Product Test | REAL | CUSTOMER-PROVIDED input → CALCULATED findings | Never auto-approves; REVIEW_REQUIRED for sensitive categories |
| Script Risk Analysis | REAL | CALCULATED | Rule-based; general compliance norms, not TikTok policy |
| Risk Assessment Score | REAL | CALCULATED | Explicitly not a "Ban Probability"; unknowns listed in every result |
| Practice LIVE (versioned retesting) | REAL | CUSTOMER-PROVIDED + CALCULATED | Version history stored; final report always carries the required disclaimer |
| Real LIVE Monitoring | UNAVAILABLE by default | OFFICIAL-API (when configured) / UNAVAILABLE | No official TikTok API is wired up in this environment; architecture is real and pluggable |
| TikTok API | UNAVAILABLE | OFFICIAL-API (not configured) | No credentials provided; never faked |
| Incident Reporting | REAL | CUSTOMER-PROVIDED | Evidence stored on local disk in this deployment |
| Evidence Package / Incident Report | REAL | CALCULATED from CUSTOMER-PROVIDED data | — |
| Appeal Preparation | REAL | CALCULATED draft text | Customer must submit via TikTok's own official process; no submission automation |
| Protection Reports (view + PDF) | REAL | CALCULATED | Real `pdf-lib` PDF binary; non-Latin scripts show as placeholders in the PDF only |
| Admin Dashboard | REAL | CALCULATED aggregates | Never selects/displays password hashes |
| `/api/health` | REAL | REAL (live DB check) | Fixed in this build — was previously statically pre-rendered at build time and frozen; now `force-dynamic` |
| Database (14 models) | REAL | — | SQLite locally; swap to Postgres for production per `docs/DEPLOYMENT.md` |
| Automated tests | REAL | — | 46 Vitest tests across business logic; no full DB-integration test suite yet |
| Real Server / Deployment | DOCUMENTED, not yet deployed | — | See `docs/DEPLOYMENT.md` for the Nginx/Postgres/systemd path |

**Never claimed and never will be:** "100% ban protection," "guaranteed
unbannable," "we can bypass TikTok," "we can remove any ban," or "our
server prevents TikTok detection." Every report, every page, and every
plan tier states plainly that this service cannot control or guarantee
TikTok's enforcement decisions.
