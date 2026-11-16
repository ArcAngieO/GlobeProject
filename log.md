# Build log: GlobeProject

**AI:** Claude Code | **Editor:** not chosen yet | **Host:** not chosen yet (repo on branch `Angie`, originally committed to `main`)
**Stack:** static HTML/CSS/JS — a 2D canvas Earth view with D3 + TopoJSON for geography, plus a mock AI chat panel. See below for how the files are organized.

---

## What we set out to build

GlobeProject is a website with an interactive globe that lets you view major events based on the year — drag to rotate, scrub a timeline from 1990 to 2026, and ask a mock "TERRA AI" chatbot about a given date. When this log starts, the repo already had a first working version (one `index.html` with everything inline, plus a `data.js` of encoded land/light data) committed as the initial commit on `main`.

---

## 1. Split the single-file page into a `src/` structure (2026-11-15) — Angie

**What I asked for**
- Asked Claude to make a `src` folder and sort the project.

**What changed**
- The original `index.html` had all CSS in one inline `<style>` block and all JS in one inline `<script>` block, plus a root-level `data.js`.
- Pulled the CSS out to `src/css/style.css` and the JS out to `src/js/app.js`, moved `data.js` to `src/js/data.js` (via `git mv` to keep its history), and left `index.html` at the repo root as a thin shell that links/loads those three files in order.

**What I checked**
- Served the folder locally (Node's `serve`, since no Python was available) and curled every new path (`index.html`, `src/css/style.css`, `src/js/app.js`, `src/js/data.js`) to confirm each returned 200 rather than a 404 from a bad path.

**Decisions**
- Kept it to a plain `src/css` + `src/js` split, no build step or bundler, since the project has no dependencies to manage yet.

---

## 2. Replaced the whole site with a newer version from an uploaded zip, reorganized the same way (2026-11-15) — Angie

**What I asked for**
- Uploaded `terra_globe_site_v3.zip` and asked Claude to get rid of all the code in the repo and replace it with what was in the zip, but keep it organized properly.

**What changed**
- The zip actually contained 7 files, not just the `index.html` Claude's auto-extract preview first showed: `index.html`, `data.js` (byte-identical to the one already in `src/js/data.js`), `d3.min.js`, `topojson-client.min.js`, and three TopoJSON datasets (`topo110m.js`, `topo50m.js`, `topo10m.js`, the last one only loaded lazily on deep zoom).
- Extracted the zip into a scratch folder first, confirmed `data.js` was unchanged, then split the new `index.html` the same way as entry 1 (`src/css/style.css`, `src/js/app.js`) and sorted the new vendor/data files into `src/vendor/` (D3, TopoJSON client) and `src/data/` (the three TopoJSON files), rather than dropping everything into `src/js`.
- Fixed one path in `app.js`: the lazy-loader for `topo10m.js` pointed at a bare `"topo10m.js"`, which needed to become `"src/data/topo10m.js"` after the move.
- Found and cleaned up a stray duplicate set of the vendor/data files that had ended up directly in `src/js/` partway through (from an earlier interrupted step), so `src/js` now holds only `app.js` and `data.js`.

**What I checked**
- Served the project locally and curled every script/stylesheet path referenced from `index.html`, including the lazy-loaded `src/data/topo10m.js`, to confirm all 200. Grepped `app.js` and `index.html` afterward for any leftover bare filename (`"topo10m.js"`, `"d3.min.js"`, etc.) to make sure nothing still pointed at the old flat layout.
- Didn't open the page in an actual browser to check the globe renders and the chat panel works — only that the files are reachable at the right URLs.

**Decisions**
- Left the lazy lazy-load pattern for `topo10m.js` as-is (same mechanism, just a fixed path), rather than eagerly loading the largest dataset (3.6 MB) up front.

---

## 3. Moved the uncommitted reorg work onto a new `Angie` branch (2026-11-15) — Angie

**What I asked for**
- Said the above work had been done on `main` and asked Claude to move it to a new branch called `Angie`.

**What changed**
- Checked first: `main` only had the repo's original initial commit — everything from entries 1 and 2 was still staged/unstaged/untracked, nothing new had actually been committed to `main`. So `git checkout -b Angie` was enough; it carried all the pending changes onto the new branch automatically and left `main` exactly at the initial commit.

**What I checked**
- `git status` on `main` before switching (to confirm nothing beyond the initial commit existed there) and `git status` on `Angie` after switching (to confirm the same staged/unstaged/untracked files were still present).

**Decisions**
- Didn't commit anything as part of this move — just the branch switch. Work from entries 1 and 2 is still sitting uncommitted on `Angie`.

---

## 4. Set up `log.md` and the log protocol (2026-11-15) — Angie

**What I asked for**
- Uploaded a `log.md` from another project as a format example and asked Claude to make sure every change from here on gets logged the same way.

**What changed**
- This file, backfilled with entries 1-3 for everything already done in this repo, structured like the uploaded example: a numbered entry per change, with "What I asked for," "What changed," "What I checked," and "Decisions."
- Added a `CLAUDE.md` with a "Log protocol" section telling any agent working in this repo to add an entry here after a real change, build step, or decision, not only when asked.

**What I checked**
- Nothing to check — this entry only adds documentation.

**Decisions**
- One global log for now rather than splitting it by area, since this project doesn't have separate team members/branches the way the example repo did.

---
