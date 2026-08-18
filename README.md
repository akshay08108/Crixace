# CrixAce

CrixAce is a responsive cricket and football live-score interface built with React and Vite. Cricket scores, fixtures and series are connected through server-side Sportmonks Cricket proxies so the private token never reaches the browser.

## Current features

- Cricket and football preference
- Login, account creation, and demo access
- Persisted local session and theme with `localStorage`
- Live, upcoming, and completed match filters
- Interactive scorecard drawer and match alerts
- Five-minute live-score refresh while a match is active and the tab is visible
- Smooth, accessible transitions between match filters and scorecard tabs
- Functional Fixtures and Series feeds, plus a graceful coming-soon News section
- Live batter runs/balls and current-bowler over details when the scorecard feed supplies them
- Responsive desktop and mobile layouts with phone-safe navigation, cards and scorecard drawer
- Honest empty and unavailable states when the live feed has no data
- Lazy-loaded fixtures and series to preserve the provider's free request allowance

## Local development

Requirements: Node.js 20 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your Sportmonks Cricket token to `.env.local` to use the cricket feeds locally. The token is never bundled into browser JavaScript.

## Production build

```bash
npm ci
npm run build
npm run preview
```

The production files are generated in `dist/`.

## Publish to GitHub

Create an empty GitHub repository, then run:

```bash
git add .
git commit -m "Initial CrixAce web prototype"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/crixace.git
git push -u origin main
```

If the repository already has an `origin`, replace the `git remote add` command with `git remote set-url origin ...`.

## Deploy on Vercel

1. Sign in to Vercel and choose **Add New → Project**.
2. Import the GitHub repository.
3. Vercel should detect **Vite** automatically.
4. Confirm the build command is `npm run build` and the output directory is `dist`.
5. Deploy.

Every push to `main` will update production, while other branches and pull requests receive preview deployments.

### API secrets

Do not use `VITE_`-prefixed variables for private API tokens because those values are bundled into browser JavaScript. When live scoring is connected for production, put provider keys in Vercel **Project Settings → Environment Variables** and access them only from server-side functions.

Configure `SPORTMONKS_API_TOKEN` and `SPORTMONKS_BASE_URL` using the names documented in `.env.example`. The token is read only by the Vercel functions under `api/`.

Sportmonks only returns competitions covered by the active subscription. CrixAce therefore labels empty feeds honestly, loads fixtures and series only when needed, caches slow-changing responses at the edge, and refreshes scores only while a live match exists and the page is visible.

## Project structure

```text
.github/workflows/ci.yml  GitHub production-build check
api/cricket.js            Server-side Sportmonks live-score proxy for Vercel
api/fixtures.js            Server-side fixtures proxy
api/series.js              Server-side series proxy
api/teams.js               Server-side teams proxy
api/players.js             Server-side player-list proxy
api/team-logo.js           Server-side team-logo proxy
api/scorecard.js           Server-side detailed scorecard proxy
src/main.jsx              Application UI and prototype data
src/services/             Live-score provider adapters
src/styles.css            Responsive visual design
vercel.json               Vercel build configuration
```

## Important

The UI labels unavailable data instead of presenting sample scores as live. Before growing CrixAce into a high-traffic real-time product, move beyond the provider's free quota and consider a backend cache or database so every visitor does not consume a separate upstream request.
