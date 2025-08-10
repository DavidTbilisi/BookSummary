// Catalog logic: build cards from books.json and handle modal dialog
async function loadBooks(){
	try {
		const res = await fetch('data/books.json');
		if(!res.ok) throw new Error('books.json load failed');
		const books = await res.json();
		buildGrid(books);
	} catch(err){
		console.error(err);
	}
}

function buildGrid(books){
	const grid = document.getElementById('bookGrid');
	const template = document.getElementById('book-card-template');
	if(!grid || !template) return;
	books.forEach(b => {
		const clone = template.content.firstElementChild.cloneNode(true);
		const cover = clone.querySelector('[data-el="cover"]');
		const titleEl = clone.querySelector('[data-el="title"]');
		const authorEl = clone.querySelector('[data-el="author"]');
		const summaryLink = clone.querySelector('[data-el="summaryLink"]');
		const bookLink = clone.querySelector('[data-el="bookLink"]');
		const openBtn = clone.querySelector('[data-el="openDesc"]');
		if(cover){ cover.src = b.cover; cover.alt = b.title; }
		if(titleEl) titleEl.textContent = b.title;
		if(authorEl) authorEl.textContent = b.author;
		if(summaryLink) summaryLink.href = b.summary || '#';
		if(bookLink) bookLink.href = b.book || '#';
		if(openBtn) openBtn.addEventListener('click', () => openDialog(b));
		grid.appendChild(clone);
	});
}

// Dialog handling (ported from original script.js)
const dialogEl = document.getElementById('descDialog');
const dialogCover = document.getElementById('dialogCover');
const dialogTitle = document.getElementById('dialogTitle');
const dialogAuthor = document.getElementById('dialogAuthor');
const dialogBody = document.getElementById('dialogBody');
const dialogClose = document.getElementById('dialogClose');
const dialogSummary = document.getElementById('dialogSummary');
const dialogBook = document.getElementById('dialogBook');
let lastFocused = null;

function openDialog(b){
	if(!dialogEl) return;
	lastFocused = document.activeElement;
	dialogTitle.textContent = b.title;
	dialogAuthor.textContent = b.author;
	dialogBody.textContent='';
	const p=document.createElement('p'); p.textContent = b.desc || ''; dialogBody.appendChild(p);
	if(b.cover) dialogCover.src = b.cover; dialogCover.alt = b.title;
	if(b.summary) dialogSummary.href = b.summary; if(b.book) dialogBook.href = b.book;
	dialogEl.classList.remove('hidden');
	trapFocus();
	dialogClose.focus();
}
function closeDialog(){
	if(!dialogEl) return; dialogEl.classList.add('hidden'); if(lastFocused) lastFocused.focus();
}
if(dialogClose) dialogClose.addEventListener('click', closeDialog);
if(dialogEl){
	dialogEl.addEventListener('click', e => { if(e.target === dialogEl || e.target === dialogEl.firstElementChild) closeDialog(); });
}
window.addEventListener('keydown', e => {
	if(e.key === 'Escape' && !dialogEl.classList.contains('hidden')) closeDialog();
	if(e.key === 'Tab' && !dialogEl.classList.contains('hidden')) handleTab(e);
});
function trapFocus(){
	const focusables = dialogEl.querySelectorAll('a, button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
	dialogEl.__focusables = Array.from(focusables);
}
function handleTab(e){
	const list = dialogEl.__focusables; if(!list || !list.length) return;
	const first = list[0]; const last = list[list.length-1];
	if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
	else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
}
window.openBookDialog = openDialog;

// Footer year
const yearEl = document.getElementById('year'); if(yearEl) yearEl.textContent = new Date().getFullYear();

// Search filter
const search = document.getElementById('search');
if(search){
	search.addEventListener('input', () => {
		const q = search.value.trim().toLowerCase();
		document.querySelectorAll('#bookGrid article').forEach(card => {
			const t = card.querySelector('[data-el="title"]').textContent.toLowerCase();
			const a = card.querySelector('[data-el="author"]').textContent.toLowerCase();
			card.style.display = (t.includes(q) || a.includes(q)) ? '' : 'none';
		});
	});
	window.addEventListener('keydown', e => { if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); search.focus(); }});
}

document.addEventListener('DOMContentLoaded', loadBooks);

// Catalog theme chooser
const themeSelect = document.getElementById('themeSelect');
function applyCatalogTheme(theme){
	document.documentElement.setAttribute('data-theme', theme);
	try{ localStorage.setItem('catalogTheme', theme); }catch(e){}
}
if(themeSelect){
	// Initialize select to stored value
	try{ const stored = localStorage.getItem('catalogTheme'); if(stored){ themeSelect.value = stored; } }catch(e){}
	themeSelect.addEventListener('change', () => applyCatalogTheme(themeSelect.value));
}
