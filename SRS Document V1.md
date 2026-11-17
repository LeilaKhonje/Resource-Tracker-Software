# SRS Document V1.1

## Resource Tracker

**Software Requirements Specification**  
**Version:** 1.1  
**Date:** 16 November 2026

### Lead Software Engineers

- Leila Khonje
- Lonjezo Alfred
- Happiness Mbewe
- Waliko Lupwayi
- Akuzike Khamai

## Document approval

The SRS is intended to be accepted and approved by the relevant stakeholders.

| Title | Name | Date | Approval |
| --- | --- | --- | --- |
|  |  |  |  |

## 1. Introduction

This is version 1.1 of the Resource Tracker Software Requirements Specification. It describes the system's purpose, scope, users, functional requirements, non-functional requirements, and constraints. It is a guide for the software engineers and project supervisor.

### 1.1 Purpose

The purpose of this document is to define the Resource Tracker's scope and requirements so that its design and implementation can be developed and reviewed against a shared understanding.

### 1.2 Scope

Resource Tracker will formalize the way teams request and managers review organizational resources. It will:

- Register and authenticate users and enforce role-based access.
- Allow team leads to create and submit resource requests.
- Route submitted requests to the appropriate line manager.
- Allow line managers to review, approve, reject, or query requests.
- Associate requests with teams, projects, and departments.
- Associate projects with teams and teams with departments.
- Allow team leads to track request status.
- Maintain a resource catalogue with available quantities for allocation.
- Allow line managers to allocate resources to team members, transfer active allocations, and record returns.
- Track who currently holds each allocation and maintain resource movement history.
- Notify users about important request and allocation events.
- Provide department heads and the managing director with appropriate historical and spending views.

The system tracks requested and disbursed resources for teams working on projects across the organization's departments. It is intended to replace informal, disconnected request channels with a transparent and accountable workflow.

Resource Tracker will **not** place orders to purchase resources or operate as a full inventory management system. Its resource catalogue and quantity tracking support request fulfillment and allocation accountability. Only team leads may submit resource requests.

### 1.3 Definitions, acronyms, and abbreviations

| Term | Meaning |
| --- | --- |
| FR | Functional requirement |
| NFR | Non-functional requirement |
| Resource request | A team's formal request for hardware, software, or other materials needed for a project |
| Audit trail | A record of actions and decisions taken on resource requests |

### 1.4 Overview

This specification describes the system context, product functions, user roles, functional requirements, non-functional requirements, and general constraints.

## 2. General description

Resource Tracker is a system for managing and monitoring resources requested and distributed across organizational departments. It centralizes request submission, review, status tracking, and oversight.

### 2.1 Product functions

The system will support System Admin-managed account creation and user authentication, with access determined by each user's role. Team leads will submit resource requests containing the required item and organizational details. Requests will be associated with a team, project, and department and routed to a line manager.

Line managers will review requests and approve, reject, or query them. They will also view available resources, allocate resources to team members, transfer active allocations, and record returns. The system will record these actions and maintain resource movement history. Team leads will be able to track their requests and receive notifications about important status changes. Department heads and the managing director will have access to historical decisions and spending information appropriate to their responsibilities.

### 2.2 User characteristics and roles

#### 2.2.1 Team leads

Team leads supervise project teams in departments. They can create and submit resource requests for their teams and track the progress and status of those requests.

#### 2.2.2 Line managers

Line managers receive requests from team leads. They can track and review requests, approve or reject them, and query requests when more information is needed. They can also view available-resource information to inform their decisions.

#### 2.2.3 Department heads

Department heads can access data for their own departments, including historical approval decisions and departmental spending patterns.

#### 2.2.4 Managing director

The managing director can view historical approval decisions, spending patterns across all departments, and the resource-request audit trail.

#### 2.2.5 System administrator

The System Admin creates and lists user accounts, assigns business roles, and deactivates or reactivates accounts. The System Admin sets an initial password and provides the account credentials to the designated user outside the system. The user may keep the initial password or change it after login.

#### 2.2.6 Team members

Team members belong to a team and may be assigned resources for work on a project. They are the recorded holders of resources allocated to them.

### 2.3 Functional requirements

#### 2.3.1 User account management and authentication

- The system shall allow only the System Admin to create user accounts with unique company-assigned email addresses, a specified business role, and an initial password.
- The system shall create new accounts as active and apply the specified role.
- The system shall allow users to change their initial password after login.
- The system shall allow the System Admin to deactivate and reactivate user accounts and shall record account-management actions in an audit log.
- The system shall support the System Admin, Team Lead, Team Member, Department Head, Line Manager, and Managing Director roles, with permissions assigned according to role.

#### 2.3.2 Create and submit a resource request

- The system shall allow a team lead to request hardware, software, and other materials required for a project.
- Each request shall include an item description, batch number, quantity, expected duration, project, team, and the line manager selected to review it.
- The request shall be routed to an active line manager for review. The system shall record the requesting team lead and the team, project, and department relationships.
- The system shall support saving a draft, submitting it, and responding to a line manager's query with updated information before resubmission.
- Manufacturer label, price, and vendor are attributes of an outsourced resource catalogue entry; they are not required fields on the resource request itself.

