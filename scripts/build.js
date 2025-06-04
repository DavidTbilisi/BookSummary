const fs = require('fs');
const path = require('path');
const pug = require('pug');
const { marked } = require('marked');

const srcDir = path.join(__dirname, '..', 'src');
const distDir = path.join(__dirname, '..', 'dist');
const distBooks = path.join(distDir, 'books');
const distStyles = path.join(distDir, 'styles');
const distScripts = path.join(distDir, 'scripts');

function ensure(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensure(distDir);
ensure(distBooks);
ensure(distStyles);
ensure(distScripts);

// compile index.pug
const indexHtml = pug.renderFile(path.join(srcDir, 'index.pug'), { pretty: true });
fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);

// copy static assets
['style.css', 'book.css'].forEach(file => {
  fs.copyFileSync(path.join(srcDir, 'styles', file), path.join(distStyles, file));
});
fs.copyFileSync(path.join(srcDir, 'scripts', 'headers.js'), path.join(distScripts, 'headers.js'));

// convert markdown books
const booksSrc = path.join(srcDir, 'books');
for (const file of fs.readdirSync(booksSrc)) {
  if (file.endsWith('.md')) {
    const md = fs.readFileSync(path.join(booksSrc, file), 'utf-8');
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="../styles/book.css">
</head>
<body>
${marked(md)}
<script src="../scripts/headers.js"></script>
</body>
</html>`;
    fs.writeFileSync(path.join(distBooks, file.replace(/\.md$/, '.html')), html);
  }
}
