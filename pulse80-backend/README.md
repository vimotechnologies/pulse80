# Pulse80 Backend

This package contains the independently deployable Pulse80 backend.

It currently uses the Node.js HTTP runtime, TypeScript, and Supabase clients.

## Development

```bash
npm install
npm run dev
```

The backend listens on `http://localhost:4000` by default. Its health endpoint is available at `GET /health`, and GraphQL is available at `/graphql`.

The initial GraphQL schema exposes:

```graphql
query {
  health {
    status
    service
    environment
  }
}
```

## Commands

- `npm run dev` starts the backend in watch mode.
- `npm run typecheck` checks the TypeScript source.
- `npm run build` compiles the backend into `dist/`.
- `npm run start` runs the compiled backend.
- `npm run supabase:types` regenerates TypeScript types from the linked Supabase
  project.

### Previewing the client dashboard with development data

For a development Supabase project only, run `supabase/seed-client-dashboard.sql` in the Supabase SQL editor after applying migrations. It uses existing organisations and practitioner assignments, creates a scheduled activation, and inserts approved screening records with department and date values. The dashboard then reads those records through the normal GraphQL path.
