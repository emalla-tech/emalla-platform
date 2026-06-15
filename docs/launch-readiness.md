# E-Malla Rwanda Launch Readiness

## Required before unrestricted public traffic

- Keep the Render backend on an always-on instance. A sleeping backend can make the first login or checkout request appear to fail.
- Run `npm run smoke:production` after every Vercel or Render deployment.
- Complete one production order with each supported payment method:
  - GTBank MoMo Pay, including admin approval
  - Cash on Delivery, including seller preparation, rider delivery, and buyer receipt
- Confirm Resend delivery for buyer, seller, rider, and admin notifications.
- Confirm the admin Monitoring page has no new server or frontend errors after the smoke test.

## Current database safety

Legacy snapshot writes are serialized with a PostgreSQL advisory transaction lock to prevent simultaneous destructive rewrites. This is a launch-safety mitigation, not the final scaling architecture.

Before running multiple backend instances or handling high concurrent traffic, replace remaining snapshot mutations with targeted SQL transactions.

## Verification commands

```powershell
node .\node_modules\typescript\bin\tsc --noEmit
node --check backend/server.js
node --check backend/dbPostgres.js
node .\node_modules\vite\bin\vite.js build
node scripts\check-postgres-readiness.mjs
npm run smoke:production
```

## Deployment review

- Vercel: verify security headers, PWA install, unknown-route 404 page, and mobile overlays.
- Render: verify `/api/health?warm=1`, logs, uptime, and response time.
- Supabase/Postgres: verify backups and connection limits.
- Cloudinary: verify upload quota and old local-upload references before removing `public/uploads`.
- Resend: verify domain health and bounced-recipient monitoring.
