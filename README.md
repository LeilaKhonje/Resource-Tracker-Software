# Resource Tracker API

## Authentication and roles

The API provides administrator-managed account creation and `POST /auth`.
Only the System Admin can create accounts. New accounts are active immediately
with the business role specified during creation. The database enforces at
most one System Admin and at most one Managing Director.

Passwords are stored as bcrypt hashes with a cost factor of 12. Login returns
an `accessToken`. The one-hour
bearer token contains the user's ID, email, and role.

Set `JWT_SECRET` to a random value of at least 16 characters before starting
the application. Database connection settings are `DB_CONNECTION`, `DB_HOST`,
`DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_DATABASE`.

## Set up the System Admin account

Set these values in the ignored `.env` file before running the seed:

```env
SYSTEM_ADMIN_EMAIL=admin@example.com
SYSTEM_ADMIN_FULL_NAME=Project System Admin
SYSTEM_ADMIN_PASSWORD=Choose9Safe
```

The seed creates a System Admin account only when neither that email nor a
System Admin account already exists. If either exists, it stops without
changing any account. Keep the `.env` file and credentials out of version
control.

For local development, start the database and run the seed from the project
directory:

```bash
npm run seed:system-admin
```

Before starting a new deployment, start MySQL and run the reviewed database
migrations in a one-off app container. The initial migration creates the
application tables for an empty database; subsequent migrations apply schema
changes such as changing `users.role` to
nullable `VARCHAR(32)` when needed, preserving existing role values and leaving
the generated unique-role columns in place. The API has TypeORM synchronization
disabled; it will not apply migrations automatically at startup.

```bash
docker compose up -d mysql
docker compose build app
docker compose run --rm app npm run migration:run
docker compose run --rm app npm run seed:system-admin
docker compose up -d --no-build app
```

The app container uses the same `.env` and Compose network as the API; set
`DB_HOST=mysql` for Compose. The migration runner records applied migrations in
`typeorm_migrations`. The seed is intended for initial provisioning; it does
not reset an existing administrator's password. Log in through
`POST /api/v1/auth` using the seeded email and password.

If the API repeatedly reports that it cannot connect to MySQL, check
`docker compose logs mysql` for the database-side error and make sure
`DB_USERNAME`, `DB_PASSWORD`, and `DB_DATABASE` in `.env` match
`MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE` in `docker-compose.yml`.
The `mysql_data` volume retains database users and passwords from its initial
creation, so changing Compose environment values does not update an existing
database automatically.

MySQL is available to host applications on port `3307` by default, avoiding
conflicts with a local MySQL server already using `3306`. Set `DB_HOST_PORT`
in `.env` to another available host port if needed. The API container still
connects to the MySQL service on its internal port `3306`.

## Account and role management

The System Admin creates an active account with `POST /users`, specifying the
user's business role and initial password, then provides the user their email
and initial password outside the system through a secure channel.
The user can keep that password or log in and change it through
`PATCH /users/me` with `{"action":"change_password", ...}`. The password is stored only as a bcrypt hash and
is never returned by the API. Account creation, deactivation, reactivation,
and role changes are recorded in the audit log.

Account creation body:

```json
{
  "fullName": "Alex Morgan",
  "email": "alex@company.com",
  "role": "TEAM_MEMBER",
  "initialPassword": "Temp1234"
}
```

The System Admin role can only be assigned by the bootstrap seed. The Managing
Director role can be assigned during account creation only when no Managing
Director account already exists.

Account changes use `PATCH /users/:id` with one action per request. For example,
send `{"action":"deactivate"}`, `{"action":"reactivate"}`, or
`{"action":"assign_role","role":"TEAM_LEAD"}`. Reactivation is allowed
only for a deactivated account. Department heads can assign `TEAM_LEAD`.
Managing Directors can assign
`LINE_MANAGER` and `DEPARTMENT_HEAD`. The System Admin can assign business
roles, including the Managing Director role, but cannot assign another System
Admin. The System Admin role is assigned only by the bootstrap seed.

Protect resource endpoints with `JwtAuthGuard` and apply `@Roles(...)` with
`RolesGuard` to enforce role-specific access. A valid token is sent as
`Authorization: Bearer <accessToken>`.

## Feature and endpoint guide

The endpoint summaries below describe the handlers currently implemented in
the controllers. Unless stated otherwise, request bodies are JSON. Validation
errors from the global validation pipe normally return `400 Bad Request` with
the invalid fields. Database or service failures may also return an error
response. Paths below are relative to `/api/v1` unless a full path is shown.

