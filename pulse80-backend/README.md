# Pulse80 Backend

This package contains the independently deployable Pulse80 backend.

It currently uses the Node.js HTTP runtime, TypeScript, and Supabase clients.

## Development

```bash
npm install
npm run dev
```

The backend listens on `http://localhost:4000` by default. Its health endpoint
is available at `GET /health`.

## Commands

- `npm run dev` starts the backend in watch mode.
- `npm run typecheck` checks the TypeScript source.
- `npm run build` compiles the backend into `dist/`.
- `npm run start` runs the compiled backend.
- `npm run test:supabase` builds the backend and checks access to the configured
  Supabase project.
