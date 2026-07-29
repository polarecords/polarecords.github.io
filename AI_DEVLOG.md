# PolaRecords.net — AI Session Devlog

Living document. Update at the start of every AI session: mark completed items, add new ones.
Single source of truth for cross-session continuity.

---

## Open Backlog

### Content
- [ ] **Upcoming event dates** — update `database.json` as new songwriter nights are booked
- [ ] **Easteregg terminal** — decoder now reveals social links; verify all links are live
- [ ] **Home marquee vs static bandstand bar** — home page uses a hardcoded `#bandstand-bar` instead of the dynamic `#header-marquee` + `updateMarquee()` the other pages use (sourced from `database.json`). This was a deliberate choice (`f9b5b5e`) at a time the marquee had other problems; now that the fixed-nav bug is resolved sitewide, revisit whether home should go back to the dynamic marquee so a schedule change doesn't require editing index.html markup directly.

### Infrastructure
- [x] ~~Service worker cache — bump cache version on major updates~~ — replaced the discipline requirement: `sw.js` is now network-first (always fetches live, falls back to cache only when offline), so stale mobile caches can no longer happen regardless of whether `CACHE_NAME` gets bumped.
- [ ] **Hardcoded glow colors** — `style.css` has ~16 literal `rgba(0, 240, 255, …)` values (e.g. `.content-body`/`.featured-poster` box-shadow, `.lightbox-poster-container` box-shadow) duplicating the `--primary`/`--glow-*` custom properties already in `:root`. A future palette change (like `7382758`) will silently miss these.
- [ ] **Inline `style="..."` sprawl** — one-off inline position/opacity/animation styles on john.html, polarband.html, easteregg.html duplicate patterns that already have CSS classes elsewhere; worth consolidating into named classes, partly so future containing-block audits (see below) don't have to also grep inline `position:`/`transform:` attributes.
- [ ] **Watch for the containing-block bug reappearing** — any `filter`/`transform`/`perspective`/`will-change:transform` on an ancestor of a `position: fixed` element (`.bottom-nav`, `#lightbox-modal`, `body::before`/`::after`) makes "fixed" resolve against that ancestor's box instead of the viewport. New atmospheric/visual effects should go on `.crt-frame` (or another wrapper that excludes `.bottom-nav` and `#lightbox-modal`), never on `<body>` directly.

---

## Session History (newest first)

### 2026-07-28 — Claude Code (Sonnet 5)

**Reported bugs:** bottom tab nav scrolled with the page on mobile instead of staying pinned above the browser chrome/OS nav bar; header marquee "seemed broken, didn't move or update."

**Root causes found:**
- `<body>` carried `filter: sepia(...)` + `animation: ambient-pulse` (the "atmospheric" look). A `filter` on any ancestor of a `position: fixed` element makes CSS resolve "fixed" against that ancestor's box instead of the real viewport — so `.bottom-nav`, `body::before`/`::after` (CRT scanline/cursor-spotlight overlays), and media.html's `#lightbox-modal` were all effectively `position: absolute` relative to the full document, not actually pinned to the screen.
- `sw.js` was pure cache-first with no revalidation and a `CACHE_NAME` that had gone unbumped across releases (a backlog item that never got done) — a returning visitor's phone would keep serving whatever CSS/JS/`database.json` it first cached, indefinitely, regardless of new deploys. This is the most likely explanation for "doesn't seem to be updating."
- The marquee's own CSS animation (`marquee-scroll` keyframes) was structurally fine — no separate motion bug found once the two issues above are accounted for.

**Done:**
- `style.css` — moved `filter`/`animation: ambient-pulse` off `<body>` onto a new `.crt-frame` wrapper div that excludes `.bottom-nav`; updated the mobile media-query override to target `.crt-frame` instead of `body`.
- `sw.js` — flipped fetch handler to network-first with offline cache fallback; bumped `CACHE_NAME` to v3; fixed a stale pinned Font Awesome version (6.0.0) in the precache list that didn't match the 6.5.2 actually loaded by the pages.
- `index.html`, `john.html`, `media.html`, `polaraf.html`, `polarband.html` — restructured so `<nav class="bottom-nav">` (and, on media.html, `#lightbox-modal`) sit outside `.crt-frame` as direct `<body>` children, no longer nested inside a filtered ancestor.
- Ran a full spec audit across all 6 pages (including `easteregg.html`/`terminal.css`, which didn't have this bug and was left alone) — all passed independent re-verification.
- Not yet committed/pushed — pending confirmation since this repo deploys straight to the live site.

**Notes:**
- Both local clones (`/root/polarecords.net` and Termux `~/polarecords.github.io`) were already in sync at commit `7382758`; only this PRoot clone was edited this session.
- See Open Backlog above for the four follow-up items surfaced while investigating (home marquee vs bandstand bar, hardcoded glow colors, inline style sprawl, containing-block bug class watch-item).

### 2026-06-23 — Claude Code (Sonnet 4.6)

**Commits:** `035ea7f`, `4354677`, `5c08c99`, `f9b5b5e`, `392e7db`

**Done:**
- **Media photos** (`035ea7f`) — added two new photos to `assets/`; updated event logs across all pages
- **Dynamic marquee** (`4354677`) — marquee now reads upcoming events from `database.json`; fixed event history display
- **Site-wide cleanup** (`5c08c99`) — OG tags added to all sub-pages (`john.html`, `polaraf.html`, `polarband.html`, `media.html`); bio and footer updated; git identity set to `PolaRecords <john@polarecords.net>`
- **Bandstand bar** (`f9b5b5e`) — home page marquee replaced with static bar: `BIRMINGHAM BANDSTAND ✦ EVERY MONDAY @ THE NICK | 8PM – 2AM`; stale past songwriter night entries removed from home log stream
- **Easteregg rewrite** (`392e7db`) — `easteregg.html` terminal fully rewritten: current data, no placeholder Unsplash images, no duplicate YouTube embeds, no stale May 5 dates; `app.js` decoder completes with social links revealed; decoder CSS added to `style.css`; orphaned countdown fragment deleted

**Notes:**
- `john@polarecords.net` is now the git committer identity for this repo
- Home page marquee is gone; bandstand info is static (update manually or via `database.json` when the event format changes)
