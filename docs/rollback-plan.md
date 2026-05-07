# E-Malla Rwanda Rollback Plan

Use this plan if a production deployment introduces user-facing errors or operational risk.

## Trigger conditions

Rollback immediately if any of these happen:

- `/api/health` fails
- buyer login/register fails
- checkout fails
- admin dashboard becomes inaccessible
- Cloudinary uploads fail consistently
- Postgres connectivity fails and production traffic is impacted

## Rollback order

### 1. Frontend rollback

- Roll back the Vercel deployment to the last known good build
- Confirm public pages and login screens recover

### 2. Backend rollback

- Roll back Render or Railway service to the last stable release
- Confirm `/api/health` becomes healthy again

### 3. Database rollback

- Do not rollback the database blindly
- First assess whether a schema change or data migration caused the failure
- Restore from backup only if data integrity is impacted and rollback is approved

## Safe rollback checks

After rollback, confirm:

- buyer login works
- admin login works
- product listing works
- checkout works
- image uploads work
- email flows are not blocked

## Communication

- Pause new deployments
- Record incident time, detected impact, and rollback version
- Resume deployment work only after root-cause review
