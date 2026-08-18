# CrixAce

CrixAce is a responsive cricket and football live-score interface built with React and Vite. The current version is a deployable web prototype; it uses illustrative score data when a live-data provider is unavailable.

## Current features

- Cricket and football preference
- Login, account creation, and demo access
- Persisted local session and theme with `localStorage`
- Live, upcoming, and completed match filters
- Interactive scorecard drawer and match alerts
- Five-minute live-score refresh while a match is active and the tab is visible
- Smooth, accessible transitions between match filters and scorecard tabs
- Functional Fixtures, Series and News sections with graceful coming-soon states
- Live batter runs/balls and current-bowler over details when the scorecard feed supplies them
- Responsive desktop and mobile layouts with phone-safe navigation, cards and scorecard drawer
- Graceful fallback to demo scores when an API is not configured

## Local development

Requirements: Node.js 20 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the local URL printed by Vite. API tokens are optional for the prototype.

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

For Cricket Data, configure `CRICKETDATA_API_KEY` and `CRICKETDATA_BASE_URL` using the names documented in `.env.example`. The key is read only by the Vercel function in `api/cricket.js`. The deployed prototype works without it and falls back to mock data.

## Project structure

```text
.github/workflows/ci.yml  GitHub production-build check
api/cricket.js            Server-side Cricket Data proxy for Vercel
api/scorecard.js           Server-side detailed scorecard proxy for Vercel
src/main.jsx              Application UI and prototype data
src/services/             Live-score provider adapters
src/styles.css            Responsive visual design
vercel.json               Vercel build configuration
```

## Important

The displayed scores are illustrative unless a provider is connected. Before presenting CrixAce as a real-time scoring product, add a licensed data provider, server-side caching, rate-limit handling, and a backend API that keeps provider credentials private.
