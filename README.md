# BookSummary

Static book summary catalog + reader experience.

## Structure

- `index.html` main catalog (cards rendered from `data/books.json`).
- `assets/css/main.css` catalog styles & theme variables.
- `assets/css/reader.css` reader page styles (themes, controls, typography).
- `assets/js/app.js` catalog logic (fetch metadata, build cards, modal, search, shortcuts).
- `assets/js/reader.js` reading enhancements (progress bar, theme/layout/font size toggles, persistence).
- `books/src/*.md` markdown sources (author adds summaries here).
- `books/dest/*.html` generated reader pages (do not edit by hand).
- `data/books.json` generated metadata (id, title, author, cover, links, desc).
- `scripts/build.js` build script (markdown → HTML + regenerate `books.json`).
- `package.json` dependencies & build script (Node + marked).

## Adding a Book
1. Create a markdown file in `books/src` (e.g. `007.md`).
2. Add or update the `manualMeta` entry for that id in `scripts/build.js` (title, author, cover URL, optional book link, desc).
3. Run the build script (see below). New HTML + updated JSON will be produced.
4. Serve the folder over HTTP and open `index.html` (fetch requires a server, not a raw file URL).

## Build
Prereq: Node >= 18.

```bash
npm install
npm run build
```

Outputs updated `books/dest/*.html` and `data/books.json`.

## Local Dev / Preview
Use any static server:

```bash
npx serve .
# or
python -m http.server 8000
```

Visit http://localhost:8000/

## Features
- Accessible description modal (focus trap, ESC close, Ctrl+K search focus).
- Responsive grid (Tailwind CDN + custom “bookish” theme variables).
- Reader page: themes (sepia / dark / night), multi‑column toggle, font size controls, scroll progress, persisted preferences.
- Automated build from markdown sources keeps catalog in sync.

## Roadmap Ideas
- Front matter in markdown (remove manualMeta map).
- Automatic description extraction (first paragraph) if `desc` absent.
- Search index (lunr / minisearch) for title + full text.
- Service worker for offline caching of pages & assets.
- Theming toggle for catalog (light/dark/sepia parity with reader).

## Conventions
- IDs numeric, zero‑padded only if desired for ordering (string compare with numeric option used).
- Keep covers as external URLs for now; future: store locally under `assets/covers/`.
- Do not manually edit generated HTML in `books/dest`—source of truth is markdown + build script template.

## License
Personal project (add explicit license if distributing).