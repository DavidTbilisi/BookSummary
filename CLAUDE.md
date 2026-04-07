# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies (only "marked" package)
npm run build        # Convert markdown → HTML reader pages + regenerate data/books.json
npx serve .          # Serve locally (or: python -m http.server 8000)
```

## Architecture

This is a static book summary site with a build step. No frameworks — vanilla HTML, CSS, and JS.

### Build Pipeline

```
books/src/*.md  →  scripts/build.js  →  books/dest/*.html
                                     →  data/books.json
```

- Each `books/src/*.md` file contains **YAML front matter** at the top — this is the sole source of truth for all book metadata.
- `scripts/build.js` reads the front matter, converts the markdown body to HTML, and regenerates `data/books.json`.
- `books/dest/*.html` and `data/books.json` are **auto-generated** — never edit them manually. Run `npm run build` to regenerate.
- Only files with a purely numeric filename (e.g. `007.md`) are processed. `TEMPLATE.md` and other non-numeric files are skipped.

### Adding a New Book

**Only one file needs to be created.** No other files require editing.

1. Copy `books/src/TEMPLATE.md` → `books/src/{id}.md` (e.g. `007.md`).
2. Fill in the YAML front matter fields: `title`, `author`, `genre`, `cover`, `book`, `desc`.
3. Write the summary below the closing `---` using standard Markdown (`##` for chapters).
4. Run `npm run build`.

#### Front matter schema

```yaml
---
title: Book Title
author: Author Name
genre: productivity   # productivity | learning | thinking | finance | psychology | general
cover: https://...    # book cover image URL (must start with https://)
book: '#'             # Amazon/purchase link, or '#' if unavailable
desc: One or two sentences shown in the catalog card.
---
```

#### Genres

| Key | Label |
|-----|-------|
| `productivity` | Productivity |
| `learning` | Learning |
| `thinking` | Thinking |
| `finance` | Finance |
| `psychology` | Psychology |
| `general` | General (default) |

To add a **new genre**, add it to the `GENRE_PALETTE` object in both `scripts/build.js` and `assets/js/app.js`, and add a filter pill in `index.html`.

### CI/CD

Pushing any change to `books/src/` on `master` triggers `.github/workflows/build.yml`, which runs `npm run build` and commits the generated files back automatically. The commit message includes `[skip ci]` to prevent a loop.

### Key Files

| File | Purpose |
|------|---------|
| `scripts/build.js` | Build script; `parseFrontMatter()` reads metadata from each `.md`; `GENRE_PALETTE` defines valid genres |
| `books/src/TEMPLATE.md` | Contributor template — copy this to create a new book |
| `index.html` | Catalog page; uses Tailwind CDN + `assets/css/main.css` |
| `assets/js/app.js` | Catalog logic: grid render, modal, search, theme persistence; `GENRE_PALETTE` maps genre keys to display colours |
| `assets/js/reader.js` | Reader controls: progress bar, theme/font/layout toggles, keyboard shortcuts |
| `assets/css/main.css` | Catalog themes via `--clr-*` CSS variables |
| `assets/css/reader.css` | Reader typography and themes (Default/Sepia/Dark/Night/B&W/High Contrast) |
| `data/books.json` | Generated metadata array consumed by `app.js` on page load |
| `.github/workflows/build.yml` | CI/CD: auto-build on push |

### Theming

Both catalog and reader use CSS custom properties (`--clr-parchment`, `--clr-ink`, `--clr-accent`, `--clr-border`, `--clr-paper`, `--clr-muted`). Theme classes are set on `<body>` and persisted to `localStorage`. Reader preferences are stored under key `reader:prefs:v1`.

### Reader Keyboard Shortcuts

`+`/`-` — font size, `t` — cycle theme, `l` — toggle column layout, `Home` — scroll to top.
