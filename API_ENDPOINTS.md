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
- Routes without an access label do not declare a JWT/role guard in their controller. In particular, resources, notifications, dashboard, and reports are currently unguarded; `GET /api/v1/notifications/me` still expects the request to contain a user identity.
- The global validation pipe rejects unknown fields and transforms input values where configured. Required and optional fields below follow the endpoint DTOs.
- Successful responses return the created/updated record, an array, or the summary described below. Error responses use NestJS HTTP errors (commonly 400, 401, 403, 404, or 409).
- User roles: `system_admin`, `team_lead`, `line_manager`, `department_head`, `managing_director`, `team_member`.

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
- **Access:** Bearer token; role: `system_admin`
- **Request:** `{ "fullName": "Alex Morgan", "email": "alex@company.com", "role": "team_member", "initialPassword": "Temp1234" }`. Email must end in `@company.com`; password is 8–12 characters and includes a digit. The initial `system_admin` role cannot be assigned here.
- **Response:** `201` created account; password is not returned.

### `GET /api/v1/users`
- **Access:** Bearer token; role: `system_admin`, `managing_director`
- **Request:** No body or query parameters.
- **Response:** `200` array of user accounts without credential data.

### `PATCH /api/v1/users/{id}/role`
- **Access:** Bearer token; role: `system_admin`, `managing_director`, `department_head`
- **Request:** `{ "role": "team_lead" }`. Any supported role except `system_admin`.
- **Response:** `200` user assignment `{ id, fullName, email, role }`.

### `GET /api/v1/users/me`
- **Access:** Bearer token; role: any authenticated user
- **Request:** No body or query parameters.
- **Response:** `200` current profile `{ id, fullName, email, role, department, team }` (some values may be null).

### `PATCH /api/v1/users/me/profile`
- **Access:** Bearer token; role: any authenticated user
- **Request:** Any one or more of: `phoneNumber` (string, max 30; digits only), `address` (string, max 255), `dateOfBirth` (`YYYY-MM-DD`), `preferredPronoun` (`Mr.`, `Mrs.`, or `Miss`). Send at least one field.
- **Response:** `200` updated profile.

### `PATCH /api/v1/users/me/password`
- **Access:** Bearer token; role: any authenticated user
- **Request:** `{ "currentPassword": "current123", "newPassword": "newSecure456" }`. Each is 8–12 characters; new password must contain a digit.
- **Response:** `200` password change confirmation.

### `PATCH /api/v1/users/{id}/deactivate`
- **Access:** Bearer token; role: `system_admin`
- **Request:** No body. UUID account ID in path.
- **Response:** `200` deactivation confirmation.

### `PATCH /api/v1/users/{id}/reactivate`
- **Access:** Bearer token; role: `system_admin`
- **Request:** No body. UUID account ID in path.
- **Response:** `200` reactivation confirmation.

## Resources — `/api/v1/resources`

Resource types are `insourced` and `outsourced`. Responses include common fields `id`, `name`, `type`, `quantity`, `createdAt`, and `updatedAt`, plus type-specific fields.

### `POST /api/v1/resources`
- **Request:** Insourced JSON: `{ "name": "Office laptop", "type": "insourced", "description": "Existing inventory", "departmentId": 2, "quantity": 1 }`. Outsourced JSON: `{ "name": "Office laptop", "type": "outsourced", "price": 1250.50, "label": "Dell Latitude 5450", "batchNumber": "LOT-2026-04", "vendor": "Example Supplies Ltd", "quantity": 3 }`. Quantity is a non-negative integer; outsourced price is non-negative with at most two decimals.
- **Response:** `201` created resource. Insourced records include `description`, `departmentId`; outsourced records include `price`, `label`, `batchNumber`, `vendor`.

### `GET /api/v1/resources`
- **Request:** Optional query: `name` (case-insensitive substring), `type` (`insourced` or `outsourced`). Example: `?name=laptop&type=outsourced`.
- **Response:** `200` matching resource array, newest first.

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
- **Access:** `team_lead`
- **Request:** JSON body: `{ "itemDescription": "Laptop for field data collection", "manufacturerLabel": "ThinkPad T14", "price": 1200, "batchNumber": "LOT-2026-04", "vendor": "Example Supplies", "quantity": 3, "projectId": "12", "lineManagerId": "<user UUID>", "teamId": "8", "departmentId": "2" }`. IDs for project/team/department are numeric strings; price is positive (max 2 decimals), quantity is integer ≥1. `requestedBy` and initial status are set by the server.
- **Response:** `201` new request in `DRAFT` status.

