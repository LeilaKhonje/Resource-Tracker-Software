# Resource Tracker use cases

### 2.5 Use cases

The following use cases describe the principal interactions between Resource Tracker actors and the system.

#### Authentication and accounts

##### UC-01: Sign in to the system.

| Field | Details |
| --- | --- |
| Actors | Any active user |
| Description | Sign in to the system. |
| Data | Company email and password. |
| Stimulus | User submits login credentials. |
| Response | System validates the account and returns access and refresh tokens plus a flag indicating whether a temporary password must be changed. |
| Comment | Inactive accounts cannot sign in. Newly created users must change their emailed temporary password before using other protected endpoints. |

##### UC-02: Refresh or end a sign-in session.

| Field | Details |
| --- | --- |
| Actors | Authenticated user |
| Description | Refresh or end a sign-in session. |
| Data | Refresh token. |
| Stimulus | User requests a new session token or logs out. |
| Response | System issues a replacement token pair or revokes the refresh token and confirms logout. |
| Comment | Protected actions require a valid access token. |

##### UC-03: Request password-reset assistance.

| Field | Details |
| --- | --- |
| Actors | User / System Admin |
| Description | Request password-reset assistance. |
| Data | Account email; reset code and new password when completing a reset. |
| Stimulus | User submits a forgot-password request or reset details. |
| Response | System accepts the request without revealing whether the account exists; when valid reset details are supplied, the password is changed. |
| Comment | The system emails a six-digit code that expires after 10 minutes. Five failed attempts expire the code. A successful reset clears the code and revokes the user’s refresh token. |

##### UC-04: Create a user account.

| Field | Details |
| --- | --- |
| Actors | System Admin |
| Description | Create a user account. |
| Data | First name, optional middle name, surname, unique email address, and business role. No password is supplied in the request. |
| Stimulus | System Admin submits a new account. |
| Response | System creates an active account, returns account details without credential data, and emails a generated temporary password to the user. |
| Comment | The user must change the temporary password at first login. If required email delivery fails, account creation fails and the account is removed. System Admin accounts are provisioned through the seed process. |

##### UC-05: List users or find accounts created in a date range.

| Field | Details |
| --- | --- |
| Actors | System Admin; Managing Director |
| Description | List users or find accounts created in a date range. |
| Data | Optional start and end timestamps. |
| Stimulus | Authorized actor requests the user list or filters by creation dates. |
| Response | System returns matching user records without password data. |
| Comment | Date boundaries are inclusive. |

##### UC-06: Change a user's business role.

| Field | Details |
| --- | --- |
| Actors | System Admin; Managing Director; Department Head |
| Description | Change a user's business role. |
| Data | User ID and target role. |
| Stimulus | Authorized actor submits a role assignment. |
| Response | System updates the role and returns the updated user. |
| Comment | The System Admin can assign business roles but not System Admin. Managing Directors can assign Line Manager and Department Head roles; Department Heads can assign Team Lead. Only one Managing Director account can be assigned. |

##### UC-07: Deactivate or reactivate an account.

| Field | Details |
| --- | --- |
| Actors | System Admin |
| Description | Deactivate or reactivate an account. |
| Data | User ID and requested account state. |
| Stimulus | Admin selects deactivate or reactivate. |
| Response | System changes account status and records the account-management action. |
| Comment | Only the System Admin can deactivate or reactivate accounts. Deactivation revokes refresh tokens; a System Admin cannot deactivate their own account. Deactivated users cannot authenticate. |

##### UC-08: View or update a profile or password.

| Field | Details |
| --- | --- |
| Actors | Any authenticated user |
| Description | View or update their profile and password. |
| Data | Profile fields (phone, address, birth date, pronoun); current and new password. |
| Stimulus | User opens their profile or submits profile/password changes. |
| Response | System returns profile details or confirms the validated update. |
| Comment | The user can only update their own profile and password. |


#### Departments, teams, and projects

##### UC-09: Create or update a department.

| Field | Details |
| --- | --- |
| Actors | Managing Director |
| Description | Create or update a department. |
| Data | Department name, optional code and description; department ID for updates. |
| Stimulus | Managing Director submits department details. |
| Response | System creates or updates the department and returns the record. |
| Comment | Department names must be unique. |

##### UC-10: View department details and related users, teams, projects, or requests.

