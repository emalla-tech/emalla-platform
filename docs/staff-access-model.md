# E-Malla Staff Access Model

## Roles and Routes

| Role | Workspace | Provisioning |
| --- | --- | --- |
| `ADMIN` | `/admin/dashboard` | Existing protected admin account |
| `LOGISTICS` | `/logistics` | Admin-created staff account only |
| `FINANCE` | `/finance` | Admin-created staff account only |
| `SUPPORT` | `/staff/support` | Admin-created staff account only |

Public registration remains limited to buyer, seller, and rider flows. Staff accounts receive a
temporary password by email and must change it before entering their workspace.

## Access Levels

- `officer`: performs assigned daily operations.
- `manager`: reviews and approves team actions as permission modules are enabled.

The access level is stored in user metadata and is returned as `staffLevel`. A department or
access-level change revokes existing sessions so the user must authenticate with current
permissions.

## Security Boundaries

- Only `ADMIN` can create, update, activate, or suspend staff accounts.
- Suspended accounts cannot sign in, and existing sessions are revoked.
- Staff route guards redirect authenticated users to their own workspace.
- Staff roles do not inherit Admin API access.
- Operational API permissions must be granted endpoint by endpoint in later dashboard phases.
- Account creation and permission changes are written to the security audit log.

## Planned Permission Modules

1. Logistics: dispatch, rider assignment, delivery fee proposals, and delivery incidents.
2. Finance: payment verification, reconciliation, settlements, payouts, and refunds.
3. Support: ticket handling, return initiation, customer communication, and escalation.

Admin retains platform oversight and final override authority. Team modules must preserve
separation of duties between operational preparation and financial approval.
