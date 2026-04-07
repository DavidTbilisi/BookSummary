#!/usr/bin/env python3
"""Batch-generate audio for all books in books/src using the installed TTS_ka CLI.

Usage: run from repo root:
    py -3 scripts/generate_audios.py

This script:
- scans books/src/*.md (skips TEMPLATE.md)
- extracts the markdown body (strips code blocks)
- detects language (ka/ru/en) heuristically
- calls: `py -3 -m TTS_ka <tmp.txt> --no-play --lang <lang>`
- moves generated data.mp3 -> audio/<slug>.mp3
"""

from pathlib import Path
import re
import subprocess
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "books" / "src"
AUDIO_DIR = ROOT / "audio"
TMP_DIR = ROOT / "tmp_tts"


def parse_front_matter(text: str):
    if text.startswith("---"):
        end = text.find("\n---\n", 3)
        if end != -1:
            meta_block = text[3:end]
            body = text[end + 5 :]
            meta = {}
            for line in meta_block.splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    meta[k.strip()] = v.strip().strip("'\"")
            return meta, body
    return {}, text


def strip_code_blocks(md: str):
    # remove fenced code blocks (```...```) and HTML comments
    s = re.sub(r"```[\s\S]*?```", "", md)
    s = re.sub(r"<!--([\s\S]*?)-->", "", s)
    return s


def detect_lang(text: str):
    if re.search(r"[\u10A0-\u10FF\u2D00-\u2D2F]", text):
        return "ka"
    if re.search(r"[\u0400-\u04FF]", text):
        return "ru"
    return "en"


def slugify(name: str):
    # create an ASCII-friendly slug; fall back to hex if empty
    s = re.sub(r"[^A-Za-z0-9]+", "_", name)
    s = s.strip("_")
    if not s:
        # fallback: use hex of name
        s = "book_" + hex(abs(hash(name)))[2:10]
    return s.lower()


def main():
    AUDIO_DIR.mkdir(exist_ok=True)
    TMP_DIR.mkdir(exist_ok=True)
    md_files = sorted([p for p in SRC.glob("*.md") if p.name != "TEMPLATE.md"])
    if not md_files:
        print("No markdown files found in", SRC)
        return

    manifest = {}

    for p in md_files:
        print("Processing", p.name)
        raw = p.read_text(encoding="utf-8")
        meta, body = parse_front_matter(raw)
        body = strip_code_blocks(body).strip()
        if not body:
            print("  Skipping (no body text)")
            continue

        lang = detect_lang(body)
        # choose output name: prefer numeric stem (001), else slugified title or filename stem
        stem = p.stem
        if stem.isdigit():
            out_name = stem
        else:
            title = meta.get("title") or stem
            out_name = slugify(title)

        tmp_txt = TMP_DIR / f"{out_name}.txt"
        # simplify whitespace for TTS
        txt = re.sub(r"\s+", " ", body).strip()
        tmp_txt.write_text(txt, encoding="utf-8")

        # call TTS_ka CLI
        cmd = ["py", "-3", "-m", "TTS_ka", str(tmp_txt), "--no-play", "--lang", lang]
        print("  Lang:", lang, "| cmd:", " ".join(cmd))
        try:
            subprocess.run(cmd, check=True, cwd=str(ROOT))
        except subprocess.CalledProcessError as e:
            print("  TTS generation failed for", p.name, e)
            continue

        # TTS_ka writes data.mp3 in cwd
        generated = ROOT / "data.mp3"
        if not generated.exists():
            print("  No data.mp3 produced for", p.name)
            continue

        dest = AUDIO_DIR / f"{out_name}.mp3"
        shutil.move(str(generated), str(dest))
        print("  ->", dest)
        # record mapping from source markdown filename to audio filename
        manifest[p.name] = dest.name

    # write manifest for build script to consume
    try:
        data_dir = ROOT / "data"
        data_dir.mkdir(exist_ok=True)
        manifest_file = data_dir / "audio_manifest.json"
        import json

        manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        print("\nWrote audio manifest to", manifest_file)
    except Exception as e:
        print("Failed to write manifest:", e)

    print("\nDone. Audio files saved to", AUDIO_DIR)


if __name__ == "__main__":
    main()
