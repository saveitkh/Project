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
`/pre-live/product`, `/pre-live/practice-live`, `/live-monitor`,
`/protection/incidents`, `/protection/plans`. Promote a user to admin
directly in the DB (there is no self-serve admin signup) to view `/admin`.

## LIVE monitoring (`/live-monitor`)

- Click **Connect** with mode **Simulated** to practice with safe, clearly
  labeled synthetic events (comments, likes, gifts, follows, viewer counts) —
  use **Simulate next event** to step through them on demand instead of
  waiting for the timer.
- Mode **Official API** only connects if `TIKTOK_OFFICIAL_API_BASE_URL` +
  `TIKTOK_OFFICIAL_API_CLIENT_ID` are set to a real, authorized integration;
  otherwise it reports **"Live monitoring unavailable"** honestly (Phase 8
  fallback) and switches the page to manual event entry — type or paste
  what you observed on your own real LIVE, and it still runs through the
  same risk engine.
- Every event and every report line is labeled with its real provenance:
  `REAL` (official API), `SIMULATED` (practice data), or
  `CUSTOMER_PROVIDED` (manual entry). Nothing is ever mislabeled as REAL.
- Comments that look like orders (e.g., "order A1 x2") are surfaced as
  **Order Suggestions** for the seller to confirm or dismiss themselves —
  this never creates a real order anywhere. Comments worth pinning are
  surfaced as **Pin Suggestions** — the host pins them inside TikTok's own
  app; this system has no write access to TikTok and never pins anything
  itself.
- Ending a session automatically generates a Protection Report with the
  full LIVE event/evidence timeline attached (viewable at
  `/protection/reports/[id]`, downloadable as PDF).

See `lib/tiktok-live/README.md` for the connector architecture and exactly
where an official API integration would plug in.

## Testing

```bash
npm test            # vitest run — tests covering risk engine, product
                     # review, readiness scoring, practice-session
                     # progression, incident reporting, report generation
                     # (incl. an XSS-escaping test and a real PDF-byte
                     # check), auth, authorization, input validation,
                     # API-failure handling for the (unconfigured) live-
                     # monitoring integration, LIVE event normalization,
                     # REAL vs SIMULATED vs CUSTOMER_PROVIDED labeling,
                     # order-suggestion detection, and LIVE session
                     # start/end + report generation.
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
- **LIVE connector** (`lib/tiktok-live/`): isolated module — the rest of the
  app depends only on its `TikTokLiveAdapter` interface, never on a
  specific third-party library. `OfficialApiAdapter` is honest-by-default
  (reuses `lib/protection/liveMonitoring.ts`'s `UNAVAILABLE`-unless-
  configured pattern); `SimulatedAdapter` only ever emits
  `confidence: "SIMULATED"`. Events are normalized (`normalizer.ts`),
  persisted, run through the **existing, unmodified**
  `lib/protection/riskEngine.ts`, and published to an in-process event bus
  consumed by `/live-monitor` over Server-Sent Events. See
  `lib/tiktok-live/README.md`.
- **Order/pin suggestions** (`lib/protection/orderSuggestionEngine.ts` +
  `orderSuggestionHandler.ts`): a deterministic pattern match on comment
  text, registered as an extension handler on the connector's event bus
  without modifying `connector.ts`. Produces draft `OrderSuggestion` rows
  for the seller to confirm/dismiss and a pin *suggestion* flag on the
  triggering event — there is no code path anywhere that calls a TikTok API
  to create an order or pin a comment.

## Security

- No API secrets, session tokens, or credentials are ever sent to browser
  JavaScript — the session cookie is `httpOnly`, and `TIKTOK_OFFICIAL_API_*`
  values are read only in server-side route handlers/lib code, never
  exposed via any API response or client bundle.
- TikTok passwords are never collected, requested, or stored anywhere in
  this codebase — the TikTok "account" fields the app stores are just the
  customer-supplied handle/identifier, not a credential.
- If a real official API integration is added later: store its tokens
  server-side only, encrypt them at rest, read them from environment
  variables (never hardcode), and implement a revocation path before
  relying on them in production — none of this is needed today because no
  such integration exists yet.
- Passwords are hashed with bcrypt (cost 12); admin views never select or
  display `passwordHash`.

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
| Real LIVE Monitoring (official API) | UNAVAILABLE by default | OFFICIAL-API (when configured) / UNAVAILABLE | No official TikTok API is wired up in this environment; `OfficialApiAdapter` proves connectivity only — real event streaming needs the integration-specific piece implemented (documented extension point) |
| Simulated LIVE Monitoring | REAL (as a simulator) | SIMULATED | Always labeled SIMULATED; verified end-to-end with the exact Khmer example |
| Manual LIVE fallback (Phase 8) | REAL | CUSTOMER_PROVIDED | Used only when connector is unavailable; runs through the same risk engine |
| Order Suggestions | REAL | CALCULATED from COMMENT text | Draft only — never creates a real order anywhere |
| Pin Suggestions | REAL | CALCULATED from COMMENT text | Suggestion only — host pins it themselves in TikTok's app; no write access exists |
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

## Legal / platform compliance limitations

This service helps creators identify and reduce preventable LIVE-content
risks. **It does not guarantee immunity from TikTok enforcement.** Beyond
that:

- No code in this repository bypasses, evades, or interferes with TikTok's
  enforcement, moderation, CAPTCHA, or anti-automation systems.
- No code spoofs GPS/location, device identity, or network origin.
- No code creates fake engagement (views, likes, followers, comments) or
  automates abusive behavior.
- No code uses an unofficial/private TikTok API to take an action on a
  user's behalf (posting, pinning, ordering). The only "write" surface this
  app has toward TikTok is a documented, unimplemented extension point for
  a future *officially authorized* integration.
- Order and pin "suggestions" are exactly that — drafts for a human to act
  on themselves, inside TikTok's own app or their own fulfillment process.
- Operating a TikTok account always remains subject to TikTok's own Terms
  of Service and Community Guidelines, which this service has no authority
  over and cannot change.
