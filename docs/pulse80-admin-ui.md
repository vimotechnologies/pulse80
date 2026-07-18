# Pulse80 Admin UI System

Use this for Admin Portal dashboard and organization workflows so new screens keep the approved Pulse80 look.

The source of truth is `app/globals.css`.

Reusable React wrappers live in `components/admin/ui/PulseAdminUI.tsx`, but they should only compose the global `.pulse-*` classes. Do not hardcode new visual styles in page components unless a one-off layout absolutely requires it.

## Typography

- Page/breadcrumb emphasis: `16px` only where needed.
- Card titles and section titles: `14px`.
- Tabs, buttons, labels, row text, metadata, badges, and table text: `12px`.
- Metric numbers may use `20px` to `24px`.

## Surfaces

- Primary cards: white background, `16px` radius, light `card-border`, soft shadow.
- Tab-attached content cards: no top radius, `16px` bottom radius.
- Rows: compact, white, soft dividers, grey hover state.

## Actions

- Use `AdminButton` from `components/admin/ui/PulseAdminUI`.
- CSS class source: `.pulse-button`, `.pulse-button-primary`, `.pulse-button-secondary`, `.pulse-button-outline-primary`.
- Use `AdminIconButton` for three-dot menus and compact icon-only controls.
- Default admin action buttons should be `12px`.
- Primary action color is Pulse80 blue; destructive actions use red only when needed.

## Navigation Tabs

- Use `AdminTabButton`.
- CSS class source: `.pulse-tab`, `.pulse-tab-active`.
- Active tab uses Pulse80 blue text and bottom border.
- Inactive tab hover uses a subtle grey background and `16px` radius.

## Badges

- Use `AdminBadge`.
- CSS class source: `.pulse-badge`, `.pulse-badge-success`, `.pulse-badge-warning`, `.pulse-badge-danger`, `.pulse-badge-info`, `.pulse-badge-neutral`.
- Success/active/low risk: green.
- Pending/medium risk: amber.
- High/critical/error: red.
- Neutral/prospect/archived: soft grey.

## Metrics

- Use `AdminMetricCard`.
- CSS class source: `.pulse-metric-card`, `.pulse-metric-icon`, `.pulse-metric-value`.
- Equal-width metric cards should use compact icon circles, `20px` values, and `12px` labels/subtext.

## Icons

- Use Iconsax only through `components/icons/IconsaxIcons.tsx`.
- Do not mix Lucide, Feather, or raw SVG for admin UI icons.
