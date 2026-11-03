# PolaRecords.net — AI Session Devlog

Living document. Update at the start of every AI session: mark completed items, add new ones.
Single source of truth for cross-session continuity.

---

## Open Backlog

### Content
- [ ] **Upcoming event dates** — update `database.json` as new songwriter nights are booked
- [ ] **Easteregg terminal** — decoder now reveals social links; verify all links are live
- [x] ~~**Home marquee vs static bandstand bar**~~ — decided: home keeps the static `#bandstand-bar` (user, 2026-07-24: "home should not have the marquee on it anymore just bandstand info"). Dynamic marquee stays on sub-pages only. Rest Easy Nathan marquee photo is no longer used on home (show card + og:image); it remains in the Media archive and john/polarband og:image.
- [x] ~~**Instagram data**~~ — resolved by embedding posts (`posts` in database.json, tap-to-load). Original item: logged-out scraping (instaloader/gallery-dl/web_profile_info API) is blocked. Needs an IG data export zip, post links (`/p/<code>/embed`), or a user-run `instaloader --login` session in a real Termux tab.
- [ ] **Guntram Anderlik / Crier** — songwriter-night host and Bham events poster; need exact IG handles from the user.

- [ ] **More history (John is collecting)** — open leads:
  - One friend's chat thread is RCS, which phone tools can't read. Ask John for screenshots.
  - A Google Photos + Timeline Takeout would fill gaps.
  - Rerun `scripts/find_appearances.py --calendar --texts` once Shizuku is back, to refresh the calendar cache.
  - @bhm_songwriternights likely has more posts listing John. Add them by URL to `posts` and as `link` on the matching show.
- [ ] **Pages are hand-maintained** — the generator used during the redesign is gone. The header, nav and footer are duplicated across index/john/polaraf/media/archive. `media.html` marks "Archive" as current. Edit all five when the nav changes.

### Infrastructure
- [x] ~~Service worker cache — bump cache version on major updates~~ — replaced the discipline requirement: `sw.js` is now network-first (always fetches live, falls back to cache only when offline), so stale mobile caches can no longer happen regardless of whether `CACHE_NAME` gets bumped.
- [x] ~~**Hardcoded glow colors**~~ — moot after the 2026-11-01 redesign (new `style.css` uses tokens only). Original item:  — `style.css` has ~16 literal `rgba(0, 240, 255, …)` values (e.g. `.content-body`/`.featured-poster` box-shadow, `.lightbox-poster-container` box-shadow) duplicating the `--primary`/`--glow-*` custom properties already in `:root`. A future palette change (like `7382758`) will silently miss these.
- [x] ~~**Inline `style="..."` sprawl**~~ — moot after the 2026-11-01 redesign (only easteregg.html keeps its own inline styles). Original item:  — one-off inline position/opacity/animation styles on john.html, polarband.html, easteregg.html duplicate patterns that already have CSS classes elsewhere; worth consolidating into named classes, partly so future containing-block audits (see below) don't have to also grep inline `position:`/`transform:` attributes.
- [ ] **Watch for the containing-block bug reappearing** — any `filter`/`transform`/`perspective`/`will-change:transform` on an ancestor of a `position: fixed` element makes "fixed" resolve against that ancestor's box instead of the viewport. In the current design the only fixed element is `#lightbox` (direct child of `<body>`); keep it that way.
- [ ] **sw.js is never registered** — nothing calls `navigator.serviceWorker.register`, so the cache list is dead weight. Either register it or delete it; if kept, every `urlsToCache` entry must exist or install fails.
- [ ] **Open questions for the user** — how PolarAF relates to John (copy is written neutrally); whether Polar & The Boys should be mentioned anywhere now that the band page is gone; whether the PolarAF photo (`live_clip.jpg`) is the right image for that act.

---

## Session History (newest first)

### 2026-11-03 — Antigravity CLI

**Upcoming Performance & Facebook Event / RSVP / Check-in Integration:**
- **New Upcoming Performance Added (Tonight, Nov 3, 2026):**
  - Event: Birmingham Songwriter Nights at The Nick featuring Blair Duluoz (headliner) with Guntram and John Polar (openers).
  - Time & Admission: 7–10 PM · $10 · 21+ at 2514 10th Ave. S., Birmingham, AL.
  - Flyer: Copied full flyer from user pictures to `assets/flyer_20261103.jpg` and created optimized 720px thumbnail in `assets/thumbs/flyer_20261103.jpg`.
  - Linked flyer in `database.json`'s `media` list and added event to `database.json`'s `shows` and `posts`.
