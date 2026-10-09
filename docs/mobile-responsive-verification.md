# Mobile responsive verification

Branch: `feat/mobile-responsive-branding`

## Changes

- Retained the branch's branded header, bottom navigation and safe-area spacing.
- Allowed the login page to grow and scroll on short screens; enlarged the password visibility control.
- Added viewport safe-area and keyboard resize settings without disabling zoom.
- Added mobile form text sizing, touch targets, wrapping page actions, and grid shrink boundaries.
- Applied a shared mobile modal boundary to existing dialogs, keeping dialogs above navigation and scrollable within the dynamic viewport. Background scrolling is disabled while dialogs are open.
- Made the collapsed mobile menu inert, added Escape dismissal, contained tall menus, and reset menu state when switching to desktop width.
- Kept wide client tables, risk tables, wellness schedules and calendars inside scrollable containers.
- Adapted practitioner registration, invitation, account setup, walk-in and roster controls for narrow screens.
- Constrained date pickers and toast messages to phone widths. Profile photo cropping now uses the rendered preview size when calculating pan offsets.
- Corrected two existing practitioner-directory check failures: an unescaped apostrophe and a comparison against a status excluded by the containing loop.

## Checks

- `npm --prefix pulse80-frontend run build`: passed, including TypeScript and all 42 generated pages.
- `npm --prefix pulse80-frontend run lint`: passed.
- `git diff --check`: passed.

Chrome browser checks used 320, 375, 390, 768 and 1440 pixel widths.

| Surface | Method | Result |
| --- | --- | --- |
| Login | Real Next.js route at each width, 500px height; fill fields, reveal password, scroll to submit | Passed |
| Protected route | Visit admin dashboard without a session | Redirected to login |
| Practitioner registration | Real component with synthetic data in portal shell | Passed at all widths |
| Admin risk distribution and wellness calendar | Real components with synthetic data | Passed at all widths |
| Walk-in registration | Real component with synthetic action responses | Passed at all widths |
| Client activations and table | Real component with synthetic activation | Passed at all widths |
| Practitioner dashboard | Real component with synthetic metrics | Passed at all widths |
| Screening capture | Real component with populated synthetic assignment and measurement fields | Passed at all widths |

The 35 isolated component/viewport checks detected no document-level horizontal overflow and no browser runtime errors. Screenshots were captured and representative phone, tablet and desktop images were inspected. Wide tables and calendars intentionally retain internal horizontal scrolling.

At 320 × 500, interaction checks passed for:

- Login password visibility and error feedback, with the support link reachable by scrolling.
- Opening the mobile menu, dismissing with Escape, and making hidden links inert.
- Scrolling the practitioner registration dialog, filling fields, selecting a capability and submitting to a test adapter.
- Generating walk-in codes, downloading CSV, activating a code and displaying test success feedback.
- Selecting a screening assignment, entering measurements and a participant code, confirming consent and submitting to a test adapter.
- Scrolling the client table without scrolling the whole document horizontally.

## Verification limits

Authenticated portal checks used the real React components and generated application CSS, but synthetic data and action adapters. Next.js image/link/navigation adapters were used only in that isolated test harness. Authentication was not bypassed in the application and no real records were created.

Successful authentication, invitation delivery, password setup from an invitation, profile persistence, walk-in persistence and screening persistence still require test accounts and a test backend. No test-account setup was supplied during this work. A reduced-height browser viewport checks available layout space; physical iOS/Android keyboard behaviour and safe-area rendering were not tested on devices.

Temporary browser harnesses, screenshots and JSON results are under `/tmp/pulse80-mobile-qa`. No test dependencies were added to the repository. Changes have not been committed, pushed or deployed.

## Metric carousel update

Metric groups now share `MetricCardGroup` across admin, client and practitioner dashboards and operational lists. Below 768px they use native horizontal touch scrolling with card snapping, a visible preview of the next card, and keyboard scrolling. At 768px and above they retain their existing grids, including the three-column programme summary.

The three portal fixtures passed all 15 viewport checks: native touch gestures, keyboard scrolling and last-card reachability at 320/375/390px; unchanged two-column and four-column grids at 768/1440px. No document-level horizontal overflow or runtime errors occurred. The tests use synthetic data and Chrome touch emulation, not physical devices. A final 320px check covers the spacing adjustment.
