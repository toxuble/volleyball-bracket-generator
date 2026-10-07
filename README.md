# Sideline — Volleyball bracket generator

A responsive, browser-only dashboard for a single-elimination tournament. No account, backend, dependency installation, or build step is needed to use it.

## Features

- 2–64 teams, event play time in minutes, 2/3/4/6 players per team, 1–16 courts, and start time.
- Automatic byes for the highest seeds, distributed across a power-of-two bracket.
- Editable opening-round team names, drag-to-swap positions, and keyboard-accessible up/down controls.
- Click a team’s advance button to select or undo a match winner. Swapping/shuffling positions clears results; changing time/courts preserves results.
- One rally-scoring set per match to a calculated point target, win by two with no cap. Later rounds have higher point targets.
- Estimated court schedule, CSV export, printing, and browser-local persistence.

## Timing model

Warm-ups and breaks are **excluded**. Matches end by points, never by a timer. Point-based matches can overrun the estimated event window.

[USA Volleyball’s 2025–2027 Indoor Rules, printed page 132](https://usavolleyball.org/wp-content/uploads/2023/03/2025-2027-USAV-Indoor-Rules-Book_FINAL.pdf) recommends scheduling allowances of 20 minutes for a set to 15 and 26 minutes for a set to 25, including six minutes of warm-up. Removing that allowance gives planning benchmarks of approximately 14 and 20 minutes of play. The guide also gives 65 minutes for best-of-three and 105 for best-of-five, including warm-up and between-set allowances.

The planner interpolates between the single-set benchmarks and extrapolates below/above them, rounding durations up to whole minutes. This is an organizer heuristic, not empirical data for a specific team size or level. More/fewer players affects roster totals only.

Reference target caps are 15 for early rounds, 21 for quarterfinals, 25 for semifinals, and 35 for the championship. Earlier rounds sharing a reference cap are lowered successively so every later round has a higher target. A binary search scales targets down when the event is short, with at least five points in the opening round and one extra point in each later round. When there is more time than the reference targets need, the remaining time is shown as reserve, rather than creating unusually long sets. Shorter-than-15-point sets are flagged.

Byes have zero duration. Active matches run in court waves, and a round barrier avoids simultaneous matches for the same team. This conservative estimate is not a fastest-possible rolling schedule. No recovery, transition, or warm-up time is added. Win-by-two play has no cap and can run over; estimated finish times are not enforceable limits.

Custom targets, especially 21 and 35, are recreational organizer rules. [FIVB indoor rules](https://www.fivb.com/volleyball/the-game/basic-rules/) use sets to 25 and a deciding set to 15 in a best-of-five match. This app deliberately uses one-set matches with progressively higher targets.

## Run locally

Open `index.html` directly in a browser, or run `npm start` (requires Python 3) and visit `http://127.0.0.1:8080`. Fonts load from Google Fonts; system fonts are used offline. Tournament data stays in local storage on the visitor’s device and is not uploaded to GitHub. Visitors do not share a live tournament state.

## Tests

With Node.js 20 or newer, run `npm test`. Tests cover every team count from 2 through 64, bye seeds, match counts, court conflicts, round dependencies, target progression, short event windows, and winner propagation. There are no npm dependencies to install.

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