- **Upcoming Performance UX:**
  - Upcoming shows automatically display at the top under "Catch us live" on Home and John Polar pages.
  - Active upcoming show rows start expanded by default so visitors immediately see the poster, lineup, time, cover, RSVP button, and venue details.
  - Dynamic "Tonight" glowing badge (`.tonight-badge`) with lightning bolt indicator for same-day shows.
- **Facebook Event & Check-In Integration:**
  - **Direct Facebook RSVP Button (`.fb-pill`):** Direct link to `https://www.facebook.com/events/2059285578058333/` for instant one-tap RSVP (Interested / Going).
  - **Venue Check-in Button (`.fb-checkin-pill`):** Direct link to The Nick Rocks Facebook page (`https://www.facebook.com/thenickrocks`) for visitor check-ins.
  - **Add to Calendar Button (`.cal-pill`):** Generates pre-filled Google Calendar event with exact show times, venue address, lineup details, and RSVP links.
  - **Tap-to-Load Facebook Event Embed:** Added lightweight click-to-load Facebook widget button (`.fb-load-btn`) that dynamically embeds the Facebook event plugin iframe inside the accordion dropdown, respecting visitor privacy until activated.
- **Service Worker:** Bumped cache version to `polarecords-cache-v7` in `sw.js`.

### 2026-11-02 — Antigravity CLI

