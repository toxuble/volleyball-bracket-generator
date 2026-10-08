# Volleyball bracket generator

A browser-only single-elimination tournament dashboard with a dark gray background, white text, and orange accents. No account, backend, dependency installation, or build step is needed to use it.

## Features

- 2–64 teams, event play time in minutes, 2/3/4/6 players per team, 1–16 courts, and start time.
- Automatic byes for the highest seeds, distributed across a power-of-two bracket.
- Editable opening-round team names, drag-to-swap positions, and keyboard-accessible up/down controls.
- Click a team’s advance button to select or undo a match winner. Swapping/shuffling positions clears results; changing time/courts preserves results.
- Point-based single-set or best-of matches fitted to allocated round slots, with every set target capped at 21. Later rounds have longer match slots by default.
- Compact bracket with setup inputs across the top and an optional Fit whole bracket overview.
- Full-window timeline with 30-minute checkpoints, thin draggable boundaries inside the bar and a reset button, and the selected overrun buffer.
- Estimated court schedule, CSV export, printing, and browser-local persistence.

## Timing model

Round slots plus the adjustable overrun buffer fill the event window exactly. The buffer defaults to 10%. No warm-ups, rest, court changes, or inter-set breaks are added.

The automatic allocation weights court waves and increases match-slot length in later rounds. Whole minutes are apportioned so there is no unallocated remainder. A round needs at least five minutes per wave; insufficient windows are rejected.

The planner fits one-set or odd-numbered best-of formats to each allocated slot, searching whole-point targets from 5 to 21. Longer slots use additional sets. Set targets never exceed 21; the win-by-two rule may extend the actual score. Best-of matches finish when a team wins a majority of sets. Every set is rally-scoring, win by two, without a hard scoring cap. The app records match winners; it does not record individual set scores.

[USA Volleyball’s 2025–2027 Indoor Rules, printed page 132](https://usavolleyball.org/wp-content/uploads/2023/03/2025-2027-USAV-Indoor-Rules-Book_FINAL.pdf) gives a 20-minute allowance for a set to 15 and a 45-minute allowance for two sets to 21. These scheduling allowances include six minutes of warm-up and three minutes between sets. Subtracting them yields a 14-minute benchmark to 15 and a derived 18 minutes per set to 21: (45 − 6 − 3) / 2. These are scheduling benchmarks, not measured average game lengths. Other targets are interpolated; targets below 15 are extrapolated. Displayed play estimates round to whole minutes. Multi-set estimates assume independent sets with equally matched teams: best-of-3 averages 2.5 sets and best-of-5 averages 4.125. This is an organizer estimate, not measured data for these teams. Custom formats differ from [official FIVB indoor scoring](https://www.fivb.com/volleyball/the-game/basic-rules/).

**Allocation is exact; actual playing time is uncertain.** Each court wave receives an allotted slot. The selected format has a separate estimated playing time and may end earlier or later. Team size affects roster totals only.

Drag a boundary bar to transfer time between adjacent rounds. Arrow keys change one minute, Shift changes five, and Home/End move to the allowed limits. The table shows read-only round durations; only boundary bars adjust time. The event length and buffer stay fixed. Reset timeline restores the automatic allocation while preserving teams and match results. Times are shown in 12-hour AM/PM format. The compact bracket has its own scroll area and a Fit whole bracket overview button. Custom allocations persist locally and reset when team count, courts, event length, or buffer changes.

## Run locally

Open `index.html` directly in a browser, or run `npm start` (requires Python 3) and visit `http://127.0.0.1:8080`. The dashboard uses system fonts and works offline. Tournament data stays in local storage on the visitor’s device and is not uploaded to GitHub. Visitors do not share a live tournament state.

## Tests

With Node.js 20 or newer, run `npm test`. Tests cover every team count from 2 through 64, bye seeds, match counts, court conflicts, round dependencies, slot progression, exact allocation, manual resizing, match formats, short event windows, and winner propagation. There are no npm dependencies to install.

## Publish with GitHub Desktop and GitHub Pages

1. Add this folder as a local repository in GitHub Desktop.
2. Publish as `toxuble/volleyball-bracket-generator`, with **Keep this code private** unchecked.
3. In the GitHub repository, open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Open **Actions → Verify and deploy dashboard → Run workflow** on `main` (or push a new commit).
5. After the deploy job succeeds, open the URL shown by the deployment: `https://toxuble.github.io/volleyball-bracket-generator/`.

The workflow tests the planner before uploading only the four application files and deploying. Pull requests run checks but do not deploy. Future pushes to `main` update the site automatically. The URL is available only after Pages has been enabled and a deployment succeeds.

See [GitHub’s Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Project files

`index.html` is the dashboard, `styles.css` is its responsive design, `planner.js` is the pure bracket/scheduling model, and `app.js` handles interactions and storage. Tests live in `tests/` and deployment in `.github/workflows/pages.yml`.

