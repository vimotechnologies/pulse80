# Pulse80 UI Rules

Pulse80 should feel light, clinical, minimal, enterprise, and premium. The interface should support healthcare operations, executive wellness intelligence, and practitioner field workflows without looking like a generic admin template or consumer fitness app.

## Brand Tone

- Use calm, clinical language.
- Keep copy concise and operational.
- Avoid consumer fitness language, playful wellness phrasing, or marketing-heavy sections inside the portal experience.
- Dashboards should feel credible, structured, and easy to scan.

## Typography

- Use Axiforma across the entire app.
- Axiforma is loaded locally from `app/fonts` through `next/font/local`.
- Global typography controls live in `app/globals.css` under the `Typography controls` comment.
- Edit letter spacing in one place using:
  - `--pulse-tracking-display`
  - `--pulse-tracking-title`
  - `--pulse-tracking-heading`
  - `--pulse-tracking-eyebrow`
- Buttons, inputs, textareas, and selects must inherit the global font.
- Do not use viewport-based font scaling.
- Keep letter spacing controlled by CSS variables, not one-off hard-coded values.

## Color

- Pulse80 blue is the primary action and intelligence color.
- Use blue for active states, links, primary buttons, focus rings, and calm platform signals.
- Use Pulse80 red only for risk, urgent alerts, critical health flags, and pulse indicators.
- Use green for verified, completed, success, and low-risk states.
- Use amber for pending, medium-risk, and awaiting-review states.
- Avoid dark-heavy layouts.
- Avoid one-note palettes dominated by a single hue family.

## Icons

- Use Iconsax only.
- Icons should use the shared wrapper in `components/icons/IconsaxIcons.tsx`.
- Add new Iconsax exports to that wrapper before using them in components.
- Keep icon style linear and visually light.
- Do not mix in Lucide, Feather, custom SVG icons, or inline icon drawings unless there is no Iconsax equivalent.

## Logo Usage

- Expanded portal sidebars use `/brand/pulse80-logo-no-tagline.png`.
- Compact or collapsed areas use `/brand/pulse80-mark.png`.
- The logo should not sit inside an unnecessary white box.
- On mobile login, the logo should be centered above the form.

## Layout

- Portal pages use the shared `PortalLayout`.
- Desktop portal sidebar should support expanded and collapsed states.
- Expanded desktop sidebar width is `w-64`.
- Collapsed desktop sidebar width is `w-20`.
- Collapsed sidebar should show the Pulse80 mark and icon-only navigation.
- Main content and top navigation must adjust with the sidebar width.
- Mobile portal navigation uses a bottom nav with five important actions.
- The middle mobile nav action is the Dashboard button and should be larger and visually emphasized.
- Mobile menu should expand from the bottom.

## Cards

- Keep cards quiet and functional.
- Use cards for metrics, widgets, repeated list items, modals, and framed tools.
- Do not put cards inside cards.
- Do not style full page sections as floating cards.
- Keep card radius at `rounded-lg` or similar restrained values unless a component already has an approved shape.
- Use subtle borders and soft shadows.
- Portal filter/search cards must use `components/ui/ListFilterCard.tsx`.
- Portal metric cards must use `MetricCardShell`, `PortalMetricCard`, or a wrapper that delegates to the shared metric shell.
- Portal cards should use `PulseCard` directly or through an approved wrapper; avoid local one-off card borders, shadows, or radius values.

## List Tables

- All portal list tables must feel related across Admin, Client, and Practitioner portals.
- Use `ResizableGridTable` for CSS-grid list tables, especially custom operational tables like Organizations and Practitioners.
- Use the shared `DataListPage` table for report, screening, result, activation, insight, recommendation, billing, user, client, and practitioner workspace lists.
- Table row dividers must be straight grey lines using the Pulse80 divider color, not rounded or pill-like row borders.
- Table columns should be resizable by the user.
- Filter/search sections above tables must use the shared `ListFilterCard`, `ListSearchField`, `ListFilterField`, and `ListClearButton`.
- Filter/search cards may contain only search, Clear Filters, and filter dropdown fields.
- Do not place sort controls, export buttons, tabs, or list/grid view toggles inside filter/search cards.
- Dropdowns should show the filter label as the first-view placeholder, then show `All` only after the user explicitly selects `All`.

## Forms

- Inputs should be clean, clinical, and easy to scan.
- Autofill states must not introduce mismatched browser backgrounds.
- Inputs, buttons, and form controls inherit Axiforma.
- Focus states should use Pulse80 blue with a soft ring.
- Do not use loud shadows on primary login buttons.

## Login Page

- Do not redesign the approved login page unless explicitly requested.
- On desktop, the login page may show the left brand/marketing panel.
- On mobile, show only the login side with the logo at the top.
- Mobile login content should be centered visually in the screen.
- Mobile login should not include the left feature text and icons.

## Dashboards

- Admin dashboard should feel like operational control.
- Client dashboard should feel like executive reporting and insights.
- Practitioner dashboard should feel like a simple field workflow.
- Use dummy data only until backend/auth/database work is explicitly requested.
- Do not add real authentication, database logic, or Prisma without explicit approval.
- Keep dashboard components related across portals, but avoid making every portal identical.

## Responsive Behavior

- Mobile screens should prioritize the active task.
- Avoid squeezing desktop sidebar patterns into mobile.
- Use bottom navigation for mobile portal navigation.
- Ensure text fits within buttons, cards, and navigation items on small screens.
- Avoid overlapping UI elements.
- Stable elements like boards, nav bars, counters, and icon buttons should have stable dimensions.

## Implementation Rules

- Prefer shared components in `components/portal` for portal UI.
- Prefer existing design tokens in `app/globals.css`.
- Keep UI changes scoped and consistent with current Pulse80 patterns.
- Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` after broad layout, route, font, or shared component changes.
