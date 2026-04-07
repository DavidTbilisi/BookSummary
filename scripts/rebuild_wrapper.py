#!/usr/bin/env python3
"""
Rebuilds books/dest/*.html by replacing the old wrapper template
with the new premium reader template, keeping the existing HTML content.
"""
import os, re, sys

ROOT  = os.path.join(os.path.dirname(__file__), '..')
DEST  = os.path.join(ROOT, 'books', 'dest')

META = {
    '001': {
        'title':  'შეჭამე ბაყაყი',
        'author': 'ბრაიან თრეისი',
        'cover':  'https://www.burnthefatinnercircle.com/members/images/2252.jpg?cb=20231212125423',
        'book':   '#',
    },
    '002': {
        'title':  'Getting Things Done (GTD)',
        'author': 'დევიდ ალენი',
        'cover':  'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQZ_blTukS5FcvIprKh9MkI-XaLGdkGyTZUj-jAG7v-xS9qE-iK',
        'book':   '#',
    },
    '003': {
        'title':  'Ultralearning',
        'author': 'Scott H. Young',
        'cover':  'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1554211384i/44770129.jpg',
        'book':   '#',
    },
    '004': {
        'title':  'Think Again',
        'author': 'Adam Grant',
        'cover':  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTszXFLGlk6g0XhteqInJ2yWfwDsYiZcFrbBDXLw11qg7hF-SDV',
        'book':   'https://www.amazon.com/Think-Again-Power-Knowing-What/dp/1984878107',
    },
    '005': {
        'title':  'The 5 Elements of Effective Thinking',
        'author': 'Edward B. Burger & Michael Starbird',
        'cover':  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQp6Agfgjk0LvZyl6ejbNjAfjjTT6yYtz9oZS1T5r6XCGSnNpyovjUxAtGSLSbOMfi8PFo&usqp=CAU',
        'book':   'https://www.amazon.com/5-Elements-Effective-Thinking/dp/0691156662',
    },
    '006': {
        'title':  'ფულის ფსიქოლოგია',
        'author': 'მორგან ჰაუსელი',
        'cover':  'https://m.media-amazon.com/images/I/71aG0m9XRcL._AC_UF1000,1000_QL80_.jpg',
        'book':   'https://www.amazon.com/Psychology-Money-Timeless-lessons-happiness/dp/0857197681',
    },
}

def count_words(html):
    text = re.sub(r'<[^>]+>', ' ', html)
    return len(text.split())

def extract_body(html_src):
    """Pull the inner HTML between <main ...> and </main>"""
    m = re.search(r'<main[^>]*>(.*?)</main>', html_src, re.DOTALL)
    if m:
        inner = m.group(1)
        # Remove the sr-only h1 the old template injected
        inner = re.sub(r'<h1 class=["\']sr-only["\'][^>]*>.*?</h1>', '', inner, flags=re.DOTALL)
        return inner.strip()
    return html_src  # fallback: return as-is

def wrap(book_id, meta, body):
    words    = count_words(body)
    read_min = max(1, round(words / 200))
    title    = meta['title']
    author   = meta.get('author', '')
    cover    = meta.get('cover', '')
    book_url = meta.get('book', '#')

    cover_img = (
        f'<img src="{cover}" alt="{title} cover" class="hero-cover" loading="eager"/>'
        if cover else ''
    )
    buy_chip = (
        f'<a href="{book_url}" target="_blank" rel="noopener" class="chip chip--buy">Buy book ↗</a>'
        if book_url and book_url != '#' else ''
    )
    cover_css_var = f"url('{cover}')" if cover else 'none'

    return f"""<!DOCTYPE html>
<html lang="ka" data-theme="dark">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{title} – კონსპექტი</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="../../assets/css/reader.css"/>
<script>(function(){{try{{var p=JSON.parse(localStorage.getItem('reader:prefs:v2')||'{{}}');if(p.theme)document.documentElement.setAttribute('data-theme',p.theme);if(p.fontSize)document.documentElement.style.setProperty('--font-size-base',p.fontSize+'rem');}}catch(e){{}}}})()</script>
</head>
<body>

<div class="reader-page" data-words="{words}" data-read-min="{read_min}">

  <!-- Hero -->
  <header class="book-hero" style="--cover-url:{cover_css_var}">
    <div class="hero-backdrop"></div>
    <div class="hero-inner">
      <a href="../../index.html" class="hero-back" aria-label="Back to library">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Library
      </a>
      {cover_img}
      <div class="hero-meta">
        <p class="hero-kicker">Book Summary</p>
        <h1 class="hero-title">{title}</h1>
        {"<p class='hero-author'>" + author + "</p>" if author else ""}
        <div class="hero-chips">
          <span class="chip chip--time">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            ~{read_min} min read
          </span>
          <span class="chip chip--words">{words:,} words</span>
          {buy_chip}
        </div>
      </div>
    </div>
  </header>

  <!-- Progress bar -->
  <div class="scroll-progress" id="scrollProgress" aria-hidden="true">
    <div class="scroll-progress-fill" id="scrollFill"></div>
  </div>

  <!-- Article -->
  <article class="reader-wrap">
    <div class="reader-content" id="readerContent">
{body}
    </div>
  </article>

  <!-- Control bar -->
  <div class="ctrl-bar" id="ctrlBar" aria-label="Reading controls">
    <button class="ctrl-btn" data-act="back"    title="Back to library">←</button>
    <button class="ctrl-btn" data-act="smaller" title="Smaller text (-)">A−</button>
    <button class="ctrl-btn" data-act="larger"  title="Larger text (+)">A+</button>
    <button class="ctrl-btn ctrl-btn--theme" data-act="theme" id="themeBtn" title="Cycle theme">◑</button>
    <button class="ctrl-btn" data-act="top"     title="Back to top">↑</button>
    <button class="ctrl-btn" data-act="print"   title="Print">⎙</button>
  </div>

  <div class="read-pct" id="readPct" aria-hidden="true">0%</div>

</div>

<script src="../../assets/js/reader.js" defer></script>
</body>
</html>"""

def build():
    built = 0
    for fname in sorted(os.listdir(DEST)):
        if not fname.endswith('.html'):
            continue
        book_id = fname.replace('.html', '')
        if book_id not in META:
            continue
        fpath = os.path.join(DEST, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            old = f.read()
        body    = extract_body(old)
        new_html = wrap(book_id, META[book_id], body)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_html)
        print(f'  rebuilt {fname}')
        built += 1
    print(f'Done — {built} file(s) rebuilt.')

if __name__ == '__main__':
    build()
