# Pulse80 App Functionality Overview

This document describes how the Pulse80 app currently functions. It reflects the frontend state of the product so far: a Next.js App Router application with a polished login page, three role-based portal experiences, mock data, reusable UI components, and no backend integration yet.

## Current Purpose

Pulse80 is currently a frontend-only enterprise wellness intelligence platform. It is designed to show how different users would move through operational wellness workflows:

- Admin and operations users manage organizations, activations, practitioners, screenings, results, reports, recommendations, billing, users, and settings.
- Client organization users review executive wellness reports, activations, recommendations, insights, and settings.
- Health practitioners manage field assignments, screening batches, profile readiness, documents, payments, and settings.

The app is intended for UI review, stakeholder preview, and workflow validation before backend, authentication, and database work is added.

## Technology Stack

- Framework: Next.js App Router
- Styling: Tailwind CSS with Pulse80 design tokens in `app/globals.css`
- Font: local Axiforma via `next/font/local` in `app/layout.tsx`
- Icons: Iconsax through the shared wrapper at `components/icons/IconsaxIcons.tsx`
- Data: local mock data in `data/`
- Deployment target: Vercel preview

## App Entry Flow

The root route redirects into the product experience. The app also has a dedicated login screen at `/login`.

The login page is visual-only at this stage. It includes:

- Pulse80 logo
- Email and password fields
- Password visibility toggle
- Remember me checkbox
- Forgot password button
- Sign in button

There is no real authentication yet. The login form does not call an API, validate credentials, create a session, or connect to a backend.

On mobile, the login page is designed to fit within the viewport without scrolling. The mobile login experience shows only the login side with the centered logo and form.

## Portal Structure

The app has three main portal areas:

- `/admin`
- `/client`
- `/practitioner`

Each portal uses the shared `PortalLayout` component. The layout provides:

- Desktop sidebar navigation
- Collapsible sidebar state
- Top navigation
- Mobile bottom navigation
- Consistent content spacing and background

Portal-level navigation, names, descriptions, user labels, roles, and dashboard metadata come from `data/portal-phase-two.ts`.

## Admin Portal

The admin portal is the internal operations workspace. It supports operational review and management across the following pages:

- `/admin/dashboard`
- `/admin/organizations`
- `/admin/activations`
- `/admin/practitioners`
- `/admin/screenings`
- `/admin/results`
- `/admin/reports`
- `/admin/insights`
- `/admin/recommendations`
- `/admin/billing`
- `/admin/users`
- `/admin/settings`

The dashboard uses summary widgets and insights. Operational pages use scalable list/table views with local mock interactions.

Admin operational page content is driven by `data/admin-portal-ui.ts` and rendered through `components/admin/AdminOperationsPage.tsx`.

## Client Portal

The client portal is for an organization reviewing its wellness intelligence. It includes:

- `/client/dashboard`
- `/client/reports`
- `/client/insights`
- `/client/activations`
- `/client/recommendations`
- `/client/settings`

Client users can review reports, activations, recommendations, and executive-level wellness indicators. The data is aggregated and intentionally avoids real employee health records.

Client page content is driven by `data/client-portal-ui.ts` and rendered through `components/client/ClientExecutivePage.tsx`.

## Practitioner Portal

The practitioner portal supports field workflow tasks for health practitioners. It includes:

- `/practitioner/dashboard`
- `/practitioner/assignments`
- `/practitioner/screenings`
- `/practitioner/profile`
- `/practitioner/documents`
- `/practitioner/payments`
- `/practitioner/settings`

Practitioner users can review assignments, screening queues, document readiness, payment status, and profile sections. These workflows are mock-only and do not submit real clinical data.

Practitioner page content is driven by `data/practitioner-portal-ui.ts` and rendered through `components/practitioner/PractitionerWorkspacePage.tsx`.

## List View Workflow

Most operational pages use the reusable `DataListPage` component in `components/portal/DataListPage.tsx`.

This component provides:

- Page header
- Summary metrics
- Search input
- Filter tabs
- Filter selects
- Sort controls
- Export placeholder action
- Enterprise-style data table
- Row hover states
- Status badges
- Row action menu
- Detail drawer
- Pagination
- Optional bulk action bar
- Empty state
- Loading state
- Warning state
- Error state

All interactions are local frontend behavior. Search, filtering, sorting, pagination, row selection, status updates, modal edits, archive actions, and drawer interactions happen in React state only.

## Detail Drawers and Modals

Rows in list views open a right-side detail drawer. The drawer shows:

- Record title and subtitle
- Detailed metadata
- Key fields
- Progress where available
- Readiness checklist where available
- Contextual actions

Create, edit, archive, upload, request, save, submit, export, and download actions are placeholders. They update local UI state or show local feedback only.

## Mock Data

The app currently uses local mock data only. The main data files are:

- `data/portal-phase-two.ts`
- `data/admin-portal-ui.ts`
- `data/client-portal-ui.ts`
- `data/practitioner-portal-ui.ts`
- `data/admin-dashboard.ts`

The mock data includes organizations, activations, practitioners, screening records, results, reports, recommendations, invoices, users, assignments, documents, payments, and portal dashboard metrics.

Nothing is persisted. Refreshing the browser resets local UI changes.

## What Is Not Implemented Yet

The app does not currently include:

- Real authentication
- Sessions
- Authorization rules
- Backend API routes
- Prisma
- Database connection
- Real file uploads
- Real payment processing
- Real report generation
- Real email or notification delivery
- Real search indexing
- Persistent create, edit, archive, or delete actions

These are intentionally out of scope for the current frontend preview.

## Design System

The UI is designed to feel clinical, calm, enterprise, and premium.

Important design rules currently in place:

- Font sizes inside portal pages should not exceed 20px.
- Axiforma is the global font.
- Icons should come from `components/icons/IconsaxIcons.tsx`.
- Iconsax uses a consistent Linear style.
- Blue is used for primary actions and active intelligence.
- Green is used for verified, completed, success, and low-risk states.
- Amber is used for warning, pending, and medium-risk states.
- Red is reserved for high-risk, critical, error, or urgent states.
- Dashboards use cards and summary widgets.
- Operational pages use list/table workflows instead of large repeated cards.

Additional UI guidance is documented in `docs/pulse80-ui-rules.md`.

## Icons

Icons are sourced from `iconsax-react`, but app code should import icons from the local wrapper:

```ts
import { Search, Bell, User } from "@/components/icons/IconsaxIcons";
```

The wrapper sets shared defaults:

- `variant="Linear"`
- `color="currentColor"`
- default size of `24`

New icons should be added to `components/icons/IconsaxIcons.tsx` before being used elsewhere.

## Routing Summary

Top-level routes:

- `/`
- `/login`
- `/admin`
- `/client`
- `/practitioner`

Portal index routes redirect to their dashboard pages. For example:

- `/admin` redirects to `/admin/dashboard`
- `/client` redirects to `/client/dashboard`
- `/practitioner` redirects to `/practitioner/dashboard`

## Build and Verification

Useful commands:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

The app is expected to build on Vercel without environment variables because it does not currently depend on backend services.

If Vercel asks for an environment variable, a harmless placeholder can be used:

```env
NEXT_PUBLIC_APP_ENV=preview
```

## Current Development Notes

- Keep login changes scoped because the login design is considered approved.
- Keep backend, auth, Prisma, and database work out unless explicitly requested.
- Use mock data and local React state for UI behavior.
- Prefer reusable portal components before creating page-specific UI.
- Continue using list views for operational records and cards for summary metrics.
- Run lint and build after shared layout, icon, route, or data-rendering changes.
