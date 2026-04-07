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

// Simple metadata map (extend or load front matter later)
const manualMeta = {
  '001': { title: 'შეჭამე ბაყაყი', author: 'ბრაიან თრეისი', cover: 'https://www.burnthefatinnercircle.com/members/images/2252.jpg?cb=20231212125423', book: '#' },
  '002': { title: 'Getting Things Done (GTD)', author: 'დევიდ ალენი', cover: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQZ_blTukS5FcvIprKh9MkI-XaLGdkGyTZUj-jAG7v-xS9qE-iK', book: '#' },
  '003': { title: 'Ultralearning', author: 'Scott H. Young', cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1554211384i/44770129.jpg', book: '#' },
  '004': { title: 'Think again', author: 'Adam Grant', cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTszXFLGlk6g0XhteqInJ2yWfwDsYiZcFrbBDXLw11qg7hF-SDV', book: 'https://www.amazon.com/Think-Again-Power-Knowing-What/dp/1984878107' },
  '005': { title: 'The 5 Elements of Effective Thinking', author: 'Edward B. Burger, Michael Starbird', cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQp6Agfgjk0LvZyl6ejbNjAfjjTT6yYtz9oZS1T5r6XCGSnNpyovjUxAtGSLSbOMfi8PFo&usqp=CAU', book: 'https://www.amazon.com/5-Elements-Effective-Thinking/dp/0691156662' },
  '006': { title: 'ფულის ფსიქოლოგია', author: 'მორგან ჰაუსელი', cover: 'https://m.media-amazon.com/images/I/71aG0m9XRcL._AC_UF1000,1000_QL80_.jpg', book: 'https://www.amazon.com/Psychology-Money-Timeless-lessons-happiness/dp/0857197681' }
};

async function ensureDir(p){ await fs.mkdir(p, { recursive: true }); }

function countWords(markdown){
  return markdown.replace(/```[\s\S]*?```/g,'').replace(/[#*_`\[\]()>]/g,'').trim().split(/\s+/).filter(Boolean).length;
}

function wrapHtml(id, meta, body, wordCount){
  const readMin = Math.max(1, Math.round(wordCount / 200));
  const title   = meta.title  || id;
  const author  = meta.author || '';
  const cover   = meta.cover  || '';
  const bookUrl = meta.book   || '#';
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

<script src="../../assets/js/reader.js" defer></script>
</body>
</html>`;
}

async function build(){
  await ensureDir(destDir);
  const entries = await fs.readdir(srcDir);
  const books = [];
  for(const file of entries){
    if(!file.endsWith('.md')) continue;
    const id = file.split('.')[0];
    const raw = await fs.readFile(path.join(srcDir, file), 'utf8');
    const html = marked.parse(raw);
    const meta = manualMeta[id] || { title: id, author: '', cover: '', book: '#' };
    const wordCount = countWords(raw);
    const outHtml = wrapHtml(id, meta, html, wordCount);
    const outFile = path.join(destDir, `${id}.html`);
    await fs.writeFile(outFile, outHtml, 'utf8');
    books.push({ id, title: meta.title, author: meta.author, cover: meta.cover, summary: `books/dest/${id}.html`, book: meta.book, desc: meta.desc || '' });
  }
  // Preserve ordering by id numeric
  books.sort((a,b)=> a.id.localeCompare(b.id, undefined, { numeric:true }));
  await fs.writeFile(dataFile, JSON.stringify(books, null, 2), 'utf8');
  console.log(`Built ${books.length} book(s).`);
}

build().catch(e => { console.error(e); process.exit(1); });
