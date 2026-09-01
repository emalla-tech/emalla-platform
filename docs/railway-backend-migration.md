# Railway Backend Migration Plan

This guide prepares E-Malla Rwanda to replace the suspended Render backend with a Railway-hosted backend while keeping GitHub, Vercel, Supabase and Cloudinary.

## Target Architecture

- GitHub remains the source of truth for code.
- Vercel remains the frontend host.
- Supabase remains the production PostgreSQL database.
- Cloudinary remains the product image/document storage provider.
- Railway replaces Render for the Node.js backend API.

## Why Railway

Railway is a good fit for the current backend because the repository already has a Node.js start script and the backend reads `process.env.PORT`, which Railway provides at runtime. This avoids a large rewrite while reducing dependency on the suspended Render service.

## Safety Rules

- Do not modify the Supabase production schema during the hosting migration.
- Do not copy production data into local development.
- Do not put secrets into GitHub.
- Do not change Vercel `VITE_API_URL` until the Railway backend has passed verification.
- Do not delete the Render service until Railway is verified and Vercel has been switched successfully.

## Railway Project Setup

Create a Railway project and add one backend service:

```text
Project name: E-Malla Rwanda
Service name: emalla-api
Source: GitHub
Repository: emalla-tech/emalla-platform
Branch: main
Root directory: /
Build command: npm install
Start command: npm run start:prod
```

Railway may auto-detect the start command from `package.json`; if it asks, set it manually to:

```text
npm run start:prod
```

The repository also contains a `Procfile` as a fallback:

```text
web: npm run start:prod
```

## Railway Variables

Use `.env.railway.example` as the checklist. Add the real values in Railway service variables only.

Minimum required production variables:

```text
NODE_ENV=production
DB_PROVIDER=postgres
DATABASE_URL=<Supabase production PostgreSQL URL>
PUBLIC_APP_URL=https://www.emallarwanda.com
CORS_ALLOWED_ORIGINS=https://emallarwanda.com,https://www.emallarwanda.com
JWT_SECRET=<secret>
SESSION_SECRET=<secret>
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=<secret>
CLOUDINARY_API_KEY=<secret>
CLOUDINARY_API_SECRET=<secret>
```

Do not add `VITE_*` variables to Railway unless a backend build step explicitly needs them. `VITE_*` belongs mainly to the Vercel frontend build.

## Verification Before Vercel Cutover

After Railway deploys, Railway will provide a backend domain similar to:

```text
https://emalla-api-production.up.railway.app
```

Verify:

```text
https://<railway-backend-domain>/api/health?warm=1
https://<railway-backend-domain>/api/products
```

Expected:

- `/api/health?warm=1` returns JSON with status `ok`.
- `/api/products` returns JSON with a `products` array.
- Product image URLs should still point to Cloudinary where products use Cloudinary media.
- The response must not be Vercel frontend HTML.
- The response must not say `Service Suspended`.

## Vercel Frontend Cutover

Only after Railway verification passes, update Vercel frontend environment:

```text
VITE_API_URL=https://<railway-backend-domain>/api
```

Then redeploy Vercel and verify:

```text
https://www.emallarwanda.com/shop
```

The shop page should load products from the Railway backend.

## Post-Cutover Checks

Run read-only checks:

```text
https://www.emallarwanda.com
https://www.emallarwanda.com/shop
https://<railway-backend-domain>/api/health?warm=1
https://<railway-backend-domain>/api/products
```

Functional checks:

- Public product browsing works.
- Product details open.
- Cloudinary images load.
- Login works.
- Seller dashboard can read products.
- Admin product approvals still work.
- Checkout still works without changing OMS/payment ownership.

## Rollback

If Railway fails after Vercel cutover:

1. Revert Vercel `VITE_API_URL` to the previous backend only if that backend is available.
2. Otherwise keep Vercel deployed but mark the backend incident clearly.
3. Fix Railway variables/logs before attempting another cutover.

## Cost Control

Start with the lowest Railway option that can run the backend reliably during pre-launch. Watch:

- CPU and memory usage.
- Request latency.
- Cold starts or sleeps if using a trial/free tier.
- Monthly usage alerts.

When real customers begin placing orders, use the smallest paid plan that keeps checkout and product browsing stable.