### `GET /resource-requests/api/v1/resource-request`
- **Access:** `team_lead`, `line_manager`, `department_head`, `managing_director`
- **Request:** Optional query: `status` (one of the statuses above), `teamId` (numeric ID encoded as string). Results are scoped to the caller's role.
- **Response:** `200` request array, newest first.

### `GET /resource-requests/api/v1/resource-request/{id}`
- **Access:** Same roles as list
- **Request:** UUID path parameter. Optional query `include=audit` adds chronological `auditTrail`.
- **Response:** `200` request details; audit trail when requested.

### `PATCH /resource-requests/api/v1/resource-request/{id}`
- **Access:** `team_lead` (own draft/queried requests), `line_manager` (assigned submitted requests)
- **Request:** Partial request fields from create body plus optional `status` and `note`. Team lead may edit `DRAFT`/`QUERIED` and submit using `{ "status": "SUBMITTED" }`. Line manager may set `APPROVED`, `REJECTED`, or `QUERIED`; rejection/query requires `note`.
- **Response:** `200` updated request, with review fields updated on manager review.

## Departments — `/api/v1/departments`

### `POST /api/v1/departments`
- **Access:** Bearer token; role: `managing_director`
- **Request:** `{ "name": "Finance", "code": "FIN", "description": "Finance and accounting" }`. `name` required (3–100 chars); `code` optional (2–20 uppercase letters, digits, `_` or `-`); description optional (max 500).
- **Response:** `201` department `{ id, name, code, description }`.

### `GET /api/v1/departments`
- **Access:** Bearer token; role: `managing_director`
- **Request:** No body.
- **Response:** `200` department array.

### `GET /api/v1/departments/{id}`
- **Access:** Bearer token; role: `managing_director`, `department_head`
- **Request:** Numeric department ID.
- **Response:** `200` department record.

### `GET /api/v1/departments/{id}/users`
- **Access:** Bearer token; role: `managing_director`, `department_head`
- **Request:** Numeric department ID.
- **Response:** `200` user array with `id`, `fullName`, `email`, `role`.

### `GET /api/v1/departments/{id}/teams`
- **Access:** Bearer token; role: `managing_director`
- **Request:** Numeric department ID.
- **Response:** `200` team array.

### `GET /api/v1/departments/{id}/projects`
- **Access:** Bearer token; role: `managing_director`, `department_head`
- **Request:** Numeric department ID.
- **Response:** `200` project array with associated teams.

### `GET /api/v1/departments/{id}/resource-requests`
- **Access:** Bearer token; role: `department_head`, `managing_director`
- **Request:** Numeric department ID.
- **Response:** `200` resource request array visible to caller.

### `GET /api/v1/departments/{id}/teams/{teamId}/projects`
- **Access:** Bearer token; role: `managing_director`
- **Request:** Numeric department and team IDs.
- **Response:** `200` projects associated with that team.

### `PATCH /api/v1/departments/{id}`
- **Access:** Bearer token; role: `managing_director`
- **Request:** Any of `name`, `code`, `description` with the create field constraints.
- **Response:** `200` updated department.

### `DELETE /api/v1/departments/{id}`
- **Access:** Bearer token; role: `managing_director`
- **Request:** Numeric department ID.
- **Response:** `200` deleted department record.

### `PATCH /api/v1/departments/{id}/assign-head/{userId}`
- **Access:** Bearer token; role: `managing_director`
- **Request:** Numeric department ID and user UUID in path; no body.
- **Response:** `200` assignment confirmation.

## Teams — `/api/v1/teams`

### `POST /api/v1/teams`
- **Access:** Bearer token; role: `department_head`
- **Request:** `{ "name": "Procurement", "description": "Sources equipment", "departmentId": 2 }`. Name required (3–100 chars), departmentId positive integer, description optional (max 500).
- **Response:** `201` team record with department.

