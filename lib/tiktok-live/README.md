# `lib/tiktok-live/` — LIVE connector module

An isolated module for ingesting LIVE events and feeding them into the
existing protection pipeline. The rest of the application never imports a
third-party library directly — it only imports from this module's `types.ts`.

## Isolation boundary

```
TikTokLiveAdapter (interface, types.ts)
  ├─ OfficialApiAdapter   (adapter.ts)      — honest-by-default, reuses lib/protection/liveMonitoring.ts
  └─ SimulatedAdapter     (simulatedAdapter.ts) — always confidence: "SIMULATED"
        ↓ raw events
  normalizeEvent()        (normalizer.ts)   — raw → strict NormalizedLiveEvent, or null if unrecognized
        ↓
  connector.ts            — persists LiveEvent rows, runs the EXISTING
                             lib/protection/riskEngine.ts on COMMENT text,
                             publishes to the event bus, and calls any
                             registered extension handlers
        ↓
  eventBus.ts             — in-process pub/sub, one EventEmitter per session
        ↓
  app/api/live-sessions/[id]/stream (SSE) → /live-monitor UI
```

Nothing in this module, nor anything it's wired into, implements or will
implement: ban/restriction bypass, region/GPS/device spoofing, CAPTCHA
bypass, anti-detection, private-API scraping, or any automated TikTok
account action (posting, pinning, ordering) without an explicit official
API. See `ADAPTER.md`-style comments inside `adapter.ts` for exactly where
a real official integration would plug in.

## REAL vs SIMULATED — never blurred

- `OfficialApiAdapter` can only ever report `dataSource: "REAL"`, and only
  once `TIKTOK_OFFICIAL_API_BASE_URL` + `TIKTOK_OFFICIAL_API_CLIENT_ID` are
  set and the official API responds. Otherwise: `"UNAVAILABLE"`.
- `SimulatedAdapter` can only ever report `dataSource: "SIMULATED"`. It is
  a separate class with no code path that can emit `"REAL"`.
- Every persisted `LiveEvent.confidence` field is stamped by the connector
  from the adapter's own declared mode — never inferred, never guessed.

## Extending

- **To plug in a real official TikTok API**: implement the event-delivery
  part of `OfficialApiAdapter` (the webhook/websocket/polling mechanism
  specific to your authorized integration) where the class docstring marks
  it, and call the registered `onEvent` callback with raw events shaped
  like the examples in `simulatedAdapter.ts`'s `DEFAULT_EVENTS`.
- **To react to events** (e.g., the order-suggestion module): call
  `registerEventHandler()` from `connector.ts` at module load time. Do not
  modify `connector.ts` itself for new reactions.
