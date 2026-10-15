# PlainAI (working name) — AI tool finder

Static site. Change the name/tagline/base URL/fields in `config.json`.

- `data/tools.json` — tool directory (pricing verified from official pages, source_url + pricing_verified date; "check site" where unverified). `data/make_tools.py` is the seed script.
- `data/usecases.json` — agent use cases (Draft, needs human review).
- `data/sources.yml` — news feed allowlist stub (empty until terms verified).
- `scripts/build.py` — builds `site/` (pages, per-tool pages, sitemap.xml, robots.txt, JSON search index).
- `scripts/refresh.py` — daily link check (HEAD/GET only, no price scraping), flags dead after 2 failures, keeps last good data, rebuilds.
- `scripts/test_site.py` — Playwright smoke test (serve `site/` on :8766 first).
- `.github/workflows/refresh.yml` — daily + on push, link-check, commit data, deploy to GitHub Pages.

Local: `python3 scripts/refresh.py && python3 -m http.server 8766 --directory site`
