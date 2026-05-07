# E-Malla Rwanda Production Launch

This document is the step-by-step launch runbook for taking E-Malla Rwanda public.

## Pre-launch

1. Confirm Supabase Postgres is healthy.
2. Confirm Resend sender domain is verified.
3. Confirm Cloudinary credentials are live and tested.
4. Confirm frontend and backend environment variables are set.
5. Run:

```powershell
npm run env:check
npm run db:postgres:check
npm run email:check
npm run storage:check
npm run build
```

## Deployment order

### Backend

Deploy backend first on Render or Railway with:

- Start command: `npm run start:prod`
- Health path: `/api/health`
- `NODE_ENV=production`
- `DB_PROVIDER=postgres`

Wait for `/api/health` to return `status=ok`.

### Frontend

Deploy frontend to Vercel with:

- Build command: `npm run build`
- Output directory: `dist`
- `VITE_API_URL=https://api.yourdomain.com/api`
- `VITE_PUBLIC_APP_URL=https://yourdomain.com/#`

## Release smoke tests

Run these checks on the deployed URLs:

- Home page load
- Shop page load
- Buyer register/login/logout
- Seller application
- Rider application
- Admin login
- Product image upload
- Checkout
- Email arrival

## Launch criteria

Launch is approved only when all are true:

- `api/health` is healthy
- Postgres mode is active
- JSON fallback is not active in production
- Images upload to Cloudinary
- Emails send through Resend
- Admin, seller, buyer, and rider flows work

## After launch

- Monitor logs for the first hour
- Place one real order end-to-end
- Verify audit logs, finance summaries, and notifications update
