# Resource Tracker API

## Authentication and roles

The API provides `POST /users/register` and `POST /auth/login`. Registration
accepts `firstName`, `lastName`, `email`, and a password. New accounts have no
role until an authorized user assigns one. Public registration cannot choose a
role. The database enforces that at most one account has the Managing Director
role.

Passwords are stored as bcrypt hashes with a cost factor of 12. Registration
returns a public user object; login returns an `accessToken`. The one-hour
bearer token contains the user's ID, email, and role.

Set `JWT_SECRET` to a random value of at least 16 characters before starting
the application. Database connection settings are `DB_CONNECTION`, `DB_HOST`,
`DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_DATABASE`. Never accept role
changes from public registration input.

## Set up the Managing Director account

Set these values in the ignored `.env` file before running the seed:

```env
MANAGING_DIRECTOR_EMAIL=director@example.com
MANAGING_DIRECTOR_FULL_NAME=Project Managing Director
MANAGING_DIRECTOR_PASSWORD=choose-a-strong-password
```

The seed hashes the password and creates the account with the Managing Director
role. It is safe to rerun for the same email: it updates that account's name,
password hash, and role. If another account currently has that role, the seed
clears the old assignment and transfers it to the configured email in the same
database transaction. Keep the `.env` file and credentials out of version
control, and give the grader the credentials through the agreed private channel.

For local development, start the database and run the seed from the project
directory:

```bash
npm run seed:managing-director
```

With Docker Compose, start MySQL and then run the seed in a one-off app
container:

```bash
docker compose up -d mysql
docker compose run --rm app npm run seed:managing-director
```

The app container uses the same `.env` and Compose network as the API. Once the
seed succeeds, start the API with `docker compose up -d app` or
`npm run start:prod` as appropriate. Log in through `POST /auth/login` using
the seeded email and password.

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

## Role assignment

Department heads can assign `team_lead` through `PATCH /users/:id/role` with a
JSON body such as `{"role":"team_lead","teamId":1}`. The Managing Director
can assign `line_manager` and `department_head`. The Managing Director role
cannot be assigned or changed through this endpoint.

Protect resource endpoints with `JwtAuthGuard` and apply `@Roles(...)` with
`RolesGuard` to enforce role-specific access. A valid token is sent as
`Authorization: Bearer <accessToken>`.

## Feature and endpoint guide

The endpoint summaries below describe the handlers currently implemented in
the controllers. Unless stated otherwise, request bodies are JSON. Validation
errors from the global validation pipe normally return `400 Bad Request` with
the invalid fields. Database or service failures may also return an error
response.

### Authentication

Authentication lets users register an account and log in to receive a bearer
token for protected endpoints. Registration is limited to `@company.com`
addresses, requires a password of 8–12 characters with a number, and does not
set a role.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `POST /auth/login` | Checks the email and password and returns an access token. | `400` invalid input format; `401` email or password is incorrect. |
| `POST /auth/forgot-password` | Accepts an email and returns a generic password reset request message to avoid disclosing whether an account exists. Email delivery and reset-token handling are not configured yet. | `400` invalid email format. |

### Users

Users can register, view their own profile, and deactivate/reactivate their account.
Authorized Managing Directors and Department Heads can assign eligible roles.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `POST /users/register` | Creates an account from `firstName`, `lastName`, `email`, and `password`, and returns the public user object. | `400` invalid email, non-company email, missing fields, or password rules not met; `409` email already registered. |

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `GET /users/me` | Returns the authenticated user's ID, name, email, and role. | `401` missing or invalid bearer token; `404` user record no longer exists. |
| `PATCH /users/me/password` | Changes the authenticated user's password. Body: `{"currentPassword":"current123","newPassword":"newSecure456"}`. The new password must be 8–12 characters and include a number. | `400` invalid new password or same password supplied; `401` missing/invalid token or current password is incorrect; `404` user not found. |
| `PATCH /users/me/deactivate` | Deactivates the authenticated user's account. | `401` missing or invalid token; `404` user not found; `400` account is already deactivated. |
| `PATCH /users/me/reactivate` | Reactivates the authenticated user's account. | `401` missing or invalid token; `404` user not found; `400` account is already active. |
| `PATCH /users/:id/role` | Assigns an allowed role to the user identified by UUID. Body: `{"role":"team_lead"}` (or another supported role). | `400` invalid UUID/body/role, Managing Director role assignment attempted, or assignment violates role rules; `401` missing or invalid token; `403` caller lacks permission; `404` assigning account or target user not found. |

### Departments

