# Pulse80 Admin Portal Functionality

This document describes how the Admin / Operations Portal currently works in the frontend implementation.

## Current Scope

The admin portal is a frontend-only operations workspace. It uses mock data from `data/admin-portal-ui.ts` and reusable UI components to simulate how Pulse80 administrators would manage organizations, activations, practitioners, screenings, results, reports, recommendations, billing, users, and settings.

There is currently no backend connection, authentication, Prisma integration, database persistence, or real file export. Create, edit, archive, role change, status update, refresh, and download actions are local UI placeholders.

## Main Routes

The admin portal is available under `/admin`.

The index route redirects into the admin workspace, and the active admin pages are:

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

## Layout And Navigation

Admin pages use the shared portal layout and sidebar configuration from `data/portal-phase-two.ts`.

The admin navigation is organized around operational areas:

- Dashboard
- Organizations
- Activations
- Screenings
- Practitioners
- Results
- Reports
- Insights
- Recommendations
- Billing
- Users
- Settings

Icons are imported through the local Iconsax wrapper at `components/icons/IconsaxIcons.tsx`, which keeps icon style consistent across the platform.

## Dashboard Behavior

The dashboard is intended for summary-level visibility. It keeps card-style widgets for metrics, insights, and operational snapshots. This is the one admin area where cards are appropriate because the content is summarized rather than record-heavy.

Dashboard data comes from `data/admin-dashboard.ts`.

## Operational Page Behavior

Most admin operational pages use `components/admin/AdminOperationsPage.tsx`.

That component loads the correct page config from `adminPageConfigs` and passes it into the reusable `DataListPage` component. Each page defines its own table columns, but the interaction model is shared.

The standard operational page structure is:

1. Page header with title, description, refresh action, and primary action.
2. Compact summary metric widgets.
3. Toolbar with search, filters, tabs where available, sorting, and export placeholder.
4. Enterprise-style table with row hover states, status badges, and row actions.
5. Right-side detail drawer when a row is selected.
6. Pagination and optional bulk action bar.

## List And Table Features

The reusable list workflow lives in `components/portal/DataListPage.tsx`.

It currently supports:

- Local search over record title, subtitle, meta text, search text, and fields.
- Local filters based on each page config.
- Local tabs where a page defines tabs.
- Column sorting.
- Frontend-only pagination.
- Row click to open a detail drawer.
- Row action menu for details, edit, download, status update, and archive.
- Bulk selection for pages where it makes sense, currently billing and users.
- Empty state when filters return no records.
- Loading state during mock refresh.
- Warning and error state components.
- Local create/edit/archive modals.

## Page-Specific Columns

The admin list pages use page-specific column definitions in `AdminOperationsPage`.

Current column behavior includes:

- Organizations: organization, industry, employees, wellness score, risk level, package, last activation, status.
- Activations: activation, organization, date, services, practitioners, expected employees, status, progress.
- Practitioners: practitioner, profession, location, services, verification, availability, assignments.
- Screenings and Results: employee reference, organization, activation, department, risk level, referral required, captured by, date.
- Reports: report, organization, type, period, status, published date.
- Recommendations: recommendation, organization, priority, owner, impact, status, progress.
- Billing: invoice, organization, package, amount, due date, status.
- Users: user, role, organization/practitioner scope, status, last active.

Pages without custom columns fall back to a general record view.

## Detail Drawers

Clicking a row opens a right-side detail drawer.

The drawer shows:

- Record title and subtitle.
- Detail fields from the record config.
- Key metadata fields.
- Progress bar when the record includes progress.
- Warning message when the record includes a warning.
- Checklist when the record includes checklist data.
- Contextual actions such as edit, archive, or a placeholder secondary action.

The drawer is UI-only and does not fetch external data.

## Local Actions

The admin portal simulates operational actions locally:

- Refresh shows a loading state and success toast.
- Create adds a mock record to local React state.
- Edit updates the selected record title locally.
- Archive removes the record from the current local list.
- Reports can toggle between draft and published states.
- Recommendations can cycle through new, planned, and completed states.
- Users can change role locally from the row action menu.
- Download/export actions show placeholder feedback.

Refreshing the browser resets these local state changes because there is no persistence layer.

## Data Model

Admin operational data is defined in `data/admin-portal-ui.ts`.

Each admin page config includes:

- `id`
- `eyebrow`
- `title`
- `description`
- `primaryAction`
- optional `secondaryAction`
- `searchPlaceholder`
- filters
- summary metrics
- records
- optional tabs
- form labels
- empty state copy

Each record includes:

- title, subtitle, and meta text
- status and semantic status tone
- search keywords
- filter values
- display fields
- drawer details
- optional progress
- optional warning
- optional checklist

## Design Principles Currently Applied

The admin portal follows the current Pulse80 UI direction:

- Dashboard surfaces stay card-based for summaries.
- Operational pages use scalable list/table views.
- Repeated records avoid large card grids.
- Important details move into drawers.
- Font sizes stay at or below 20px in portal pages.
- Colors use Pulse80 semantic tones: blue for primary/active, green for success, amber for warning, and red for critical states.
- Icons use the Iconsax wrapper instead of mixing icon libraries.

## Known Limitations

The current admin portal is not production-functional yet.

Known limitations:

- No real authentication or user permissions.
- No backend API calls.
- No database persistence.
- No Prisma integration.
- No real report generation.
- No real invoice generation.
- No real exports or downloads.
- No server-side search, filtering, or pagination.
- Mock records are intentionally small but the UI is designed for larger record sets.

## What To Inspect Manually

When reviewing the admin portal, inspect:

- Table density and readability at desktop and mobile widths.
- Search and filter behavior on each admin list page.
- Row click behavior and drawer content.
- Row action menu placement and usability.
- Pagination controls.
- Bulk action bar on billing and users.
- Empty states after restrictive filters.
- Status badge colors and risk semantics.
- Whether admin dashboard cards still feel summary-focused rather than record-heavy.
