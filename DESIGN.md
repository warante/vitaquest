# VitaQuest Design Contract

## Product intent

VitaQuest is a calm, Spanish-language personal health dashboard. The visual direction is warm, compact and encouraging: a light paper background, dark ink typography, muted green progress surfaces and orange accents for rewards and streaks.

No external reference design was supplied for this first implementation. This file documents the intended product surface so future Codex sessions can preserve the visual decisions instead of reconstructing them from memory.

## Token contract

- All colors, surfaces, borders, spacing, typography sizes, radii and shadows live in `app/globals.css` under `:root`.
- Component selectors consume `var(--...)` tokens. New values should be added to the token layer before being used in a selector.
- `--border-thin` is the shared thin-border measurement. The mobile media query keeps its breakpoint literal because CSS custom properties cannot be used in media-query conditions.

## Responsive contract

- At desktop widths, `.shell` uses a fixed sidebar and a constrained content column.
- At widths up to 820px, the layout becomes one column, navigation moves above the content, panels stack and action cards remain usable without horizontal scrolling.
- The mobile layout must preserve the same information hierarchy: greeting, streak, daily goal, actions, progress and reward.

## Component contract

- `Eyebrow` provides the small uppercase section label.
- `ActionCard` is a real button with an `aria-pressed` state and a completed visual state.
- `ProgressBar` exposes `role="progressbar"` and the current value.
- `WeeklyBars` renders the compact weekly activity chart.

## Interaction contract

- The five daily actions are local interactive state for the first slice: breakfast, walking, water, dinner and sleep/rest.
- Completing or undoing an action updates the daily progress indicator and XP summary.
- Navigation items are real anchors to the dashboard sections so the shell remains useful before routing is introduced.

## Fase 3 contract

- The app is installable as a standalone Spanish PWA with a green VitaQuest icon, manifest and offline shell cache.
- A visible keyboard skip link jumps directly to the main content; interactive controls expose focus rings, pressed states and reduced-motion behavior.
- The reward panel owns the first export action: it downloads a date-stamped JSON snapshot of the current actions, XP, streak and weekly summary.
- Mobile keeps navigation horizontally scrollable and stacks panels without introducing horizontal page overflow.

## Fase 4 contract

- Evolution panels use green for active progress, warm cream for personal controls and muted cards for locked achievements.
- The 12-week route is compact and scannable: current week, target focus, adherence progress and numbered milestones.
- Reminder controls are deliberately local and transparent; the interface says that scheduling is device-only until account-backed notifications exist.
- Locked achievements remain visible with progress text so the product rewards the next useful action instead of hiding unfinished work.

## Private access contract

- `/login` is the only unauthenticated product screen; the dashboard and data APIs require the `vitaquest_session` cookie.
- The access key is server-only in `VITAQUEST_ACCESS_KEY`; it must never appear in client code, URLs or repository files.
- The login surface uses the existing paper, ink and green token system, with a clear error state and a 30-day device-session note.
