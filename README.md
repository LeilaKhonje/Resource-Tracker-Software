# Resource Tracker API

## Authentication and roles

The API provides `POST /auth/register` and `POST /auth/login`. Registration
accepts `firstName`, `lastName`, `email`, and a password. New accounts have no
role until an authorized user assigns one. Public registration cannot choose a
role. The database enforces that at most one account has the Managing Director
role.

Passwords are stored as bcrypt hashes with a cost factor of 12. Both endpoints
return an `accessToken` and a public user object; the one-hour bearer token
contains the user's ID, email, and role.

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
