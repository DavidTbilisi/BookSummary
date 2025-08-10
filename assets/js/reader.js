// Reader interactivity (migrated from reading.js)
(function(){
	const root = document.documentElement;
	const storeKey = 'reader:prefs:v1';
	const prefs = loadPrefs();
	function loadPrefs(){ try { return JSON.parse(localStorage.getItem(storeKey)) || {}; } catch { return {}; } }
	function savePrefs(){ try { localStorage.setItem(storeKey, JSON.stringify(prefs)); } catch {}
	}
	function applyPrefs(){
		if (prefs.theme) root.setAttribute('data-theme', prefs.theme); else root.removeAttribute('data-theme');
		if (prefs.layout) root.setAttribute('data-layout', prefs.layout); else root.removeAttribute('data-layout');
		if (prefs.fontSize) root.style.setProperty('--font-size-base', prefs.fontSize + 'rem');
	}
	const progressBar = document.createElement('div'); progressBar.className='progress-bar'; document.body.appendChild(progressBar);
	const progressLabel = document.createElement('div'); progressLabel.className='reading-progress-label'; progressLabel.setAttribute('aria-hidden','true'); progressLabel.textContent='0%'; document.body.appendChild(progressLabel);
	function updateProgress(){
		const scrollTop = window.scrollY || document.documentElement.scrollTop;
		const docHeight = document.documentElement.scrollHeight - window.innerHeight;
		const ratio = docHeight>0 ? Math.min(1, scrollTop / docHeight) : 0;
		const pct = Math.round(ratio*100);
		progressBar.style.width = pct + '%'; progressLabel.textContent = pct + '%';
	}
	window.addEventListener('scroll', updateProgress, { passive:true }); window.addEventListener('resize', updateProgress);
	const bar = document.createElement('div'); bar.className='control-bar'; bar.innerHTML = `
		<button type="button" data-act="back" title="Back to library">←</button>
		<select id="readerThemeSelect" title="Select theme">
			<option value="">Default</option>
			<option value="sepia">Sepia</option>
			<option value="dark">Dark</option>
			<option value="night">Night</option>
			<option value="bw">B/W</option>
			<option value="hc">High Contrast</option>
		</select>
		<button type="button" data-act="theme" title="Cycle theme">Theme</button>
		<button type="button" data-act="layout" title="Toggle column layout">Cols</button>
		<button type="button" data-act="smaller" title="Decrease font size">A-</button>
		<button type="button" data-act="larger" title="Increase font size">A+</button>
		<button type="button" data-act="top" title="Back to top">Top</button>
		<button type="button" data-act="print" title="Print page">Print</button>`; document.body.appendChild(bar);

	const themeSelect = bar.querySelector('#readerThemeSelect');
	if(themeSelect){
		const initTheme = prefs.theme || '';
		themeSelect.value = initTheme;
		themeSelect.addEventListener('change', () => {
			const val = themeSelect.value;
			if(val) prefs.theme = val; else delete prefs.theme;
			savePrefs(); applyPrefs();
		});
	}
	bar.addEventListener('click', e => {
		const btn = e.target.closest('button[data-act]'); if(!btn) return;
		const act = btn.getAttribute('data-act');
		switch(act){
			case 'back': window.location.href = '../../index.html'; break;
			case 'smaller': adjustFont(-0.05); break;
			case 'larger': adjustFont(+0.05); break;
			case 'layout': toggleLayout(); break;
			case 'theme': toggleTheme(); break;
			case 'top': window.scrollTo({ top:0, behavior:'smooth' }); break;
			case 'print': window.print(); break;
		}
	});
	function adjustFont(delta){
		const current = prefs.fontSize || 1.05; const next = Math.min(1.6, Math.max(0.85, +(current + delta).toFixed(2)));
		prefs.fontSize = next; savePrefs(); applyPrefs();
	}
	function toggleLayout(){ prefs.layout = (prefs.layout === 'columns') ? 'single' : 'columns'; if(prefs.layout === 'single') delete prefs.layout; savePrefs(); applyPrefs(); }
	const themes = ['sepia','dark','night','bw','hc',''];
	function toggleTheme(){ const current = prefs.theme || ''; const idx = themes.indexOf(current); const next = themes[(idx+1)%themes.length]; prefs.theme = next; if(!next) delete prefs.theme; savePrefs(); applyPrefs(); }
	window.addEventListener('keydown', e => { if(e.altKey||e.metaKey||e.ctrlKey) return; switch(e.key){ case '+': case '=': adjustFont(+0.05); break; case '-': case '_': adjustFont(-0.05); break; case 't': toggleTheme(); break; case 'l': toggleLayout(); break; case 'Home': window.scrollTo({ top:0, behavior:'smooth' }); break; } });
	applyPrefs(); updateProgress(); setTimeout(updateProgress,100);
})();
