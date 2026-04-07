// ══════════════════════════════════════════
//  KnowledgeBase — app.js
//  Catalog + progress tracking
// ══════════════════════════════════════════

// ── Genre palette (keyed by genre name, matches front matter) ───
const GENRE_PALETTE = {
  productivity: { label: 'Productivity', bg: '#fed7aa', color: '#9a3412' },
  learning:     { label: 'Learning',     bg: '#bbf7d0', color: '#14532d' },
  thinking:     { label: 'Thinking',     bg: '#bfdbfe', color: '#1e3a5f' },
  finance:      { label: 'Finance',      bg: '#99f6e4', color: '#134e4a' },
  psychology:   { label: 'Psychology',   bg: '#fbcfe8', color: '#831843' },
  general:      { label: 'General',      bg: '#e5e7eb', color: '#374151' },
};

// ── Progress (localStorage) ──────────────
function getStatus(id) {
  try { return localStorage.getItem(`kb:prog:${id}`) || 'unread'; } catch { return 'unread'; }
}
function saveStatus(id, status) {
  try { localStorage.setItem(`kb:prog:${id}`, status); } catch { /* ignore */ }
}

// ── State ────────────────────────────────
let allBooks   = [];
let activeGenre = 'all';
let currentBook = null;

// ── DOM refs ─────────────────────────────
const grid     = document.getElementById('bookGrid');
const emptyMsg = document.getElementById('emptyMsg');
const template = document.getElementById('book-card-tpl');
const modal    = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');

// ════════════════════════════════════════
//  LOAD
// ════════════════════════════════════════
async function loadBooks() {
  try {
    const res = await fetch('data/books.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allBooks = await res.json();
    renderGrid();
    updateStats();
  } catch (err) {
    console.error('Failed to load books.json:', err);
    if (emptyMsg) { emptyMsg.textContent = 'Failed to load books.'; emptyMsg.classList.remove('hidden'); }
  }
}

// ════════════════════════════════════════
//  GRID RENDER
// ════════════════════════════════════════
function renderGrid(query = '') {
  if (!grid || !template) return;
  grid.innerHTML = '';

  let books = activeGenre === 'all'
    ? allBooks
    : allBooks.filter(b => (b.genre || 'general') === activeGenre);

  if (query) {
    const q = query.toLowerCase();
    books = books.filter(b =>
      b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
  }

  emptyMsg.classList.toggle('hidden', books.length > 0);

  books.forEach(b => {
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.id = b.id;

    const genre  = GENRE_PALETTE[b.genre] ?? GENRE_PALETTE.general;
    const status = getStatus(b.id);

    // Cover
    const coverEl = card.querySelector('[data-el="cover"]');
    if (coverEl) { coverEl.src = b.cover || ''; coverEl.alt = b.title; }

    // Status dot
    const dotEl = card.querySelector('[data-el="dot"]');
    if (dotEl) dotEl.dataset.status = status;

    // Genre tag
    const genreEl = card.querySelector('[data-el="genre"]');
    if (genreEl) {
      genreEl.textContent = genre.label;
      genreEl.style.background = genre.bg;
      genreEl.style.color = genre.color;
    }

    // Text
    const titleEl  = card.querySelector('[data-el="title"]');
    const authorEl = card.querySelector('[data-el="author"]');
    if (titleEl)  titleEl.textContent  = b.title;
    if (authorEl) authorEl.textContent = b.author;

    // Progress bar
    applyProgressBar(card, status);

    // Summary link
    const summaryLink = card.querySelector('[data-el="summaryLink"]');
    if (summaryLink) {
      const hasSummary = b.summary && b.summary !== '#';
      summaryLink.href = hasSummary ? b.summary : '#';
      if (!hasSummary) summaryLink.dataset.disabled = '';
      summaryLink.addEventListener('click', e => { e.stopPropagation(); if (!hasSummary) e.preventDefault(); });
    }

    // Details button
    const moreBtn = card.querySelector('[data-el="moreBtn"]');
    if (moreBtn) moreBtn.addEventListener('click', e => { e.stopPropagation(); openModal(b); });

    // Whole card click → modal
    card.addEventListener('click', () => openModal(b));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(b); } });

    grid.appendChild(card);
  });
}