| Field | Details |
| --- | --- |
| Actors | Managing Director; Department Head |
| Description | View department details and related users, teams, projects, or requests. |
| Data | Department ID and, where applicable, team ID. |
| Stimulus | Actor requests a department or one of its related lists. |
| Response | System returns the requested records within the actor's permitted scope. |
| Comment | Department Heads are limited to their department; available views depend on role. |

##### UC-11: Assign a Department Head to a department.

| Field | Details |
| --- | --- |
| Actors | Managing Director |
| Description | Assign a Department Head to a department. |
| Data | Department ID and target user ID. |
| Stimulus | Managing Director assigns a department head. |
| Response | System associates the eligible user with the department and confirms the update. |
| Comment | Target must be an appropriate user account. |

##### UC-12: Create, update, or delete a team.

| Field | Details |
| --- | --- |
| Actors | Department Head |
| Description | Create, update, or delete a team. |
| Data | Team name, department, optional description; team ID for updates/deletion. |
| Stimulus | Department Head submits a team change. |
| Response | System creates, updates, or deletes the team and confirms the result. |
| Comment | A Department Head manages teams for their department. Related records may prevent deletion. |

##### UC-13: Assign a Team Lead or Team Member to a team.

| Field | Details |
| --- | --- |
| Actors | Department Head |
| Description | Assign a Team Lead or Team Member to a team. |
| Data | Team ID, user ID, and (for Team Leads) lead assignment. |
| Stimulus | Department Head selects an eligible unassigned user or changes team assignment. |
| Response | System assigns the user and aligns their department to the team's department. |
| Comment | Active users can be assigned; a user already belonging to another team cannot be reassigned through the assignment operation. |

##### UC-14: Create, view, update, or delete a project and manage its team assignments.

| Field | Details |
| --- | --- |
| Actors | Department Head; Managing Director |
| Description | Create, view, update, or delete a project and manage its team assignments. |
| Data | Project name, date range, description, project ID, team IDs; optional team ID when filtering project members. |
| Stimulus | Actor submits project details, requests a view, or changes project/team assignments. |
| Response | System returns project information or confirms the change. Project-member views group members under their assigned teams; an optional team filter limits the result to one team. |
| Comment | Department Heads manage projects in their department; Managing Directors have broader read access. A project date range must be valid. Creation can omit teams, but team assignment requires at least one team. Project-member results are sorted by team name and then member name. |

##### UC-15: Find active Line Managers available to review a request.

| Field | Details |
| --- | --- |
| Actors | Team Lead |
| Description | Find active Line Managers available to review a request. |
| Data | No input beyond authenticated user context. |
| Stimulus | Team Lead requests the reviewer list. |
| Response | System returns eligible Line Manager names and contact details. |
| Comment | The request workflow identifies a reviewer by name; ambiguous duplicate names are rejected during submission. |


#### Resource requests

##### UC-16: Create and submit a resource request.

| Field | Details |
| --- | --- |
| Actors | Team Lead |
| Description | Create and submit a resource request. |
| Data | Item description, batch number, quantity, expected duration, project, team, selected Line Manager. |
| Stimulus | Team Lead submits a request for project resources. |
| Response | System validates team/project/reviewer relationships, records the request, sets its initial workflow status, and notifies the Line Manager. |
| Comment | Only Team Leads may submit. Department is derived from the team; request attributes do not include catalogue price, vendor, or manufacturer label. |

##### UC-17: Track requests and view request details or audit history.

| Field | Details |
| --- | --- |
| Actors | Team Lead |
| Description | Track requests and view request details or audit history. |
| Data | Optional status/team filters, request ID, optional audit inclusion. |
| Stimulus | Team Lead opens the request list or a specific request. |
| Response | System returns requests visible to the Team Lead, including current status and optionally chronological audit details. |
| Comment | Team Leads are restricted to their own team/request scope. |

##### UC-18: Review resource requests and view request history.

| Field | Details |
| --- | --- |
| Actors | Line Manager; Department Head; Managing Director |
| Description | Review resource requests and view request history. |
| Data | Optional status/team filters, request ID, optional audit inclusion. |
| Stimulus | Actor requests request lists or details. |
| Response | System returns requests and available audit history within role and department scope. |
| Comment | Line Managers see requests assigned to them; Department Heads see their department; Managing Directors have organization-wide oversight. |

##### UC-19: Approve, reject, or query a submitted request.

