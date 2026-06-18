# SUPERBASE

## Supabase Certificate Setup

If your Supabase Postgres instance requires a custom root certificate, download the certificate from the Supabase project and store it in Heroku as `SUPABASE_ROOT_CERT`.

## Download The Certificate From Supabase

1. Open your Supabase project dashboard.
2. Go to `Project Settings`.
3. Open the database or connection settings section for Postgres.
4. Find the SSL or root certificate information.
5. Copy or download the PEM certificate content provided by Supabase.

The value should look similar to this:

```text
-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----
```

## Add The Certificate To Heroku

Open your Heroku app:

1. Go to `Settings`.
2. Open `Reveal Config Vars`.
3. Create the `SUPABASE_ROOT_CERT` variable.
4. Paste the full PEM certificate content as the value.

## Notes

Use the certificate exactly as provided by Supabase, including the `BEGIN CERTIFICATE` and `END CERTIFICATE` lines.

If your Supabase project rotates or changes its certificate, update the Heroku config var and redeploy or restart the app.