// Apply/update progress bar colour + width on a card element
function applyProgressBar(card, status) {
  const fill = card.querySelector('[data-el="progFill"]');
  if (!fill) return;
  const width = status === 'finished' ? '100%' : status === 'reading' ? '50%' : '0%';
  const color = status === 'finished' ? '#34d399' : '#fbbf24';
  fill.style.width = width;
  fill.style.background = status === 'unread' ? '' : color;
}

// ════════════════════════════════════════
//  STATS
// ════════════════════════════════════════
function updateStats() {
  const counts = { unread: 0, reading: 0, finished: 0 };
  allBooks.forEach(b => { counts[getStatus(b.id)]++; });

  const total = allBooks.length;
  const pct   = total ? Math.round((counts.finished / total) * 100) : 0;

  setText('statTotal',    total);
  setText('statReading',  counts.reading);
  setText('statFinished', counts.finished);
  setText('statPct',      `${pct}% დასრულებული`);

  const fill = document.getElementById('statBarFill');
  if (fill) fill.style.width = pct + '%';

  const bar = document.getElementById('statBar');
  if (bar) bar.setAttribute('aria-valuenow', pct);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ════════════════════════════════════════
//  MODAL
// ════════════════════════════════════════
function openModal(b) {
  currentBook = b;
  const genre  = GENRE_PALETTE[b.genre] ?? GENRE_PALETTE.general;
  const status = getStatus(b.id);

  document.getElementById('modalCover').src  = b.cover || '';
  document.getElementById('modalCover').alt  = b.title;
  document.getElementById('modalTitle').textContent  = b.title;
  document.getElementById('modalAuthor').textContent = b.author;
  document.getElementById('modalDesc').textContent   = b.desc || '';

  const hasSummary = b.summary && b.summary !== '#';
  const hasBook    = b.book    && b.book    !== '#';
  document.getElementById('modalSummary').href = hasSummary ? b.summary : '#';
  document.getElementById('modalBook').href    = hasBook    ? b.book    : '#';

  const genreEl = document.getElementById('modalGenre');
  genreEl.textContent     = genre.label;
  genreEl.style.background = genre.bg;
  genreEl.style.color      = genre.color;

  setActiveProgBtn(status);

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  modalClose.focus();
}

function closeModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  currentBook = null;
}

function setActiveProgBtn(status) {
  document.querySelectorAll('.prog-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === status);
  });
}

// Progress button clicks
document.querySelectorAll('.prog-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!currentBook) return;
    const status = btn.dataset.status;
    saveStatus(currentBook.id, status);
    setActiveProgBtn(status);

    // Reflect in the card without re-rendering everything
    const card = grid?.querySelector(`[data-id="${currentBook.id}"]`);
    if (card) {
      const dot = card.querySelector('[data-el="dot"]');
      if (dot) dot.dataset.status = status;
      applyProgressBar(card, status);
    }
    updateStats();
  });
});

// Close handlers
if (modalClose) modalClose.addEventListener('click', closeModal);
if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    document.getElementById('search')?.focus();
  }
});

// ════════════════════════════════════════
//  SEARCH
// ════════════════════════════════════════
const searchInput = document.getElementById('search');
if (searchInput) {
  searchInput.addEventListener('input', () => renderGrid(searchInput.value.trim()));
}

// ════════════════════════════════════════
//  GENRE FILTER
// ════════════════════════════════════════
document.querySelectorAll('.genre-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeGenre = pill.dataset.genre;
    renderGrid(searchInput?.value.trim() || '');
  });
});

// ════════════════════════════════════════
//  THEME
// ════════════════════════════════════════
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('kb:theme', theme); } catch { /* ignore */ }
  const icon = document.querySelector('.theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

// Sync icon to stored theme on load
(function syncThemeIcon() {
  try {
    const t = localStorage.getItem('kb:theme') || 'light';
    const icon = document.querySelector('.theme-icon');
    if (icon) icon.textContent = t === 'dark' ? '🌙' : '☀️';
  } catch { /* ignore */ }
})();

// ── Footer year ──────────────────────────
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── Boot ─────────────────────────────────
document.addEventListener('DOMContentLoaded', loadBooks);
