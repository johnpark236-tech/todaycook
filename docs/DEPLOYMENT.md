# Deployment

## GitHub Pages

Push `main`. `.github/workflows/pages.yml` uploads the repository as a static Pages artifact. In repository Settings → Pages, set Source to **GitHub Actions** if it is not already selected. Production is `https://johnpark236-tech.github.io/todaycook/`.

## Google API

Follow `docs/GOOGLE_SHEET_SETUP.md`, then update the single `API_URL` value in `js/config.js`. Never store OAuth tokens, service-account JSON, API keys, or passwords in the repository.

## Verification

Confirm the Pages workflow succeeded, open home, recipe detail, cooking mode, shopping, and ingredients routes, and test with `?v=YYYYMMDDHHMM` to bypass stale browser cache.