| Field | Details |
| --- | --- |
| Actors | Line Manager |
| Description | Approve, reject, or query a submitted request. |
| Data | Request ID, decision status, optional approved quantity, optional review note. |
| Stimulus | Line Manager records a review decision. |
| Response | System updates status and review details, records the decision in the audit trail, reserves the approved units, and tells the Team Lead the approved quantity. |
| Comment | `approvedQuantity` may be from 1 through the requested quantity and defaults to the full quantity. Rejection and query require a note. Approval sends email and an in-app notification with the approved count; rejection and query send email. |

##### UC-20: Edit and resubmit a queried request.

| Field | Details |
| --- | --- |
| Actors | Team Lead |
| Description | Edit and resubmit a queried request. |
| Data | Request ID and updated request fields; resubmission status. |
| Stimulus | Team Lead responds to a query and resubmits. |
| Response | System updates the request and returns it to the review workflow. |
| Comment | A positive expected duration is required before resubmission. The current API does not notify the Line Manager when a request is resubmitted. |

#### Resource catalogue and allocations

##### UC-21: Add or update a resource catalogue entry.

| Field | Details |
| --- | --- |
| Actors | Managing Director |
| Description | Add or update a resource catalogue entry. |
| Data | Name, type, quantity, and type-specific fields: insourced description/department or outsourced price/label/batch/vendor. |
| Stimulus | Managing Director submits a resource record or edits an existing record. |
| Response | System saves and returns the catalogue group and its individually tracked units. |
| Comment | Creating a group generates one unit per quantity. Each unit has a generated ID and group-local number, status, and optional serial number and asset tag. Quantity cannot be reduced below reserved and allocated units; the system does not place purchase orders. |

##### UC-22: Search and view resource catalogue entries.

| Field | Details |
| --- | --- |
| Actors | Line Manager; other authorized catalogue viewers |
| Description | Search and view resource catalogue entries. |
| Data | Optional name and resource-type filters; resource ID. |
| Stimulus | Actor requests catalogue records or one resource. |
| Response | System returns matching resource details. |
| Comment | Catalogue route access follows the API's configured guards; available-quantity view is Line Manager-only. |

##### UC-23: Check available resources.

| Field | Details |
| --- | --- |
| Actors | Line Manager |
| Description | Check available resources. |
| Data | No required input; optional resource filters where supported. |
| Stimulus | Line Manager opens the availability view. |
| Response | System returns resources grouped by type with available quantities. |
| Comment | Availability is based on unit status: only `AVAILABLE` units can be assigned; `RESERVED` units are held for an approved request and `ALLOCATED` units have a current holder. |

##### UC-24: Allocate a resource to a team member.

| Field | Details |
| --- | --- |
| Actors | Line Manager |
| Description | Allocate a resource to a team member. |
| Data | Resource ID, quantity, optional exact unit IDs, team, project, assignee, optional expected return date and approved request ID. |
| Stimulus | Line Manager assigns available units. |
| Response | System creates an active allocation and movement record for the selected units, updates their status to `ALLOCATED`, and notifies the assignee. |
| Comment | Assignee must be active and belong to the selected team; project must belong to that team. The system selects available units if IDs are omitted. For a linked request, it uses that request's reserved units and enforces its approved quantity balance. |

##### UC-25: Review current allocations for a resource.

| Field | Details |
| --- | --- |
| Actors | Line Manager |
| Description | Review current allocations for a resource. |
| Data | Resource ID. |
| Stimulus | Line Manager requests allocation details. |
| Response | System returns active assignments with assignee, team, project, quantity, exact unit identities, and expected return date. |
| Comment | Shows current holders and active allocations. |

##### UC-26: Transfer an active allocation.

| Field | Details |
| --- | --- |
| Actors | Line Manager |
| Description | Transfer an active allocation. |
| Data | Allocation ID, destination user/team/project, optional expected return date and note. |
| Stimulus | Line Manager transfers the assigned resource. |
| Response | System closes the old assignment, creates a new active assignment for the same resource, quantity, and unit identities, records movement details, and notifies the new assignee. |
| Comment | Destination user must be active and team/project assignment valid; existing return date is preserved unless replaced. |

##### UC-27: Record a resource return.

| Field | Details |
| --- | --- |
| Actors | Line Manager |
| Description | Record a resource return. |
| Data | Allocation ID and optional note. |
| Stimulus | Line Manager marks an active allocation as returned. |
| Response | System closes the allocation, records the return movement, changes its units to `AVAILABLE`, and notifies the assignee. |
| Comment | Only active allocations can be returned. |

#### Movement history

##### UC-28: Review a resource's movement history.

