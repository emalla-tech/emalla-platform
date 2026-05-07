# E-Malla Rwanda Database Migration Plan

This document maps the current local JSON database to a production-ready relational database such as Postgres.

The current development database is:

- `backend/data/db.json`

The recommended production database is:

- Postgres on Railway, Render, Supabase, Neon, or another managed provider

## Migration Goals

- Keep local development working with JSON while production moves to Postgres.
- Preserve all existing users, products, orders, applications, logs, settings, and finance data.
- Avoid changing frontend behavior during the migration.
- Migrate in small, reversible steps.

## Core Tables

### users

Stores all platform accounts: admin, buyer, seller, and rider.

Recommended columns:

- `id` text primary key
- `name` text
- `username` text unique nullable
- `email` text unique
- `password` text
- `role` text
- `status` text
- `phone` text nullable
- `avatar` text nullable
- `must_change_password` boolean default false
- `last_login_at` timestamptz nullable
- `created_at` timestamptz
- `updated_at` timestamptz
- `metadata` jsonb default '{}'

### products

Stores seller products and approval status.

Recommended columns:

- `id` text primary key
- `merchant_id` text references users(id)
- `name` text
- `description` text
- `specifications` text nullable
- `category` text
- `price` numeric
- `stock` integer
- `image` text nullable
- `images` jsonb default '[]'
- `status` text
- `featured` boolean default false
- `rating` numeric default 0
- `reviews` integer default 0
- `created_at` timestamptz
- `updated_at` timestamptz
- `metadata` jsonb default '{}'

### orders

Stores buyer orders and delivery workflow.

Recommended columns:

- `id` text primary key
- `order_number` text unique
- `user_id` text references users(id)
- `merchant_id` text nullable references users(id)
- `rider_id` text nullable references users(id)
- `status` text
- `payment_status` text
- `payment_method` text
- `items` jsonb default '[]'
- `shipping_address` jsonb default '{}'
- `subtotal` numeric
- `delivery_fee` numeric
- `total` numeric
- `notes` text nullable
- `created_at` timestamptz
- `updated_at` timestamptz
- `metadata` jsonb default '{}'

### seller_applications

Stores seller onboarding applications.

Recommended columns:

- `id` text primary key
- `business_name` text
- `category` text
- `email` text
- `phone` text
- `logo_url` text nullable
- `supporting_document_url` text nullable
- `status` text
- `merchant_id` text nullable references users(id)
- `temporary_username` text nullable
- `rejected_reason` text nullable
- `created_at` timestamptz
- `updated_at` timestamptz
- `approved_at` timestamptz nullable
- `rejected_at` timestamptz nullable
- `metadata` jsonb default '{}'

Security note: do not persist temporary passwords in this table.

### rider_applications

Stores rider onboarding applications.

Recommended columns:

- `id` text primary key
- `name` text
- `email` text
- `phone` text
- `vehicle_number` text
- `status` text
- `rider_id` text nullable references users(id)
- `temporary_username` text nullable
- `rejected_reason` text nullable
- `created_at` timestamptz
- `updated_at` timestamptz
- `approved_at` timestamptz nullable
- `rejected_at` timestamptz nullable
- `metadata` jsonb default '{}'

Security note: do not persist temporary passwords in this table.

### sessions

Stores login sessions and security review state.

Recommended columns:

- `id` text primary key
- `token_hash` text unique
- `user_id` text references users(id)
- `created_at` timestamptz
- `last_seen_at` timestamptz
- `revoked_at` timestamptz nullable
- `user_agent` text nullable
- `reviewed_at` timestamptz nullable
- `reviewed_by` text nullable
- `review_notes` text nullable
- `metadata` jsonb default '{}'

### auth_tokens

Stores active login tokens needed by the current backend auth flow.

Recommended columns:

- `token` text primary key
- `user_id` text references users(id)
- `created_at` timestamptz
- `metadata` jsonb default '{}'

### password_reset_tokens

Stores temporary forgot-password reset tokens.

Recommended columns:

- `id` text primary key
- `token` text unique
- `user_id` text references users(id)
- `expires_at` timestamptz
- `created_at` timestamptz
- `metadata` jsonb default '{}'

### transactions

Stores payouts and finance transaction records.

Recommended columns:

- `id` text primary key
- `user_id` text nullable references users(id)
- `amount` numeric
- `status` text
- `method` text
- `tx_ref` text
- `timestamp` timestamptz
- `metadata` jsonb default '{}'

### inquiries

Stores public contact and investor inquiries.

Recommended columns:

- `id` text primary key
- `type` text
- `name` text
- `email` text
- `subject` text nullable
- `company` text nullable
- `message` text
- `status` text
- `assigned_to` text nullable
- `internal_notes` text nullable
- `replied_at` timestamptz nullable
- `created_at` timestamptz
- `updated_at` timestamptz
- `metadata` jsonb default '{}'

### audit_logs

Stores operational audit events.

Recommended columns:

- `id` text primary key
- `event` text
- `actor` text
- `category` text
- `status` text
- `time` timestamptz
- `metadata` jsonb default '{}'

### email_logs

Stores email delivery records.

Recommended columns:

- `id` text primary key
- `to_addresses` jsonb
- `subject` text
- `template` text nullable
- `body` text nullable
- `html` text nullable
- `sent_at` timestamptz
- `status` text
- `provider` text
- `provider_message_id` text nullable
- `error` text nullable
- `note` text nullable
- `metadata` jsonb default '{}'

### addresses

Stores buyer delivery addresses.

Recommended columns:

- `id` text primary key
- `user_id` text references users(id)
- `name` text
- `district` text
- `sector` text
- `street` text
- `is_default` boolean default false
- `created_at` timestamptz
- `updated_at` timestamptz

### wishlists

Stores buyer wishlists.

Recommended columns:

- `id` text primary key
- `user_id` text references users(id)
- `product_id` text references products(id)
- `created_at` timestamptz

### admin_settings

Stores platform settings.

Recommended columns:

- `id` text primary key default 'platform'
- `preferences` jsonb default '{}'
- `category_commission_rates` jsonb default '{}'
- `updated_at` timestamptz
- `updated_by` text nullable

## Safe Migration Order

1. Create Postgres schema.
2. Run `npm run db:migrate:plan` locally to inspect the JSON collections.
3. Run `npm run db:migrate:sql` to generate SQL seed output.
4. Review generated SQL before applying it.
5. Import SQL into staging Postgres.
6. Add a Postgres adapter behind the existing `readDb` and `writeDb` interface.
7. Test staging end-to-end.
8. Switch production environment to `DB_PROVIDER=postgres`.

## Adapter Scaffold

The repository includes a safe scaffold for future Postgres support:

- `backend/dbPostgres.js`
- `docs/postgres-schema.sql`
- `scripts/create-postgres-schema.sql`

This scaffold does not change runtime behavior yet. The current backend still uses `backend/db.js` and `backend/data/db.json` until the Postgres adapter is fully implemented and explicitly enabled.

The scaffold is intentionally protective:

- It reports whether `DB_PROVIDER=postgres` and `DATABASE_URL` are configured.
- It throws clear errors if someone tries to use the adapter before normalized read/write queries are implemented.
- It avoids silently switching production to an incomplete database layer.

## Production Environment

Add these values in production only:

```env
DB_PROVIDER=postgres
DATABASE_URL=postgresql://user:password@host:5432/emalla
```

Local development can keep:

```env
DB_PROVIDER=json
```