**Past Shows Media Cards & Specialized Drop-down:**
- **Fanned Playing Cards Overlay:** Shows in the past shows list that have media (flyers, photos, stage clips, YouTube recordings) now display a compact fanned card deck indicator on the right of the row. Multiple media items (e.g. marquee photo + flyer, or flyer + video) are overlaid and rotated like someone holding a hand of playing cards (with interactive hover spreading and video play badges).
- **Specialized Event Drop-down:** Clicking any past show row opens an accordion drop-down with:
  - High-res photo/flyer gallery from that night with captions and tap-to-open lightbox support across all pages (`index.html`, `john.html`, `polaraf.html`).
  - Playable video clips / stage recordings inline.
  - Lineup notes, artist tags, and special show details.
  - Direct links to the venue website hosting event data (e.g., The Nick at `thenickrocks.com`, Dave's Pub, True Story Brewing) as well as direct Instagram event listings.
- **Service Worker:** Bumped cache version to `polarecords-cache-v6` in `sw.js`.

### 2026-11-01 — Claude Code (Opus 5.5)

**Redesign:** replaced the terminal/CRT "signal hub" look with a plain music-label site.

- **Archive:** old design frozen at `archive/terminal-2026/` (pages, `style.css`, `app.js`, snapshot of the old `database.json`; asset paths rewritten to `../../assets/`, `noindex`, banner linking back). Git tag `design-terminal-2026` → `01039ef`. Linked as "old site" in the footer.
- **Structure:** Home, John Polar, PolarAF, Photos. Band page dropped; `polarband.html` is now a redirect to home (same pattern as `johnpolar.html`). Bottom tab nav, marquee, ASCII art, countdown, decoder and CRT effects removed. Static Bandstand strip kept at the top of every page.
- **Look:** warm black + cream + stage-light amber (from the live photos), Anton / IBM Plex Sans / IBM Plex Mono via Google Fonts, hat mark inverted as logo. Color tokens only.
- **Adding a show:** add an entry to `shows` with a future `date` (YYYY-MM-DD) and `artists`; it appears under "Catch us live" until the date passes, then moves to "Past shows" automatically.
- **Data:** `database.json` restructured into `residency`, `shows` (merged John/PolarAF duplicates, artist tags), `videos`, `media` (captions + credit + `thumb`). Grid thumbnails in `assets/thumbs/` (720px, the 2.6 MB flyer PNG → 185 KB).
- **Copy:** plain sentence case; only facts already in the repo (IG bio quote, venues, dates, co-bills from flyers). Photo credit to @through_rebeseyes shown on hero and grid.
- `easteregg.html` / `terminal.css` left untouched (unlinked, self-contained).
- `sw.js` list updated (no polarband), `CACHE_NAME` v5; manifest description/colors updated.
- **Round 2 (same day):**
  - Animations: hero photo drift + headline rise, scroll-reveal on sections/rows/cards (IntersectionObserver, `.js` class set in `<head>`, all gated on `prefers-reduced-motion`), nav underline slide, card hover zoom, pulsing dot when Bandstand is tonight, equalizer bars in the strip, lightbox fade, cross-page `@view-transition`.
  - Videos are click-to-load YouTube cards (real IDs from the channel RSS); Guntram Anderlik's Facebook post added as a quote (home + John page).
  - **Archive page** (`archive.html`, nav item replaces Photos): one timeline of shows, videos, photos and milestones grouped by year, filters + newest/oldest toggle; flyers attach to the show on the same date (media items now carry `date`). `milestones` array added to `database.json`.
  - Shows marked `"source": "phone"` came from John's own records, not public listings.
  - `scripts/sync_youtube.py` + `.github/workflows/sync-youtube.yml` (weekly, commits new uploads). `scripts/find_appearances.py` writes its output outside the repo. `_config.yml` keeps `scripts/` and this devlog out of the published site.
- **Instagram:** `posts` in `database.json` render as tap-to-load embeds (Instagram's `embed.js` only loads on tap, since it tracks visitors). Show entries whose `link` is an Instagram post get the same button in the archive. Embeds render fine logged out.
- **Research notes:** public search turns up almost nothing for John Polar/PolarAF, and Facebook/Instagram need a login. Some shows come from John's own records (`"source": "phone"`); see `scripts/find_appearances.py`. Private notes stay outside the repo. `find_appearances.py --calendar --texts` also reads calendar events and your own sent texts through Shizuku (`rish`); Dave's Pub, Dobber's Five Points Pub and Voodoo Lounge (Huntsville) are known venues now; Shizuku-backed sources fall back to a cache in the output folder when rish is down.


### 2026-10-28 — Claude Code (Opus 5.5)

**Review:** cross-checked Claude sessions (Jul 24, Jul 28, Oct 13) and Antigravity sessions (`1d311cb7`, `296bc00e`, `b6fab653`) against the repo. All prior work was in `49c45e7` and live on Pages; both clones (`~/projects/`, `/sdcard/Documents/`) clean, nothing stashed or unpushed.

**Done:**
- `johnpolar.html` — redirect to `john.html`; `polarecords.net/johnpolar` (the link in @thejohnpolar's IG bio) was a 404.
- `index.html` — og:image switched from the old June 11 flyer to the @through_rebeseyes live photo.
- `database.json` / `app.js` — new `admission` field on events, rendered on the home show card (21+, $5/yr Nick membership card + ID, per thenickrocks.com).
- `database.json` logs — added YouTube @thejohnpolar uploads: 2025.11.11 Songwriter's Night @ The Nick (Rocks) (already embedded as the home Video Log), 2025.06.19 "JP Live — Too Hard (On Ourselves)" + "Elements of Loneliness", 2025.06.14 Freestyle Friday livestream (PolarAF log).

**Notes:** The Nick's calendar lists Bandstand every Monday through Dec 7, doors 7PM, $4.60 cover; Nov 16 has a special appearance by The Lowliest One / Fire Camino. TikTok @thejohnpolar exposes no posts logged-out.

### 2026-10-25 — Claude Code & Antigravity CLI

**Work done:**
- **Media & Content:** Added live performance photo by @through_rebeseyes (`assets/photo_rebe_20260628.jpg`) as featured media in `database.json`; added live stage clip (`assets/live_clip.mp4` / `assets/live_clip.jpg`) to homepage; added John Polar Instagram bio log entry in `database.json`.
- **Birmingham Bandstand updates:** Added 7:00 PM sign-up time to event card (`app.js`) and top banner (`index.html`); replaced stale marquee photo reference with `live_clip.jpg`.
- **Responsive scrolling banner:** Added `.bandstand-track` in `style.css` with mobile marquee scroll animation so expanded show/sign-up text doesn't clip on small screens.
- **Service Worker:** Bumped `CACHE_NAME` to `polarecords-cache-v4` in `sw.js`.
- **Repository hygiene:** Restored all missing flyer/photo assets in shared storage clone; set `core.fileMode = false` to prevent Android FUSE permission churn.

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
- Committed (`4d71112`) and pushed to `origin/main` — live on polarecords.net. Termux clone (`~/polarecords.github.io`) pulled to match; its own separate uncommitted `database.json` edit (media ordering) was left untouched.

**Notes:**
- Both local clones (`/root/polarecords.net` and Termux `~/polarecords.github.io`) were already in sync at commit `7382758` before this session; only this PRoot clone was edited.
- See Open Backlog above for the four follow-up items surfaced while investigating (home marquee vs bandstand bar, hardcoded glow colors, inline style sprawl, containing-block bug class watch-item).

### 2026-07-03 21:48–21:50 — Antigravity CLI [session 1d311cb7]

**Commits:** `ff3d7b1`, `7382758`

**Done:**
- **Color cleanup** (`ff3d7b1`) — removed legacy green filters and hardcoded colors
- **Cyber-cyan + violet palette** (`7382758`) — creative color enhancement; all social media icon links verified wired

**Notes:**
- Ran in the Termux clone (`~/polarecords.github.io`); this entry was only just folded back into the canonical devlog (2026-07-28) after the two clones' devlogs were reconciled — they'd been tracking commit history independently for a while. Also touched The Nick event data; was told not to use placeholders.

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
