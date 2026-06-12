# SimsAi

## Live Demo

[https://simsai-production-e399.up.railway.app](https://simsai-production-e399.up.railway.app)

SimsAi is an IDE-style product feedback demo. Paste a website URL and SimsAi runs seven simulated persona agents against the page, same-site routes, copy, trust signals, forms, accessibility signals, and conversion paths. The final output is a severity-coded report with persona-specific recommendations.

## What It Does

- Captures a live page with Playwright.
- Crawls up to three safe same-site routes.
- Shows seven independent persona cursors testing the site at the same time.
- Detects login-gated pages and pauses the review.
- Supports a local manual-login handoff for authenticated pages.
- Produces issue cards with `Critical`, `High`, `Medium`, and `Low` severity states.
- Exports the report as Markdown.

## Personas

SimsAi uses seven hardcoded demo personas:

- Maya Chen: first-time founder reviewing positioning and first impression.
- Daniel Ortiz: budget owner reviewing pricing and plan confidence.
- Priya Raman: product ops lead reviewing setup and workflow control.
- Luis Mercado: non-technical merchant reviewing plain-language clarity.
- Ava Brooks: accessibility reviewer checking structure and interaction risk.
- Marcus Reed: security evaluator reviewing trust, privacy, and data handling.
- Nora Singh: research lead synthesizing recurring signals.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Playwright for live browser capture
- Railway for hosted deployment

No API keys or environment variables are required for the demo.

## Run Locally

Requirements:

- Node.js 20.9 or newer
- npm
- macOS, Windows, or Linux with a desktop browser environment for manual login

```bash
git clone https://github.com/MianMMajid/StressBot.git
cd StressBot
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm install` automatically installs the Playwright Chromium browser needed for live page capture. If that install is interrupted, run:

```bash
npm run browsers
```

## Demo Flow

1. Paste a public URL or localhost URL into the SimsAi composer.
2. Click `Run review`.
3. Watch the agents inspect the captured page and route trace.
4. If SimsAi detects a login page locally, a browser window opens. Log in there, return to SimsAi, and click `Continue after login`.
5. Review the final severity-coded report.

## Railway Deployment

This project is deployed on Railway as `SimsAi`.

Current public URL:

```text
https://simsai-production-e399.up.railway.app
```

Deploy from a linked Railway project:

```bash
railway up --detach --message "Deploy SimsAi frontend"
```

Generate or view a Railway domain:

```bash
railway domain --json
```

Check deployment status:

```bash
railway service status
```

Important hosted behavior:

- Public URL review works on Railway.
- Manual-login handoff opens a headed browser and is intended for local desktop use.
- Some sites block hosted or automated browsers. SimsAi returns a fallback report instead of crashing.

## Useful Commands

```bash
npm run dev      # start the local demo
npm run check    # run lint and production build
npm run build    # build for production
npm run start    # serve the production build
npm run browsers # install Playwright Chromium
```

## Troubleshooting

- Browser executable error: run `npm run browsers`.
- Port already in use: use the alternate local port printed by Next.js.
- Capture blocked by target site: try another URL or use the fallback report for the presentation.
- Login-gated site on Railway: run locally for manual-login handoff.

## Project Structure

```text
app/                    Next.js app routes and API handlers
app/api/analyze/        Live page capture and analysis endpoint
app/api/manual-login/   Local manual-login session endpoints
components/             SimsAi UI, report, terminal, and viewport components
hooks/                  Simulation state machine
lib/                    Browser capture, persona analysis, and simulation data
public/                 Static assets
```