### Authentication

Authentication lets active users log in to receive a bearer token for
protected endpoints. Account creation is limited to `@company.com` addresses;
the initial password must be 8–12 characters and contain a number. Users may
change it after logging in.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `POST /auth` | Checks the email and password and returns access and refresh tokens. | `400` invalid input format; `401` email or password is incorrect, or the account has been deactivated. |
| `POST /auth/refresh` | Exchanges a valid refresh token for a new access and refresh token pair. | `401` refresh token is invalid, expired, revoked, or the account is inactive. |
| `POST /auth/logout` | Revokes the supplied refresh token. | `401` refresh token is invalid, expired, or revoked. |
| `POST /auth/forgot-password` | Sends a password reset code to an active account and returns a generic confirmation with the submitted email masked, so the response does not disclose whether an account exists. | `400` invalid email format. |

### Users

Users can view their own profile. System Admins manage account status.
System Admins, Managing Directors, and Department Heads can assign eligible
business roles according to the role rules above.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `POST /users` | System Admin creates an active account from `fullName`, `email`, `role`, and `initialPassword`. The password is not returned. | `400` invalid fields, role, or password; `401` missing/invalid token; `403` caller is not System Admin; `409` email already registered or a Managing Director is already assigned. |
| `GET /users?startDate=<ISO-8601>&endDate=<ISO-8601>` | System Admin or Managing Director lists accounts without credential data. The date filters are optional; if either is supplied, both are required, and the inclusive range filters by creation time. | `400` one date missing, invalid timestamp, or start later than end; `401` missing/invalid token; `403` caller lacks permission. |
| `GET /users/line-managers` | Team Lead lists active Line Managers to choose a recipient for a resource request. Returns `id`, `fullName`, and `email`, ordered by name. | `401` missing/invalid token; `403` caller is not a Team Lead. |

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `GET /users/me` | Returns the authenticated user's ID, name, email, and role. | `401` missing or invalid bearer token; `404` user record no longer exists. |
| `PATCH /users/me` | Performs exactly one action: update profile (`{"action":"update_profile","address":"Lilongwe, Malawi"}`) or change password (`{"action":"change_password","currentPassword":"current123","newPassword":"newSecure456"}`). Profile updates accept one or more of `phoneNumber`, `address`, `dateOfBirth`, and `preferredPronoun`; password changes require both password fields. Fields for the other action are rejected. | `400` invalid action/fields/profile data/password or same password supplied; `401` missing/invalid token or current password is incorrect; `404` user not found. |
| `PATCH /users/:id` | Performs exactly one action: deactivate (`{"action":"deactivate"}`), reactivate (`{"action":"reactivate"}`), or assign a business role (`{"action":"assign_role","role":"TEAM_LEAD"}`). Reactivation requires a deactivated account; deactivation revokes existing tokens. | `400` invalid action/body/role, account already active/deactivated, or self-deactivation attempted; `401` missing/invalid token; `403` caller lacks permission; `404` assigning account or target user not found; `409` Managing Director already assigned. |

### Departments

Departments organize teams, users, and projects. All department routes require
authentication; the allowed roles vary by route.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `POST /departments` | Creates a department (`name`, optional `code`, `description`). | `400` invalid field values; database constraint errors may occur for duplicate values. |
| `GET /departments` | Lists all departments. | Database errors. |
| `GET /departments/:id` | Returns one department. `:id` is the numeric department ID. | `404` department does not exist or `:id` is not a valid number (the controller converts it to a number before lookup). |
| `GET /departments/:id/users` | Lists users assigned to the department. | `404` department does not exist or `:id` is not a valid number; database errors. |
| `GET /departments/:id/teams` | Lists teams assigned to the department. | `404` department does not exist or `:id` is not a valid number; database errors. |
| `GET /departments/:id/projects` | Lists projects linked to teams in the department, including the associated teams. | `404` department does not exist or `:id` is not a valid number; database errors. |
| `GET /departments/:id/resource-requests` | Department Head lists requests for their own department. Although the route also permits Managing Directors, the service currently rejects them. | `401` missing/invalid token; `403` caller is not a Department Head or has no department; `404` department is outside caller's department. |
| `GET /departments/:id/teams/:teamId/projects` | Lists projects assigned to `:teamId`, provided that team belongs to `:id` department. Both path values are numeric IDs. | `404` department does not exist, either ID is not a valid number, or the team does not belong to that department; database errors. |
| `PATCH /departments/:id` | Updates a department's `name`, `code`, or `description`. | `400` invalid field values; `404` department does not exist or `:id` is not a valid number; database constraint errors may occur. |
| `DELETE /departments/:id` | Deletes the department. | `404` department does not exist or `:id` is not a valid number; database constraint errors may occur if related records prevent deletion. |
| `PATCH /departments/:id/assign-head/:userId` | Managing Director assigns an existing Department Head account to the department. | `403` target user is not a Department Head; `404` department or user does not exist. |

