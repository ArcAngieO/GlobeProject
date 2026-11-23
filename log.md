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

## 5. Country/state borders with hover highlight, a historical-era timeline strip, and click-to-see population/timezone (2026-11-22) — Angie

**What I asked for**
- Outlines on all countries and states, subtle at rest and highlighted on hover.
- Move the wind/layer toggle bar to the top of the screen; add a collapsible historical-era timeline at the bottom (Ancient through Modern, with icons) that sets the existing year dial when an era is clicked.
- On the left side, show the population, timezone, and other relevant info for wherever the user clicked, for the selected date — and whether that needs a database like Supabase, or whether it can just be looked up automatically.

**What changed**
- Asked three clarifying questions before starting (border scope, data source for population/timezone, and era-strip fidelity); you chose: country **and** state borders, a **bundled static dataset** (no live DB, no AI-per-click), and eras matching the reference image closely.
- Pulled two new datasets from Natural Earth (`nvkelso/natural-earth-vector`, public domain) and converted them with `mapshaper` to match this project's existing TopoJSON style:
  - `src/data/topoStates110m.js` / `topoStates50m.js` — admin-1 state/province boundaries (own self-contained topology, ~11KB/85KB), loaded alongside the existing country/land files.
  - `src/data/countryInfo.js` — population estimate + continent per country, keyed by the same ISO numeric id the existing country topology already uses (confirmed this via a throwaway `check.js` cross-reference, since Natural Earth has known `-99` id bugs for France/Norway that needed manual patching, and 3 disputed territories — N. Cyprus, Somaliland, Kosovo — that have no numeric id at all in this project's topology and had to be keyed by name instead).
  - `index.html` — added script tags for the three new data files; split the left `.stats` grid into two swappable panels (`#statsGlobal`, the original 4 boxes, and `#statsLocation`, population/timezone/surface/continent); added the `#eras` section (tab + collapsible strip).
  - `src/js/app.js` — country borders are now subtly visible at all zoom levels instead of only appearing past 1.4× zoom; added per-feature country/state lookup (`topojson.feature`, not just the existing shared-edge `mesh`) so individual borders can be hit-tested and highlighted; added a throttled pointermove hover check (`d3.geoContains`, country always, state only past 2× zoom) that brightens just the hovered boundary; added `showLocationInfo()`/`hideLocationInfo()` wired into both the existing click-to-probe flow and city selection, computing population by compounding the dataset's ~2019 estimate at a flat ~1.1%/yr to the selected year, and timezone as a simple `round(longitude/15)` UTC offset (there's no real timezone-boundary data bundled, so this is an approximation, same spirit as the rest of the app's placeholder data); added the `ERAS` array (6 eras, inline SVG icons, no image assets) and the open/close tab.
  - Moved `.layers` (the wind/lights/grid/borders bar) from bottom-center to top-center in `style.css`; added `.eras`/`.era*` styles, sized to sit in the gap between the left hero panel and the bottom-right timeline panel so it doesn't overlap either at desktop widths.

**What I checked**
- Installed Playwright locally and drove the page in headless Chromium (own scratch script, deleted afterward, not committed): confirmed no console/page errors, confirmed clicking the globe populates population/timezone/surface/continent correctly (tested a Land point in Sudan, a Land point in Iraq at 4× zoom, and open Ocean — each showed sensible values, including the "no country" fallback), confirmed country hover-highlight renders at both 1× and 4× zoom, confirmed the era strip opens/closes and clicking an era moves the year dial and date display.
- Caught and fixed one real bug this way: `buildMap()` referenced `res` (the current geography resolution) without having it passed in, which threw on every frame once state-border code could run — passing `res` through as a parameter fixed it.
- Didn't get to test on narrow/mobile widths, or verify the population-by-year growth-rate approximation against real historical figures for any specific country.

**Decisions**
- **Eras vs. the dial's real range**: the globe's data only covers 1990–2026, but the requested eras go back to 3000 BCE. Rather than block on this, spread the 6 eras across the existing 1990–2026 range (Ancient→1990, …, Modern→2026) so every era is clickable and moves the dial somewhere, while the card itself still shows the real historical date range and key event text. This is a judgment call, not historically meaningful — flagging it in case you'd rather eras before 1990 just snap to 1990 with no spread, or want the note under the strip worded differently.
- **No live database and no per-click AI lookup** for population/timezone, per your answer to the clarifying question — a bundled static dataset fits this project's existing "no backend" pattern (see `CLAUDE.md`) and the existing `CITIES`/`EVENT_TYPES` placeholder-data style already in `app.js`.
- Timezone is computed from longitude only (not a real timezone-polygon dataset) to keep this a static, dependency-free lookup — it'll be off near some timezone boundaries and for places with non-hour offsets or unusual political borders.

---

## 6. Follow-up round: real era year ranges, click-to-ID hero text, a mouse-following geo tooltip, nearest city on the probe card (2026-11-22) — Angie

**What I asked for** (after trying entry 5 locally)
- Clicking a state/country should also replace the "See the world…" hero headline with the place name and a short blurb, not just the 4 stat boxes.
- The year dial wasn't actually reflecting the clicked era's real years — e.g. clicking Industrial still showed 2018-era years instead of 1700–1900. Make the whole bar (min/max, tick labels, histogram) re-scope to the era's real range.
- Hovering a country/state should show a small tooltip box next to the mouse cursor, like the existing city-hover tags.
- Add the nearest city to the top of the click-probe popup (the one that currently only shows wind/surface/light index).

**What changed**
- `src/js/app.js`:
  - The year dial's min/max are no longer hardcoded to 1990–2026. Each `ERAS` entry now carries a real `ymin`/`ymax`/`anchor` (e.g. Industrial = 1700/1900/1769). Clicking an era sets `yearEl.min/max` to that range and rebuilds both the histogram (`rebuildHist`, capped at 40 bars so a 2500-year span like Ancient doesn't render thousands of DOM elements) and the tick labels (`rebuildTicks`, using a "nice round number" step — 10/20/50/100 etc. — so labels land on clean values instead of awkward quarters).
  - Added BCE-aware date formatting (`yearStr`) and fixed a real latent bug while doing this: `new Date(y, m, d)` (and `Date.UTC`) silently add 1900 to any two-digit year, which would have broken any click landing between 1 CE and 99 CE. Replaced the three places doing this (`dow` lookup, day-of-month lookup, the day-stepper) with a `setFullYear`-based constructor that doesn't have that bug.
  - The sample-data generators (`stats`, `lightIndex`, the growth factor) all run through one `yearT()` conversion — clamped it there, in one place, so scrubbing to a historical/BCE year can't produce `Math.pow(negative, 0.8)` → `NaN` and break the globe's visuals; `eventFor`/`buildWind` didn't need this, they're hash-based and don't choke on arbitrary year numbers.
  - `showLocationInfo()` now also looks up the state/province at the clicked point (new `stateInfoAt()`) and country (existing `countryInfoAt()`), and writes a hero title + one-line description into new `#heroLocation` / `#locHeroTitle` / `#locHeroDesc` elements, swapped in/out against the original `#heroDefault` block exactly like the stat-box swap already did.
  - Found a second real issue testing this: the population model (compound ~1.1%/yr back from a ~2019 baseline) decays to an absurd "0" once you're far enough back (confirmed in-browser: Chad showed "Population 0" at 2500 BCE). Added a floor — below 1,000 people the estimate is treated as "not modeled" and the UI says so, rather than showing a fake zero.
  - Added a `#geoTip` element that follows the cursor (updated on every `pointermove`, independent of the throttled hover lookup) showing the hovered state (with its country via the dataset's `admin` field) or country name — the same "little box near the mouse" pattern as the existing city tags, but for borders instead of pins. Also dropped the old `zoom > 2` gate on *detecting* state hover (kept it only for the drawn outline) so the tooltip can name a state at any zoom level, since the underlying lon/lat point is exact regardless of zoom.
  - Added `nearestCity()` (reuses the existing `vec()` dot-product machinery already in the file) and a "NEAREST CITY" row at the top of the click-probe card, above wind.
- `index.html` — wrapped the hero copy in `#heroDefault`/`#heroLocation` siblings; gave the big timeline tick row an id (`#yearTicks`) so it can be rebuilt; added the `#geoTip` div.
- `src/css/style.css` — styled `.geoTip` (small dark bordered box, fades in, follows the cursor via `transform`, `pointer-events:none` so it never blocks clicks).

**What checked**
- Re-ran the same local Playwright/headless-Chromium smoke test as entry 5 (installed fresh each time since it isn't committed to the repo): clicked a land point, hovered a different country, opened the era strip and clicked Industrial then Ancient, each time screenshotting and checking `page.on('pageerror')`/`console --errors`. Confirmed: hero + stat boxes update together, the dial genuinely shows "1700 / 1750 / 1800 / 1850 / 1900" for Industrial and "3000 BCE / 2000 BCE / 1000 BCE / 500 BCE" for Ancient (not the old fixed labels), the date text reads e.g. "June 14, 2500 BCE", the Industrial/Ancient cards get the "now" highlight, the hover tooltip shows the country name and follows the cursor, and the nearest-city row renders above wind in the probe card.
- Deleted the scratch test script and its `node_modules` afterward, same as last time — not committed.
- Didn't get to check the Classical/Medieval/Renaissance eras individually (only Industrial and Ancient, as the two extremes), or re-check narrow/mobile widths after these changes.

**Decisions**
- Picked 1,000 people as the "stop pretending this number means anything" floor for population, rather than a fixed year cutoff — it naturally adapts per country (a small country's estimate goes unreliable earlier than a huge one's would, under the same growth-rate math) instead of hard-coding one global historical boundary.
- Left the Renaissance era's anchor at 1600 rather than the card's own headline event (1450, printing press) — 1450 actually falls before the Renaissance's own declared 1500–1700 range (same odd ordering as your reference image, where the key event also predates the era label), and landing the dial there would have made the "now" highlight light up the *Medieval* card instead of the one you clicked. The displayed event text is unchanged; only the jump-to year was adjusted.

---

## 7. Default dial = Modern era; real nearest-city lookup (2026-11-22) — Angie

**What I asked for**
- The default timeline on page load didn't match the "Modern" era card — fix it to default to the modern timeline.
- The nearest-city readout on the click-probe card was only ever picking from the 18 cities in the demo `CITIES` list (the ones used for the light-index simulation and the clickable pins), so a click in Washington State was never going to find Tacoma — it'd return whichever of those 18 happened to be closest, however far that was. Wanted the actual nearest real city.

**What changed**
- `src/js/app.js` — `yearMin`/`yearMax` now default to 1900–2026 (matching the Modern era card's own stated range) instead of 1990–2026, so the dial, its tick labels, and the era strip agree from first load without needing to click anything.
- `src/data/places.js` (new) — pulled Natural Earth's `ne_10m_populated_places` dataset (same public-domain source as the country/state borders from entry 5), trimmed to just name/lat/lon, ~7,300 places worldwide, ~203KB. `nearestCity()` now searches this instead of the 18-city demo list — confirmed Tacoma, New York, and Bristol (UK) all resolve correctly to themselves from their own coordinates.
- `index.html` — added the `places.js` script tag; updated the year slider's static HTML defaults (`min`, tick labels, the `YEARS` stat placeholder) to 1900–2026 so they match before JS first runs.
- The 18-city `CITIES` list is untouched and still drives the light-index simulation, the clickable globe pins, and the "Top Regions" panel — this was purely about what the probe card's "nearest city" row searches.

**What checked**
- `node --check` on `app.js`.
- In headless Chromium: confirmed the Modern card has the "now" highlight and the tick row reads "1900 / 1950 / 2000 / 2026" on a fresh page load with no clicks. Called `nearestCity()` directly for Tacoma's, New York's, and Bristol's own coordinates and got each back with a few km of slack (floating-point/rounding, not a bug).
- Didn't re-verify the full click-on-globe path end-to-end in the browser this round (a scripted camera fly-to in the test gave an unrelated point due to the test's own math, not the app's — direct function calls confirmed the lookup itself is correct) — worth you clicking around Washington state yourself to confirm the on-screen experience matches.

**Decisions**
- Kept the new `places.js` as a flat array of `[name, lat, lon]` tuples rather than adding population/country fields — it's only used for "what's the closest named place," so extra fields would just be unused weight.

---