| Field | Details |
| --- | --- |
| Actors | Line Manager |
| Description | Review a resource's movement history. |
| Data | Resource ID. |
| Stimulus | Line Manager opens movement history. |
| Response | System returns chronological allocation, transfer, and return events with users, organizational assignments, and affected unit identities. |
| Comment | History supports accountability for resource custody. |

#### Notifications, dashboards, and oversight

##### UC-29: Notify a Line Manager when a request is submitted.

| Field | Details |
| --- | --- |
| Actors | System |
| Description | Create an in-app notification when a resource request is submitted. |
| Data | Assigned Line Manager, request details, message and timestamp. |
| Stimulus | A Team Lead submits a resource request. |
| Response | System stores an unread notification for the assigned Line Manager; the system also sends that manager an email. |
| Comment | Approval also creates an in-app notification for the Team Lead with the approved quantity. Rejection and query send email but do not create in-app notifications. Allocation events currently send email where configured. |

##### UC-30: View and manage notifications.

| Field | Details |
| --- | --- |
| Actors | Authenticated user |
| Description | View and manage notifications. |
| Data | Current user context; notification ID; read state. |
| Stimulus | User opens notifications, marks one read, or removes it. |
| Response | System returns the user's notifications or confirms the requested update/removal. |
| Comment | The authenticated user's list is scoped to their account. The API also exposes notification management operations by user and notification ID. |

##### UC-31: View dashboard summaries.

| Field | Details |
| --- | --- |
| Actors | Department Head; Managing Director; Line Manager |
| Description | View dashboard summaries. |
| Data | Optional department ID or dashboard filters. |
| Stimulus | Actor opens the dashboard. |
| Response | System returns summary information allowed for the actor's role and department. |
| Comment | Department Heads receive departmental views; Managing Directors receive broader views. |

##### UC-32: Generate historical and spending reports.

| Field | Details |
| --- | --- |
| Actors | System Admin; Managing Director |
| Description | Generate historical and spending reports. |
| Data | Report type and optional date, department, or other supported filters. |
| Stimulus | Actor requests approval history, departmental spending, allocation history, or organization/department report. |
| Response | System returns the matching report data. |
| Comment | Reports require a System Admin or Managing Director token. Optional department and inclusive date filters are supported; the organization report ignores its department filter. |

##### UC-33: Review audit records.

| Field | Details |
| --- | --- |
| Actors | Managing Director; Department Head; authorized audit viewer |
| Description | Review audit records. |
| Data | Optional entity type, entity ID, or audit filters. |
| Stimulus | Actor requests audit records or a record's history. |
| Response | System returns matching audit entries, including action details, actor, and timestamp. |
| Comment | System Admins, Managing Directors, and Department Heads can call the audit-log routes. Optional filters are combined with OR; without filters the API returns all audit entries. |

##### UC-34: View members working on a project's teams.

| Field | Details |
| --- | --- |
| Actors | Department Head; Managing Director |
| Description | View users assigned to the teams associated with a project. |
| Data | Project ID; optional team ID. |
| Stimulus | Actor requests project members, optionally filtering to one assigned team. |
| Response | System returns the project and its teams, with each team's members grouped under that team. Teams and members are sorted by name. |
| Comment | A supplied team must be assigned to the project. Department Heads are limited to projects in their department; Managing Directors can view organization-wide. |


##### UC-35: Request or cancel scheduled account deletion.

| Field | Details |
| --- | --- |
| Actors | Any authenticated user |
| Description | Request deletion of the user's own account or cancel the request by signing in. |
| Data | Current password to request deletion; account credentials to sign in during the five-day waiting period. |
| Stimulus | User submits an account deletion request or signs in before the scheduled deletion date. |
| Response | System schedules account deletion five days after a valid request. A successful sign-in within that period cancels the scheduled deletion. |
| Comment | The current password is verified. Scheduling deletion revokes the refresh token; only the account owner can request deletion. |

##### UC-36: Inspect and identify individual units in a resource group.

| Field | Details |
| --- | --- |
| Actors | Department Head; Line Manager; Managing Director; Team Lead |
| Description | View a resource group's individual units and record physical identifiers. |
| Data | Resource ID; optional unit ID, serial number, and asset tag. |
| Stimulus | Actor opens a resource's unit list or records identifying information for a unit. |
| Response | System returns units ordered by unit number with their status, reservation or current allocation, serial number, and asset tag. Line Managers and Managing Directors can update the serial number or asset tag. |
| Comment | Unit IDs and unit numbers are generated when the resource group is created. A serial number or asset tag can identify the physical item; asset tags must be unique. |
