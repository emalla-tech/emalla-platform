# E-Malla Rwanda Deployment Checklist

Use this checklist before switching public traffic to E-Malla Rwanda.

## 1. Platform split

- Frontend: Vercel
- Backend API: Render or Railway
- Database: Supabase Postgres
- Email: Resend
- Storage: Cloudinary
- DNS / SSL: Cloudflare or registrar-managed DNS with HTTPS enabled

## 2. Frontend deployment setup

- `vercel.json` is present with SPA rewrites to `index.html`
- Vercel framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Frontend env vars:
  - `VITE_API_URL=https://api.yourdomain.com/api`
  - `VITE_PUBLIC_APP_URL=https://yourdomain.com/#`

## 3. Backend deployment setup

- Start command: `npm run start:prod`
- Health endpoint: `/api/health`
- Node version: `22+`
- Backend env vars:
  - `NODE_ENV=production`
  - `DB_PROVIDER=postgres`
  - `DATABASE_URL`
  - `PUBLIC_APP_URL`
  - `CORS_ALLOWED_ORIGINS`
  - `JWT_SECRET`
  - `SESSION_SECRET`
  - `EMAIL_PROVIDER=resend`
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
  - `STORAGE_PROVIDER=cloudinary`
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `CLOUDINARY_UPLOAD_FOLDER`

## 4. Validation commands

Run these before launch:

```powershell
npm run env:check
npm run db:postgres:check
npm run email:check
npm run storage:check
npm run build
```

## 5. Database readiness

- Apply schema:

```powershell
npm run db:postgres:schema
npm run db:postgres:seed
npm run db:postgres:import
```

- Confirm `/api/health` reports:
  - `database.provider=postgres`
  - `database.mode=postgres`
  - `email.liveDeliveryReady=true` when Resend is live
  - `storage.liveReady=true` when Cloudinary is live

## 6. Security readiness

- Production backend must not rely on automatic JSON fallback
- `JWT_SECRET` and `SESSION_SECRET` must be long random secrets
- CORS must include only trusted frontend origins
- Rate limiting is active for auth, uploads, and general API usage
- Security headers are present on API responses
- Uploads are restricted to `jpg`, `jpeg`, `png`, `webp`, and PDF only where required

## 7. Final smoke tests

### Buyer flow

- Register
- Verify account / welcome email
- Login
- Browse shop and product details
- Add to cart
- Checkout with available payment methods
- View orders
- Logout

### Seller flow

- Submit seller application
- Admin approves application
- Seller receives approval email
- Seller logs in
- Seller updates settings
- Seller uploads product images
- Seller creates and edits product

### Rider flow

- Submit rider application
- Admin approves application
- Rider receives approval email
- Rider logs in
- Rider updates phone, wallet, vehicle number, emergency contact
- Rider sees assigned deliveries and earnings

### Admin flow

- Login through `/#/admin`
- Review seller applications
- Review rider applications
- Review products
- Manage sellers and riders
- Open finance, audit logs, settings, and operational sections

### Cross-cutting checks

- Cloudinary upload returns hosted URL
- Resend emails arrive in a real inbox
- Protected dashboard routes reject unauthorized users
- Firefox and Chrome both load public pages correctly

## 8. Cutover

1. Deploy backend to staging
2. Deploy frontend preview to Vercel
3. Run smoke tests against staging
4. Point production frontend to production API
5. Enable DNS / HTTPS
6. Run one final `/api/health` check
7. Announce launch internally

## 9. Immediate post-launch checks

- Confirm backend logs are clean
- Confirm one real product image upload lands in Cloudinary
- Confirm one real email is sent through Resend
- Confirm one live order moves through buyer -> seller -> rider -> admin visibility
