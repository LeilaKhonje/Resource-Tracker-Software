# Authentication

The API provides `POST /auth/register` and `POST /auth/login`. Registration
accepts `firstName`, `lastName`, `email`, and a password. The first account successfully registered
receives the `managing_director` role. Later accounts are registered with a
`null` role; clients cannot choose their role. The database enforces that at
most one account has the managing director role. Unassigned users can log in,
but cannot access endpoints protected by role requirements.
Passwords are stored as bcrypt hashes with a cost factor of 12. Both endpoints
return an `accessToken` and a public user object; the one-hour bearer token
contains the user's ID, email, and role.

Set `JWT_SECRET` to a random value of at least 16 characters before starting
the application. Database connection settings are `DB_HOST`, `DB_PORT`,
`DB_USERNAME`, `DB_PASSWORD`, and `DB_DATABASE`. Never accept role changes
from public registration input.

Protect resource endpoints with `JwtAuthGuard` and apply `@Roles(...)` with
`RolesGuard` to enforce role-specific access. A valid token is sent as
`Authorization: Bearer <accessToken>`.

Department heads can assign `team_lead` through `PATCH /users/:id/role` with a
JSON body such as `{"role":"team_lead"}`. The managing director can assign
`line_manager` and `department_head`. The managing director role cannot be
assigned or changed through this endpoint.
