#!/usr/bin/env node
// Build script: convert markdown in books/src to HTML in books/dest and regenerate data/books.json
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'books', 'src');
const destDir = path.join(root, 'books', 'dest');
const dataFile = path.join(root, 'data', 'books.json');
const audioDir = path.join(root, 'audio');
const audioManifestFile = path.join(root, 'data', 'audio_manifest.json');

// Valid genres — add new genres here to make them available in front matter
const GENRE_PALETTE = {
  productivity: { label: 'Productivity', bg: '#fed7aa', color: '#9a3412' },
  learning: { label: 'Learning', bg: '#bbf7d0', color: '#14532d' },
  thinking: { label: 'Thinking', bg: '#bfdbfe', color: '#1e3a5f' },
  finance: { label: 'Finance', bg: '#99f6e4', color: '#134e4a' },
  psychology: { label: 'Psychology', bg: '#fbcfe8', color: '#831843' },
  general: { label: 'General', bg: '#e5e7eb', color: '#374151' },
};

// Parse YAML front matter from a markdown file.
// Returns { meta, body } where body is the content after the closing ---.
function parseFrontMatter(raw) {
  // Strip UTF-8 BOM and normalise line endings so the parser works on both Windows and Unix
  const src = raw.replace(/^\ufeff/, '').replace(/\r\n/g, '\n');
  if (!src.startsWith('---\n')) return { meta: {}, body: raw };
  const end = src.indexOf('\n---\n', 4);
  if (end === -1) return { meta: {}, body: raw };
  const block = src.slice(4, end);
  const body = src.slice(end + 5);
  const meta = {};
  for (const line of block.split('\n')) {
    const sep = line.indexOf(':');
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    let val = line.slice(sep + 1).trim();
    // Strip inline comments (# ...) only for non-URL values
    if (!val.startsWith('http')) val = val.replace(/\s+#.*$/, '');
    // Strip surrounding quotes
    val = val.replace(/^['"]|['"]$/g, '');
    if (key) meta[key] = val;
  }
  return { meta, body };
}

// Warn about missing or invalid fields — build continues regardless.
function validateMeta(id, meta) {
  const required = ['title', 'author', 'genre', 'cover', 'book', 'desc'];
  for (const field of required) {
    if (!meta[field]) console.warn(`[WARN] ${id}.md: missing field "${field}"`);
  }
  if (meta.genre && !GENRE_PALETTE[meta.genre]) {
    const valid = Object.keys(GENRE_PALETTE).join(', ');
    console.warn(`[WARN] ${id}.md: unknown genre "${meta.genre}" (valid: ${valid})`);
  }
  if (meta.cover && !meta.cover.startsWith('https://')) {
    console.warn(`[WARN] ${id}.md: cover URL should start with https://`);
  }
}

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }

function countWords(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, '').replace(/[#*_`\[\]()>]/g, '').trim().split(/\s+/).filter(Boolean).length;
}

function wrapHtml(id, meta, body, wordCount) {
  const readMin = Math.max(1, Math.round(wordCount / 200));
  const title = meta.title || id;
  const author = meta.author || '';
  const cover = meta.cover || '';
  const bookUrl = meta.book || '#';
  return `<!DOCTYPE html>
<html lang="ka" data-theme="dark">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} – კონსპექტი</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="../../assets/css/reader.css"/>
<script>(function(){try{var p=JSON.parse(localStorage.getItem('reader:prefs:v2')||'{}');if(p.theme)document.documentElement.setAttribute('data-theme',p.theme);if(p.fontSize)document.documentElement.style.setProperty('--font-size-base',p.fontSize+'rem');}catch(e){}})();</script>
</head>
<body>

<div class="reader-page" data-words="${wordCount}" data-read-min="${readMin}">

  <!-- ── Hero ── -->
  <header class="book-hero" style="--cover-url:url('${cover}')">
    <div class="hero-backdrop"></div>
    <div class="hero-inner">
      <a href="../../index.html" class="hero-back" aria-label="Back to library">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Library
      </a>
      ${cover ? `<img src="${cover}" alt="${title} cover" class="hero-cover" loading="eager"/>` : ''}
      <div class="hero-meta">
        <p class="hero-kicker">Book Summary</p>
        <h1 class="hero-title">${title}</h1>
        ${author ? `<p class="hero-author">${author}</p>` : ''}
        <div class="hero-chips">
          <span class="chip chip--time">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            ~${readMin} min read
          </span>
          <span class="chip chip--words">${wordCount.toLocaleString()} words</span>
          ${bookUrl !== '#' ? `<a href="${bookUrl}" target="_blank" rel="noopener" class="chip chip--buy">Buy book ↗</a>` : ''}
        </div>
        ${meta && meta.audio ? `
          <div class="hero-audio">
            <audio controls preload="none">
              <source src="${meta.audio}" type="audio/mpeg">
              Your browser does not support the audio element.
            </audio>
          </div>
        ` : ''}
      </div>
    </div>
  </header>

  <!-- ── Progress bar ── -->
  <div class="scroll-progress" id="scrollProgress" aria-hidden="true">
    <div class="scroll-progress-fill" id="scrollFill"></div>
  </div>

  <!-- ── Article content ── -->
  <article class="reader-wrap">
    <div class="reader-content" id="readerContent">
${body}
    </div>
  </article>

  <!-- ── Bottom control bar ── -->
  <div class="ctrl-bar" id="ctrlBar" aria-label="Reading controls">
    <button class="ctrl-btn" data-act="back"    title="Back to library">←</button>
    <button class="ctrl-btn" data-act="smaller" title="Smaller text (-)">A−</button>
    <button class="ctrl-btn" data-act="larger"  title="Larger text (+)">A+</button>
    <button class="ctrl-btn ctrl-btn--theme" data-act="theme" id="themeBtn" title="Cycle theme">◑</button>
    <button class="ctrl-btn" data-act="top"     title="Back to top">↑</button>
    <button class="ctrl-btn" data-act="print"   title="Print">⎙</button>
  </div>

  <!-- ── Reading progress label ── -->
  <div class="read-pct" id="readPct" aria-hidden="true">0%</div>

</div>

<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js" defer></script>
<script src="../../assets/js/reader.js" defer></script>
</body>
</html>`;
}

async function build() {
  await ensureDir(destDir);
  // load audio manifest (generated by scripts/generate_audios.py) if present
  let audioManifest = {};
  try {
    const txt = await fs.readFile(audioManifestFile, 'utf8');
    audioManifest = JSON.parse(txt);
  } catch (e) {
    audioManifest = {};
  }
  // list audio files (if any)
  let audioFiles = [];
  try { audioFiles = await fs.readdir(audioDir); } catch (e) { audioFiles = []; }
  const entries = await fs.readdir(srcDir);
  const books = [];
  let warnings = 0;
  for (const file of entries) {
    if (!file.endsWith('.md')) continue;
    // Only process numeric IDs (e.g. 001.md, 007.md) — skip TEMPLATE.md and other non-book files
    const id = file.replace(/\.md$/, '');
    if (!/^\d+$/.test(id)) continue;
    const raw = await fs.readFile(path.join(srcDir, file), 'utf8');
    const { meta, body } = parseFrontMatter(raw);
    validateMeta(id, meta);
    // determine audio file for this markdown (manifest preferred, then heuristics)
    let audioRel = '';
    let audioBasename = '';
    if (audioManifest && audioManifest[file]) {
      audioBasename = audioManifest[file];
    } else {
      // try exact numeric match
      const exact = `${id}.mp3`;
      if (audioFiles.includes(exact)) audioBasename = exact;
      else {
        // try slugified title
        const title = (meta.title || id).toString();
        const slug = title.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
        if (slug && audioFiles.includes(`${slug}.mp3`)) audioBasename = `${slug}.mp3`;
        else {
          // fallback: find first file that contains the id or slug
          audioBasename = audioFiles.find(f => f.includes(id) || (slug && f.includes(slug))) || '';
        }
      }
    }
    if (audioBasename) audioRel = `../../audio/${audioBasename}`;
    const html = marked.parse(body);
    const wordCount = countWords(body);
    // attach audio path to meta so wrapHtml can render player
    if (audioRel) meta.audio = audioRel;
    const outHtml = wrapHtml(id, meta, html, wordCount);
    const outFile = path.join(destDir, `${id}.html`);
    await fs.writeFile(outFile, outHtml, 'utf8');
    books.push({
      id,
      title: meta.title || id,
      author: meta.author || '',
      cover: meta.cover || '',
      summary: `books/dest/${id}.html`,
      book: meta.book || '#',
      desc: meta.desc || '',
      genre: meta.genre || 'general',
      audio: audioBasename ? `audio/${audioBasename}` : '',
    });
  }
  // Preserve ordering by id numeric
  books.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  await fs.writeFile(dataFile, JSON.stringify(books, null, 2), 'utf8');
  console.log(`Built ${books.length} book(s).`);
}

build().catch(e => { console.error(e); process.exit(1); });