Departments organize teams, users, and projects. These controller routes currently
do not declare authentication guards.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `POST /departments` | Creates a department (`name`, optional `code`, `description`). | `400` invalid field values; database constraint errors may occur for duplicate values. |
| `GET /departments` | Lists all departments. | Database errors. |
| `GET /departments/:id` | Returns one department. `:id` is the numeric department ID. | `404` department does not exist or `:id` is not a valid number (the controller converts it to a number before lookup). |
| `GET /departments/:id/users` | Lists users assigned to the department. | `404` department does not exist or `:id` is not a valid number; database errors. |
| `GET /departments/:id/teams` | Lists teams assigned to the department. | `404` department does not exist or `:id` is not a valid number; database errors. |
| `GET /departments/:id/projects` | Lists projects linked to teams in the department, including the associated teams. | `404` department does not exist or `:id` is not a valid number; database errors. |
| `GET /departments/:id/teams/:teamId/projects` | Lists projects assigned to `:teamId`, provided that team belongs to `:id` department. Both path values are numeric IDs. | `404` department does not exist, either ID is not a valid number, or the team does not belong to that department; database errors. |
| `PATCH /departments/:id` | Updates a department's `name`, `code`, or `description`. | `400` invalid field values; `404` department does not exist or `:id` is not a valid number; database constraint errors may occur. |
| `DELETE /departments/:id` | Deletes the department. | `404` department does not exist or `:id` is not a valid number; database constraint errors may occur if related records prevent deletion. |

### Teams

Teams group staff within a department and connect those staff to projects. These
routes currently do not declare authentication guards.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `POST /teams` | Creates a team using `name`, `departmentId`, and optional `description`. | `400` invalid input; `404` department does not exist. |
| `GET /teams` | Lists teams with their department information. | Database errors. |
| `GET /teams/:id` | Returns one team and its department. | `404` team does not exist; `400` malformed numeric ID may be coerced by the service. |
| `GET /teams/:id/users` | Lists users assigned to a team. | `404` team does not exist. |
| `GET /teams/:id/projects` | Lists projects associated with a team. | `404` team does not exist. |
| `PATCH /teams/:id` | Updates a team's name, description, or department. | `400` invalid input; `404` team or requested department does not exist. |
| `DELETE /teams/:id` | Deletes a team. | `404` team does not exist; database constraint errors may occur if related records prevent deletion. |

### Projects

Projects track work and can be associated with a department head's teams.
Every project must have at least one team from that department. All project
routes require a bearer token; creation, update, team assignment, and deletion
are for Department Heads, while Managing Directors can also list and view.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `POST /projects` | Creates a project (`name`, optional `description`, and `teamIds`). | `400` invalid body; `401` missing/invalid token; `403` caller has wrong role, no department, or team belongs to another department; `422` no team supplied or a team ID does not exist. |
| `GET /projects` | Lists projects visible to the caller's role and department. | `401` missing/invalid token; `403` caller is not a Department Head or Managing Director, or Department Head has no department. |
| `GET /projects/:id` | Returns a project visible to the caller. | `400` ID is not an integer; `401` missing/invalid token; `403` caller lacks role/department; `404` project does not exist or is outside the Department Head's department. |
| `PATCH /projects/:id/teams` | Replaces a project's team assignments (`teamIds`). | `400` invalid body or ID; `401` missing/invalid token; `403` wrong role, no department, or cross-department team; `404` project not found; `422` team ID not found or no team remains assigned. |
| `PATCH /projects/:id` | Updates project `name` and/or `description`. | `400` invalid ID/body or no fields supplied; `401` missing/invalid token; `403` wrong role/no department; `404` project does not exist or is outside the caller's department. |
| `GET /projects/:id/team-members` | Lists names and team details for members of the project's teams. | `400` ID is not an integer; `401` missing/invalid token; `403` caller lacks role/department; `404` project does not exist or is outside the caller's department. |
| `DELETE /projects/:id` | Deletes a project. | `400` ID is not an integer; `401` missing/invalid token; `403` wrong role/no department; `404` project does not exist or is outside the caller's department. |

### Resource requests

Resource requests represent a team's request for an item or service, with
submission, review, and status tracking handled by the request service. The
service contains these operations, but `ResourcerequestController` currently
has no route handlers, so there are no `/resourcerequest` endpoints available
through HTTP yet. When exposed, service-level errors include `400` for edits to
requests that are not drafts/queried, incomplete submission, or invalid review
decisions; `403` for ownership, role, or access violations; and `404` when the
request ID does not exist.

### Resource allocations

Resource allocations record quantities assigned to requests. The current
service keeps allocations in memory, so they reset when the application
restarts. These routes currently do not declare authentication guards.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `GET /resource-allocation` | Lists allocations held in memory. | No service-level error is defined. |
| `GET /resource-allocation/:id` | Returns one allocation. | `400` ID is not an integer; `404` allocation does not exist. |
| `POST /resource-allocation` | Creates an allocation from positive integer `requestId`, `resourceId`, and `quantityAllocated`. | `400` invalid fields or allocated quantity is not greater than zero. |