### `GET /api/v1/teams`
- **Access:** Bearer token; role: `department_head`, `managing_director`
- **Request:** No body.
- **Response:** `200` team array.

### `GET /api/v1/teams/{id}/users`
- **Access:** Bearer token; role: `department_head`, `team_lead`, `team_member`
- **Request:** Numeric team ID.
- **Response:** `200` member array (`id`, `fullName`, `email`, `role`).

### `GET /api/v1/teams/{id}/projects`
- **Access:** Bearer token; role: `department_head`, `team_lead`, `team_member`
- **Request:** Numeric team ID.
- **Response:** `200` project array.

### `GET /api/v1/teams/{id}/resource-requests`
- **Access:** Bearer token; role: `team_lead`, `team_member`
- **Request:** Numeric team ID.
- **Response:** `200` team request array.

### `GET /api/v1/teams/{id}`
- **Access:** Bearer token; role: `department_head`, `team_lead`, `team_member`, `managing_director`
- **Request:** Numeric team ID.
- **Response:** `200` team record.

### `PATCH /api/v1/teams/{id}/team-lead`
- **Access:** Bearer token; role: `department_head`
- **Request:** `{ "userId": "<user UUID>" }`; target user must have `team_lead` role.
- **Response:** `200` team lead assignment.

### `PATCH /api/v1/teams/{id}`
- **Access:** Bearer token; role: `department_head`
- **Request:** Any of `name` (3–50 chars), `description` (max 50), `departmentId` (positive integer).
- **Response:** `200` updated team.

### `DELETE /api/v1/teams/{id}`
- **Access:** Bearer token; role: `department_head`
- **Request:** Numeric team ID.
- **Response:** `200` deleted team record.

## Projects — `/api/v1/projects`

### `POST /api/v1/projects`
- **Access:** Bearer token; role: `department_head`
- **Request:** `{ "name": "Office Modernization", "description": "Upgrade shared equipment", "teamIds": [1] }`. Name required (1–150 chars); description optional (max 1000); teamIds optional array of unique positive integers.
- **Response:** `201` project with assigned teams.

### `GET /api/v1/projects`
- **Access:** Bearer token; role: `department_head`, `managing_director`
- **Request:** No body.
- **Response:** `200` projects visible to caller.

### `GET /api/v1/projects/department/{departmentId}`
- **Access:** Bearer token; role: `managing_director`
- **Request:** Numeric department ID.
- **Response:** `200` projects assigned to teams in that department.

### `GET /api/v1/projects/{id}`
- **Access:** Bearer token; role: `department_head`, `managing_director`
- **Request:** Numeric project ID.
- **Response:** `200` project record.

### `PATCH /api/v1/projects/{id}/teams`
- **Access:** Bearer token; role: `department_head`
- **Request:** `{ "teamIds": [1] }`. Array of unique positive integer IDs (the DTO currently caps the array at one item); replaces the assigned team list.
- **Response:** `200` updated project.

### `PATCH /api/v1/projects/{id}`
- **Access:** Bearer token; role: `department_head`
- **Request:** One or both of `name` (1–150 chars) and `description` (max 1000).
- **Response:** `200` updated project.

### `GET /api/v1/projects/{id}/team-members`
- **Access:** Bearer token; role: `department_head`, `managing_director`
- **Request:** Numeric project ID.
- **Response:** `200` array of `{ id, fullName, teamId, teamName }`.

### `DELETE /api/v1/projects/{id}`
- **Access:** Bearer token; role: `department_head`
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

Report endpoints accept optional query filters: `departmentId` (positive integer), `startDate`, and `endDate` (ISO date strings, e.g. `2026-01-01`). Dates are inclusive. No request body is used.

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

Both routes require a Bearer token for `system_admin`.

### `GET /api/v1/audit-logs`
- **Request:** No body/query.
- **Response:** `200` array of audit records, including action/entity type, details, request reference, actor/note fields, and `createdAt`.

### `GET /api/v1/audit-logs/record/{entityType}/{entityId}`
- **Request:** Entity type string and integer entity ID in path.
- **Response:** `200` matching audit record array.
