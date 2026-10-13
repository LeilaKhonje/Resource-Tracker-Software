# SRS Document V1

## Resource Tracker

**Software Requirements Specification**  
**Version:** 1.0  
**Date:** 29 September 2026

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

This document is the first version of the Resource Tracker Software Requirements Specification. It describes the system's purpose, scope, users, functional requirements, non-functional requirements, and constraints. It is a guide for the software engineers and project supervisor.

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
- Notify team leads about request status changes and resource return deadlines.
- Maintain an audit trail of request decisions and resource allocations.
- Provide department heads and the managing director with appropriate historical and spending views.

The system tracks requested and disbursed resources for teams working on projects across the organization's departments. It is intended to replace informal, disconnected request channels with a transparent and accountable workflow.

Resource Tracker will **not** place orders to purchase resources, operate as an inventory management system, or allow users other than team leads to submit resource requests.

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

The system will support user registration and authentication, with access determined by each user's role. Team leads will submit resource requests containing the required item and organizational details. Requests will be associated with a team, project, and department and routed to a line manager.

Line managers will review requests and approve, reject, or query them. The system will record these decisions and maintain resource allocation history. Team leads will be able to track their requests and receive notifications about important status changes and return deadlines. Department heads and the managing director will have access to historical decisions and spending information appropriate to their responsibilities.

### 2.2 User characteristics and roles

#### 2.2.1 Team leads

Team leads supervise project teams in departments. They can create and submit resource requests for their teams and track the progress and status of those requests.

#### 2.2.2 Line managers

Line managers receive requests from team leads. They can track and review requests, approve or reject them, and query requests when more information is needed. They can also view available-resource information to inform their decisions.

#### 2.2.3 Department heads

Department heads can access data for their own departments, including historical approval decisions and departmental spending patterns.

#### 2.2.4 Managing director

The managing director can view historical approval decisions, spending patterns across all departments, and the resource-request audit trail.

### 2.3 Functional requirements

#### 2.3.1 User registration and authentication

- The system shall allow users to register and authenticate using unique credentials: a company-assigned email address and a password.
- The system shall support the roles Team Lead, Department Head, Line Manager, and Managing Director, with permissions assigned according to role.

#### 2.3.2 Create and submit a resource request

- The system shall allow a team lead to request hardware, software, and other materials required for a project.
- Each request shall include the item's description, manufacturer's label, pricing, batch number, quantity, and vendor.
- The request shall be routed to the appropriate line manager for review.

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
- The system shall notify team leads when a resource's assigned time limit has expired and it should be returned.

#### 2.3.9 Display available resources

- The system shall display available resources to line managers to support their decisions.
- The system shall show the number of available resources in each relevant category.

#### 2.3.10 Track resource movement

- The system shall track resource movement within the company.
- The system shall provide line managers with information about who is currently using a resource.

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

*The source SRS labels Integrity as NFR-002, then labels Transparency as NFR-002 and subsequent items NFR-003 through NFR-006. This readme renumbers the entries sequentially to avoid duplicate identifiers; the requirement statements are retained in meaning.*

## 3. General constraints

- Only team leads may submit resource requests.
- Every valid request must be associated with a team, project, and department.
- Access to request and reporting data is limited according to user role and, for department heads, department.
- The system does not place purchase orders or replace an inventory-management system.

## 4. References

- Resource Tracker project problem statement supplied by the project stakeholders.