### Reports

Reports summarize approval history, spending, and allocation history, with
optional department and date filters. These routes currently do not declare
authentication guards.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `GET /reports/approval-history` | Lists approval decisions, optionally filtered by department and dates. | `400` invalid department ID or date format; database errors if report tables are unavailable. |
| `GET /reports/departmental-spending` | Summarizes approved spending by department, optionally filtered by department and dates. | `400` invalid filters; database errors if report tables are unavailable. |
| `GET /reports/allocation-history` | Lists allocations, optionally filtered by department and dates. | `400` invalid filters; database errors if report tables are unavailable. |
| `GET /reports/department/:departmentId` | Combines approvals, spending, and allocations for one department. | `400` invalid department ID or filters; database errors if report tables are unavailable. |
| `GET /reports/organization` | Combines organization-wide approvals, spending, and allocations. | `400` invalid date or department filter; database errors if report tables are unavailable. (The implementation ignores the department filter for this aggregate.) |

### Dashboard

The dashboard gives summary counts, recent activity, and spending totals for
the resource tracker. These routes currently do not declare authentication
guards.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `GET /dashboard` | Returns the dashboard data, optionally limited to `departmentId`. | `500` invalid department ID currently throws a generic error; database errors if source tables are unavailable. |
| `GET /dashboard/summary` | Returns summary metrics, optionally limited to `departmentId`. | `500` invalid department ID currently throws a generic error; database errors if source tables are unavailable. |
| `GET /dashboard/recent-activity?limit=10` | Returns recent activity, with an optional integer `limit`. | `400` limit is not an integer; database errors if source tables are unavailable. |
| `GET /dashboard/department-spending` | Returns spending totals grouped by department. | Database errors if source tables are unavailable. |

### Notifications

Notifications deliver messages to users and let clients retrieve, mark, and
delete them. The controller currently does not declare authentication guards.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `GET /notifications` | Returns notifications for the current request's user. | `500` request has no authenticated `user` attached; database errors. |
| `GET /notifications/:id` | Returns notifications for the user ID in the path. | `400` ID is not an integer; database errors. |
| `PATCH /notifications/read/:id` | Marks a notification as read for the supplied `userId`. | `400` invalid ID or missing `userId`; database errors. |
| `PATCH /notifications/:id/read` | Despite the route name, this handler currently returns notifications for the path ID; it does not mark one as read. | `400` ID is not an integer; database errors. |
| `POST /notifications` | Creates a notification using `userId` and `message`. | `400` missing userId/message or invalid ID; database errors. |
| `DELETE /notifications/:userId/:notificationId` | Deletes a notification belonging to the supplied user. | `400` either ID is not an integer; database errors. |

### Audit logs

Audit logs provide a history of recorded system actions for review. These
routes currently do not declare authentication guards.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `GET /audit-logs` | Lists all audit log records. | Database errors. |
| `GET /audit-logs/record/:entityType/:entityId` | Lists audit records associated with an entity type and record ID. | `400` entity ID is not an integer; database errors. |

### Line manager review

The line manager dashboard shows request totals and lets a line manager review,
approve, or reject requests. These controller routes currently do not declare
authentication guards.

| Method and path | What it does | Possible errors |
| --- | --- | --- |
| `GET /line-manager/overview` | Returns counts by request status. | Database errors. |
| `GET /line-manager/requests?status=...` | Lists requests, optionally filtered by allocation status. | Invalid status may be rejected by validation if enabled for the query; database errors. |
| `GET /line-manager/requests/:id` | Intended to return request details. | Currently throws a generic unimplemented error (`500`). |
| `PATCH /line-manager/requests/:id/review` | Marks a request as queried for follow-up. | Database errors; ID conversion/update failures. |
| `PATCH /line-manager/requests/:id/approve` | Marks a request approved. | Database errors; ID conversion/update failures. |
| `PATCH /line-manager/requests/:id/reject` | Marks a request rejected; DTO expects a `reason`. | `400` invalid/missing reason when DTO validation is applied; database errors; ID conversion/update failures. |

## Error response notes

NestJS errors generally include a status code and message. Authentication
failures are `401 Unauthorized`, role guard failures are `403 Forbidden`,
missing records are usually `404 Not Found`, and invalid request values are
usually `400 Bad Request`. Some older controllers do not use typed ID pipes,
and some service methods do not check for missing records; for those routes,
invalid IDs may instead produce an empty result or a server/database error.
