# CoffeeShop

[![Build](https://github.com/jorgemrht/CoffeeShopBackend/actions/workflows/swift.yml/badge.svg)](https://github.com/jorgemrht/CoffeeShopBackend/actions/workflows/swift.yml)
[![Deploy Development](https://github.com/jorgemrht/CoffeeShopBackend/actions/workflows/deploy-development.yml/badge.svg)](https://github.com/jorgemrht/CoffeeShopBackend/actions/workflows/deploy-development.yml)
![Swift](https://img.shields.io/badge/Swift-6.3-F05138?logo=swift&logoColor=white)
![Vapor](https://img.shields.io/badge/Vapor-4-0D0D0D?logo=vapor&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

Backend API built with Vapor, PostgreSQL, Docker, Heroku, and Supabase.

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
heroku stack:set container -a <heroku-app-name>
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

## Documentation

* [Vapor](/vapor.md) — Detailed guide for running and debugging the backend locally.
* [Supabase](/superbase.md) — Step-by-step setup for TLS support.
* [MIT License](/LICENSE) — Project terms and conditions.
