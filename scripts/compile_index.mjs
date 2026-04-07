#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pug from 'pug';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'index.pug');
const out = path.join(root, 'index.html');

async function compile() {
    try {
        const html = pug.renderFile(src, { pretty: true });
        await writeFile(out, html, 'utf8');
        console.log('Wrote', out);
    } catch (err) {
        console.error('Error compiling Pug:', err);
        process.exit(1);
    }
}

compile();
