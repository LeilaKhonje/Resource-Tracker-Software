# Software Requirements Specification

## Resource Tracker

**Version:** 1.3

**Date:** 24 November 2026

**Status:** Implementation baseline

### Lead Software Engineers

- Leila Khonje
- Lonjezo Alfred
- Happiness Mbewe
- Waliko Lupwayi
- Akuzike Khamai

## Document approval

| Title | Name | Date | Approval |
| --- | --- | --- | --- |
|  |  |  |  |

## 1. Introduction

This specification describes the Resource Tracker as currently implemented in the NestJS API and its relational database. It records implemented behavior and known limitations so that the document can be used as a baseline for review and future development. It is not a statement that every listed capability has a user interface.

### 1.1 Purpose

The purpose of this document is to describe the implemented system scope, users, workflows, rules, and technical constraints.

### 1.2 Scope

Resource Tracker is an API-backed system for managing organizational users, departments, teams, projects, resource requests, catalogue items, allocations, notifications, and oversight data. The current implementation supports:

- Account creation and administration, login, token refresh and logout, password reset, profile updates, and account deletion requests.
- Role-based operations for System Admins, Team Leads, Line Managers, Department Heads, Managing Directors, and Team Members.
- Department, team, project, and membership management.
- Team Lead resource requests routed to a selected active Line Manager, with approval, rejection, query, and request history.
- Insourced and outsourced resource groups with individually tracked units, allocations, transfers, returns, and movement history.
- In-app notifications and email notifications for selected request and allocation events.
- Dashboard data, reports, and audit-log queries.

The system does not place purchase orders. Resource catalogue quantities and allocation tracking support custody and availability tracking; they do not provide procurement or a complete inventory-management workflow.

### 1.3 Definitions and abbreviations

| Term | Meaning |
| --- | --- |
| API | Application programming interface exposed by the NestJS service |
| FR | Functional requirement |
| NFR | Non-functional requirement |
| Resource request | A Team Lead's request for a resource for a team and project |
| Resource unit | One individually tracked item within a resource catalogue group, with a generated identifier and unit number, optional serial number or asset tag, and availability status |
| Reserved unit | An available unit held for an approved resource request until it is allocated |
| Active allocation | A resource assignment that has not been returned or transferred out |
| Movement | A recorded allocation, transfer, or return event |
| Audit log | A recorded action and its actor, entity, details, and timestamp |

### 1.4 System context

The backend exposes JSON HTTP endpoints, generally under `/api/v1`. Swagger documentation is served at `/api/docs`. Persistence is provided through TypeORM and a configured relational database. Database schema synchronization is disabled; schema changes are applied through migrations. Email delivery depends on the configured email service and environment.

## 2. General description

### 2.1 Product functions

The API authenticates users with access and refresh tokens and applies role guards to protected operations. It stores the organization's department, team, and project relationships; accepts and routes resource requests; records Line Manager decisions; and tracks catalogue resources and their current assignments. It also exposes notification, dashboard, report, and audit-log operations.

### 2.2 User roles

| Role | Implemented responsibilities |
| --- | --- |
| System Admin | Create accounts, list accounts, administer account status and roles, and access audit logs and reports. Initial System Admin provisioning is performed by the seed process. |
| Team Lead | View active Line Managers, submit requests for a team and project, view own requests, and edit or resubmit queried requests. |
| Line Manager | View requests routed to them, approve/reject/query submitted requests, allocate resources against approved requests, transfer and return allocations, and view resource allocation and movement history. |
| Department Head | Manage department teams and projects, access departmental request and organization data, and perform permitted user role actions. |
| Managing Director | Manage departments, create/update catalogue resources, access organization-wide users, requests, reports, and oversight data, and administer roles as permitted. |
| Team Member | Be assigned to a team and act as the recorded holder of an allocated resource; may view allowed team details. |

Role authorization is enforced per controller route, with several exceptions and gaps called out in section 3. A role's presence in the system does not imply access to every feature.

### 2.3 Functional requirements

#### 2.3.1 Authentication and account management

- The API shall authenticate accounts using email and password and issue access and refresh tokens with separate `accessTokenExpiresAt` and `refreshTokenExpiresAt` timestamps. The access token shall include the `mustChangePassword` claim for users who must change their temporary password; user response objects shall not expose that property.
- The API shall rotate tokens through the refresh operation and revoke the stored refresh token on logout.
- An access token shall be rejected after its expiry. A valid refresh token may be exchanged for a new token pair before the refresh token expires; after it expires, the user must sign in again to establish a session.
- Inactive accounts shall not log in or refresh a session.
- The System Admin shall be able to create active user accounts with a unique email, `firstName`, nullable `middleName`, `surname`, role, and initial password. User API responses shall return names as separate fields, with `middleName` null when absent; they shall not return a `fullName` field. The System Admin role is provisioned separately through the seed process and is not assignable through account creation.
- Authorized account administrators shall be able to deactivate/reactivate accounts or assign roles, subject to role-specific service rules. Account actions are written to the audit log where implemented.
- Authenticated users shall be able to read their own profile, update supported profile fields, and change their password after supplying the current password.
- A user shall be able to request account deletion. The request is scheduled for five days; a successful login during that grace period cancels the pending request. Expired deletion requests prevent login; actual deletion is dependent on the application's account-deletion processing.
- An active user may request a password-reset code by email. A valid unexpired code may be used to set a new password; reset attempts are limited by the service.

