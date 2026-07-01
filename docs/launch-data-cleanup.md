# Pre-Launch Test Commerce Cleanup

Use this procedure only after confirming that every existing production order is test data.

## Preserved Data

- Users and authentication records
- Seller and rider applications
- Products, stock metadata, and Cloudinary URLs
- Categories, settings, addresses, wishlists, reviews, and support records
- Product upload and security audit records

## Cleaned Data

- Orders, order items, deliveries, payments, and transactions
- Order/payment notifications, audit records, and transactional email logs
- Seller financial totals, rider earnings/delivery totals, and buyer last-order dates
- Stale low-stock alerts created by test checkout activity

Product quantities reserved by active test orders are returned to stock. Cancelled or rejected
orders and orders already marked as restocked are not restored twice.

## Procedure

1. Stop marketing and checkout activity during the maintenance window.
2. Run the read-only preview:

   ```powershell
   npm run launch:cleanup
   ```

3. Review every count and every proposed product stock adjustment.
4. If stock was already corrected manually, rerun with `--skip-stock-restore`.
5. Execute using the required confirmation token:

   ```powershell
   npm run launch:cleanup -- --execute --confirm=RESET_TEST_COMMERCE
   ```

6. Keep the generated `backend/data/backups/launch-cleanup-*.json` file secure.
7. Confirm the script reports zero remaining orders, payments, deliveries, and transactions.
8. Test one new real order end to end before seller onboarding begins.

The execute mode locks commerce tables, writes a backup, and performs the cleanup in one
transaction. Any failure rolls back the database changes.
