# E-Malla Rwanda Supabase Production Setup

This guide prepares E-Malla Rwanda to run its backend on Supabase Postgres without changing the current UI or route behavior.

## Required Environment Variables

Backend:

```env
DB_PROVIDER=postgres
DATABASE_URL=postgresql://postgres:<password>@<host>:6543/postgres
PUBLIC_APP_URL=https://yourdomain.com/#
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ADMIN_BOOTSTRAP_PASSWORD=replace_with_strong_admin_password
ADMIN_ALERT_EMAIL=admin@yourdomain.com
```

Frontend:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

Notes:

- For Supabase, use the pooled or direct Postgres connection string from Project Settings.
- Keep `DATABASE_URL` on the backend only.
- `PUBLIC_APP_URL` must include the `/#` hash fragment used by the current SPA routes.

## Production Schema

Canonical schema migrations live in:

- `backend/sql/migrations/001_initial_supabase_schema.sql`
- `backend/sql/migrations/002_seed_reference_data.sql`

The schema covers:

- `users`
- `seller_profiles`
- `buyer_profiles`
- `rider_profiles`
- `categories`
- `products`
- `product_reviews`
- `orders`
- `order_items`
- `payments`
- `deliveries`
- `support_tickets`
- `notifications`
- `audit_logs`
- plus compatibility/support tables used by the current backend flow

## Migration Steps

1. Create the Supabase project.
2. Copy the Supabase Postgres connection string into `DATABASE_URL`.
3. Set `DB_PROVIDER=postgres`.
4. Apply schema migrations:

```powershell
npm run db:postgres:schema
```

5. Seed categories and the demo admin:

```powershell
npm run db:postgres:seed
```

6. Generate normalized migration SQL from the current JSON database:

```powershell
npm run db:migrate:normalized
```

7. Import the latest generated normalized migration:

```powershell
npm run db:postgres:import
```

8. Verify readiness:

```powershell
npm run db:postgres:check
```

## Backup Instructions

Before importing production data:

1. Export the current local JSON backup:

```powershell
npm run db:backup
```

2. Create a Supabase/Postgres SQL backup before every major import:

```bash
pg_dump "$DATABASE_URL" --format=custom --file emalla-pre-import.dump
```

3. Keep the generated `backend/data/migrations/*.sql` files private because they can contain real platform data.

Recommended recovery pattern:

- Backup local JSON
- Backup Supabase
- Apply schema
- Seed reference data
- Import normalized data
- Run readiness check
- Run smoke tests before switching traffic

## Smoke Test Checklist

After the Postgres switch, verify:

- Buyer registration, login, logout, wishlist, address book, checkout, and order tracking
- Seller application, approval, login, product create/edit, and seller settings
- Rider application, approval, login, rider settings, and delivery workflow
- Admin login, approvals, finance, audit logs, settings, and security sessions
- `/api/health` returns Postgres mode with no critical issues

## Stability Notes

- The frontend does not need route or payload changes for this migration.
- The backend continues to serve the same API shapes while persisting to Postgres.
- Normalized tables such as `order_items`, `deliveries`, and profile tables are populated behind the scenes to keep the app production-ready without breaking the current UI.
