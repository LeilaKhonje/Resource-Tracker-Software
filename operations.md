# Resource Tracker Operations

## Purpose and current scope

Resource Tracker is the central API for recording and reviewing organizational resource requests. Its intended workflow formalizes requests by team and project, routes them to line managers, and gives management an audit trail and spending visibility. The current application provides the API foundation for that workflow: a NestJS HTTP API, MySQL persistence, account registration and login, JWT authentication, role assignment, and a health-style root endpoint. Resource request, project, team, inventory, notification, and audit-trail endpoints are not implemented yet.

In a fresh database, the first account to register is treated as the managing director. The app does not verify the registrant's real-world job title. Later registrations receive no role until the managing director assigns one.

The system is intended for four roles:

| Role | Intended responsibility |
| --- | --- |
| `team_lead` | Submit resource requests and track their status |
| `line_manager` | Review, approve, reject, or query requests |
| `department_head` | View their department's decisions and spending |
| `managing_director` | View organization-wide decisions, spending, and audit history |

The SRS excludes purchasing resources and inventory management. The SRS mentions displaying available resources and tracking resource movement; these are future capabilities and are not currently exposed by this API.

## How the app works

1. The NestJS application starts on port `3000` by default (`PORT` can override it) and connects to MySQL using the `DB_*` settings.
2. On registration, the API validates the request, trims and lowercases the email, hashes the password with bcrypt (12 rounds), and stores the user. The first successful registration is assigned `managing_director`; subsequent users have a `null` role until the managing director assigns one.
3. Login checks the password and returns a signed JWT and a public user object. The token is valid for one hour and contains the user's ID, email, and role. Password hashes are not returned.
4. Protected endpoints require `Authorization: Bearer <accessToken>`. `JwtAuthGuard` checks the token; `RolesGuard` checks role metadata. The current role-management endpoint is restricted to the managing director.

Global request validation strips no unexpected fields: it rejects them (`forbidNonWhitelisted`) and transforms DTO input. Consequently, a client cannot set a role during public registration.

## Run locally

Requirements: Node.js 20 or later, npm, and MySQL 8.4 (or a compatible MySQL server).

Create a `.env` file in the project root with database values matching your MySQL instance:

```dotenv
PORT=3000
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=resource_user
DB_PASSWORD=resourcepassword
DB_DATABASE=resource_tracker
JWT_SECRET=replace-with-a-random-secret-at-least-16-characters
```

Install dependencies and start the API:

```sh
npm install
npm run start:dev
```

To use the included Docker Compose database and app, configure `.env` for the app container (`DB_HOST=mysql`, `DB_PORT=3306`), then run:

```sh
docker compose up --build
```

The Compose file publishes MySQL on host port `3307`; the application container reaches it at `mysql:3306`. TypeORM currently has `synchronize: true`; this is convenient for development, but should be replaced with migrations and disabled for production deployments.

## HTTP API

All request and response bodies use JSON. Current endpoints:

| Method and path | Authentication | Purpose |
| --- | --- | --- |
| `GET /` | Public | Returns `Hello World!` |
| `POST /auth/register` | Public | Register an account and return a token |
| `POST /auth/login` | Public | Authenticate and return a token |
| `PATCH /users/:id/role` | Managing director | Assign a non-director role to a user |

### Register

`POST /auth/register`

```json
{
  "firstName": "Amina",
  "lastName": "Phiri",
  "email": "amina@company.com",
  "password": "team1234"
}
```

Registration requires a valid `@company.com` email and a password 4–8 characters long containing at least one digit. A successful response contains `accessToken` and `user` (`id`, `fullName`, `email`, `role`). The first account becomes managing director; later accounts initially have `role: null`. Duplicate email addresses return `409 Conflict`; invalid input returns `400 Bad Request`.

### Login

`POST /auth/login`

```json
{
  "email": "amina@company.com",
  "password": "team1234"
}
```

Successful login returns the same response shape as registration. Incorrect email or password returns `401 Unauthorized`. Registration enforces the company email suffix; the login DTO currently validates email syntax but does not enforce that suffix.

### Assign a role

`PATCH /users/:id/role`

Send the UUID of the target account and one of `team_lead`, `line_manager`, or `department_head`:

```json
{
  "role": "team_lead"
}
```

Include the managing director's bearer token. The response contains the updated public user fields. Invalid UUID or role returns `400`; a missing user returns `404`; missing/invalid credentials return `401`; a non-managing-director caller is denied by role authorization. The endpoint cannot assign the managing director role or change the existing managing director's role.

## Test the endpoints manually

With the API running at `http://localhost:3000`, use the following `curl` sequence. Use unique email addresses for each registration run. The first account in a fresh database receives the managing director role.

```sh
BASE_URL=http://localhost:3000

# 1. Root endpoint: expect HTTP 200 and "Hello World!"
curl -i "$BASE_URL/"

# 2. Register the first user (expect HTTP 201 and a managing_director role)
curl -i -X POST "$BASE_URL/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Amina","lastName":"Phiri","email":"amina@company.com","password":"team1234"}'

# 3. Log in (expect HTTP 200); copy accessToken and user.id from the response
curl -i -X POST "$BASE_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"amina@company.com","password":"team1234"}'

# 4. Register another account (expect HTTP 201 and role null)
curl -i -X POST "$BASE_URL/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Tapiwa","lastName":"Banda","email":"tapiwa@company.com","password":"worker12"}'

# 5. As managing director, assign team_lead to Tapiwa's user UUID
curl -i -X PATCH "$BASE_URL/users/SECOND_USER_UUID/role" \
  -H 'Authorization: Bearer DIRECTOR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"role":"team_lead"}'
```

Expected failure checks:

```sh
# Duplicate registration: HTTP 409
curl -i -X POST "$BASE_URL/auth/register" -H 'Content-Type: application/json' \
  -d '{"firstName":"Amina","lastName":"Phiri","email":"amina@company.com","password":"team1234"}'

# Invalid email/password or unexpected input property: HTTP 400
curl -i -X POST "$BASE_URL/auth/register" -H 'Content-Type: application/json' \
  -d '{"firstName":"A","lastName":"B","email":"person@example.org","password":"abc"}'

# Incorrect credentials: HTTP 401
curl -i -X POST "$BASE_URL/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"amina@company.com","password":"wrong123"}'

# No bearer token on role endpoint: HTTP 401
curl -i -X PATCH "$BASE_URL/users/SECOND_USER_UUID/role" \
  -H 'Content-Type: application/json' -d '{"role":"team_lead"}'
```

Replace `SECOND_USER_UUID` and `DIRECTOR_ACCESS_TOKEN` with values from the registration/login responses. To test role denial, log in as a non-director user and use that token for the role assignment; authorization should reject it.

## Automated checks

```sh
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

The repository includes Jest unit specs for authentication and a basic end-to-end spec for `GET /`. The e2e spec imports the real application module and therefore needs a reachable database plus `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, and `JWT_SECRET` configured. The current e2e suite does not yet exercise registration, login, or role assignment through HTTP; the curl checks above cover those endpoint behaviors manually.

## Operational notes

- Keep `JWT_SECRET` private and use a randomly generated value of at least 16 characters.
- Only the managing director can assign roles through the current API. The public registration endpoint intentionally has no role field.
- Unassigned users can authenticate, but cannot access endpoints that require a role.
- There are no resource request endpoints, approval history, notifications, projects, teams, or spending reports in the current codebase. Those features remain necessary to fulfill the full SRS workflow.
