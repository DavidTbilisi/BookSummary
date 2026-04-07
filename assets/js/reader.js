// ══════════════════════════════════════════
//  KnowledgeBase — reader.js
//  Premium reading controls
// ══════════════════════════════════════════

(function () {
  const STORE_KEY = 'reader:prefs:v2';
  const THEMES = ['dark', 'light', 'sepia', 'night', 'hc'];

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
  const fillEl = document.getElementById('scrollFill');
  const pctEl = document.getElementById('readPct');

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
    const pct = Math.round(ratio * 100);
    if (fillEl) fillEl.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
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
    const idx = THEMES.indexOf(getTheme());
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
    const next = Math.min(1.65, Math.max(0.8, +(current + delta).toFixed(2)));
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
        case 'back': window.location.href = '../../index.html'; break;
        case 'smaller': adjustFont(-0.05); break;
        case 'larger': adjustFont(+0.05); break;
        case 'theme': cycleTheme(); break;
        case 'top': window.scrollTo({ top: 0, behavior: 'smooth' }); break;
        case 'print': window.print(); break;
      }
    });
  }

  // ── Keyboard shortcuts ───────────────────
  window.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    switch (e.key) {
      case '+': case '=': adjustFont(+0.05); break;
      case '-': case '_': adjustFont(-0.05); break;
      case 't': cycleTheme(); break;
      case 'Home': window.scrollTo({ top: 0, behavior: 'smooth' }); break;
    }
  });

  // ── Hide/show ctrl bar on scroll ─────────
  let lastScroll = 0;
  let hideTimer = null;

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
  const page = document.querySelector('.reader-page');
  const readMin = parseInt(page?.dataset?.readMin || '0', 10);
  const wordCount = parseInt(page?.dataset?.words || '0', 10);

  if (readMin > 0 && pctEl) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
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

  // ── Mermaid diagrams initialization ─────
  function initMermaid() {
    try {
      const codeBlocks = Array.from(document.querySelectorAll('pre code.language-mermaid, code.language-mermaid'));
      if (codeBlocks.length === 0) return;
      codeBlocks.forEach(code => {
        const pre = code.closest('pre') || code.parentElement;
        const div = document.createElement('div');
        div.className = 'mermaid';
        div.textContent = code.textContent.trim();
        if (pre && pre.parentNode) pre.parentNode.replaceChild(div, pre);
      });

      if (window.mermaid) {
        try {
          if (typeof window.mermaid.initialize === 'function') {
            window.mermaid.initialize({ startOnLoad: false });
          }
          if (typeof window.mermaid.init === 'function') {
            window.mermaid.init(undefined, document.querySelectorAll('.mermaid'));
          } else if (typeof window.mermaid.run === 'function') {
            window.mermaid.run();
          }
        } catch (err) {
          console.warn('Mermaid init error', err);
        }
      } else {
        // Mermaid not loaded yet; init on window load
        window.addEventListener('load', () => {
          try {
            if (window.mermaid) {
              if (typeof window.mermaid.initialize === 'function') window.mermaid.initialize({ startOnLoad: false });
              if (typeof window.mermaid.init === 'function') window.mermaid.init(undefined, document.querySelectorAll('.mermaid'));
            }
          } catch (err) { console.warn('Mermaid init on load failed', err); }
        });
      }
    } catch (err) { console.warn('Mermaid processing failed', err); }
  }
  initMermaid();

  // ── Audio player initialization ─────────────────
  function formatTime(sec) {
    if (!isFinite(sec) || isNaN(sec)) return '0:00';
    const s = Math.floor(sec || 0);
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${ss.toString().padStart(2, '0')}`;
  }

  function initAudioPlayers() {
    try {
      const players = Array.from(document.querySelectorAll('.audio-player'));
      // Expose players for resize handler
      window.__kbAudioPlayers = players;

      // Reusable audio context + caches
      const audioCtx = window.__kbAudioCtx || (window.__kbAudioCtx = new (window.AudioContext || window.webkitAudioContext)());
      window.__kbWaveCache = window.__kbWaveCache || {};
      window.__kbWaveDecodePromises = window.__kbWaveDecodePromises || {};

      function ensureDecodedAudio(src) {
        if (!src) return Promise.reject(new Error('no-src'));
        if (window.__kbWaveCache[src]) return Promise.resolve(window.__kbWaveCache[src]);
        if (window.__kbWaveDecodePromises[src]) return window.__kbWaveDecodePromises[src];
        const p = fetch(src).then(r => r.arrayBuffer()).then(ab => audioCtx.decodeAudioData(ab)).then(buf => { window.__kbWaveCache[src] = buf; delete window.__kbWaveDecodePromises[src]; return buf; }).catch(err => { delete window.__kbWaveDecodePromises[src]; throw err; });
        window.__kbWaveDecodePromises[src] = p;
        return p;
      }

      function drawWaveFromBuffer(canvas, audioBuffer) {
        if (!canvas || !audioBuffer) return;
        const cs = getComputedStyle(document.documentElement);
        const accent = cs.getPropertyValue('--accent') || '#d4943a';
        const dpr = window.devicePixelRatio || 1;
        const w = Math.max(120, Math.floor(canvas.clientWidth));
        const h = Math.max(18, Math.floor(canvas.clientHeight));
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.scale(dpr, dpr);
        const data = audioBuffer.getChannelData(0);
        const step = Math.max(1, Math.floor(data.length / w));
        const amp = h / 2;
        ctx.lineWidth = 1;
        ctx.strokeStyle = accent.trim();
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        for (let i = 0; i < w; i++) {
          const start = i * step;
          let max = 0;
          for (let j = start; j < start + step && j < data.length; j++) {
            const v = Math.abs(data[j]);
            if (v > max) max = v;
          }
          const y1 = amp - max * amp;
          const y2 = amp + max * amp;
          ctx.moveTo(i + 0.5, y1);
          ctx.lineTo(i + 0.5, y2);
        }
        ctx.stroke();
        ctx.restore();
      }

      function renderWaveform(canvas, src) {
        if (!canvas || !src) return;
        ensureDecodedAudio(src).then(buf => {
          drawWaveFromBuffer(canvas, buf);
        }).catch(() => { /* ignore waveform failures */ });
      }

      players.forEach(wrapper => {
        const audioEl = wrapper.querySelector('.audio-element') || wrapper.querySelector('audio');
        let audio = audioEl;
        if (!audio) {
          const src = wrapper.dataset?.src || wrapper.getAttribute('data-src');
          if (!src) return;
          audio = new Audio(src);
          audio.preload = 'none';
        }

        const playBtn = wrapper.querySelector('.ap-play');
        const progFill = wrapper.querySelector('.ap-progress-fill');
        const progBar = wrapper.querySelector('.ap-progress');
        const timeEl = wrapper.querySelector('.ap-time');
        const speedBtn = wrapper.querySelector('.ap-speed');

        audio.addEventListener('loadedmetadata', () => {
          if (timeEl) timeEl.textContent = `0:00 / ${formatTime(audio.duration)}`;
        });

        audio.addEventListener('timeupdate', () => {
          const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
          if (progFill) progFill.style.width = pct + '%';
          if (timeEl) timeEl.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        });

        audio.addEventListener('play', () => {
          if (playBtn) { playBtn.textContent = '⏸'; playBtn.classList.add('playing'); }
        });
        audio.addEventListener('pause', () => {
          if (playBtn) { playBtn.textContent = '▶'; playBtn.classList.remove('playing'); }
        });
        audio.addEventListener('ended', () => {
          if (playBtn) { playBtn.textContent = '▶'; playBtn.classList.remove('playing'); }
          if (progFill) progFill.style.width = '0%';
        });

        if (playBtn) {
          playBtn.addEventListener('click', () => {
            if (audio.paused) audio.play().catch(() => { });
            else audio.pause();
          });
        }

        if (progBar) {
          progBar.addEventListener('click', (e) => {
            const rect = progBar.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(1, x / rect.width));
            if (audio.duration) audio.currentTime = pct * audio.duration;
          });
        }

        if (speedBtn) {
          const speeds = [0.75, 1, 1.25, 1.5, 2];
          speedBtn.addEventListener('click', () => {
            const cur = audio.playbackRate || 1;
            const idx = speeds.indexOf(cur);
            const next = speeds[(idx + 1) % speeds.length] || 1;
            audio.playbackRate = next;
            speedBtn.textContent = next + '×';
          });
        }

        // Waveform
        const waveCanvas = wrapper.querySelector('.ap-wave');
        const src = (audio && (audio.currentSrc || audio.src)) || wrapper.dataset.src || wrapper.getAttribute('data-src');
        if (waveCanvas && src) renderWaveform(waveCanvas, src);
      });

      // Re-render waveforms on resize (debounced)
      if (!window.__kbWaveResizeBound) {
        window.__kbWaveResizeBound = true;
        let rt;
        window.addEventListener('resize', () => {
          clearTimeout(rt);
          rt = setTimeout(() => {
            const players = window.__kbAudioPlayers || Array.from(document.querySelectorAll('.audio-player'));
            players.forEach(wrapper => {
              const canvas = wrapper.querySelector('.ap-wave');
              const audio = wrapper.querySelector('.audio-element') || wrapper.querySelector('audio');
              const src = (audio && (audio.currentSrc || audio.src)) || wrapper.dataset.src || wrapper.getAttribute('data-src');
              if (canvas && src) renderWaveform(canvas, src);
            });
          }, 180);
        }, { passive: true });
      }
    } catch (err) { console.warn('Audio init failed', err); }
  }

  initAudioPlayers();

})();