#### 2.3.2 Organizational structure

- The Managing Director shall be able to create, list, update, and delete departments and assign a Department Head.
- A Department Head shall be able to create, update, and delete teams within their permitted department and assign eligible Team Leads and Team Members.
- Department Heads shall be able to create projects, update them, delete them, and manage project/team associations. Projects have a name and valid start/end dates; creation may omit assigned teams.
- Team and project endpoints shall provide permitted views of users, projects, teams, and associated resource requests.
- Team membership and department/project relationships shall be validated by the relevant services. Assignment operations require active, eligible users; an already assigned user cannot be assigned to a different team through the standard assignment operation.

#### 2.3.3 Submit and review resource requests

- Only a Team Lead shall be able to create a resource request.
- A new request shall contain an item description, batch number, positive quantity, positive expected duration in days, team name, project name, and Line Manager name. The service shall resolve the names to stored relationships, derive the department from the team, and record the requester from the authenticated identity.
- The selected project shall be assigned to the selected team. The selected Line Manager must be active. Ambiguous matching names shall be rejected.
- Request creation immediately submits the request with status `SUBMITTED`. The implementation does not currently provide a separate draft-creation workflow, although `DRAFT` appears in some request status definitions and query documentation.
- The assigned Line Manager shall be able to approve, reject, or query a `SUBMITTED` request. Rejection and query require a note. The service shall record reviewer and review time and create an audit entry.
- An approval may specify `approvedQuantity` from 1 through the requested quantity. If omitted, the full requested quantity is approved. The approved quantity shall be persisted and shall not exceed available units; the approved number of individual units is reserved for that request. The review response and requester notifications identify the approved count, such as “approved for 3 of 5”.
- A request's approved quantity, rather than its original requested quantity, shall limit subsequent allocation. Allocations against the request shall not exceed the approved quantity, less units already allocated against it.
- A Team Lead shall be able to edit a queried request and resubmit it. Resubmission requires complete team, department, project, Line Manager, and expected-duration details. The system records request changes and resubmission in its audit history.
- Team Leads shall see their own requests; Line Managers shall see requests routed to them; Department Heads shall see requests for their assigned department; Managing Directors shall see all requests.
- Authorized users shall be able to view request details. Request detail can include the chronological request audit trail when requested.
- Unit price, vendor, and manufacturer label are not request-entry fields in the current create flow. They belong to the catalogue model where applicable.

#### 2.3.4 Resource catalogue and availability

- The Managing Director shall be able to create and update resource catalogue entries.
- A catalogue entry shall be either `insourced` or `outsourced`. Insourced entries store a description and department; outsourced entries store price, manufacturer's label, batch number, and vendor. Both store a name and positive quantity. Creating a group creates one `ResourceUnit` record per quantity, each with a UUID, a per-group unit number, status, and optional serial number and asset tag.
- Department Heads, Line Managers, Managing Directors, and Team Leads shall be able to list/search catalogue entries by name and type. The list response indicates whether a resource is `AVAILABLE` or `ASSIGNED`.
- Unit status shall be `AVAILABLE`, `RESERVED`, or `ALLOCATED`. Available quantity is the number of units with `AVAILABLE` status; reserved and allocated units cannot be assigned to another request or allocation.
- Department Heads, Line Managers, Managing Directors, and Team Leads shall be able to list a resource's units and their status, current allocation, and reservation where applicable. Line Managers and Managing Directors shall be able to change a unit's serial number or asset tag.
- Updating a resource quantity shall create additional unit records when it increases. A decrease shall remove available, unreserved units only and shall not reduce the quantity below occupied units (reserved or allocated).
- Line Managers shall be able to view active allocations for a resource and its chronological movement events, including the identity of the units in each allocation.
- **Access limitation:** the single-resource `GET /api/v1/resources/{id}` route has no authentication/role guard in the current controller. Catalogue update operations use Managing Director role guards. The catalogue and allocation access rules should therefore be understood from the implemented route guards, not inferred from the role descriptions alone.

#### 2.3.5 Allocate, transfer, and return resources