#### 2.3.3 Associate a request with a team and project

- The system shall associate every requested resource with the team that submitted the request and the project it will support.
- The system shall associate projects with teams.

#### 2.3.4 Maintain an audit trail

- The system shall record request approvals, rejections, and queries.
- The system shall allow managing directors and department heads to review relevant request decisions and audit information.

#### 2.3.5 Associate a request with a department

- Every requesting team shall be associated with a department.
- A request shall be valid only when it originates from a team assigned to a department.

#### 2.3.6 Track resource requests

- The system should allow team leads to track a submitted request's progress.
- The system shall show the current approval status of each request to its team lead.

#### 2.3.7 Show allocation history

- The system shall display how resources have been allocated across teams, grouped by department.

#### 2.3.8 Send notifications

- The system shall notify the line manager when a team lead submits a request.
- The system shall notify team leads at key request stages, including submission, approval, and rejection.
- The system shall notify the assigned user when a resource is allocated, transferred to them, or marked as returned.
- The system shall record the expected return date for an allocation when one is provided or derived from an approved request's expected duration.

#### 2.3.9 Display available resources

- The system shall display available resources to line managers to support their decisions.
- The system shall show the number of available resources in each relevant category.

#### 2.3.10 Track resource movement

- The system shall track resource movement within the company.
- The system shall provide line managers with information about who is currently using a resource.

#### 2.3.11 Maintain the resource catalogue and availability

- The system shall allow the managing director to create resource catalogue entries for insourced and outsourced resources, with a recorded quantity.
- An insourced resource shall include a description and department. An outsourced resource shall include a price, manufacturer's label, batch number, and vendor.
- The system shall show line managers resources with available quantity, grouped by resource type.
- Available quantity shall equal the catalogue quantity less the quantity in active allocations. Returned or transferred-out allocations shall not reduce availability; transferred-in allocations shall count as active.
- The system shall prevent an allocation from exceeding the available quantity and shall prevent a catalogue quantity from being reduced below the quantity currently allocated.

#### 2.3.12 Allocate resources

- The system shall allow line managers to allocate one or more units of a resource to an active user who belongs to the selected team.
- Every allocation shall be associated with a team and a project assigned to that team, and shall record the line manager who made it, the assignee, the quantity, and the allocation date.
- A line manager may associate an allocation with an approved resource request assigned to that line manager. When linked, the allocation's team and project shall match the approved request, and the quantity allocated against the request shall not exceed its unfulfilled quantity.
- An allocation may have an expected return date. When it fulfills a request that specifies an expected duration and no explicit return date is supplied, the system shall calculate the expected return date from that duration.
- The system shall notify the assigned user when a resource is allocated to them.

#### 2.3.13 Transfer active allocations

- The system shall allow a line manager to transfer an active allocation to another active user and a valid team and project.
- The system shall close the prior allocation as transferred and create a new active allocation for the same resource and quantity, preserving the expected return date unless a new date is supplied.
- The system shall record the source and destination user, team, and project, the time of transfer, the line manager who performed it, and an optional note.
- The system shall notify the new assignee when a resource is transferred to them.

#### 2.3.14 Record resource returns

- The system shall allow a line manager to record the return of an active allocation, with an optional note.
- The system shall mark the allocation as returned, record the return time, and make its quantity available for future allocations.
- The system shall notify the assignee when an allocation is marked as returned.

#### 2.3.15 Review allocation and movement history

- The system shall allow line managers to view active allocations for a resource, including its current assignee, team, project, quantity, and expected return date.
- The system shall provide a chronological movement history for each resource, including allocations, transfers, and returns, with the people and organizational assignments involved and the user who performed each action.

### 2.4 Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR-001: Security | The system shall resist external attacks and enforce role-based access control so users can access only the functionality assigned to their roles. It shall use authentication, authorization, encryption, and input validation. |
| NFR-002: Integrity | The system shall keep resource-request data accurate and consistent, except when changed by authorized users through authorized actions. |
| NFR-003: Transparency | The system shall provide authorized users with clear, timely visibility into request status, history, and decisions. |
| NFR-004: Accountability | The system shall maintain a complete, tamper-resistant record of actions taken on requests, including approvals, rejections, and queries. |
| NFR-005: Efficiency | The system shall be intuitive and straightforward to use without disrupting users' workflows. |
| NFR-006: Performance | The system shall operate efficiently and reliably. |
| NFR-007: Availability | The system shall be available to users at all times with minimal downtime. |

## 3. General constraints

- Only team leads may submit resource requests.
- Line managers manage resource allocations, transfers, and returns.
- Every valid request must be associated with a team, project, and department.
- Every allocation must be associated with a resource, an active assignee, a team, and a project assigned to that team.
- Access to request and reporting data is limited according to user role and, for department heads, department.
- The system does not place purchase orders or replace a full inventory-management system.

## 4. References

- Resource Tracker project problem statement supplied by the project stakeholders.
