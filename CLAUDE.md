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

- `scripts/build.js` is the **only** file to edit when adding a new book. It contains `manualMeta`, a hardcoded object mapping book IDs to metadata (title, author, cover URL, description, external book link).
- `books/dest/*.html` and `data/books.json` are **auto-generated** — never edit them manually. Run `npm run build` to regenerate.

### Adding a New Book

1. Create `books/src/{id}.md` with the summary content in Markdown.
2. Add an entry to `manualMeta` in `scripts/build.js` with `title`, `author`, `cover`, `book`, and `desc`.
3. Run `npm run build`.

### Key Files

| File | Purpose |
|------|---------|
| `scripts/build.js` | Build script; metadata source of truth (`manualMeta`) |
| `index.html` | Catalog page; uses Tailwind CDN + `assets/css/main.css` |
| `assets/js/app.js` | Catalog logic: grid render, modal, search, theme persistence |
| `assets/js/reader.js` | Reader controls: progress bar, theme/font/layout toggles, keyboard shortcuts |
| `assets/css/main.css` | Catalog themes via `--clr-*` CSS variables |
| `assets/css/reader.css` | Reader typography and themes (Default/Sepia/Dark/Night/B&W/High Contrast) |
| `data/books.json` | Generated metadata array consumed by `app.js` on page load |

### Theming

Both catalog and reader use CSS custom properties (`--clr-parchment`, `--clr-ink`, `--clr-accent`, `--clr-border`, `--clr-paper`, `--clr-muted`). Theme classes are set on `<body>` and persisted to `localStorage`. Reader preferences are stored under key `reader:prefs:v1`.

### Reader Keyboard Shortcuts

`+`/`-` — font size, `t` — cycle theme, `l` — toggle column layout, `Home` — scroll to top.
