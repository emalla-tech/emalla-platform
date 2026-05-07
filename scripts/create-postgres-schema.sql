-- E-Malla Rwanda production Postgres schema
-- Apply to staging first from the repository root:
-- psql "$DATABASE_URL" -f scripts/create-postgres-schema.sql

\i backend/sql/migrations/001_initial_supabase_schema.sql
\i backend/sql/migrations/002_seed_reference_data.sql
