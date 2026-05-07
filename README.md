# E-Malla Rwanda

E-Malla Rwanda is a multi-role commerce and logistics platform prototype built with Vite, React, and TypeScript. It includes a public storefront plus dashboard experiences for buyers, sellers, riders, and admins.

## Features

- marketplace browsing with category and search flows
- product detail pages with variants and AI-assisted summaries
- shared cart and checkout flow powered by local storage
- auth with role-based dashboards for admin, seller, buyer, and rider
- backend API for auth, products, orders, addresses, and payments
- dedicated dashboard areas for platform operations

## Run locally

### Prerequisites

- Node.js 22+

### Setup

1. Install dependencies with `npm install`
2. Add your Gemini key to `.env.local` as `GEMINI_API_KEY=...` (used by backend API only)
3. Start the backend API with `npm run api`
4. Start the frontend with `npm run dev`

## Bootstrap accounts

For a fresh local database, bootstrap account passwords come from `.env.local`:

- `ADMIN_BOOTSTRAP_PASSWORD`
- `BUYER_BOOTSTRAP_PASSWORD`
- `MERCHANT_BOOTSTRAP_PASSWORD`
- `RIDER_BOOTSTRAP_PASSWORD`

If an admin password has already been changed and you need a safe maintenance reset, run:

```powershell
$env:ADMIN_RESET_PASSWORD='NewStrongPassword#2026'
npm run admin:reset-password -- --email admin@emalla.rw
```

The reset tool creates a JSON backup when using the local database, revokes existing admin sessions, and marks the account to change password on next login by default.

## Notes

- Styling is provided through Tailwind's browser runtime from `index.html`, which matches the utility-class based UI already used throughout the app.
- Frontend API calls are proxied from Vite to `http://localhost:4000`.
- Backend data is persisted in `backend/data/db.json`.
- Auth, products, orders, addresses, and payment initialization/verification now go through the backend API.
- Notifications and a few dashboard widgets still use demo/local services.

## Production deployment preparation

Use `.env.production.example` as the checklist for production hosting variables. Keep real secrets inside the hosting provider environment settings, not in the repository.

Recommended production stack:

- Frontend: Vercel
- Backend and managed database: Railway or Render
- DNS and SSL: Cloudflare
- Email: Resend with a verified sender domain
- Upload storage: Cloudinary

Before going public, confirm these items:

- `PUBLIC_APP_URL` points to the real public domain.
- `VITE_API_URL` points to the deployed backend `/api` base when frontend and backend are hosted separately.
- `VITE_PUBLIC_APP_URL` points to the public frontend URL.
- `CORS_ALLOWED_ORIGINS` includes only trusted production frontend domains.
- `NODE_ENV=production`, `DB_PROVIDER=postgres`, `DATABASE_URL`, `JWT_SECRET`, and `SESSION_SECRET` are set on the backend host.
- `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL` are set.
- `STORAGE_PROVIDER=cloudinary`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `CLOUDINARY_UPLOAD_FOLDER` are set.
- Bootstrap passwords are strong production-only secrets.
- Temporary passwords are sent by email only and are not displayed in admin approval screens.
- `GEMINI_API_KEY` is configured only on the backend environment.
- `backend/data/db.json` is replaced by a managed production database before serious public usage.

Final smoke test before launch:

- Buyer register, login, shop, checkout, and order tracking
- Seller application, admin approval, first login password change, and product creation
- Rider application, admin approval, login, settings, and delivery flow
- Admin approvals, finance, inquiries, security, email logs, and exports
- Resend email delivery to a real inbox
- Cloudinary upload for product images, seller branding, and application documents
- Language switcher across public pages

### Frontend API URL setup

Local development uses Vite's `/api` proxy automatically. In production, set this frontend environment variable if the backend is deployed on a different domain:

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_PUBLIC_APP_URL=https://yourdomain.com/#
```

If the frontend and backend are served from the same domain with `/api` routing, you can leave `VITE_API_URL` unset.

### Production environment validation

Before the first public deployment, verify backend configuration safely:

```powershell
npm run env:check
```

The checker validates:

- `NODE_ENV=production`
- `DB_PROVIDER=postgres`
- `DATABASE_URL`
- `PUBLIC_APP_URL`
- `CORS_ALLOWED_ORIGINS`
- `JWT_SECRET`
- `SESSION_SECRET`
- Resend readiness when `EMAIL_PROVIDER=resend`
- Cloudinary readiness when `STORAGE_PROVIDER=cloudinary`

### Vercel frontend deployment

- `vercel.json` now rewrites all routes to `index.html` so React Router works on refresh.
- Set frontend env vars in Vercel:
  - `VITE_API_URL`
  - `VITE_PUBLIC_APP_URL`
- Build command: `npm run build`
- Output directory: `dist`

### Backend deployment (Render or Railway)

- Start command: `npm run start:prod`
- Health check path: `/api/health`
- Required backend env vars:
  - `NODE_ENV=production`
  - `DB_PROVIDER=postgres`
  - `DATABASE_URL`
  - `PUBLIC_APP_URL`
  - `CORS_ALLOWED_ORIGINS`
  - `JWT_SECRET`
  - `SESSION_SECRET`
  - `EMAIL_PROVIDER`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
  - `STORAGE_PROVIDER`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_FOLDER`

Production backend behavior now includes:

- strict Postgres mode without automatic JSON fallback
- security headers on every API response
- request rate limiting for auth, uploads, and general API usage
- gzip compression for larger JSON responses
- trust-proxy aware request handling
- graceful shutdown on `SIGINT` and `SIGTERM`
- production env validation at startup

