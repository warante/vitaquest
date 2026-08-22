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