### Teams

Teams group staff within a department and connect those staff to projects. Team
routes require authentication; only the Department Head for a team's department
can manage team membership.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `POST /teams` | Creates a team using `name`, `departmentId`, and optional `description`. | `400` invalid input; `404` department does not exist. |
| `GET /teams` | Lists teams with their department information. | Database errors. |
| `GET /teams/unassigned-users?role=TEAM_LEAD` | Department Head lists active Team Leads without a team; `role=TEAM_MEMBER` lists active Team Members, and omitting `role` returns both. | `400` unsupported role filter; `401` missing/invalid token; `403` caller is not a Department Head. |
| `GET /teams/:id` | Returns one team and its department. | `404` team does not exist; `400` malformed numeric ID may be coerced by the service. |
| `GET /teams/:id/users` | Lists users assigned to a team. | `404` team does not exist. |
| `GET /teams/:id/projects` | Lists projects associated with a team. | `404` team does not exist. |
| `GET /teams/:id/resource-requests` | Team Lead or Team Member lists requests for their own team. | `401` missing/invalid token; `403` caller is not assigned to the requested team; `404` team does not exist. |
| `PATCH /teams/:id/team-lead` | Assigns a Team Lead to the team using a `userId` UUID. | `403` caller is not that team's Department Head or target user is not a Team Lead; `404` team or user not found; `409` user belongs to another team. |
| `PATCH /teams/:id` | Updates a team's name, description, or department. | `400` invalid input; `404` team or requested department does not exist. |
| `PATCH /teams/:id/assign-user` | Assigns an active Team Lead or Team Member by UUID; also updates the user's department to the team's department. | `403` target is inactive, has an unsupported role, or caller is not the department head for the team; `404` team or user not found; `409` target already belongs to another team. |
| `DELETE /teams/:id` | Deletes a team. | `404` team does not exist; database constraint errors may occur if related records prevent deletion. |

### Projects

Projects track work and can be associated with teams. The create endpoint
currently allows `teamIds` to be omitted or empty and does not check that
supplied teams belong to the caller's department. All project
routes require a bearer token; creation, update, team assignment, and deletion
are for Department Heads, while Managing Directors can also list and view.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `POST /projects` | Creates a project (`name`, required `startDate` and `endDate`, optional `description` and `teamIds`). Dates use `YYYY-MM-DD`; `endDate` must be on or after `startDate`. | `400` invalid body or date range; `401` missing/invalid token; `403` caller is not a Department Head; `422` a supplied team ID does not exist. |
| `GET /projects` | Lists projects visible to the caller's role and department. | `401` missing/invalid token; `403` caller is not a Department Head or Managing Director, or Department Head has no department. |
| `GET /projects/department/:departmentId` | Managing Director lists projects associated with teams in the specified department. | `401` missing/invalid token; `403` caller is not Managing Director; `400` department ID is not an integer. |
| `GET /projects/:id` | Returns a project visible to the caller. | `400` ID is not an integer; `401` missing/invalid token; `403` caller lacks role/department; `404` project does not exist or is outside the Department Head's department. |
| `PATCH /projects/:id/teams` | Replaces a project's team assignments (`teamIds`). | `400` invalid body or ID; `401` missing/invalid token; `403` wrong role, no department, or cross-department team; `404` project not found; `422` team ID not found or no team remains assigned. |
| `PATCH /projects/:id` | Updates project `name`, `description`, `startDate`, and/or `endDate`. Dates use `YYYY-MM-DD`; the resulting `endDate` must be on or after `startDate`. | `400` invalid ID/body, invalid date range, or no fields supplied; `401` missing/invalid token; `403` wrong role/no department; `404` project does not exist or is outside the caller's department. |
| `GET /projects/:id/team-members?teamId=<id>` | Lists members grouped by team, sorted by team name and then member name. Omit `teamId` for all project teams or provide a team assigned to the project to return just that team. Response includes `projectId`, `projectName`, and `teams: [{ teamId, teamName, members: [{ id, fullName }] }]`. | `400` invalid project/team ID; `401` missing/invalid token; `403` caller lacks role/department; `404` project does not exist or is outside the caller's department, or team is not assigned to the project. |
| `DELETE /projects/:id` | Deletes a project. | `400` ID is not an integer; `401` missing/invalid token; `403` wrong role/no department; `404` project does not exist or is outside the caller's department. |

