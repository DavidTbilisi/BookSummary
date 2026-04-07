// ══════════════════════════════════════════
//  KnowledgeBase — reader.js
//  Premium reading controls
// ══════════════════════════════════════════

(function () {
  const STORE_KEY = 'reader:prefs:v2';
  const THEMES    = ['dark', 'light', 'sepia', 'night', 'hc'];

  // ── Prefs ───────────────────────────────
  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); }
    catch { return {}; }
  }
  function savePrefs(prefs) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
  }

  const prefs = loadPrefs();

  // Apply stored prefs (theme already applied by inline script in <head>)
  function applyPrefs() {
    const root = document.documentElement;
    if (prefs.theme) root.setAttribute('data-theme', prefs.theme);
    if (prefs.fontSize) root.style.setProperty('--font-size-base', prefs.fontSize + 'rem');
    updateThemeBtn();
  }

  // ── Scroll progress ─────────────────────
  const fillEl  = document.getElementById('scrollFill');
  const pctEl   = document.getElementById('readPct');

  function updateProgress() {
    const scrollTop  = window.scrollY;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    const ratio      = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
    const pct        = Math.round(ratio * 100);
    if (fillEl) fillEl.style.width = pct + '%';
    if (pctEl)  pctEl.textContent  = pct + '%';
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  // ── Theme ───────────────────────────────
  function getTheme() { return document.documentElement.getAttribute('data-theme') || 'dark'; }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    prefs.theme = theme;
    savePrefs(prefs);
    updateThemeBtn();
  }

  function cycleTheme() {
    const idx  = THEMES.indexOf(getTheme());
    const next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next);
  }

  const themeBtn = document.getElementById('themeBtn');

  function updateThemeBtn() {
    if (!themeBtn) return;
    const icons = { dark: '🌙', light: '☀️', sepia: '📜', night: '🌃', hc: '⚡' };
    themeBtn.textContent = icons[getTheme()] || '◑';
    themeBtn.title = 'Theme: ' + getTheme();
  }

  // ── Font size ───────────────────────────
  function adjustFont(delta) {
    const current = prefs.fontSize || 1.05;
    const next    = Math.min(1.65, Math.max(0.8, +(current + delta).toFixed(2)));
    prefs.fontSize = next;
    savePrefs(prefs);
    document.documentElement.style.setProperty('--font-size-base', next + 'rem');
  }

  // ── Controls ────────────────────────────
  const ctrlBar = document.getElementById('ctrlBar');
  if (ctrlBar) {
    ctrlBar.addEventListener('click', e => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      switch (btn.dataset.act) {
        case 'back':    window.location.href = '../../index.html'; break;
        case 'smaller': adjustFont(-0.05); break;
        case 'larger':  adjustFont(+0.05); break;
        case 'theme':   cycleTheme(); break;
        case 'top':     window.scrollTo({ top: 0, behavior: 'smooth' }); break;
        case 'print':   window.print(); break;
      }
    });
  }

  // ── Keyboard shortcuts ───────────────────
  window.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    switch (e.key) {
      case '+': case '=': adjustFont(+0.05); break;
      case '-': case '_': adjustFont(-0.05); break;
      case 't':           cycleTheme();      break;
      case 'Home':        window.scrollTo({ top: 0, behavior: 'smooth' }); break;
    }
  });

  // ── Hide/show ctrl bar on scroll ─────────
  let lastScroll = 0;
  let hideTimer  = null;

  window.addEventListener('scroll', () => {
    const now = window.scrollY;
    if (ctrlBar) {
      // Always show when scrolling up or near bottom
      const atBottom = (window.innerHeight + now) >= document.documentElement.scrollHeight - 60;
      if (now < lastScroll || atBottom) {
        ctrlBar.style.opacity = '1';
        ctrlBar.style.transform = 'translateX(-50%) translateY(0)';
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          if (window.scrollY > 200) {
            ctrlBar.style.opacity = '0.35';
            ctrlBar.style.transform = 'translateX(-50%) translateY(4px)';
          }
        }, 2800);
      }
    }
    lastScroll = now;
  }, { passive: true });

  // ── Reading time countdown ───────────────
  const page     = document.querySelector('.reader-page');
  const readMin  = parseInt(page?.dataset?.readMin || '0', 10);
  const wordCount = parseInt(page?.dataset?.words   || '0', 10);

  if (readMin > 0 && pctEl) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio     = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
      const remaining = Math.max(0, Math.ceil(readMin * (1 - ratio)));
      pctEl.textContent = remaining > 0 ? `~${remaining}m left` : 'Done ✓';
    }, { passive: true });
  }

  // ── Smooth anchor links ──────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  // ── Init ────────────────────────────────
  applyPrefs();

})();
