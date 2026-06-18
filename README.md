# CoffeeShop

Backend API built with Vapor, PostgreSQL, Docker, Heroku, and Supabase.

## Documentation

- [Vapor local development](./vapor.md)
- [Supabase certificate setup](./superbase.md)

## Quick Start

You can run the project locally with Docker Compose:

```bash
docker compose build
docker compose up app
```

The API will be available at `http://localhost:8080`.

Useful local commands:

```bash
docker compose run migrate
docker compose run revert
docker compose down -v
```

Docker is useful when you want a production-like local environment. For debugging, faster edit/run cycles, or working directly from the IDE, 
there are other ways to run the server locally. Everything is documented in [vapor.md](/Users/jorge/Projects/CoffeeShop/CoffeeShopBackend/vapor.md#run-locally).

## Deploy to Heroku with Docker

Before deploying, define the required environment variables in the Heroku app settings.

Required variables:

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`

Optional TLS variables for Supabase:

- `SUPABASE_ROOT_CERT`

Certificate download and setup from Supabase is documented in [superbase.md](/Users/jorge/Projects/CoffeeShop/CoffeeShopBackend/superbase.md#supabase-certificate-setup).

Set them in:

1. Heroku Dashboard
2. Your app
3. `Settings`
4. `Reveal Config Vars`

Then deploy the Docker image to Heroku:

```bash
heroku container:login
heroku container:push web -a <heroku-app-name>
heroku container:release web -a <heroku-app-name>
```

After release, open the app logs if you want to validate startup:

```bash
heroku logs --tail -a <heroku-app-name>
```

## Migration Setup

Run database migrations after the deployment:

```bash
heroku run -a <heroku-app-name> -- ./CoffeeShop migrate --yes
```

If you need to revert the last migration:

```bash
heroku run -a <heroku-app-name> -- ./CoffeeShop migrate --revert --yes
```
