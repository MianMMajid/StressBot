# SimsAi

SimsAi is a local Next.js demo that runs seven AI-style persona agents against any website URL. It captures the page with Playwright, animates multiple cursors through the inspected surface, handles login-gated sites with a manual browser handoff, and produces a severity-coded report.

## Requirements

- Node.js 20.9 or newer
- npm
- macOS, Windows, or Linux with a desktop browser environment for the manual-login demo

No API keys or environment variables are required.

## Run Locally

```bash
git clone https://github.com/MianMMajid/StressBot.git
cd StressBot
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm install` also installs the Playwright Chromium browser needed for live page capture. If the browser install is interrupted, run:

```bash
npm run browsers
```

## Demo Flow

1. Paste a URL into the SimsAi composer.
2. Click `Run review`.
3. Watch the seven persona agents inspect the page and same-site routes.
4. If SimsAi detects a login page, a local browser window opens. Log in there, then return to SimsAi and click `Continue after login`.
5. Review the final severity-coded report.

## Useful Commands

```bash
npm run dev      # start the local demo
npm run check    # run lint and production build
npm run build    # build for production
npm run start    # serve the production build
```

## Troubleshooting

- If live capture fails with a browser executable error, run `npm run browsers`.
- If port `3000` is already in use, Next.js will offer another local port in the terminal.
- Some websites block automated browsers. SimsAi will still show a fallback report instead of crashing.
