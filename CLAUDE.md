# CLAUDE.md

Guidance for Claude Code when working in this repo.

## What this project is

GlobeProject: a static website with an interactive globe (2D canvas + D3/TopoJSON) that lets you view "events" by date, from 1990 to 2026, plus a mock AI chat panel. No backend, no build step, no dependencies beyond the vendored D3/TopoJSON scripts in `src/vendor/`.

## Layout

- `index.html` — thin shell: links `src/css/style.css`, loads `src/js/data.js`, `src/vendor/*`, `src/data/*` (TopoJSON), then `src/js/app.js`.
- `src/css/style.css` — all styling.
- `src/js/app.js` — all app logic (globe rendering, timeline, mock chat).
- `src/js/data.js` — encoded land/light data consumed by `app.js`.
- `src/vendor/` — third-party libraries (D3, TopoJSON client), unmodified.
- `src/data/` — TopoJSON geography datasets (`topo110m.js`, `topo50m.js` loaded eagerly; `topo10m.js` loaded lazily on deep zoom).

## The log protocol

Keep `log.md` updated on your own after any real change, build step, or decision — not only when the user asks you to. Follow the same format already used in `log.md`: a numbered entry with a date and who asked, then:

- **What I asked for** — the actual request, briefly.
- **What changed** — files touched and what changed in them, plus anything surprising you found along the way.
- **What I checked** — what you actually verified (ran, curled, tested) versus what you didn't get to check.
- **Decisions** — anything you chose between options on, and why, especially if it's not locked in or needs sign-off.

State facts as facts and open/undecided things as open — don't invent team agreement or test results that didn't happen.
