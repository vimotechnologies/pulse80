# Pulse80

Pulse80 is a monorepo containing independently installable frontend and backend
packages. The repository root orchestrates them without owning their runtime
dependencies.

## Structure

```text
pulse80-frontend/  Independent Next.js package
pulse80-backend/   Independent Node.js and TypeScript backend package
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

`pulse80-backend` runs independently on `http://localhost:4000`. Start it from
its directory with `npm run dev`, or from the repository root with
`npm run dev:backend`.

## Run applications together

From the repository root:

```bash
npm run dev
```

The root launcher starts both the frontend and backend development servers.
