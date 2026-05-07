# E-Malla Rwanda Backup Guide

This guide covers the minimum backup discipline before launch and before major production changes.

## 1. Supabase Postgres backups

- Enable Supabase automated backups on the production project
- Before major schema/import work, create a fresh manual backup or point-in-time snapshot if available
- Keep a written record of:
  - backup timestamp
  - environment
  - operator
  - reason for backup

## 2. Local command helpers

For local JSON development backups:

```powershell
npm run db:backup
```

To restore a local JSON backup:

```powershell
npm run db:restore -- .\\backend\\data\\backups\\db-backup-YYYY-MM-DDTHH-MM-SS-sssZ.json
```

## 3. Before production cutover

Take backups before:

- applying Postgres schema updates
- importing migration data
- resetting admin credentials
- changing storage/email providers
- large catalog imports

## 4. What to verify in a backup plan

- database can be restored
- admin credentials recovery path is known
- product records and image URLs are present
- seller and rider applications are included
- orders and payments are included

## 5. Admin recovery

If admin access is lost in a maintenance window, use:

```powershell
$env:ADMIN_RESET_PASSWORD='NewStrongPassword#2026'
npm run admin:reset-password -- --email admin@emalla.rw
```

Then log in and change the password again from the dashboard.
