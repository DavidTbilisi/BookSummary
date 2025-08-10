// Build book cards from hidden data source and handle modal dialog
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('bookGrid');
    const source = document.getElementById('cards-source');
    const template = document.getElementById('book-card-template');

    if (source && template && grid) {
        const items = source.querySelectorAll('[data-book]');
        items.forEach(node => {
            const clone = template.content.firstElementChild.cloneNode(true);
            const cover = clone.querySelector('[data-el="cover"]');
            const titleEl = clone.querySelector('[data-el="title"]');
            const authorEl = clone.querySelector('[data-el="author"]');
            const summaryLink = clone.querySelector('[data-el="summaryLink"]');
            const bookLink = clone.querySelector('[data-el="bookLink"]');
            const openBtn = clone.querySelector('[data-el="openDesc"]');

            const title = node.getAttribute('data-title') || '';
            const author = node.getAttribute('data-author') || '';
            const coverUrl = node.getAttribute('data-cover') || '';
            const summaryUrl = node.getAttribute('data-summary') || '#';
            const bookUrl = node.getAttribute('data-booklink') || '#';
            const desc = node.getAttribute('data-desc') || '';

            if (cover) cover.src = coverUrl;
            if (cover) cover.alt = title;
            if (titleEl) titleEl.textContent = title;
            if (authorEl) authorEl.textContent = author;
            if (summaryLink) summaryLink.href = summaryUrl;
            if (bookLink) bookLink.href = bookUrl;
            if (openBtn) openBtn.addEventListener('click', () => openDialog({ title, author, coverUrl, desc, summaryUrl, bookUrl }));

            grid.appendChild(clone);
        });
    }

    // Footer year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Quick search filter
    const search = document.getElementById('search');
    if (search) {
        search.addEventListener('input', () => {
            const q = search.value.trim().toLowerCase();
            grid.querySelectorAll('article').forEach(card => {
                const t = card.querySelector('[data-el="title"]').textContent.toLowerCase();
                const a = card.querySelector('[data-el="author"]').textContent.toLowerCase();
                card.style.display = (t.includes(q) || a.includes(q)) ? '' : 'none';
            });
        });
    }

    // Ctrl+K focus search
    window.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            if (search) { e.preventDefault(); search.focus(); }
        }
    });
});

// Dialog handling
const dialogEl = document.getElementById('descDialog');
const dialogCover = document.getElementById('dialogCover');
const dialogTitle = document.getElementById('dialogTitle');
const dialogAuthor = document.getElementById('dialogAuthor');
const dialogBody = document.getElementById('dialogBody');
const dialogClose = document.getElementById('dialogClose');
const dialogSummary = document.getElementById('dialogSummary');
const dialogBook = document.getElementById('dialogBook');

let lastFocused = null;

function openDialog({ title, author, coverUrl, desc, summaryUrl, bookUrl }) {
    if (!dialogEl) return;
    lastFocused = document.activeElement;
    dialogTitle.textContent = title;
    dialogAuthor.textContent = author;
    dialogBody.textContent = '';
    const p = document.createElement('p');
    p.textContent = desc;
    dialogBody.appendChild(p);
    if (coverUrl) dialogCover.src = coverUrl;
    dialogCover.alt = title;
    if (summaryUrl) dialogSummary.href = summaryUrl;
    if (bookUrl) dialogBook.href = bookUrl;
    dialogEl.classList.remove('hidden');
    trapFocus();
    dialogClose.focus();
}

function closeDialog() {
    if (!dialogEl) return;
    dialogEl.classList.add('hidden');
    if (lastFocused) lastFocused.focus();
}

if (dialogClose) dialogClose.addEventListener('click', closeDialog);
if (dialogEl) {
    dialogEl.addEventListener('click', e => {
        if (e.target === dialogEl || e.target === dialogEl.firstElementChild) {
            closeDialog();
        }
    });
}

window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !dialogEl.classList.contains('hidden')) {
        closeDialog();
    }
    if (e.key === 'Tab' && !dialogEl.classList.contains('hidden')) {
        handleTab(e);
    }
});

function trapFocus() {
    const focusables = dialogEl.querySelectorAll('a, button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
    dialogEl.__focusables = Array.from(focusables);
}

function handleTab(e) {
    const list = dialogEl.__focusables;
    if (!list || list.length === 0) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
    }
}

// Optional: expose for console debugging
window.openBookDialog = openDialog;