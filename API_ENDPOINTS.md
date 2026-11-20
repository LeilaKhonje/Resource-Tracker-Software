# Resource Tracker API endpoints

This document describes the HTTP endpoints currently implemented by the NestJS controllers. Unless noted otherwise, JSON request and response bodies are used. The API listens on port `3000` by default; set `PORT` to change it. Interactive Swagger documentation is available at `/api/docs` and its JSON document at `/api/docs-json`.

## Endpoint index

- [Authentication](#authentication--apiv1auth)
- [Users](#users--apiv1users)
- [Resources](#resources--apiv1resources)
- [Resource requests](#resource-requests)
- [Departments](#departments--apiv1departments)
- [Teams](#teams--apiv1teams)
- [Projects](#projects--apiv1projects)
- [Notifications](#notifications--apiv1notifications)
- [Dashboard](#dashboard--apiv1dashboard)
- [Reports](#reports--apiv1reports)
- [Audit logs](#audit-logs--apiv1audit-logs)

## Conventions

- Most endpoints use the `/api/v1` prefix. Replace `{id}` placeholders with the indicated numeric ID or UUID.
- Routes marked **Bearer** require `Authorization: Bearer <accessToken>`. Role restrictions are shown where the controller enforces them.
- Routes without an access label do not declare a JWT/role guard in their controller. Resource listing/view/update routes, notifications, and dashboard routes are currently unguarded; reports and audit-log routes are guarded. `GET /api/v1/notifications/me` still expects the request to contain a user identity.
- The global validation pipe rejects unknown fields and transforms input values where configured. Required and optional fields below follow the endpoint DTOs.
- Successful responses return the created/updated record, an array, or the summary described below. Error responses use NestJS HTTP errors (commonly 400, 401, 403, 404, or 409).
- User roles: `SYSTEM_ADMIN`, `TEAM_LEAD`, `LINE_MANAGER`, `DEPARTMENT_HEAD`, `MANAGING_DIRECTOR`, `TEAM_MEMBER`.

## Authentication — `/api/v1/auth`

### `POST /api/v1/auth`
- **Request:** JSON `{ "email": "alex@company.com", "password": "secure123" }`. Both strings; email must be valid, password must contain a digit and be at most 12 characters.
- **Response:** `200` `{ "accessToken": "…", "refreshToken": "…" }`

### `POST /api/v1/auth/refresh`
- **Request:** JSON `{ "refreshToken": "<JWT>" }`
- **Response:** `200` with a new `{ "accessToken": "…", "refreshToken": "…" }`

### `POST /api/v1/auth/logout`
- **Request:** JSON `{ "refreshToken": "<JWT>" }`
- **Response:** `200` `{ "message": "Logged out successfully" }`; revokes that refresh token.

### `POST /api/v1/auth/forgot-password`
- **Request:** JSON `{ "email": "alex@company.com" }`
- **Response:** `200` `{ "message": "…" }` (accepted without disclosing whether an account exists)

## Users — `/api/v1/users`

### `POST /api/v1/users`
- **Access:** Bearer token; role: `SYSTEM_ADMIN`
- **Request:** `{ "fullName": "Alex Morgan", "email": "alex@company.com", "role": "TEAM_MEMBER", "initialPassword": "Temp1234" }`. Email must end in `@company.com`; password is 8–12 characters and includes a digit. The initial `SYSTEM_ADMIN` role cannot be assigned here.
- **Response:** `201` created account; password is not returned.

### `GET /api/v1/users`
- **Access:** Bearer token; role: `SYSTEM_ADMIN`, `MANAGING_DIRECTOR`
- **Request:** Optional `startDate` and `endDate` query parameters as ISO 8601 timestamps, for example `?startDate=2026-11-01T00:00:00.000Z&endDate=2026-11-11T23:59:59.999Z`. If either is supplied, both are required. Both boundaries are inclusive; `startDate` must be less than or equal to `endDate`.
- **Response:** `200` array of user accounts without credential data.
- **Errors:** `400` one date missing, invalid timestamp, or start later than end; `401` missing/invalid token; `403` caller lacks permission.

### `GET /api/v1/users/line-managers`
- **Access:** Bearer token; role: `TEAM_LEAD`
- **Request:** No body or query parameters.
- **Response:** `200` array of active Line Managers, each with `id`, `fullName`, and `email`, ordered by name. Use `fullName` as `lineManagerName` when creating a resource request.

### `PATCH /api/v1/users/{id}`
- **Access:** Bearer token; role: `SYSTEM_ADMIN`, `MANAGING_DIRECTOR`, `DEPARTMENT_HEAD`; each action still enforces its own role permissions.
- **Request:** Exactly one action per request. Deactivate: `{ "action": "deactivate" }`; reactivate: `{ "action": "reactivate" }`; assign a role: `{ "action": "assign_role", "role": "TEAM_LEAD" }`. `role` is required only for `assign_role`; `SYSTEM_ADMIN` cannot be assigned. Reactivation is allowed only when the account is currently deactivated. The System Admin cannot deactivate their own account.
- **Response:** `200` confirmation for deactivation or reactivation, or the updated user assignment for `assign_role`.
- **Errors:** `400` invalid action/body, invalid role, account already active/deactivated, or self-deactivation; `401` missing/invalid token; `403` caller lacks permission; `404` acting or target user not found; `409` a Managing Director is already assigned.

### `GET /api/v1/users/me`
- **Access:** Bearer token; role: any authenticated user
- **Request:** No body or query parameters.
- **Response:** `200` current profile `{ id, fullName, email, role, department, team }` (some values may be null).

### `PATCH /api/v1/users/me`
- **Access:** Bearer token; role: any authenticated user
- **Request:** Exactly one action per request. Update profile: `{ "action": "update_profile", "address": "Lilongwe, Malawi" }`, with one or more of `phoneNumber` (string, max 30; digits only), `address` (string, max 255), `dateOfBirth` (`YYYY-MM-DD`), and `preferredPronoun` (`Mr.`, `Mrs.`, or `Miss`). Change password: `{ "action": "change_password", "currentPassword": "current123", "newPassword": "newSecure456" }`; both passwords are 8–12 characters and the new password must contain a digit. Profile fields are rejected for password changes, and password fields are rejected for profile updates.
- **Response:** `200` updated profile or password change confirmation.
- **Errors:** `400` invalid action/fields, invalid profile data, or new password matching the current password; `401` missing/invalid token or current password is incorrect; `404` user not found.

## Resources — `/api/v1/resources`

Resource types are `insourced` and `outsourced`. Responses include common fields `id`, `name`, `type`, `status`, `quantity`, `createdAt`, and `updatedAt`, plus type-specific fields. Resource status is `AVAILABLE` when there are no active allocations and `ASSIGNED` when one or more units have an active allocation.

### `POST /api/v1/resources`
- **Access:** Bearer token; role: `MANAGING_DIRECTOR`.
- **Request:** Use `type` to select the resource type. Insourced JSON: `{ "name": "Office laptop", "type": "insourced", "description": "Existing inventory", "departmentName": "Information Technology", "quantity": 1 }`. The department name must match one existing department. Outsourced JSON: `{ "name": "Office laptop", "type": "outsourced", "price": 1250.50, "label": "Dell Latitude 5450", "batchNumber": "LOT-2026-04", "vendor": "Example Supplies Ltd", "quantity": 3 }`. Quantity is an integer of at least 1; outsourced price and vendor are required. Type-specific fields from the other resource type are rejected.
- **Response:** `201` created resource with status `AVAILABLE`. Insourced records include `description` and `departmentName`; outsourced records include `price`, `label`, `batchNumber`, and `vendor`. `401` missing/invalid token; `403` caller is not Managing Director.

### `GET /api/v1/resources`
- **Access:** Bearer token; roles: `DEPARTMENT_HEAD`, `LINE_MANAGER`, or `MANAGING_DIRECTOR`.
- **Request:** Optional query: `name` (case-insensitive substring), `type` (`insourced` or `outsourced`). Use `type` to filter to one resource type; without it, both types are returned. Example: `?name=laptop&type=outsourced`.
- **Response:** `200` matching resource array, newest first; each resource includes its `AVAILABLE` or `ASSIGNED` status.

### `POST /api/v1/resources/{id}/allocations`
- **Access:** Bearer token; role: `LINE_MANAGER`.
- **Request:** `quantity`, `teamId`, `projectId`, and `assignedToUserId`; optional `expectedReturnAt` and approved `requestId`. When allocating against a request, omitting `expectedReturnAt` sets it from the request's `expectedDurationDays`. The project must be assigned to the team, and the active assigned user must belong to that team. A supplied request must be approved, routed to the caller, and match the team and project.
- **Response:** `201` active allocation and an allocation movement event. The server rejects quantities exceeding available stock or the request's unfulfilled quantity.

### `GET /api/v1/resources/{id}/allocations`
- **Access:** Bearer token; role: `LINE_MANAGER`.
- **Response:** `200` active allocations, including current user, team, project, request, allocation date, and return deadline.

### `PATCH /api/v1/resources/allocations/{allocationId}/return`
- **Access:** Bearer token; role: `LINE_MANAGER`.
- **Request:** Optional `note`.
- **Response:** `200` allocation marked returned and a return movement event recorded.

### `PATCH /api/v1/resources/allocations/{allocationId}/transfer`
- **Access:** Bearer token; role: `LINE_MANAGER`.
- **Request:** New `teamId`, `projectId`, and `assignedToUserId`; optional `expectedReturnAt` and `note`.
- **Response:** `200` prior assignment closed, new active assignment created, and transfer movement event recorded.

### `GET /api/v1/resources/{id}/movements`
- **Access:** Bearer token; role: `LINE_MANAGER`.
- **Response:** `200` chronological allocation, transfer, and return events for the resource.

### `GET /api/v1/resources/{id}`
- **Request:** Resource UUID in path.
- **Response:** `200` resource record.

### `PATCH /api/v1/resources/{id}`
- **Request:** Partial JSON body. Any fields applicable to the resource's existing type (same field requirements and validation as create); `type` cannot be changed.
- **Response:** `200` updated resource.

## Resource requests

**Route prefix note:** the controller combines `@Controller('resource-requests')` with route decorators that already contain `api/v1/resource-request`. The implemented paths therefore begin `/resource-requests/api/v1/resource-request`, as listed below.

Statuses used by list and update operations are `DRAFT`, `SUBMITTED`, `QUERIED`, `APPROVED`, and `REJECTED`. All four routes require a Bearer token.

### `POST /resource-requests/api/v1/resource-request`
- **Access:** `TEAM_LEAD`
- **Request:** JSON body: `{ "resourceId": "550e8400-e29b-41d4-a716-446655440000", "itemDescription": "Laptop for field data collection", "batchNumber": "LOT-2026-04", "quantity": 3, "expectedDurationDays": 14, "projectId": 12, "lineManagerName": "Jordan Lee", "teamId": 4 }`. `resourceId` must identify a catalog resource; `projectId` must be assigned to `teamId`; `lineManagerName` must identify an active Line Manager. Quantity and `expectedDurationDays` are positive integers. The department is derived from the team and `requestedBy` from the caller.
- **Response:** `201` submitted request. The Line Manager is notified whether a matching catalog resource is marked `AVAILABLE` with enough quantity; missing resources and insufficient quantities are reported as unavailable for review.

### `GET /resource-requests/api/v1/resource-request`
- **Access:** `TEAM_LEAD`, `LINE_MANAGER`, `DEPARTMENT_HEAD`, `MANAGING_DIRECTOR`
- **Request:** Optional query: `status` (one of the statuses above), `teamId` (numeric ID encoded as string). Results are scoped to the caller's role.
- **Response:** `200` request array, newest first.

### `GET /resource-requests/api/v1/resource-request/{id}`
- **Access:** Same roles as list
- **Request:** UUID path parameter. Optional query `include=audit` adds chronological `auditTrail`.
- **Response:** `200` request details; audit trail when requested.

### `PATCH /resource-requests/api/v1/resource-request/{id}`
- **Access:** `TEAM_LEAD` (own queried requests), `LINE_MANAGER` (assigned submitted requests)
- **Request:** Partial request fields from create body (including `resourceId`, `projectId`, `lineManagerName`, and `teamId`) plus optional `status` and `note`. Approving reserves the unfulfilled quantity against available inventory; approval fails if stock is insufficient. Team Lead may edit a `QUERIED` request and submit using `{ "status": "SUBMITTED" }`; Line Manager may set `APPROVED`, `REJECTED`, or `QUERIED`; rejection/query requires `note`.
- **Response:** `200` updated request, with review fields updated on manager review.

## Departments — `/api/v1/departments`

### `POST /api/v1/departments`
- **Access:** Bearer token; role: `MANAGING_DIRECTOR`
- **Request:** `{ "name": "Finance", "code": "FIN", "description": "Finance and accounting" }`. `name` required (3–100 chars); `code` optional (2–20 uppercase letters, digits, `_` or `-`); description optional (max 500).
- **Response:** `201` department `{ id, name, code, description }`.
- **Error:** `409` when a department with the same name already exists.

### `GET /api/v1/departments`
- **Access:** Bearer token; role: `MANAGING_DIRECTOR`
- **Request:** No body.
- **Response:** `200` department array.

### `GET /api/v1/departments/{id}`
- **Access:** Bearer token; role: `MANAGING_DIRECTOR`, `DEPARTMENT_HEAD`
- **Request:** Numeric department ID.
- **Response:** `200` department record.

### `GET /api/v1/departments/{id}/users`
- **Access:** Bearer token; role: `MANAGING_DIRECTOR`, `DEPARTMENT_HEAD`
- **Request:** Numeric department ID.
- **Response:** `200` user array with `id`, `fullName`, `email`, `role`.

### `GET /api/v1/departments/{id}/teams`
- **Access:** Bearer token; role: `MANAGING_DIRECTOR`
- **Request:** Numeric department ID.
- **Response:** `200` team array.

### `GET /api/v1/departments/{id}/projects`
- **Access:** Bearer token; role: `MANAGING_DIRECTOR`, `DEPARTMENT_HEAD`
- **Request:** Numeric department ID.
- **Response:** `200` project array with associated teams.

### `GET /api/v1/departments/{id}/resource-requests`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD`, `MANAGING_DIRECTOR`
- **Request:** Numeric department ID.
- **Response:** `200` resource request array visible to caller.

### `GET /api/v1/departments/{id}/teams/{teamId}/projects`
- **Access:** Bearer token; role: `MANAGING_DIRECTOR`
- **Request:** Numeric department and team IDs.
- **Response:** `200` projects associated with that team.

### `PATCH /api/v1/departments/{id}`
- **Access:** Bearer token; role: `MANAGING_DIRECTOR`
- **Request:** Any of `name`, `code`, `description` with the create field constraints.
- **Response:** `200` updated department.

### `DELETE /api/v1/departments/{id}`
- **Access:** Bearer token; role: `MANAGING_DIRECTOR`
- **Request:** Numeric department ID.
- **Response:** `200` deleted department record.

### `PATCH /api/v1/departments/{id}/assign-head/{userId}`
- **Access:** Bearer token; role: `MANAGING_DIRECTOR`
- **Request:** Numeric department ID and user UUID in path; no body.
- **Response:** `200` assignment confirmation.

## Teams — `/api/v1/teams`

### `POST /api/v1/teams`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD`
- **Request:** `{ "name": "Procurement", "description": "Sources equipment", "departmentId": 2 }`. Name required (3–100 chars), departmentId positive integer, description optional (max 500).
- **Response:** `201` team record with department.

### `GET /api/v1/teams`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD`, `MANAGING_DIRECTOR`
- **Request:** No body.
- **Response:** `200` team array.

### `GET /api/v1/teams/unassigned-users`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD`
- **Request:** Optional `role` query parameter: `TEAM_LEAD` or `TEAM_MEMBER`. Omit to list both roles.
- **Response:** `200` active users without a team, each with `id`, `fullName`, `email`, and `role`, ordered by name.

### `GET /api/v1/teams/{id}/users`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD`, `TEAM_LEAD`, `TEAM_MEMBER`
- **Request:** Numeric team ID.
- **Response:** `200` member array (`id`, `fullName`, `email`, `role`).

### `GET /api/v1/teams/{id}/projects`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD`, `TEAM_LEAD`, `TEAM_MEMBER`
- **Request:** Numeric team ID.
- **Response:** `200` project array.

### `GET /api/v1/teams/{id}/resource-requests`
- **Access:** Bearer token; role: `TEAM_LEAD`, `TEAM_MEMBER`
- **Request:** Numeric team ID.
- **Response:** `200` team request array.

### `GET /api/v1/teams/{id}`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD`, `TEAM_LEAD`, `TEAM_MEMBER`, `MANAGING_DIRECTOR`
- **Request:** Numeric team ID.
- **Response:** `200` team record.

### `PATCH /api/v1/teams/{id}/team-lead`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD`
- **Request:** `{ "userId": "<user UUID>" }`; target user must have `TEAM_LEAD` role.
- **Response:** `200` team lead assignment.

### `PATCH /api/v1/teams/{id}/assign-user`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD` for the team's department
- **Request:** `{ "userId": "<Team Lead or Team Member UUID>" }`
- **Response:** `200` updated team record. The active user is assigned to the team and the team's department. `403` inactive user or unsupported role; `409` user already belongs to another team.

### `PATCH /api/v1/teams/{id}`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD`
- **Request:** Any of `name` (3–50 chars), `description` (max 50), `departmentId` (positive integer).
- **Response:** `200` updated team.

### `DELETE /api/v1/teams/{id}`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD`
- **Request:** Numeric team ID.
- **Response:** `200` deleted team record.

## Projects — `/api/v1/projects`

### `POST /api/v1/projects`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD`
- **Request:** `{ "name": "Office Modernization", "description": "Upgrade shared equipment", "startDate": "2026-01-01", "endDate": "2026-12-31", "teamIds": [1] }`. Name required (1–150 chars); `startDate` and `endDate` required as `YYYY-MM-DD`, with `endDate` on or after `startDate`; description optional (max 1000); teamIds optional array of unique positive integers.
- **Response:** `201` project with assigned teams.

### `GET /api/v1/projects`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD`, `MANAGING_DIRECTOR`
- **Request:** No body.
- **Response:** `200` projects visible to caller.

### `GET /api/v1/projects/department/{departmentId}`
- **Access:** Bearer token; role: `MANAGING_DIRECTOR`
- **Request:** Numeric department ID.
- **Response:** `200` projects assigned to teams in that department.

### `GET /api/v1/projects/{id}`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD`, `MANAGING_DIRECTOR`
- **Request:** Numeric project ID.
- **Response:** `200` project record.

### `PATCH /api/v1/projects/{id}/teams`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD`
- **Request:** `{ "teamIds": [1] }`. Array of unique positive integer IDs (the DTO currently caps the array at one item); replaces the assigned team list.
- **Response:** `200` updated project.

### `PATCH /api/v1/projects/{id}`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD`
- **Request:** One or more of `name` (1–150 chars), `description` (max 1000), `startDate`, and `endDate`. Dates use `YYYY-MM-DD`; if a date is changed, the resulting end date must be on or after the start date.
- **Response:** `200` updated project.

### `GET /api/v1/projects/{id}/team-members`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD`, `MANAGING_DIRECTOR`
- **Request:** Numeric project ID; optional query `teamId` to return one team assigned to the project. Omit it to include all project teams.
- **Response:** `200` `{ projectId, projectName, teams: [{ teamId, teamName, members: [{ id, fullName }] }] }`. Teams are sorted by name, and members within each team are sorted by name. An unassigned `teamId` returns `404`.

### `DELETE /api/v1/projects/{id}`
- **Access:** Bearer token; role: `DEPARTMENT_HEAD`
- **Request:** Numeric project ID.
- **Response:** `200` `{ "message": "Project with id … deleted successfully" }`.

## Notifications — `/api/v1/notifications`

### `GET /api/v1/notifications/me`
- **Request:** Uses the authenticated user attached to the request; no body/query.
- **Response:** `200` that user's notification array.

### `GET /api/v1/notifications/users/{id}`
- **Request:** User ID in path.
- **Response:** `200` notification array for that user.

### `PATCH /api/v1/notifications/{id}/read`
- **Request:** `{ "userId": "<user UUID>" }`; notification ID in path.
- **Response:** `200` updated notification.

### `POST /api/v1/notifications`
- **Request:** `{ "userId": "<user ID>", "message": "Your resource request has been approved" }`. Both required.
- **Response:** `201` created notification.

### `DELETE /api/v1/notifications/users/{userId}/notifications/{notificationId}`
- **Request:** User ID and notification ID in path.
- **Response:** `200` deletion result.

## Dashboard — `/api/v1/dashboard`

### `GET /api/v1/dashboard`
- **Request:** Optional query `departmentId` (numeric), e.g. `?departmentId=2`.
- **Response:** `200` dashboard overview, optionally scoped to a department.

### `GET /api/v1/dashboard/departments`
- **Request:** No body/query.
- **Response:** `200` department list for dashboard.

### `GET /api/v1/dashboard/departments/{departmentId}`
- **Request:** Numeric department ID.
- **Response:** `200` dashboard details for that department.

## Reports — `/api/v1/reports`

Report endpoints require a Bearer token for `SYSTEM_ADMIN` or `MANAGING_DIRECTOR`. They accept optional query filters: `departmentId` (positive integer), `startDate`, and `endDate` (ISO date strings, e.g. `2026-01-01`). Dates are inclusive. No request body is used.

### `GET /api/v1/reports/approval-history`
- **Response:** `200` array of approval history rows.

### `GET /api/v1/reports/departmental-spending`
- **Response:** `200` rows `{ departmentId, departmentName, totalSpending }`.

### `GET /api/v1/reports/allocation-history`
- **Response:** `200` array of allocation history rows.

### `GET /api/v1/reports/department/{departmentId}`
- **Response:** Numeric department ID plus optional `startDate`, `endDate`; `200` `{ departmentId, approvals: [], spending: [], allocations: [] }`.

### `GET /api/v1/reports/organization`
- **Response:** Optional common filters above; `200` `{ approvals: [], spending: [], allocations: [] }`.

## Audit logs — `/api/v1/audit-logs`

Both routes require a Bearer token for `SYSTEM_ADMIN`, `DEPARTMENT_HEAD`, or `MANAGING_DIRECTOR`.

### `GET /api/v1/audit-logs`
- **Request:** No body/query.
- **Response:** `200` array of audit records, including action/entity type, details, request reference, actor/note fields, and `createdAt`.

### `GET /api/v1/audit-logs/record/{entityType}/{entityId}`
- **Request:** Entity type string and integer entity ID in path.
- **Response:** `200` matching audit record array.
