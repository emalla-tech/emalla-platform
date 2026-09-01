# Koyeb Backend Migration Plan

This guide prepares the E-Malla Rwanda backend to move from Render to Koyeb without touching production Supabase data or Vercel production settings until the new backend is verified.

## Goal

Run the E-Malla backend as a low-cost Koyeb Web Service while keeping:

- Frontend on Vercel.
- Database on the existing Supabase production project.
- Product media on Cloudinary.
- Email through the existing configured provider.

## Current Problem

The Render backend service is suspended for billing, so the public shop cannot load products. Cloudinary is not the root cause. The frontend needs a working backend API for `/api/products`.

## Recommended Koyeb Setup

- Service type: Web Service.
- Source: GitHub repository `emalla-tech/emalla-platform`.
- Branch: `main`.
- Builder: Buildpack is acceptable.
- Run command: use `Procfile`, which runs `npm run start:prod`.
- Instance: start with Koyeb Free while pre-launch, then move to Eco/paid when real customers begin using the platform.
- Port: use Koyeb-provided `PORT`; do not hard-code a port.

## Required Environment Variables

Set these in Koyeb only. Do not commit real values.

```text
NODE_ENV=production
DB_PROVIDER=postgres
DATABASE_URL=<Supabase production pooled PostgreSQL URL>
PUBLIC_APP_URL=https://www.emallarwanda.com
CORS_ALLOWED_ORIGINS=https://www.emallarwanda.com,https://emallarwanda.com
JWT_SECRET=<secret>
SESSION_SECRET=<secret>
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=<secret>
CLOUDINARY_UPLOAD_PRESET=<secret if used>
CLOUDINARY_API_KEY=<secret>
CLOUDINARY_API_SECRET=<secret>
CLOUDINARY_UPLOAD_FOLDER=e-malla
EMAIL_PROVIDER=resend
RESEND_API_KEY=<secret if email is enabled>
RESEND_FROM_EMAIL=<verified sender>
EMAIL_FROM_NAME=E-Malla Rwanda
ADMIN_ALERT_EMAIL=<admin email>
GTBANK_MERCHANT_CODE=<current value>
GTBANK_RECIPIENT_NAME=Perfect Technologies Ltd
```

Only include optional provider variables if that provider is active.

## Verification Before Switching Vercel

After Koyeb deploys, verify these read-only endpoints:

```text
https://<koyeb-service>.koyeb.app/api/health?warm=1
https://<koyeb-service>.koyeb.app/api/products
```

Expected:

- Health returns JSON with status `ok`.
- Products returns JSON with a `products` array.
- No response should say `Service Suspended`.
- No endpoint should return the Vercel frontend HTML for API paths.

## Frontend Cutover

Only after the Koyeb backend is verified:

1. Set Vercel frontend environment variable:

```text
VITE_API_URL=https://<koyeb-service>.koyeb.app/api
```

2. Redeploy the Vercel frontend.
3. Confirm the built shop page loads products from the Koyeb API.

If a stable custom API domain is preferred later, use:

```text
api.emallarwanda.com
```

and point it to the verified Koyeb service before changing `VITE_API_URL`.

## Safety Rules

- Do not run migrations directly against production during this migration.
- Do not copy production data into local development databases.
- Do not expose secrets in GitHub, screenshots, logs, or docs.
- Do not change production Supabase schema as part of hosting migration.
- Keep Render suspended until Koyeb is verified, unless immediate live backend availability is required.

## Cost Notes

Koyeb Free can be used for pre-launch testing, but it may scale down when idle and should not be treated as final production capacity. Once E-Malla starts receiving customers, move to the smallest reliable paid instance that keeps checkout and product browsing responsive.

## Rollback

If Koyeb fails verification:

1. Do not update Vercel `VITE_API_URL`.
2. Keep the current frontend unchanged.
3. Either fix Koyeb configuration or temporarily resume Render if immediate live API access is required.
