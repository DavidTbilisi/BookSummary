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

function wrapHtml(id, title, body){
  return `<!DOCTYPE html>\n<html lang="ka">\n<head>\n<meta charset='utf-8'/>\n<meta name='viewport' content='width=device-width,initial-scale=1'/>\n<title>${title} – კონსპექტი</title>\n<link rel='stylesheet' href='../../assets/css/reader.css'/>\n</head>\n<body class='reader-shell'>\n<main class='reader' id='content' tabindex='-1'>\n<h1 class='sr-only'>${title} (კონსპექტი)</h1>\n${body}\n</main>\n<script src='../../assets/js/reader.js' defer></script>\n</body>\n</html>`;
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
    const outHtml = wrapHtml(id, meta.title, html);
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
