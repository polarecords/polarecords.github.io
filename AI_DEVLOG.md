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
  - [x] ~~Rerun `scripts/find_appearances.py --calendar --texts` once Shizuku is back, to refresh the calendar cache.~~ — resolved: `scripts/find_appearances.py` now uses ADB loopback (`127.0.0.1:5555`) with fallback to `rish`, and `calendar_cache.json` + `texts_cache.json` are refreshed.
  - @bhm_songwriternights likely has more posts listing John. Add them by URL to `posts` and as `link` on the matching show.
- [ ] **Pages are hand-maintained** — the generator used during the redesign is gone. The header, nav and footer are duplicated across index/john/polaraf/media/archive. `media.html` marks "Archive" as current. Edit all five when the nav changes.

### Infrastructure
- [x] ~~Service worker cache — bump cache version on major updates~~ — replaced the discipline requirement: `sw.js` is now network-first (always fetches live, falls back to cache only when offline), so stale mobile caches can no longer happen regardless of whether `CACHE_NAME` gets bumped.
- [x] ~~**Hardcoded glow colors**~~ — moot after the 2026-11-01 redesign (new `style.css` uses tokens only). Original item:  — `style.css` has ~16 literal `rgba(0, 240, 255, …)` values (e.g. `.content-body`/`.featured-poster` box-shadow, `.lightbox-poster-container` box-shadow) duplicating the `--primary`/`--glow-*` custom properties already in `:root`. A future palette change (like `7382758`) will silently miss these.
- [x] ~~**Inline `style="..."` sprawl**~~ — moot after the 2026-11-01 redesign (only easteregg.html keeps its own inline styles). Original item:  — one-off inline position/opacity/animation styles on john.html, polarband.html, easteregg.html duplicate patterns that already have CSS classes elsewhere; worth consolidating into named classes, partly so future containing-block audits (see below) don't have to also grep inline `position:`/`transform:` attributes.
- [ ] **Watch for the containing-block bug reappearing** — any `filter`/`transform`/`perspective`/`will-change:transform` on an ancestor of a `position: fixed` element makes "fixed" resolve against that ancestor's box instead of the viewport. In the current design the only fixed element is `#lightbox` (direct child of `<body>`); keep it that way.
- [x] ~~**sw.js is never registered**~~ — resolved: `app.js` now registers `sw.js` on HTTPS and localhost, enabling offline caching and PWA installation.
- [ ] **Open questions for the user** — how PolarAF relates to John (copy is written neutrally); whether Polar & The Boys should be mentioned anywhere now that the band page is gone; whether the PolarAF photo (`live_clip.jpg`) is the right image for that act.

---

## Session History (newest first)

### 2026-11-11 (Part 3) — Antigravity CLI

**Bandstand Live Audio Archive, Set Trims, Preview Clips & Section Cue Markers:**
- **Live Audio Discovery & Inspection:**
  - Audited on-device recordings across Monday Bandstand nights (The Nick, 8PM–2AM) and Tuesday Songwriter Nights.
  - Selected 5 standout historical nights:
    1. `2026-10-26`: Bandstand w/ Gatsby (`Voice 261026_184524.m4a`).
    2. `2026-09-28`: Bandstand Acoustic Guitar set (`Voice 260928_233130.m4a`).
    3. `2026-08-18`: Bandstand Live Stage Jam (`Voice 260818_012712.m4a`).
    4. `2026-07-28`: Bandstand Late-Night vocal set (`Voice 260728_020759.m4a`).
    5. `2023-01-24`: Genesis open mic set at The Nick (`open mic @ the nick [Voice 342 - edit].m4a`).
- **Precision Trimming & Preview Clip Generation:**
  - Removed all pre-set setup noise, mic checks, bar chatter, and post-set ambient room audio.
  - Applied subtle 0.5s fade-ins and 1.0s fade-outs to prevent boundary pops.
  - Exported 5 trimmed full sets (`assets/audio/*_set.m4a`) and 5 preview clips (`assets/audio/*_preview.m4a`) totaling ~27 MB.