### Resources

The resources API manages catalog records and stores the count of units represented by each record. Line Managers can allocate units to a team member and project, record returns and transfers, and review movement history. A resource has status `AVAILABLE` when it has no active allocations and `ASSIGNED` when one or more units are actively allocated. Available quantity is still checked against recorded quantity minus active allocations. Creating resources requires a Managing Director; listing, viewing, and updating routes currently do not declare authentication guards. Resource IDs are UUIDs. The returned fields depend on the resource `type`:

- `insourced`: `id`, `name`, `type`, `status`, `description`, `departmentName`, `quantity`, `createdAt`, `updatedAt`
- `outsourced`: `id`, `name`, `type`, `status`, `price`, `label`, `batchNumber`, `vendor`, `createdAt`, `updatedAt`

| Method and path | Request | What it does | Possible errors |
| --- | --- | --- | --- |
| `POST /resources` | Managing Director bearer token and JSON resource object; see examples below. | Creates a catalog resource. `type` is `insourced` or `outsourced`; insourced requires `description` and an existing `departmentName`, outsourced requires `price`, `label`, `batchNumber`, and `vendor`. Quantity must be at least 1. | `400` invalid or conflicting type-specific fields; `401` missing/invalid token; `403` caller is not Managing Director; `404` department not found; database errors. |
| `GET /resources?name=lap&type=insourced` | Optional `name` substring and `type` filters. | Lists matching catalog resources, newest first. `name` matching is case-insensitive. | `400` invalid `type`; database errors. |
| `POST /resources/:id/allocations` | Line Manager bearer token; quantity, team, project, assigned user; optional due date and approved request ID. | Assigns available units and records a movement. When linked to a request without an explicit due date, the due date is calculated from the Team Lead's requested duration. The project must be assigned to the team and the active user must belong to that team. | `400` invalid assignment; `401` missing/invalid token; `403` caller is not authorized; `404` referenced record not found; `409` insufficient availability/request quantity. |
| `GET /resources/:id/allocations` | Line Manager bearer token. | Lists active assignments and current holders. | `401` missing/invalid token; `403` caller is not a Line Manager; `404` resource not found. |
| `PATCH /resources/allocations/:allocationId/return` | Line Manager bearer token; optional note. | Marks an assignment returned and records a movement. | `401` missing/invalid token; `403` caller is not a Line Manager; `404` allocation not found; `409` allocation is not active. |
| `PATCH /resources/allocations/:allocationId/transfer` | Line Manager bearer token; destination team, project, and assigned user. | Closes the prior assignment, opens a new assignment, and records the transfer. | `401` missing/invalid token; `403` caller is not a Line Manager; `404` destination/allocation not found; `409` allocation is not active. |
| `GET /resources/:id/movements` | Line Manager bearer token. | Lists allocation, transfer, and return history. | `401` missing/invalid token; `403` caller is not a Line Manager; `404` resource not found. |
| `GET /resources/:id` | `:id` is a resource UUID. | Returns one catalog resource. | `400` malformed UUID; `404` resource not found. |
| `PATCH /resources/:id` | JSON containing one or more editable fields. `type` cannot be changed. | Updates the resource catalog record. Fields belonging to the other resource type are rejected. | `400` malformed UUID or invalid fields; `404` resource not found; database errors. |

Create an insourced resource:

```json
{
  "name": "Laptop",
  "type": "insourced",
  "description": "Standard staff laptop",
  "departmentName": "IT",
  "quantity": 2
}
```

Create an outsourced resource:

```json
{
  "name": "Laptop",
  "type": "outsourced",
  "price": 1200,
  "label": "ThinkPad T14",
  "batchNumber": "LOT-2026-04",
  "vendor": "Example Supplies",
  "quantity": 3
}
```

Example `GET /resources/:id` response for an outsourced resource:

```json
{
  "id": "2a24af18-e5ee-4afb-a3f9-c8e99b00128a",
  "name": "Laptop",
  "type": "outsourced",
  "price": 1200,
  "label": "ThinkPad T14",
  "batchNumber": "LOT-2026-04",
  "vendor": "Example Supplies",
  "createdAt": "2026-11-04T10:00:00.000Z",
  "updatedAt": "2026-11-04T10:00:00.000Z"
}
```

