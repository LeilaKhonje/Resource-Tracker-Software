# Email setup (Brevo)

The API sends email through Brevo's SMTP relay using Nodemailer. The local `.env` file is ignored by Git and is loaded by the NestJS `ConfigModule` and Docker Compose.

Set these values in `.env` before starting the app:

- `MAIL_HOST`: Brevo relay host, normally `smtp-relay.brevo.com`.
- `MAIL_PORT`: SMTP port, normally `587`.
- `MAIL_USERNAME`: SMTP login from Brevo's SMTP & API settings.
- `MAIL_PASSWORD`: a Brevo SMTP key (not an API key).
- `APP_MAIL_FROM`: a sender address verified in Brevo.
- `API_BASE_URL`: public base URL of this API, used to build backend-served password reset links.

The app connects using `MAIL_HOST` and `MAIL_PORT` with TLS. Restart the app after changing `.env`. If either SMTP credential or the sender address is missing, the app skips delivery and logs a warning. `.env.example` provides a safe template; do not put real credentials in it or commit `.env`.