### Cloudinary storage setup

1. Create a Cloudinary account and copy the cloud name.
2. Create an API key and API secret for signed server-side uploads.
3. Choose the base folder that will contain E-Malla assets.
4. Set production environment variables:
   - `STORAGE_PROVIDER=cloudinary`
   - `CLOUDINARY_CLOUD_NAME=...`
   - `CLOUDINARY_API_KEY=...`
   - `CLOUDINARY_API_SECRET=...`
   - `CLOUDINARY_UPLOAD_FOLDER=e-malla`
   - `MAX_IMAGE_UPLOAD_MB=8`
   - `MAX_DOCUMENT_UPLOAD_MB=12`
5. Run `npm run storage:check` to verify the storage configuration without uploading a real file.
6. Test uploads from:
   - Seller inventory product images
   - Seller settings logo and cover image
   - Become Seller logo and supporting document

Supported upload types:

- Product, seller branding, banner, and profile photo uploads: JPG, JPEG, PNG, WEBP
- Seller application supporting documents: images or PDF files

Product create/edit flows now store only returned asset URLs in the database, and product updates automatically try to remove replaced Cloudinary images. If Cloudinary is not configured, local development falls back to inline file data so the app can still be tested locally.

### Resend email setup

1. Create a Resend account.
2. Verify the domain you will use for sender emails.
3. Create an API key in Resend.
4. Set production environment variables:
   - `EMAIL_PROVIDER=resend`
   - `RESEND_API_KEY=...`
   - `RESEND_FROM_EMAIL=no-reply@yourdomain.com`
   - `EMAIL_FROM=no-reply@yourdomain.com` as an optional backward-compatible fallback
   - `EMAIL_FROM_NAME=E-Malla Rwanda`
   - `ADMIN_ALERT_EMAIL=admin@yourdomain.com`
   - `PUBLIC_APP_URL=https://yourdomain.com/#`
5. Restart the backend after setting the variables.
6. Open Admin Dashboard -> Email Delivery Desk and confirm the provider status says live email is ready.
7. Run `npm run email:check` to verify config and template rendering without sending a real email.

Email flows to test before going public:

- Buyer registration account-ready email
- Buyer registration welcome email
- Order confirmation email
- Seller order notification email
- Rider delivery assignment email
- Seller application submitted email
- Seller approval email with temporary credentials
- Rider approval email with temporary credentials
- Contact/support ticket confirmation email
- Forgot/reset password email
- Contact and investor inquiry alerts
- Payout request and payout decision emails

If Resend is not configured, local development keeps emails in the admin email logs instead of sending to a real inbox.

## Database backup and restore

- Create a backup: `npm run db:backup`
- Restore from a backup: `npm run db:restore -- .\\backend\\data\\backups\\db-backup-YYYY-MM-DDTHH-MM-SS-sssZ.json`
- Automatic rotation keeps the latest backups only. Configure retention with `DB_BACKUP_RETENTION` in `.env.local`

## Database migration planning

The local development database is still `backend/data/db.json`. Before serious public usage, migrate to a managed database such as Postgres.

Migration planning files:

- Deployment checklist: `docs/deployment-checklist.md`
- Schema map: `docs/database-schema.md`
- Supabase/Postgres production guide: `docs/supabase-production.md`
- SQL migrations: `backend/sql/migrations`
- Migration scaffold: `scripts/migrate-json-to-postgres.mjs`

Useful commands:

- Inspect current JSON collections: `npm run db:migrate:plan`
- Generate reviewable SQL seed output: `npm run db:migrate:sql`
- Generate normalized SQL for the production schema: `npm run db:migrate:normalized`
- Apply schema to configured Postgres: `npm run db:postgres:schema`
- Seed categories and demo admin: `npm run db:postgres:seed`
- Import latest normalized migration to configured Postgres: `npm run db:postgres:import`
- Check Postgres connection/schema/adapter readiness: `npm run db:postgres:check`
- Print schema path: `npm run db:schema:path`

The migration script can generate two kinds of SQL:

- Generic staging SQL using JSON payload rows for low-risk inspection.
- Normalized SQL targeting the production migration tables in `backend/sql/migrations`.

Review generated SQL before applying it to Postgres. The app runtime remains unchanged while `DB_PROVIDER=json`.

Generated migration SQL files are ignored by Git because they can contain real local user data, email addresses, and password hashes.

Postgres adapter files:

- `backend/dbPostgres.js`
- `backend/dbProvider.js`

The adapter is inactive during local JSON development. It becomes active only when `DB_PROVIDER=postgres` and `DATABASE_URL` are configured.

`backend/dbProvider.js` selects the active database backend from `DB_PROVIDER`. Local development continues to use JSON. For production, apply the migrations in `backend/sql/migrations`, seed the reference data, import the reviewed normalized migration SQL into staging, set `DB_PROVIDER=postgres`, and run a full smoke test before switching live traffic.

You can check the active backend without exposing secrets:

```powershell
Invoke-RestMethod http://127.0.0.1:4000/api/health
```

When a staging Postgres database is ready, run:

```powershell
npm run db:migrate:normalized
npm run db:postgres:schema
npm run db:postgres:seed
npm run db:postgres:import
npm run db:postgres:check
```

These commands generate a fresh normalized migration file, apply the schema, seed categories and the demo admin, import the latest migration, and verify `DB_PROVIDER=postgres`, `DATABASE_URL`, required tables, and adapter reads without printing the database URL.
