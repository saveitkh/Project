# Deployment

This describes a real production deployment path for the LIVE Pre-Test &
Account Protection Service. Nothing here is a mockup — it reflects how this
specific Next.js + Prisma app is actually structured to run.

## Request path

```
Internet
  → DNS (A/AAAA record → your server's public IP)
  → HTTPS (TLS termination — Let's Encrypt via certbot, or your CDN/load balancer)
  → Nginx (reverse proxy, static-asset caching, rate limiting)
  → Next.js (this app, run via `next start` behind a process manager)
  → Database (Postgres in production — see below)
  → Background jobs (see "Background jobs" below)
  → Monitoring (see "Monitoring" below)
```

## Database

Local/dev uses SQLite (`prisma/schema.prisma`, `DATABASE_URL="file:./dev.db"`)
so the app runs with zero external setup. For production:

1. Provision a real Postgres instance.
2. Change `datasource db { provider = "sqlite" }` to `provider = "postgresql"`
   in `prisma/schema.prisma`.
3. Set `DATABASE_URL` to the Postgres connection string in your production
   environment (never in source control).
4. Run `npx prisma migrate deploy` as part of your deploy pipeline.

No application code depends on SQLite-specific behavior, so this swap does
not require touching `lib/protection/*`.

## Example Nginx config (reverse proxy to `next start` on :3000)

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.example;

    ssl_certificate     /etc/letsencrypt/live/your-domain.example/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.example/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name your-domain.example;
    return 301 https://$host$request_uri;
}
```

## Process management

Run `next start` under a supervisor (systemd unit, pm2, or your platform's
equivalent) so the app restarts on crash/reboot. Example systemd unit:

```ini
[Unit]
Description=Protection Service (Next.js)
After=network.target

[Service]
WorkingDirectory=/opt/protection-service
EnvironmentFile=/opt/protection-service/.env
ExecStart=/usr/bin/npm run start
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

## Background jobs

This app does not currently require a background job queue — all analysis
is synchronous and fast (rule-based, no ML inference, no outbound calls
unless an official TikTok API is configured). If you add scheduled work
(e.g., periodic polling of an official API for LIVE status), run it as a
separate scheduled process (cron, a queue worker) rather than inside a
Next.js request handler, and have it write results into `LiveSession` rows
the app already reads.

## Monitoring

- `/api/health` returns `200` with `{"status":"ok"}` when the database is
  reachable, and `503` with `{"status":"degraded"}` otherwise. Point your
  uptime monitor / load balancer health check at this endpoint.
- Application logs: run behind your platform's standard log collection
  (journald, Docker logs, or your PaaS's log stream). No custom logging
  pipeline is bundled in this repo.

## Secrets

All secrets are read from environment variables (see `.env.example`):
`DATABASE_URL`, `SESSION_SECRET`, and the optional
`TIKTOK_OFFICIAL_API_*` variables. None are hardcoded in source. Generate
`SESSION_SECRET` with `openssl rand -base64 32` and store it in your
platform's secret manager, not in a committed file.

## Known security-scan caveats (local/dev)

`npm audit` will show some findings in this project's dependency tree:

- Several upstream Next.js advisories concern `next/image` optimization,
  middleware, Server Actions, and custom servers — none of which this app
  uses. They do not apply to this deployment shape.
- `vitest`/`vite`/`esbuild` dev-server advisories apply only to running the
  Vite/Vitest **UI/dev server**, which this project never starts (tests run
  via `vitest run`, not `vitest --ui`, and are never exposed to the
  internet).
- `mysql2` is a transitive dependency pulled in by Prisma's multi-driver
  support; this project only ever configures the `sqlite`/`postgresql`
  driver and never loads the MySQL driver at runtime.

These are documented here rather than silently ignored; re-run `npm audit`
periodically and re-evaluate as dependencies update.