- A Line Manager shall be able to allocate a positive quantity of available units to an active user belonging to the selected team, for a project assigned to that team. The caller may specify exact unit IDs; otherwise, the service selects eligible units automatically. The number of selected units shall equal the allocation quantity.
- An allocation shall record resource, quantity, exact unit identities, team, project, assignee, allocating Line Manager, status, and allocation time. It may link to an approved request routed to that Line Manager.
- When linked to a request, the allocation team/project shall match the request and the total quantity allocated against the request shall not exceed its approved quantity remaining to fulfill. Units reserved for that request are selected for its allocation.
- If an allocation is linked to a request with an expected duration and no explicit return deadline is given, the service shall calculate the expected return date from that duration. Otherwise, an explicitly supplied date is stored or the deadline is absent.
- A Line Manager shall be able to transfer an active allocation to an eligible user/team/project. The old allocation is marked transferred and a new active allocation is created for the same resource, quantity, and unit identities. Transfer history records the source and destination and optional note; the expected return date is retained unless changed.
- A Line Manager shall be able to mark an active allocation returned. The service records the return time and optional note and changes its units to `AVAILABLE` for future allocation.
- The service shall record movement events for allocations, transfers, and returns. It shall send email to the assignee on allocation, transfer, and return where email delivery is configured.

#### 2.3.6 Notifications and email

- The system shall create an in-app notification and send an email to the assigned Line Manager when a Team Lead creates a request.
- On a Line Manager's approval, the system shall send the requester an email and create an in-app notification that includes the approved quantity. On rejection or query, the system shall send an email to the requester; those review outcomes do not currently create an in-app notification.
- Resubmitting a queried request records the resubmission but currently has no notification to the Line Manager.
- Allocation, transfer, and return events send email to the relevant assignee. These resource allocation events are recorded as movements; they do not create in-app notifications in the current service.
- The API provides notification list, create, mark-read, and delete operations. Only the `me` list operation has a JWT guard; other notification operations currently lack route-level authentication/ownership guards.

#### 2.3.7 Dashboards, reports, and audit logs

- The dashboard API shall provide request summary counts, recent audit activity, department spending, and department lists, plus a department-specific summary operation.
- The reports API shall provide approval history, departmental spending, allocation history, and a combined department report with optional department/date filters. Report routes are guarded for System Admins and Managing Directors.
- The audit-log API shall support listing and filtering audit records. It is guarded for System Admins, Department Heads, and Managing Directors. Filters include actor, action, entity, date, and time; when multiple filters are supplied, the implementation matches any supplied filter.
- Audit records are written for request creation and changes/reviews and for account actions where implemented. The implementation does not establish a tamper-resistant audit store.
- **Known dashboard limitation:** dashboard routes currently have no authentication/role guard. The summary query uses the legacy status `PENDING`, while the current request workflow uses `SUBMITTED`, so its pending-approval count may not represent current pending requests. Department spending is calculated from approved request price and quantity fields, which are not populated by the current request-create flow; the resulting spending totals may therefore be zero or incomplete.

### 2.4 Non-functional requirements and implementation characteristics

| ID | Current characteristic |
| --- | --- |
| NFR-001: Authentication and authorization | JWT access/refresh authentication and role guards protect many operations. Route-level gaps are documented above; access should not be assumed for unguarded controllers. |
| NFR-002: Data integrity | DTO validation, service-level relationship checks, database constraints, and transactions are used for key operations such as allocation. Not every operation is transactional. |
| NFR-003: Password handling | Passwords are stored as bcrypt hashes. Reset codes and refresh tokens are stored as hashes. Password policy and token lifetimes are defined by the API implementation and DTOs. |
| NFR-004: Auditability | Request, account, and resource movement history are recorded in database entities. The records are not described as tamper-resistant. |
| NFR-005: Availability and performance | No measured availability or response-time target is currently specified by the implementation. Runtime availability depends on the configured application, database, and email service. |
| NFR-006: Input handling | A global validation pipe is configured to validate and transform request DTOs and reject unknown fields where enabled. |

## 3. Constraints and known limitations

- The current server is an API; this specification does not claim that a complete front-end application is implemented.
- Only Team Leads can create resource requests. A new request is submitted immediately; drafts are not currently created through the API.
- Request review and resubmission notification behavior differs: manager review emails the requester, but request resubmission does not currently notify the manager.
- Some notification, dashboard, and resource-detail endpoints lack authentication and/or ownership checks. Refer to `API_ENDPOINTS.md` for the current route-level access inventory.
- Dashboard summary and spending figures have legacy-field/status mismatches described in section 2.3.7.
- Reports are available to System Admins and Managing Directors through guarded report routes; Department Heads do not have access to those routes in the current controller.
- The database is not automatically synchronized at application startup. Migrations define schema changes.
- Existing resource quantities and active allocations are backfilled into individual unit records by migration. Historical physical serial numbers and asset tags are not available, so backfilled units receive generated identities and may be labelled after migration. The migration also reserves units for outstanding approved requests.
- The resource catalogue tracks recorded quantities and individual units. It does not place orders, receive purchases, or manage procurement.

## 4. External interfaces and references

- HTTP API: JSON endpoints generally under `/api/v1`.
- API reference: [`API_ENDPOINTS.md`](API_ENDPOINTS.md); Swagger UI at `/api/docs` when the service is running.
- Project overview and setup: [`README.md`](README.md).
- Use cases: [`USE_CASES.md`](USE_CASES.md).
- Implementation: NestJS modules under `src/`, database migrations under `src/migrations/`.
