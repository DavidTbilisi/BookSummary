# Book Summary

This repository contains short book summaries. Source files are written in [Pug](https://pugjs.org/) templates and Markdown. A build step converts them to static HTML.

## Development

Install dependencies and build the site:

```bash
npm install
npm run build
```

The generated files appear in the `dist/` directory.

## Continuous Integration

A GitHub Actions workflow (`.github/workflows/build.yml`) builds the HTML on every push to `main` or `master` and uploads the contents of `dist` as an artifact.
