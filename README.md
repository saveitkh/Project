# Regional Moderation Research Lab (Simulation)

A local, educational research lab for studying — in the abstract — how differing
content-moderation policy configurations could produce different outcomes for the
same branded LIVE-stream content across markets.

## Scope and ethics

- **Educational / defensive research only.** This project does not interact with
  TikTok or any other live platform in any way.
- **All data is synthetic.** Regions (Indonesia, Malaysia, Singapore, Vietnam),
  policy sensitivity values, and risk scores are entirely invented for this lab.
  They are explicitly labeled SIMULATED throughout the UI and code and must never
  be presented or mistaken as TikTok's actual rules, data, or behavior.
- **No bypass, evasion, or enforcement-interaction logic of any kind.** This
  project contains, and will never contain:
  - TikTok moderation bypass logic
  - Geo-restriction evasion
  - GPS/location spoofing
  - Device fingerprint spoofing
  - IP rotation to avoid enforcement
  - Fake account creation
  - Use of undocumented TikTok APIs
  - Automated interaction with any real enforcement system
- **"Region" is just a config label.** Selecting a region in this app only picks
  which mock `RegionPolicy` object (plain numbers in `lib/regions.ts`) is applied
  to the scoring function. It has no relationship to network location, server
  location, device location, or any real account's market.

## What it does

A deterministic, fully transparent scoring function (`lib/riskEngine.ts`) takes a
piece of test content (brand, product, LIVE title/script, hashtags, evidence) and
a mock regional policy, and returns a synthetic risk score, the signals that
contributed to it, and a plain-language explanation — all computed locally in
your browser, with no network calls.

## Features

| Route | Feature |
|---|---|
| `/dashboard` | Landing page, scope/ethics statement, location-vs-server diagram |
| `/live-test` | Run one piece of content through a single simulated region |
| `/region-comparison` | Run the same content through all simulated regions at once |
| `/experiments` | Change one variable (A–E) at a time and compare before/after |
| `/false-positives` | Curated legitimate examples that a mock policy could still flag |
| `/reports` | Generate and review structured research reports |
| `/settings` | Edit each simulated region's mock sensitivity/threshold values |

## Security note

This app is built with Next.js 14.2.x (latest 14.x patch at time of writing) and is
intended to run only locally for research/demo purposes. It does not use
`next/image` optimization, middleware, Server Actions, or a custom server — the
features implicated in most outstanding upstream Next.js advisories for this
major version — and it is not intended to be deployed as a public-facing server.

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Disclaimer

**Simulation only — results do not represent TikTok's actual moderation rules.**
All data in this project is synthetic and intended solely for educational research
into moderation-policy design concepts.
