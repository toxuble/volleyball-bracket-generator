# Volleyball bracket generator

A browser-only single-elimination tournament dashboard with a dark gray background, white text, and orange accents. No account, backend, dependency installation, or build step is needed to use it.

**[Open the dashboard](https://toxuble.github.io/volleyball-bracket-generator/)**

## Features

- Team count, total event time, team size, court count, start time, and overrun buffer inputs across the top.
- Automatic byes for the highest seeds, distributed across a power-of-two bracket.
- Editable opening-round team names, drag-to-swap positions, and keyboard-accessible up/down controls.
- Click a team’s advance button to select or undo a match winner. Swapping/shuffling positions clears results; changing time/courts preserves results.
- Point-based single-set or best-of matches fitted to allocated round slots, with every set target capped at 21. Later rounds have longer match slots by default.
- A compact bracket section that fills the visible browser height. Scroll within large brackets, or continue down the page to the timeline. **Fit whole bracket** provides an overview; **Readable size** restores the normal scale.
- Full-window timeline with 30-minute checkpoints, thin draggable boundaries inside the bar and a reset button, and the selected overrun buffer.
- Estimated court schedule, CSV export, printing, and browser-local persistence.

## Using the dashboard

1. Set the tournament inputs and select **Generate bracket**.
2. Rename teams in the opening round. Drag teams to swap positions, or use the up/down arrows. Byes advance automatically.
3. Review the point and set format above each round, along with the allotted match slots and estimated playing time.
4. Scroll to the timeline. Drag the small orange bars inside the timeline to transfer time between adjacent rounds. Points and sets recalculate automatically. **Reset timeline** restores the generated allocation.
5. During the tournament, select the advance button beside each winning team. Use **Court schedule** for court assignments and CSV export, or **Print / save PDF** to print the dashboard.

| Input | Supported values | Purpose |
| --- | --- | --- |
| Number of teams | 2–64 | Determines rounds, matches, and opening byes. |
| Total event time | 15–1,440 minutes | The complete window from start to finish, including the buffer. Very short windows may be rejected. |
| Team size | 2, 3, 4, or 6 players | Calculates the total number of players. |
| Courts | 1–16 | Determines how many matches can run simultaneously. |
| Event starts | Local time | Sets the schedule's AM/PM clock times. |
| Overrun buffer | 0–50% | Reserves time inside the event window; defaults to 10%. |

Changing the team count creates a new bracket and clears results. Swapping or shuffling teams also clears results. Timing changes preserve team names and winners. **Reset results** clears selected winners without changing the team arrangement.

## Timing model

Round slots plus the adjustable overrun buffer fill the event window exactly. The buffer defaults to 10%. No warm-ups, rest, court changes, or inter-set breaks are added.

The automatic allocation weights court waves and increases match-slot length in later rounds. Whole minutes are apportioned so there is no unallocated remainder. A round needs at least five minutes per wave; insufficient windows are rejected.

The planner fits one-set or odd-numbered best-of formats to each allocated slot, searching whole-point targets from 5 to 21. Longer slots use additional sets. Set targets never exceed 21; the win-by-two rule may extend the actual score. Best-of matches finish when a team wins a majority of sets. Every set is rally-scoring, win by two, without a hard scoring cap. The app records match winners; it does not record individual set scores.

[USA Volleyball’s 2025–2027 Indoor Rules, printed page 132](https://usavolleyball.org/wp-content/uploads/2023/03/2025-2027-USAV-Indoor-Rules-Book_FINAL.pdf) gives a 20-minute allowance for a set to 15 and a 45-minute allowance for two sets to 21. These scheduling allowances include six minutes of warm-up and three minutes between sets. Subtracting them yields a 14-minute benchmark to 15 and a derived 18 minutes per set to 21: (45 − 6 − 3) / 2. These are scheduling benchmarks, not measured average game lengths. Other targets are interpolated; targets below 15 are extrapolated. Displayed play estimates round to whole minutes. Multi-set estimates assume independent sets with equally matched teams: best-of-3 averages 2.5 sets and best-of-5 averages 4.125. This is an organizer estimate, not measured data for these teams. Custom formats differ from [official FIVB indoor scoring](https://www.fivb.com/volleyball/the-game/basic-rules/).

**Allocation is exact; actual playing time is uncertain.** Each court wave receives an allotted slot. The selected format has a separate estimated playing time and may end earlier or later. Team size affects roster totals only.

Timeline checkpoints show the tournament stage every 30 minutes. The table beneath the bar shows each round's format, start, duration, and finish. There are no separate duration sliders or editable duration fields: only the timeline boundary bars adjust the allocation. Focus a bar and use arrow keys to change one minute, Shift plus an arrow to change five, or Home/End to move to the allowed limits. The total event length and buffer stay fixed. Custom allocations persist locally and reset when team count, courts, event length, or buffer changes.

## Run locally

Open `index.html` directly in a browser, or run `npm start` (requires Python 3) and visit `http://127.0.0.1:8080`. The dashboard uses system fonts and works offline. Tournament data stays in local storage on the visitor’s device and is not uploaded to GitHub. Visitors do not share a live tournament state.

## Tests

With Node.js 20 or newer, run `npm test`. Tests cover every team count from 2 through 64, bye seeds, match counts, court conflicts, round dependencies, slot progression, exact allocation, manual resizing, match formats, short event windows, and winner propagation. There are no npm dependencies to install.

## Update the published site

This repository publishes to [GitHub Pages](https://toxuble.github.io/volleyball-bracket-generator/) from `main`.

1. Make changes locally and review them in GitHub Desktop.
2. Commit the changes on `main`, then select **Push origin**.
3. Check **Actions → Verify and deploy dashboard**. After the workflow succeeds, refresh the dashboard to see the update.

The workflow tests the planner before uploading only the four application files and deploying. Pull requests run checks but do not deploy. Tournament data is stored locally in each visitor's browser, so publishing code does not publish anyone's tournament data.

### Set up GitHub Pages for a new copy

1. Add this folder as a local repository in GitHub Desktop.
2. Publish it to your GitHub account, with **Keep this code private** unchecked for a public repository.
3. In the GitHub repository, open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Open **Actions → Verify and deploy dashboard → Run workflow** on `main` (or push a new commit).
5. After the deploy job succeeds, open the URL shown by the deployment. For a repository named `volleyball-bracket-generator`, it is normally `https://<your-account>.github.io/volleyball-bracket-generator/`.

See [GitHub’s Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Project files

`index.html` is the dashboard, `styles.css` is its responsive design, `planner.js` is the pure bracket/scheduling model, and `app.js` handles interactions and storage. Tests live in `tests/` and deployment in `.github/workflows/pages.yml`.