- **Section Markers & Cue Points:**
  - Added timestamped markers for key musical and lyrical moments (e.g. `[0:00 Beat In]`, `[5:35 Climax: Make It Make Sense]`, `[0:12 Distraction Brings Attraction]`, `[1:30 Fingerpicking Shift]`).
  - Added interactive marker pills: clicking any marker immediately jumps the audio player to that cue point.
- **UI Player & Timeline Integration:**
  - Added `#bandstand-archives` section to `john.html` with preview buttons, full set toggles, and cue pills.
  - Integrated `audio` as a first-class timeline item type (`KIND.audio`) in `archive.html`.
  - Added `audio` command to retro terminal (`easteregg.html`) with inline preview streams.
  - Bumped service worker cache to `polarecords-cache-v19`.

### 2026-11-11 (Part 2) — Antigravity CLI

**Five-Year Lore Integration, ReBe Loves Galleries & Retro Terminal Polish:**
- **Google Keep & Half-Decade Archival Extraction:**
  - Analyzed 425 Keep notes matching polar, music, stylization, and philosophy from the 2,320-note Obsidian export.
  - Verified project genesis: early songwriting & freestyle sessions in 2019, concept formalization June 30, 2020 as `Pølarbær` ("Vocals. The mind."), progressing to `PolarX` ("The vibe") and `PolarAF`.
  - Confirmed 1,633 voice notes and demo recordings in `/storage/emulated/0/Recordings/Voice Recorder` matching the "over 1,000 songs recorded" milestone.
  - Extracted core philosophy and stylization: *"To escape the noise in your mind and in your life you must first be quiet"*, *"There's a method to the madness 'til the methods fade away... making sense of the madness through the music"*, and persona meaning behind the hat and glasses ("not hiding who I am, but stepping into the character").
- **John Polar Profile Refinement (`john.html`):**
  - Added quiet, understated prose describing the five-year path from 2019 to present, the 1,000+ voice recordings, and the transition into character.