### Resource requests

The implemented paths include a repeated prefix because the controller route
prefix and method routes both contain path segments. Use the full paths shown
below: `/resource-requests/api/v1/resource-request...`.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `POST /resource-requests/api/v1/resource-request` | Creates and submits a request; body includes item details, `quantity`, positive integer `expectedDurationDays`, and `teamName`, `projectName`, and `lineManagerName`. Department is derived from the team. | `400` invalid or ambiguous names/fields; `401` missing/invalid token; `403` caller is not a Team Lead; `404` team, project, or active Line Manager not found. |
| `GET /resource-requests/api/v1/resource-request` | Lists requests visible to the caller; supports `status` and `teamId` filters. | `400` invalid query; `401` missing/invalid token; `403` unsupported role. |
| `GET /resource-requests/api/v1/resource-request/:id` | Returns one request. Add `?include=audit` to include its request audit trail. | `403` caller cannot view it; `404` request not found. |
| `PATCH /resource-requests/api/v1/resource-request/:id` | Team Lead edits a queried request and may resubmit with `{"status":"SUBMITTED"}`. The assigned Line Manager reviews with `APPROVED`, `REJECTED`, or `QUERIED`; rejection/query requires a `note`. | `400` invalid status/state or missing required fields; `401` missing/invalid token; `403` wrong owner/role/manager; `404` request not found. |

### Reports

Reports summarize approval history, spending, and allocation history, with
optional department and date filters. All report routes require a bearer token
for a System Admin or Managing Director.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `GET /reports/approval-history` | Lists approval decisions, optionally filtered by department and dates. | `400` invalid department ID or date format; database errors if report tables are unavailable. |
| `GET /reports/departmental-spending` | Summarizes approved spending by department, optionally filtered by department and dates. | `400` invalid filters; database errors if report tables are unavailable. |
| `GET /reports/allocation-history` | Lists allocations, optionally filtered by department and dates. | `400` invalid filters; database errors if report tables are unavailable. |
| `GET /reports/department/:departmentId` | Combines approvals, spending, and allocations for one department. | `400` invalid department ID or filters; database errors if report tables are unavailable. |
| `GET /reports/organization` | Combines organization-wide approvals, spending, and allocations. | `400` invalid date or department filter; database errors if report tables are unavailable. (The implementation ignores the department filter for this aggregate.) |

### Dashboard

The dashboard routes currently do not declare authentication guards.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `GET /dashboard` | Returns the dashboard data, optionally limited to `departmentId`. | `500` invalid department ID currently throws a generic error; database errors if source tables are unavailable. |
| `GET /dashboard/departments` | Returns the department list used by the dashboard. | Database errors if source tables are unavailable. |
| `GET /dashboard/departments/:departmentId` | Returns dashboard details for the specified department. | `400` department ID is not an integer; database errors if source tables are unavailable. |

### Notifications

Notifications deliver messages to users and let clients retrieve, mark, and
delete them. The controller currently does not declare authentication guards.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `GET /notifications/me` | Returns notifications for the current request's user. | `400` request has no authenticated `user` attached; database errors. |
| `GET /notifications/users/:id` | Returns notifications for the user ID in the path. | Database errors. |
| `PATCH /notifications/:id/read` | Marks the notification as read for the `userId` in the JSON body. | `400` missing notification ID or `userId`; `404` notification not found for that user. |
| `POST /notifications` | Creates a notification using `userId` and `message`. | `400` missing userId/message or invalid ID; database errors. |
| `DELETE /notifications/users/:userId/notifications/:notificationId` | Deletes a notification belonging to the supplied user. | `404` notification not found for that user; database errors. |

### Audit logs

Audit logs provide a history of recorded system actions for review. Both routes
require a bearer token for a System Admin, Department Head, or Managing Director.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `GET /audit-logs` | Lists all audit log records. | Database errors. |
| `GET /audit-logs/record/:entityType/:entityId` | Lists audit records associated with an entity type and record ID. | `400` entity ID is not an integer; database errors. |

## Error response notes

NestJS errors generally include a status code and message. Authentication
failures are `401 Unauthorized`, role guard failures are `403 Forbidden`,
missing records are usually `404 Not Found`, and invalid request values are
usually `400 Bad Request`. Some older controllers do not use typed ID pipes,
and some service methods do not check for missing records; for those routes,
invalid IDs may instead produce an empty result or a server/database error.
