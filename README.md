# Newsfeed Viewer

A minimal, borderless RSS reader intended for large screens.

## Running locally

1. Open `newsfeed/index.html` in a browser, or run a local server:

```powershell
cd newsfeed
npx serve
```

2. Visit the URL shown by the server (e.g. `http://localhost:3000`).

## Features

- Loads RSS feed (default: NRK Toppsaker)
- Custom feed URL input
- Auto-refresh scheduler with countdown
- Compact mode (smaller spacing + denser list)
- Clean, borderless UI focused on the news list

## Deployment (GitHub Pages)

This repository includes a GitHub Actions workflow that deploys `newsfeed/` to **GitHub Pages** on every push to `main`.

Once configured, the site will be available at:

- `https://<username>.github.io/<repo>/` (or your organization URL)

> Note: GitHub Pages will publish the `gh-pages` branch that the workflow creates.