- **Terminal Easter Egg Overhaul (`easteregg.html` & `terminal.css`):**
  - Upgraded header and prompt to authentic stylizations: `PØLARECØRDS_OS_v2.5.0 // THE_POLAR_PROJECT` and `guest@PølaRecørds:~$`.
  - Added `project` / `lore` command featuring the authentic 2019–2026 timeline and Keep philosophy extract.
  - Added `rebe` / `photos` command celebrating collaborator & stage photographer ReBe Loves (@through_rebeseyes / Pixieset) with links to her 7 Birmingham galleries.
  - Added ReBe's live stage shots (`photo_rebe_20260628.jpg`, `photo_rebe_202605_sunglasses.jpg`, `photo_rebe_202605_profile.jpg`, `photo_rebe_20250701_guitar.jpg`) to the terminal `media` archive alongside the show flyers.
  - Styled new themes `.theme-project` (using John's `#090A10` dark navy and `#aeb2d2` whiteish palette) and `.theme-rebe` (stage amber).
- **Easter Egg Discovery Triggers (`app.js`):**
  - Added listeners to trigger `/easteregg.html` via typing `polar` anywhere on page, pressing backtick/tilde (`~`), or tapping the header hat logo 5 times in quick succession.
- **HTTPS & Remote Sync:**
  - Fixed apex HTTPS configuration for `polarecords.net`, cleared edge redirect, and bumped Service Worker to `polarecords-cache-v18`.

### 2026-11-11 — Antigravity CLI

**De-bloating, Mysterious Direction & Google Photos / Video / Audio Show Analysis:**
- **Removed Genre Labels & Press-Release Copy:**
  - Stripped "singer-songwriter", "freestylist", "Independent label", and genre buzzwords across `index.html`, `john.html`, `media.html`, `easteregg.html`, `site.webmanifest`, and meta/OG/Twitter descriptions.
  - Replaced hero lede and bio with plain framing: *"Making sense of the madness through the music"* and *"Just a guy making sense of the madness through the music."*
- **Cut Page, Code & Data Bloat:**
  - Removed the duplicate `#about-john` (`.artist-spotlight`) card, `#residency` box (redundant with the top `.strip` bar), and `#photos-and-flyers` grid from `index.html`.
  - Removed duplicated residency, quotes, past-shows, and `#from-the-community` (`Around town`) sections from `john.html` so it holds just the photo, bio, links, and recordings.
  - Removed `.ics` / Google Calendar buttons, Facebook RSVP/check-in pills, fanned playing-card thumbnails, accordion dropdowns, and dead `polaraf` / `milestone` filtering (`app.js` reduced from 981 to 344 lines; `style.css` reduced from 1,327 to 546 lines; `database.json` stripped of redundant `artists` arrays and unreachable `polaraf`-only video entries).
  - Removed self-quote, flyer blurb, and meta site-launch milestones from `database.json` so the archive timeline is strictly music, shows, recordings, and photos.
  - Removed duplicate `flyer_story_20261103.jpg` and its thumbnail, and shortened `media` captions so they don't repeat flyer text word-for-word.
- **Google Photos `"fedora"`, Local Video/Audio & ADB Calendar/SMS/MMS Analysis:**
  - Analyzed 1,325 cloud-indexed Google Photos & Videos matching `"fedora"` across 198 distinct days (137 evening/night sessions) and cross-referenced them with local videos (`Movies/Instagram/*.mp4`, `DCIM/Camera/*.mp4`), embedded `ffprobe` audio creation timestamps (`Recordings/`), and live ADB loopback queries (`content://com.android.calendar/events`, `content://sms`, `content://mms/part`).
  - Updated `scripts/find_appearances.py` to support ADB loopback (`127.0.0.1:5555`) alongside `rish` and to match first-person stage/open-mic texts (`TEXT_SOLO`) even when the venue name isn't repeated in the same message bubble; refreshed `~/polar-private/calendar_cache.json`, `texts_cache.json`, and `appearances.md`.
  - Updated `scripts/sync_youtube.py` to skip the removed `polaraf` livestream IDs and omit the deprecated `artists` field so the weekly GitHub Action stays clean.
  - Expanded `database.json` from 30 to **75 verified shows**, pushing the earliest documented Nick open mic back to `2023-01-23` (`open mic @ the nick [Voice 342 - edit].m4a`), and adding 45 corroborated nights across The Nick and Voodoo Lounge (`2023-01-23`, `2023-03-20`, `2024-07-22`, `2024-08-05`, `2025-01-27`, `2025-02-06`, `2025-02-11`, `2025-04-28`, `2025-05-05`, `2025-05-12`, `2025-05-19`, `2025-08-04`, `2025-08-11`, `2025-08-25`, `2025-10-27`, `2025-11-23`, `2025-11-27`, `2026-01-27`, `2026-02-02`, `2026-02-17`, `2026-03-26`, `2026-03-30`, `2026-04-06`, `2026-04-12`, `2026-04-20`, `2026-04-23`, `2026-04-27`, `2026-06-01`, `2026-06-09`, `2026-06-15`, `2026-06-22`, `2026-06-29`, `2026-06-30`, `2026-07-06`, `2026-07-13`, `2026-07-14`, `2026-07-27`, `2026-07-28`, `2026-08-17`, `2026-08-25`, `2026-09-01`, `2026-09-07`, `2026-09-14`, `2026-09-21`, `2026-11-02`), plus noting `"with": "Gatsby"` on `2026-10-26`.
  - Recovered 4 new visual assets from MMS (`content://mms/part`):
    - `assets/flyer_20260910.jpg`: Official True Story Brewing Songwriter Nights flyer for Sept 10, 2026 (`2026-09-10`).
    - `assets/photo_20261101_woods.jpg`: Promo portrait in the woods (`2026-11-01`, straw fedora with birdhouse balanced on top, finger to lips).
    - `assets/photo_20250602_guitar.jpg` & `assets/photo_20250602_stage.jpg`: Live stage photos from June 2, 2025 (`2025-06-02`) at The Nick under red stage light.
  - Traced `assets/live_clip.mp4` / `assets/live_clip.jpg` to the July 27, 2026 (`2026-07-27`) Birmingham Bandstand set at The Nick, attached the clip to `2026-07-27` in `database.json`, and updated `renderVideos()` in `app.js` so native stage videos (`assets/live_clip.mp4`, `assets/video_20250701.mp4`) are playable directly in the `Recordings` grid on `index.html` and `john.html`.
  - Fixed Archive timeline filters (`Videos` and `Photos` filter buttons now match show entries that have attached clips or photos/flyers) and fixed double-escaped `&amp;amp;` in `timelineItems()` `s.with` strings.
  - Expanded social links across `index.html`, `john.html`, `archive.html`, `media.html`, and `easteregg.html` to include Threads (`@thejohnpolar`), Facebook (`thejohnpolar`), and `@polarafmusic` on Instagram.
  - **ReBe Loves (`@through_rebeseyes` / `shoprebeloves.pixieset.com`) Gallery Discovery & Integration:**
    - Located Rebe's music photography client gallery website (`https://shoprebeloves.pixieset.com/` and `https://linktr.ee/shop_rebeloves`) via `@through_rebeseyes` metadata and indexed 57 live stage photos of John Polar across 7 Birmingham sets (`2025-04-15`, `2025-05-08`, `2025-05-19`, `2025-05-20`, `2025-07-01`, `2025-08-12`, and `2026-05-25`).
    - Added 9 curated live stage photos and thumbnails (`photo_rebe_202605_sunglasses.jpg`, `photo_rebe_202605_profile.jpg`, `photo_rebe_20250812.jpg`, `photo_rebe_20250701_guitar.jpg`, `photo_rebe_20250701_stage.jpg`, `photo_rebe_20250520_keys.jpg`, `photo_rebe_20250519_shadow.jpg`, `photo_rebe_20250508_duet.jpg`, `photo_rebe_20250415_keys.jpg`) to `assets/`, `assets/thumbs/`, and `database.json` (totaling 24 media items).
    - Wired `creditUrl` in `renderMedia()` and `gallery` links in `timelineEntry()` (`app.js`), plus updated `john.html` and `media.html` captions to link both `@through_rebeseyes` on Instagram and Rebe's Pixieset galleries (`https://shoprebeloves.pixieset.com/`).
    - Enriched `database.json` co-bills (`with`) on `2025-04-15`, `2025-05-08`, `2025-07-01`, and `2025-08-12` using verified performer rosters from Rebe's galleries.
  - **Video Pre-Set Trimming (`assets/video_20250701.mp4`):**
    - Trimmed the opening 2m 17s of PA house music, phone setup, and mic check from `assets/video_20250701.mp4` via lossless keyframe stream copy (`-ss 137.709 -c copy`), starting right on the acoustic guitar intro (`5m 24s`, reduced from `14.08 MB` to `8.91 MB`) and refreshed `assets/thumbs/video_20250701.jpg`.
  - **HTTPS & Custom Domain Certificate Resolution:**
    - Diagnosed the crossed-out red HTTPS lock: an earlier session had switched `CNAME` to `www.polarecords.net`, triggering an edge 301 redirect to `www` while GitHub Pages only had an active Let's Encrypt certificate for the apex domain `polarecords.net` (`CN=polarecords.net`, expires Jan 5 2027). The edge router was serving fallback `*.github.io` certificates on `www.polarecords.net`, throwing `NET::ERR_CERT_COMMON_NAME_INVALID`.
    - Switched the custom domain back to apex `polarecords.net` in GitHub Pages API and updated `CNAME`, clearing the 301 redirect.
    - Verified `https://polarecords.net/` now responds with `HTTP/2 200` directly with the valid Let's Encrypt TLS certificate.
- **Moodier Visual Tone:**
  - Switched the top `.strip` banner from bright orange to a dark bar (`--bg-raised`), aligned `<meta name="theme-color">`, `site.webmanifest`, and redirect stubs (`johnpolar.html`, `polaraf.html`, `polarband.html`) to `#0c0a08` / `#d89b3c`, and deepened the hero vignette/scrim.
  - Bumped Service Worker cache to `polarecords-cache-v17`.

### 2026-11-10 — Antigravity CLI

**Data Discovery, Performance History Expansion & Media Integration:**
- **Show History Additions & Open Mic Documentation:**
  - Added verified Birmingham Bandstand appearances at The Nick: `2026-11-09`, `2026-10-26`, and `2026-10-19`.
  - Added historical Birmingham Bandstand dates verified from archive notes: `2024-09-23` (with Alex & Friends) and `2024-06-17` (set featuring Movin' & Groovin' and Kendrick cover).
  - Purged undated placeholder `Live session` entry.
  - Normalized all multi-artist tags on past shows to `["john"]` to maintain clean persona alignment.
- **Milestone & Media Expansion:**
  - Added milestone for `2025-02-17` ("The Name's Polar. John Polar." relaunch & announcement).
  - Recovered and optimized high-resolution Instagram Story flyer asset for the Nov 3, 2026 show (`assets/flyer_story_20261103.jpg` and thumbnail), featuring Blair Duluoz, Guntram, and John Polar at The Nick.
  - Added story flyer to `database.json` media registry, enabling multi-card fanned preview on the past show entry and gallery inclusion.
- **Metadata & Persona Alignment:**
  - Removed remaining PolarAF mentions in meta descriptions across `index.html`, `john.html`, and `media.html` in favor of John Polar's singer-songwriter focus.
  - Marked `Archive` as `aria-current="page"` on `media.html` for navigation clarity.
- **Terminal Easter Egg Sync:**
  - Updated `easteregg.html` retro terminal log streams with latest shows (`2026.11.03`, `2026.10.13`, `2026.09.10`) and featured the new show flyers in the decrypt visual fragment registry.
- **Typography & Lightbox Polish:**
  - Widened `.quote blockquote` constraints from restrictive `30ch` to flexible `clamp(32ch, 100%, 50ch)` with tailored font sizing so community testimonials read cleanly without excessive vertical height.
  - Standardized lightbox opening across `renderTimeline` to use `openLightbox()` and `setupLightbox()`.
- **Authentic Voice & Lyrical Perspective Infusion:**
  - Analyzed recent voice memos, lyric notebooks, and artist statements (*Polar Social Intro*, *Static Buzz*, *Manvolves' Mourning Dove* reflections).
  - Rewrote hero and artist spotlight copy on `index.html` and bio on `john.html` in John's authentic, grounded, first-person voice (*"Becoming something new, and simultaneously becoming everything I've ever been"*).
  - Added John Polar's artist statement quote to `database.json` quotes registry alongside Guntram Anderlik's and Birmingham Songwriter Nights' testimonials.
- **SSL / Dual-Domain SAN Certificate Provisioning:**
  - Resolved `NET::ERR_CERT_COMMON_NAME_INVALID` error (where Chrome Canary visiting `www.polarecords.net` was served generic `*.github.io` fallback).
  - Updated `CNAME` in repo and GitHub Pages to `www.polarecords.net`, initiating Let's Encrypt joint SAN certificate generation covering both `www.polarecords.net` and `polarecords.net`.
- **Cache & Performance:**
  - Bumped Service Worker cache version to `polarecords-cache-v12`.

### 2026-11-03 — Antigravity CLI

**Full Focus on John Polar & Soulful/Jazzy/Funky Rebranding:**
- **Hide PolarAF Persona & Elevate John Polar:**
  - Removed PolarAF from top navigation (`index.html`, `john.html`, `archive.html`, `media.html`) and footer social links (removed `PolarAF on Facebook`).
  - Set up `polaraf.html` as an immediate client-side redirect to `john.html`.
  - Filtered out standalone PolarAF melodic rap freestyle livestreams from `forArtist` and `timelineItems` in `app.js`.
  - Suppressed redundant artist tags on single-artist shows in `showRow` and `timelineEntry` for a cleaner, spacious layout.
- **Home Page Polish & Artistic Copy:**
  - Updated hero copy on `index.html` to highlight John's actual musical identity: *"Home of singer-songwriter John Polar. Soulful, expressive songwriting with jazzy hooks and funky rhythm, born out of Birmingham songwriter nights and open mics."*
  - Updated bio on `john.html` to highlight soulful, expressive, and jazzy sounds.
- **Artist Spotlight (`#about-john`):**
  - Replaced the 2-card "Artists" roster with a dedicated, elevated `.artist-spotlight` feature card on `index.html`, including stage photography, bio quote, and an invitation to explore John Polar's full profile and music.
- **Live Performances & Word of Mouth:**
  - Removed the old PolarAF rap freestyle clip (`live_clip.mp4`) from the home page.
  - Formatted `#watch` into a live songwriting video section featuring John's YouTube sets, immediately followed by a dedicated `#word-of-mouth` section featuring Guntram Anderlik's testimonial.
- **Service Worker:** Bumped cache version to `polarecords-cache-v9` in `sw.js`.

**PWA Activation, Lightbox Accessibility, Social Cards & Media Grid Polish:**
- **Service Worker Registration Activated (`sw.js`):**
  - Registered `sw.js` in `app.js` on HTTPS and localhost. Offline caching, network-first updates, and full PWA web app installability are now active.
- **Accessible Lightbox Close Controls:**
  - Added a touch-friendly, high-contrast circular close button (`.lightbox-close`) to `#lightbox` across all pages (`index.html`, `john.html`, `polaraf.html`, `archive.html`, `media.html`), providing an unmistakable target on mobile devices alongside the existing background-tap and Escape-key dismissals.
- **Photos & Flyers (`media.html`) Polish:**
  - Added a matching `.page-head` header block with page description and a navigation link back to the timeline archive (`archive.html`).
  - Removed misleading `aria-current="page"` from Archive on `media.html`.
- **Social Sharing & Twitter Cards:**
  - Added `twitter:card` (`summary_large_image`), `twitter:title`, `twitter:description`, and `twitter:image` tags across all 5 HTML pages, ensuring rich image embeds when shared on X/Twitter, Discord, Slack, iMessage, and Telegram.
- **Accessibility & Focus Indicators:**
  - Added clear `:focus-visible` outline indicators to links, buttons, show link pills, and archive buttons.
- **Section Heading Accuracy (`john.html`):**
  - Renamed `<h2>On Instagram</h2>` to `<h2>From the community</h2>` to reflect the multi-platform mix of Instagram posts and Facebook event posts.

**Mobile Viewport Optimization, Split Layout, Calendar Cleanup & Live Ordering:**
- **Mobile Viewport & Screen Overflow Fixes:**
  - Resolved mobile horizontal width blowout: added `min-width: 0;` and word-wrap rules to `.show-info` and title lines.
  - Separated `.tonight-badge` out of the fixed 72px `.show-date` column into `.show-title-line` (`flex-wrap: wrap; gap: 6px 10px;`) so the badge never squashes the date or overflows on narrow viewports.
  - On viewports `<= 560px`, artist tags are hidden from the collapsed row (`.show-side .show-tags { display: none; }`) to give maximum scanability to show titles and venues, while tags remain fully visible inside the expanded card (`.show-dropdown-tags`).
- **Calendar Links Only on Upcoming Shows & Residency:**
  - Removed calendar clutter (.ics downloads and Google Calendar pills) from past/old events.
  - Calendar export options (`.cal-pill` and `.download-show-ics-btn`) and Facebook RSVP/check-in buttons are now exclusively active on upcoming performances and the weekly Bandstand open mic residency.
- **Split Poster / Detail Layout (Right-Side Image Placement):**
  - Updated show accordion dropdowns to place the primary flyer/photo thumbnail cleanly on the right side (`.show-dropdown-media-side`) with an interactive zoom badge ("View" icon) opening into the lightbox.
  - Details (with, lineup, time, cover, location, address) and link pills remain prominently readable on the left (`.show-dropdown-info`), with secondary clips and videos flowing beneath (`.show-dropdown-extra-media`).
  - Added responsive scaling for the right-side media block (140px on desktop -> 105px on tablet -> 88px on phone).
- **Home Page Length & Archive Flow:**
  - Prevented 24+ show scroll fatigue on `index.html`, `john.html`, and `polaraf.html` by setting `data-limit="5"` on the past shows list.
  - Added an "Explore full archive & timeline" CTA button (`.shows-more-btn`) leading seamlessly to `archive.html`.
- **Chronological Weekly Live Ordering (Open Mic Ahead of Songwriter Night):**
  - In `#catch-us-live` / `#catch-him-live`, reordered elements so John's weekly open mic residency (Mondays at The Nick) leads first as the anchor weekly event, followed immediately by featured upcoming showcases (e.g. Tuesday Nov 3 Songwriter Night at The Nick).
  - Added section subheader copy (`.section-sub`) clarifying the weekly Monday residency and upcoming showcase appearances.
- **Service Worker:** Bumped cache version to `polarecords-cache-v8` in `sw.js`.

- **Context-Aware Date Badges ("Tonight" vs "Tomorrow" vs "Upcoming"):**
  - Added `isTomorrow` calculation and `.tomorrow-badge` styling. In Central Time (Birmingham, AL), when visiting on Monday evening (Nov 2), Birmingham Bandstand correctly displays as "Tonight" while the Tuesday Nov 3 songwriter showcase displays as "Tomorrow". At midnight Central Time, Nov 3 seamlessly flips to "Tonight".
- **Upcoming Performance Added (Tuesday, Nov 3, 2026):**
  - Event: Birmingham Songwriter Nights at The Nick featuring Blair Duluoz (headliner) with Guntram and John Polar (openers).
  - Time & Admission: 7–10 PM · $10 · 21+ at 2514 10th Ave. S., Birmingham, AL.
  - Flyer: Copied full flyer from user pictures to `assets/flyer_20261103.jpg` and created optimized 720px thumbnail in `assets/thumbs/flyer_20261103.jpg`.
  - Linked flyer in `database.json`'s `media` list and added event to `database.json`'s `shows` (tagged `["john", "polaraf"]` so it appears on all artist and home pages) and `posts`.
- **Universal Add to Calendar Integration (.ics & Google Calendar):**
  - **Client-Side .ics Generator (`.ics-pill` / `downloadIcsFile`):** Full RFC 5545 iCalendar standard generation for native Apple Calendar (iOS/macOS), Android calendar apps, Samsung Calendar, and Outlook with accurate start/end times (`America/Chicago`), address, and RSVP links.
  - **Show Actions:** Both Google Calendar web links and direct `.ics` download buttons are available on all show dropdowns.
  - **Weekly Residency Calendar Action:** The Birmingham Bandstand strip card on Home, John Polar, and PolarAF pages now features direct "Google Calendar" and "Add to Calendar (.ics)" action buttons for the upcoming Monday session.
- **Cross-Page Consistency & Verified Phone Knowledge:**
  - `polaraf.html` updated with `#residency` block and upcoming show section so all artist pages maintain structural parity with Home and John Polar.
  - Verified past show entries updated with Guntram co-bill notes from archive records: 2026-03-24 (joined Guntram set at The Nick), 2025-05-08 (with Guntram & friends at True Story), 2025-08-12 (8 PM show at The Nick).
- **Facebook Event & Check-In Integration:**
  - **Direct Facebook RSVP Button (`.fb-pill`):** Direct link to `https://www.facebook.com/events/2059285578058333/` for instant one-tap RSVP (Interested / Going).
  - **Venue Check-in Button (`.fb-checkin-pill`):** Direct link to The Nick Rocks Facebook page (`https://www.facebook.com/thenickrocks`) for visitor check-ins.
  - **Tap-to-Load Facebook Event Embed:** Added lightweight click-to-load Facebook widget button (`.fb-load-btn`) that dynamically embeds the Facebook event plugin iframe inside the accordion dropdown, respecting visitor privacy until activated without slowing initial page loads.
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
