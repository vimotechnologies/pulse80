# Pulse80

Pulse80 is a monorepo containing independently installable frontend and backend
packages. The repository root orchestrates them without owning their runtime
dependencies.

## Structure

```text
pulse80-frontend/  Independent Next.js package
pulse80-backend/   Independent backend package (runtime not selected yet)
scripts/           Repository-level orchestration
```

## Frontend

Install each package's dependencies independently:

```bash
cd pulse80-frontend
npm install
```

The frontend can be started from its directory with `npm run dev`, or from the
repository root with `npm run dev:frontend`.

## Backend

`pulse80-backend` establishes the backend's ownership and deployment boundary
only. No backend framework or implementation has been chosen yet, so its local
`dev` command is intentionally not present.

## Run applications together

From the repository root:

```bash
npm run dev
```

The root launcher starts every application that defines its own `dev` command.
It starts the frontend now and will automatically start the backend after the
backend package adds its `dev` command.
