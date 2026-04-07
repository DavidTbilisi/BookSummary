# BookSummary

A community-maintained library of book summaries — readable in the browser with a clean reader experience, dark mode, and reading progress tracking.

[![Build Books](https://github.com/DavidTbilisi/BookSummary/actions/workflows/build.yml/badge.svg)](https://github.com/DavidTbilisi/BookSummary/actions/workflows/build.yml)

---

## Suggest a Book

Don't have time to write a summary but have a great book to recommend?
**[Open a GitHub Issue](https://github.com/DavidTbilisi/BookSummary/issues/new)** with the book title and author — we'll take it from there.

---

## Contribute a Summary

Contributing is simple — you only need to add **one file**.

### Step 1 — Fork & clone

```bash
git clone https://github.com/YOUR_USERNAME/BookSummary.git
cd BookSummary
```

### Step 2 — Copy the template

```bash
cp books/src/TEMPLATE.md books/src/007.md   # use the next available number
```

### Step 3 — Fill in the front matter

Open your new file and fill in the fields at the top:

```yaml
---
title: Atomic Habits
author: James Clear
genre: productivity
cover: https://m.media-amazon.com/images/I/91bYsX41DVL.jpg
book: https://www.amazon.com/Atomic-Habits-James-Clear/dp/0735211299
desc: A practical guide to building good habits and breaking bad ones through tiny, consistent changes.
---
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | yes | Full book title |
| `author` | yes | Author name(s) |
| `genre` | yes | See genre list below |
| `cover` | yes | Book cover image URL (`https://...`) |
| `book` | yes | Purchase/Amazon link, or `'#'` if unavailable |
| `desc` | yes | 1–2 sentence description shown in the catalog card |

### Step 4 — Write the summary

Below the closing `---`, write your summary in plain Markdown. Use `##` for chapter or section headings:

```markdown
## Chapter 1 — The Surprising Power of Atomic Habits

Small habits compound over time. A 1% improvement every day leads to 37x better outcomes in a year...

## Chapter 2 — How Habits Actually Work

The habit loop: Cue → Craving → Response → Reward...
```

### Step 5 — Open a Pull Request

Push your branch and open a PR. The CI pipeline will automatically build your summary into an HTML reader page and update the catalog — **no other files need to be changed**.

---

## Valid Genres

| Genre | Use for |
|-------|---------|
| `productivity` | Time management, GTD, goal setting |
| `learning` | Skill acquisition, memory, education |
| `thinking` | Mental models, decision making, reasoning |
| `finance` | Investing, money, personal finance |
| `psychology` | Behaviour, persuasion, mindset |
| `general` | Everything else |

---

## Running Locally

Prereq: Node >= 18.

```bash
npm install
npm run build       # convert .md → .html + regenerate data/books.json
npx serve .         # serve at http://localhost:3000
```

> `fetch()` requires a real HTTP server — opening `index.html` directly as a `file://` URL won't work.

---

## Project Structure

```
books/src/*.md        Markdown summaries (source of truth — edit these)
books/dest/*.html     Generated reader pages (do not edit — auto-built)
data/books.json       Generated catalog metadata (do not edit — auto-built)
scripts/build.js      Build pipeline
assets/js/app.js      Catalog logic (grid, modal, search, theme)
assets/js/reader.js   Reader controls (progress, themes, font size)
assets/css/           Catalog + reader stylesheets
```

---

## How CI Works

Whenever a new `books/src/*.md` file is pushed to `master`, GitHub Actions automatically:
1. Installs dependencies
2. Runs `npm run build`
3. Commits the generated `books/dest/*.html` and `data/books.json` back to the repo

The commit message contains `[skip ci]` so it doesn't trigger a second build.

---

## License

Personal / community project. Add an explicit license before distributing.
