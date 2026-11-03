// Each page sets <body data-artist="john|polaraf"> to filter shows/videos/quotes.
// Home and Photos leave it empty and get everything.

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ARTIST_NAMES = { john: 'John Polar', polaraf: 'PolarAF' };

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function parseDate(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function forArtist(list, artist) {
    return artist ? list.filter(item => item.artists?.includes(artist)) : list;
}

// ─── Residency (next Monday at The Nick) ─────────────────────────────────────
function renderResidency(r) {
    const el = document.getElementById('residency');
    if (!el || !r) return;

    const now  = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    next.setDate(next.getDate() + ((r.day - next.getDay() + 7) % 7));
    const isTonight = next.toDateString() === now.toDateString();
    const when = isTonight ? 'Tonight' : `${DAYS[next.getDay()].slice(0, 3)}, ${MONTHS[next.getMonth()]} ${next.getDate()}`;

    el.innerHTML = `
        <div class="residency-when">
            <span class="eyebrow">${isTonight ? '<span class="live-dot" aria-hidden="true"></span>' : ''}Next up</span>
            <span class="residency-date">${esc(when)}</span>
        </div>
        <div class="residency-body">
            <h3>${esc(r.name)} <span class="muted">${esc(r.kind)}</span></h3>
            <p>Every ${esc(DAYS[r.day])} at <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.venue)}</a>, ${esc(r.city)}.
               Sign-up at ${esc(r.signup)}, music from ${esc(r.show)} until ${esc(r.end)}.</p>
            <p class="muted small">${esc(r.admission)}</p>
        </div>
    `;
}

// ─── Venue Links & Show Media ───────────────────────────────────────────────
const VENUE_URLS = {
    'The Nick': 'https://www.thenickrocks.com/',
    "Dave's Pub": 'https://davespubbham.com/',
    'True Story Brewing Co.': 'https://truestorybrewing.com/',
    'Voodoo Lounge': 'https://voodooloungehsv.com/',
    'Voodoo Lounge, Huntsville': 'https://voodooloungehsv.com/'
};

function isSameDay(d1, d2) {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

function buildGCalUrl(s) {
    if (!s || !s.date) return '';
    const title = encodeURIComponent(s.title + (s.with ? ` (with ${s.with})` : ''));
    const cleanDate = s.date.replace(/-/g, '');
    let dates = `${cleanDate}/${cleanDate}`;
    if (s.time && s.time.includes('7') && s.time.includes('10')) {
        dates = `${cleanDate}T190000/${cleanDate}T220000`;
    }
    const location = encodeURIComponent(`${s.venue || ''}${s.address ? `, ${s.address}` : ''}`);
    const details = encodeURIComponent([
        s.note || s.title,
        s.time ? `Time: ${s.time}` : '',
        s.cover ? `Admission: ${s.cover} (${s.age || '21+'})` : '',
        s.facebookEvent ? `Facebook Event & RSVP: ${s.facebookEvent}` : (s.link || '')
    ].filter(Boolean).join('\n\n'));
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&ctz=America/Chicago`;
}

function getVenueInfo(s, data) {
    let url = s.venue_url || s.url;
    if (!url && s.venue) {
        if (s.venue.includes('The Nick')) {
            url = (data && data.residency && data.residency.url) || 'https://www.thenickrocks.com/';
        } else if (VENUE_URLS[s.venue]) {
            url = VENUE_URLS[s.venue];
        } else {
            for (const [k, v] of Object.entries(VENUE_URLS)) {
                if (s.venue.includes(k) || k.includes(s.venue)) {
                    url = v;
                    break;
                }
            }
        }
    }
    let host = '';
    if (url) {
        try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (_) {}
    }
    return { name: s.venue, url, host };
}

function getShowMediaItems(s, data) {
    const items = [];
    if (!data) return items;

    // 1. Photos and flyers from data.media where date matches
    if (data.media && s.date) {
        data.media.filter(m => m.date && m.date === s.date).forEach(m => {
            items.push({
                type: 'photo',
                src: m.src,
                thumb: m.thumb || m.src,
                alt: m.alt || m.caption || 'Show media',
                caption: m.caption,
                credit: m.credit
            });
        });
    }

    // 2. Direct stage clip on the show
    if (s.clip) {
        items.push({
            type: 'clip',
            src: s.clip.src,
            thumb: s.clip.poster || s.clip.thumb || 'assets/thumbs/video_20250701.jpg',
            alt: s.clip.caption || 'Live stage clip',
            caption: s.clip.caption
        });
    }

    // 3. YouTube video
    if (data.videos) {
        const matchedVids = data.videos.filter(v => {
            if (s.video && v.id === s.video) return true;
            if (v.date && s.date && v.date === s.date) return true;
            if (s.date && v.title) {
                const parts = s.date.split('-');
                if (parts.length === 3) {
                    const shortPattern = `${parts[1]}.${parts[2]}.${parts[0].slice(2)}`;
                    if (v.title.includes(shortPattern)) return true;
                }
            }
            return false;
        });
        matchedVids.forEach(v => {
            items.push({
                type: 'video',
                id: v.id,
                src: `https://www.youtube.com/watch?v=${v.id}`,
                thumb: `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
                alt: v.title,
                caption: v.title
            });
        });
    }

    return items;
}

function renderShowDropdown(s, mediaItems, venueInfo, tags) {
    const photos = mediaItems.filter(m => m.type === 'photo');
    const clips = mediaItems.filter(m => m.type === 'clip');
    const videos = mediaItems.filter(m => m.type === 'video');
    const hasMedia = mediaItems.length > 0;

    let mediaHtml = '';
    if (hasMedia) {
        let photosHtml = '';
        if (photos.length) {
            photosHtml = `
                <div class="show-dropdown-gallery">
                    ${photos.map(p => `
                        <button type="button" class="show-dropdown-thumb" data-src="${esc(p.src)}" data-caption="${esc(p.caption || '')}${p.credit ? ` · photo ${esc(p.credit)}` : ''}" data-alt="${esc(p.alt || '')}" aria-label="Enlarge photo: ${esc(p.caption || p.alt)}">
                            <img src="${esc(p.thumb || p.src)}" alt="${esc(p.alt)}" loading="lazy">
                            ${p.caption ? `<span class="show-dropdown-caption">${esc(p.caption)}</span>` : ''}
                        </button>
                    `).join('')}
                </div>`;
        }

        let clipsHtml = '';
        if (clips.length || videos.length) {
            clipsHtml = `
                <div class="show-dropdown-media-row">
                    ${clips.map(c => `
                        <div class="show-dropdown-clip">
                            <video src="${esc(c.src)}" poster="${esc(c.thumb || '')}" controls playsinline preload="none"></video>
                            ${c.caption ? `<p class="muted small">${esc(c.caption)}</p>` : ''}
                        </div>
                    `).join('')}
                    ${videos.map(v => `
                        <div class="show-dropdown-video">
                            <a class="tl-video" href="${esc(v.src)}" target="_blank" rel="noopener" aria-label="Watch video: ${esc(v.caption)}">
                                <img src="${esc(v.thumb)}" alt="" loading="lazy">
                                <span class="play" aria-hidden="true"><i class="fas fa-play"></i></span>
                            </a>
                            ${v.caption ? `<p class="muted small">${esc(v.caption)}</p>` : ''}
                        </div>
                    `).join('')}
                </div>`;
        }

        mediaHtml = `
            <div class="show-dropdown-section">
                <div class="show-dropdown-heading"><i class="fas fa-camera-retro" aria-hidden="true"></i> Media from the night</div>
                ${photosHtml}
                ${clipsHtml}
            </div>`;
    }

    let detailsHtml = '';
    if (s.note || s.with || s.time || s.cover || s.address || s.source === 'phone') {
        detailsHtml = `
            <div class="show-dropdown-details">
                ${s.note ? `<p class="show-dropdown-note"><i class="fas fa-quote-left" aria-hidden="true"></i> ${esc(s.note)}</p>` : ''}
                ${s.with ? `<p class="show-dropdown-with"><b>With:</b> ${esc(s.with)}</p>` : ''}
                ${(s.time || s.cover || s.age) ? `<p class="show-dropdown-with"><b>Details:</b> ${[s.time, s.cover, s.age].filter(Boolean).map(esc).join(' · ')}</p>` : ''}
                ${s.address ? `<p class="show-dropdown-with"><b>Address:</b> ${esc(s.address)}</p>` : ''}
                ${s.source === 'phone' ? `<p class="show-dropdown-source muted small"><i class="fas fa-phone-flip" aria-hidden="true"></i> From John Polar's archive records</p>` : ''}
            </div>`;
    }

    let linksHtml = '';
    const fbEventUrl = s.facebookEvent || (s.link && /facebook\.com/.test(s.link) ? s.link : '');
    const venueFbUrl = s.venueFacebook || (s.venue && s.venue.includes('The Nick') ? 'https://www.facebook.com/thenickrocks' : '');
    const gcalUrl = buildGCalUrl(s);

    if (venueInfo.url || s.link || fbEventUrl || venueFbUrl || gcalUrl) {
        linksHtml = `
            <div class="show-dropdown-links">
                ${fbEventUrl ? `
                    <a href="${esc(fbEventUrl)}" target="_blank" rel="noopener" class="show-link-pill fb-pill" aria-label="RSVP on Facebook">
                        <i class="fab fa-facebook" aria-hidden="true"></i>
                        <span>RSVP on Facebook</span>
                    </a>` : ''}
                ${venueFbUrl ? `
                    <a href="${esc(venueFbUrl)}" target="_blank" rel="noopener" class="show-link-pill fb-checkin-pill" aria-label="Check in at ${esc(s.venue || 'venue')} on Facebook">
                        <i class="fas fa-location-dot" aria-hidden="true"></i>
                        <span>Check in at ${esc(s.venue || 'The Nick')}</span>
                    </a>` : ''}
                ${gcalUrl ? `
                    <a href="${esc(gcalUrl)}" target="_blank" rel="noopener" class="show-link-pill cal-pill" aria-label="Add event to Calendar">
                        <i class="fas fa-calendar-plus" aria-hidden="true"></i>
                        <span>Add to Calendar</span>
                    </a>` : ''}
                ${venueInfo.url ? `
                    <a href="${esc(venueInfo.url)}" target="_blank" rel="noopener" class="show-link-pill">
                        <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
                        <span>${esc(venueInfo.name)} website${venueInfo.host ? ` (${esc(venueInfo.host)})` : ''}</span>
                    </a>` : ''}
                ${s.link && !fbEventUrl ? `
                    <a href="${esc(s.link)}" target="_blank" rel="noopener" class="show-link-pill ${/instagram\.com/.test(s.link) ? 'ig-pill' : ''}">
                        <i class="${/instagram\.com/.test(s.link) ? 'fab fa-instagram' : 'fas fa-link'}" aria-hidden="true"></i>
                        <span>${esc(s.linkText || 'Event listing')}</span>
                    </a>` : ''}
            </div>`;
    }

    let fbEmbedHtml = '';
    if (fbEventUrl) {
        fbEmbedHtml = `
            <div class="show-dropdown-section fb-embed-section">
                <div class="show-dropdown-heading"><i class="fab fa-facebook" aria-hidden="true"></i> Facebook Event &amp; Check-In</div>
                <div class="fb-embed-container">
                    <button type="button" class="fb-load-btn" data-url="${esc(fbEventUrl)}">
                        <i class="fab fa-facebook" aria-hidden="true"></i>
                        <span>Show Facebook Event &amp; RSVP Embed</span>
                    </button>
                </div>
            </div>`;
    }

    return `
        ${mediaHtml}
        ${detailsHtml}
        ${linksHtml}
        ${fbEmbedHtml}
    `;
}

let showRowCounter = 0;

// ─── Shows: dated today or later → #upcoming, the rest → #shows ────────────
function showRow(s, artist, data, isUpcoming = false) {
    const d = parseDate(s.date);
    const now = new Date();
    const isToday = isSameDay(d, now);
    const tags = artist ? '' : (s.artists || []).map(a => `<span class="tag">${esc(ARTIST_NAMES[a] || a)}</span>`).join('');
    const mediaItems = getShowMediaItems(s, data);
    const hasMedia = mediaItems.length > 0;

    let badgeHtml = '';
    if (isUpcoming) {
        if (isToday) {
            badgeHtml = `<span class="tonight-badge"><i class="fas fa-bolt" aria-hidden="true"></i> Tonight</span>`;
        } else {
            badgeHtml = `<span class="upcoming-badge">Upcoming</span>`;
        }
    }

    let cardsHtml = '';
    if (hasMedia) {
        const count = Math.min(mediaItems.length, 3);
        const cardElements = mediaItems.slice(0, 3).map((item, idx) => {
            const isVideo = item.type === 'video' || item.type === 'clip';
            return `
                <div class="show-card" data-index="${idx}" title="${esc(item.caption || item.alt)}">
                    <img src="${esc(item.thumb || item.src)}" alt="${esc(item.alt)}" loading="lazy">
                    ${isVideo ? `<span class="show-card-play"><i class="fas fa-play" aria-hidden="true"></i></span>` : ''}
                </div>`;
        }).join('');
        cardsHtml = `<div class="show-cards" data-count="${count}" aria-label="${mediaItems.length} media item${mediaItems.length > 1 ? 's' : ''}">${cardElements}</div>`;
    }

    const venueInfo = getVenueInfo(s, data);
    const dropdownHtml = renderShowDropdown(s, mediaItems, venueInfo, tags);
    const showId = `show-detail-${++showRowCounter}`;
    const willOpen = isUpcoming;

    return `
        <li class="show-row ${hasMedia ? 'has-media' : ''} ${willOpen ? 'is-open is-upcoming' : ''}" data-reveal>
            <div class="show-row-main" role="button" tabindex="0" aria-expanded="${willOpen ? 'true' : 'false'}" aria-controls="${showId}" aria-label="${esc(s.title)}, ${d ? `${MONTHS[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}` : 'Earlier'}. View event details.">
                <span class="show-date">${d ? `<b>${MONTHS[d.getMonth()]} ${d.getDate()}</b> ${d.getFullYear()}` : '<b>Earlier</b>'}${badgeHtml}</span>
                <span class="show-info">
                    <span class="show-title">${esc(s.title)}</span>
                    <span class="show-meta">${esc(s.venue)}${s.with ? ` · with ${esc(s.with)}` : ''}</span>
                </span>
                <div class="show-side">
                    ${tags ? `<span class="show-tags">${tags}</span>` : ''}
                    ${cardsHtml}
                    <span class="show-chevron" aria-hidden="true"><i class="fas fa-chevron-down"></i></span>
                </div>
            </div>
            <div class="show-dropdown" id="${showId}" ${willOpen ? '' : 'hidden'}>
                ${dropdownHtml}
            </div>
        </li>`;
}

function renderShows(shows, artist, data) {
    if (!shows) return;
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const list  = forArtist(shows, artist);
    const upcoming = list.filter(s => parseDate(s.date) >= today)
                         .sort((a, b) => parseDate(a.date) - parseDate(b.date));
    const past     = list.filter(s => !upcoming.includes(s));

    const up = document.getElementById('upcoming');
    if (up) {
        up.innerHTML = upcoming.map(s => showRow(s, artist, data, true)).join('');
        up.hidden = !upcoming.length;
        const section = up.closest('[data-hide-if-empty]');
        if (section) section.hidden = !upcoming.length;
    }
    const el = document.getElementById('shows');
    if (el) el.innerHTML = past.map(s => showRow(s, artist, data, false)).join('');
}

// ─── Quotes ──────────────────────────────────────────────────────────────────
function renderQuotes(quotes, artist) {
    const el = document.getElementById('quotes');
    if (!el || !quotes) return;
    const list = forArtist(quotes, artist);
    el.innerHTML = list.map(q => `
        <figure class="quote" data-reveal>
            <blockquote>${esc(q.text)}</blockquote>
            <figcaption>
                <b>${esc(q.by)}</b>${q.role ? `, ${esc(q.role)}` : ''}
                ${q.url ? ` · <a href="${esc(q.url)}" target="_blank" rel="noopener">Read the post</a>` : ''}
            </figcaption>
        </figure>
    `).join('');
    const section = el.closest('[data-hide-if-empty]');
    if (section) section.hidden = !list.length;
}

// ─── Videos: thumbnail cards that swap to an embed on tap ───────────────────
function renderVideos(videos, artist) {
    const el = document.getElementById('videos');
    if (!el || !videos) return;
    const limit = Number(el.dataset.limit) || videos.length;

    el.innerHTML = forArtist(videos, artist).slice(0, limit).map(v => {
        const d = parseDate(v.date);
        return `
        <figure class="video" data-reveal>
            <button type="button" class="video-thumb" data-id="${esc(v.id)}" aria-label="Play: ${esc(v.title)}">
                <img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="" loading="lazy">
                <span class="play" aria-hidden="true"><i class="fas fa-play"></i></span>
            </button>
            <figcaption>
                <span>${esc(v.title)}</span>
                <span class="muted small">${d ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : ''}</span>
            </figcaption>
        </figure>`;
    }).join('');

    el.addEventListener('click', e => {
        const btn = e.target.closest('.video-thumb');
        if (!btn) return;
        const frame = document.createElement('iframe');
        frame.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.id}?autoplay=1&rel=0`;
        frame.title = btn.getAttribute('aria-label').replace(/^Play: /, '');
        frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        frame.allowFullscreen = true;
        btn.replaceWith(frame);
    });
}

// ─── Shared Lightbox ────────────────────────────────────────────────────────
function openLightbox(src, alt = '', caption = '') {
    const box = document.getElementById('lightbox');
    if (!box) return;
    const boxImg = box.querySelector('img');
    const boxCap = box.querySelector('figcaption');
    if (boxImg) {
        boxImg.src = src;
        boxImg.alt = alt;
    }
    if (boxCap) {
        boxCap.textContent = caption;
    }
    box.hidden = false;
}

function setupLightbox() {
    const box = document.getElementById('lightbox');
    if (!box || box.dataset.ready) return;
    box.dataset.ready = 'true';
    const close = () => {
        box.hidden = true;
        const img = box.querySelector('img');
        if (img) img.src = '';
    };
    box.addEventListener('click', close);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !box.hidden) close();
    });
}

function setupShowsInteractions() {
    if (document.body.dataset.showsReady) return;
    document.body.dataset.showsReady = 'true';

    document.addEventListener('click', e => {
        const thumb = e.target.closest('.show-dropdown-thumb');
        if (thumb) {
            e.stopPropagation();
            openLightbox(thumb.dataset.src, thumb.dataset.alt, thumb.dataset.caption);
            return;
        }

        if (e.target.closest('a, button, video, audio, .ig-load, .fb-load-btn, .fb-embed-wrapper, .tl-video, .show-dropdown-thumb')) {
            return;
        }

        const rowMain = e.target.closest('.show-row-main');
        if (rowMain) {
            const row = rowMain.closest('.show-row');
            const dropdown = row ? row.querySelector('.show-dropdown') : null;
            if (!dropdown) return;
            const willOpen = dropdown.hidden;
            dropdown.hidden = !willOpen;
            row.classList.toggle('is-open', willOpen);
            rowMain.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            const rowMain = document.activeElement?.closest?.('.show-row-main');
            if (rowMain && !e.target.closest('a, button, video')) {
                e.preventDefault();
                rowMain.click();
            }
        }
    });
}

// ─── Media grid + lightbox ───────────────────────────────────────────────────
function renderMedia(media) {
    const grid = document.getElementById('media-grid');
    if (!grid || !media) return;
    const limit = Number(grid.dataset.limit) || media.length;

    grid.innerHTML = media.slice(0, limit).map((m, i) => `
        <figure class="media-item" data-reveal>
            <button type="button" data-index="${i}" aria-label="Open: ${esc(m.caption)}">
                <img src="${esc(m.thumb || m.src)}" alt="${esc(m.alt)}" loading="lazy">
            </button>
            <figcaption>${esc(m.caption)}${m.credit ? ` <span class="muted">· photo ${esc(m.credit)}</span>` : ''}</figcaption>
        </figure>
    `).join('');

    setupLightbox();
    grid.addEventListener('click', e => {
        const btn = e.target.closest('button[data-index]');
        if (!btn) return;
        const m = media[btn.dataset.index];
        openLightbox(m.src, m.alt, m.caption + (m.credit ? ` · photo ${m.credit}` : ''));
    });
}

// ─── Instagram posts ─────────────────────────────────────────────────────────
// Instagram's embed script tracks visitors, so nothing loads until someone taps.
function igButton(url, label = 'Show the Instagram post') {
    return `<button type="button" class="ig-load" data-url="${esc(url)}"><i class="fab fa-instagram" aria-hidden="true"></i> ${esc(label)}</button>`;
}

function loadInstagramEmbed(btn) {
    const url = btn.dataset.url;
    const box = document.createElement('div');
    box.className = 'ig-embed';
    box.innerHTML = `<blockquote class="instagram-media" data-instgrm-permalink="${esc(url)}" data-instgrm-version="14">
        <a href="${esc(url)}" target="_blank" rel="noopener">View this post on Instagram</a></blockquote>`;
    btn.replaceWith(box);
    if (window.instgrm) { window.instgrm.Embeds.process(); return; }
    if (!document.getElementById('ig-embed-js')) {
        const sc = document.createElement('script');
        sc.id = 'ig-embed-js';
        sc.async = true;
        sc.src = 'https://www.instagram.com/embed.js';
        document.body.appendChild(sc);
    }
}

function loadFacebookEmbed(btn) {
    const url = btn.dataset.url;
    const container = btn.closest('.fb-embed-container');
    if (!container) return;
    const encoded = encodeURIComponent(url);
    container.innerHTML = `
        <div class="fb-embed-wrapper">
            <iframe 
                src="https://www.facebook.com/plugins/post.php?href=${encoded}&width=500&show_text=true&appId" 
                width="100%" 
                height="500" 
                style="border:none;overflow:hidden;border-radius:8px;background:var(--bg-raised,#18191a);" 
                scrolling="no" 
                frameborder="0" 
                allowfullscreen="true" 
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share">
            </iframe>
            <p class="fb-embed-fallback muted small">
                <i class="fab fa-facebook" aria-hidden="true"></i> 
                Can't see the RSVP button? <a href="${esc(url)}" target="_blank" rel="noopener">Open directly on Facebook</a> to RSVP or check in.
            </p>
        </div>`;
}

document.addEventListener('click', e => {
    const btn = e.target.closest('.ig-load');
    if (btn) loadInstagramEmbed(btn);

    const fbBtn = e.target.closest('.fb-load-btn');
    if (fbBtn) loadFacebookEmbed(fbBtn);
});

function renderPosts(posts, artist) {
    const el = document.getElementById('posts');
    if (!el || !posts) return;
    const list = forArtist(posts, artist);
    el.innerHTML = list.map(p => {
        const d = parseDate(p.date);
        const isFb = p.platform === 'facebook' || /facebook\.com/.test(p.url);
        return `
        <figure class="post ${isFb ? 'post-fb' : 'post-ig'}" data-reveal>
            <figcaption>
                <span>${esc(p.about)}</span>
                <span class="muted small">${[p.by, d ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : ''].filter(Boolean).map(esc).join(' · ')}</span>
            </figcaption>
            ${isFb ? `
                <div class="fb-post-cta">
                    <a href="${esc(p.url)}" target="_blank" rel="noopener" class="show-link-pill fb-pill">
                        <i class="fab fa-facebook" aria-hidden="true"></i>
                        <span>RSVP / View Event</span>
                    </a>
                </div>
            ` : `
                ${igButton(p.url, 'Show post')}
                <a class="small" href="${esc(p.url)}" target="_blank" rel="noopener">Open on Instagram</a>
            `}
        </figure>`;
    }).join('');
    const section = el.closest('[data-hide-if-empty]');
    if (section) section.hidden = !list.length;
}

// ─── Archive timeline ────────────────────────────────────────────────────────
// Everything with a date, grouped by year. Flyers/photos from a show's date are
// attached to that show instead of getting their own row.
const KIND = {
    show:      { label: 'Show',  icon: 'fa-microphone' },
    video:     { label: 'Video', icon: 'fa-play' },
    photo:     { label: 'Photo', icon: 'fa-image' },
    milestone: { label: 'Note',  icon: 'fa-star' },
};

function timelineItems(data) {
    const media = data.media || [];
    const used = new Set();
    const items = [];

    (data.shows || []).forEach(s => {
        const pics = media.filter(m => m.date && m.date === s.date);
        pics.forEach(m => used.add(m));
        items.push({ kind: 'show', date: s.date, title: s.title,
            meta: `${s.venue}${s.with ? ` · with ${s.with}` : ''}`, note: s.note, artists: s.artists, pics,
            link: s.link, linkText: s.linkText, clip: s.clip, facebookEvent: s.facebookEvent });
    });
    (data.videos || []).forEach(v => items.push({ kind: 'video', date: v.date, title: v.title, artists: v.artists,
        video: v.id }));
    media.filter(m => m.date && !used.has(m)).forEach(m => items.push({ kind: 'photo', date: m.date, title: m.caption, pics: [m] }));
    (data.milestones || []).forEach(m => items.push({ kind: 'milestone', date: m.date, title: m.title, meta: m.text,
        link: m.link, linkText: m.linkText }));
    return items;
}

function timelineEntry(it) {
    const d = parseDate(it.date);
    const k = KIND[it.kind];
    const tags = (it.artists || []).map(a => `<span class="tag">${esc(ARTIST_NAMES[a] || a)}</span>`).join('');
    const pics = (it.pics || []).map(m => `
        <button type="button" class="tl-pic" data-src="${esc(m.src)}" data-caption="${esc(m.caption)}" aria-label="Open: ${esc(m.caption)}">
            <img src="${esc(m.thumb || m.src)}" alt="${esc(m.alt)}" loading="lazy">
        </button>`).join('');
    const video = it.video ? `
        <a class="tl-video" href="https://www.youtube.com/watch?v=${esc(it.video)}" target="_blank" rel="noopener">
            <img src="https://i.ytimg.com/vi/${esc(it.video)}/mqdefault.jpg" alt="" loading="lazy">
            <span class="play" aria-hidden="true"><i class="fas fa-play"></i></span>
        </a>` : '';
    return `
        <li class="tl-entry tl-${it.kind}" data-kind="${it.kind}" data-reveal>
            <span class="tl-dot" aria-hidden="true"><i class="fas ${k.icon}"></i></span>
            <div class="tl-when">${d ? `${MONTHS[d.getMonth()]} ${d.getDate()}` : 'Undated'}<span>${esc(k.label)}</span></div>
            <div class="tl-body">
                <h3>${esc(it.title)}</h3>
                ${it.meta ? `<p class="muted">${esc(it.meta)}</p>` : ''}
                ${it.note ? `<p class="tl-note">${esc(it.note)}</p>` : ''}
                ${it.facebookEvent || (it.link && /facebook\.com/.test(it.link)) ? `
                    <p><a href="${esc(it.facebookEvent || it.link)}" target="_blank" rel="noopener" class="show-link-pill fb-pill"><i class="fab fa-facebook" aria-hidden="true"></i> <span>${esc(it.linkText || 'Facebook Event & RSVP')}</span></a></p>
                ` : it.link && /instagram\.com\/p\//.test(it.link) ? igButton(it.link) : it.link ? `<p><a href="${esc(it.link)}"${/^https?:/.test(it.link) ? ' target="_blank" rel="noopener"' : ''}>${esc(it.linkText || 'Open')}</a></p>` : ''}
                ${tags ? `<div class="show-tags">${tags}</div>` : ''}
                ${video}
                ${it.clip ? `<video class="tl-clip" src="${esc(it.clip.src)}" poster="${esc(it.clip.poster)}" controls playsinline preload="none"></video>${it.clip.caption ? `<p class="caption">${esc(it.clip.caption)}</p>` : ''}` : ''}
                ${pics ? `<div class="tl-pics">${pics}</div>` : ''}
            </div>
        </li>`;
}

function renderTimeline(data) {
    const el = document.getElementById('timeline');
    if (!el) return;
    let newestFirst = true;
    const items = timelineItems(data);

    function draw() {
        const sorted = [...items].sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return newestFirst ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
        });
        const years = [];
        sorted.forEach(it => {
            const y = it.date ? it.date.slice(0, 4) : 'Undated';
            if (!years.length || years.at(-1).year !== y) years.push({ year: y, items: [] });
            years.at(-1).items.push(it);
        });
        el.innerHTML = years.map(g => `
            <section class="tl-year" data-year="${esc(g.year)}">
                <h2 class="tl-year-label" data-reveal>${esc(g.year)}</h2>
                <ol class="tl-list">${g.items.map(timelineEntry).join('')}</ol>
            </section>`).join('');
        applyFilter();
        observeReveals();
    }

    // Filters
    const counts = items.reduce((c, it) => (c[it.kind] = (c[it.kind] || 0) + 1, c), {});
    const bar = document.getElementById('timeline-filters');
    let active = 'all';
    function applyFilter() {
        el.querySelectorAll('.tl-entry').forEach(e => { e.hidden = active !== 'all' && e.dataset.kind !== active; });
        el.querySelectorAll('.tl-year').forEach(y => { y.hidden = !y.querySelector('.tl-entry:not([hidden])'); });
    }
    if (bar) {
        bar.innerHTML = [['all', 'Everything', items.length], ...Object.entries(KIND).filter(([k]) => counts[k]).map(([k, v]) => [k, v.label + 's', counts[k]])]
            .map(([k, label, n]) => `<button type="button" data-kind="${k}" aria-pressed="${k === 'all'}">${esc(label)} <span>${n}</span></button>`).join('')
            + `<button type="button" class="tl-sort" aria-label="Change order">Newest first <i class="fas fa-arrow-down-long"></i></button>`;
        bar.addEventListener('click', e => {
            const b = e.target.closest('button');
            if (!b) return;
            if (b.classList.contains('tl-sort')) {
                newestFirst = !newestFirst;
                b.innerHTML = `${newestFirst ? 'Newest' : 'Oldest'} first <i class="fas fa-arrow-${newestFirst ? 'down' : 'up'}-long"></i>`;
                draw();
                return;
            }
            active = b.dataset.kind;
            bar.querySelectorAll('[data-kind]').forEach(x => x.setAttribute('aria-pressed', x === b));
            applyFilter();
        });
    }

    // Pictures open in the shared lightbox
    const box = document.getElementById('lightbox');
    el.addEventListener('click', e => {
        const b = e.target.closest('.tl-pic');
        if (!b || !box) return;
        box.querySelector('img').src = b.dataset.src;
        box.querySelector('img').alt = b.querySelector('img').alt;
        box.querySelector('figcaption').textContent = b.dataset.caption;
        box.hidden = false;
    });
    if (box && !document.getElementById('media-grid')) {
        box.addEventListener('click', () => { box.hidden = true; });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') box.hidden = true; });
    }

    draw();
}

// ─── Scroll reveal ───────────────────────────────────────────────────────────
// Elements with [data-reveal] fade up when they enter the viewport. Siblings
// revealed together are staggered. Without JS (or with reduced motion) the
// .js class never hides anything.
let revealObserver;
function observeReveals() {
    const items = document.querySelectorAll('[data-reveal]:not(.in)');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        items.forEach(el => el.classList.add('in'));
        return;
    }
    revealObserver ??= new IntersectionObserver(entries => {
        entries.filter(e => e.isIntersecting).forEach((e, i) => {
            e.target.style.transitionDelay = `${Math.min(i, 6) * 70}ms`;
            e.target.classList.add('in');
            revealObserver.unobserve(e.target);
        });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => revealObserver.observe(el));
}

// ─── Boot ────────────────────────────────────────────────────────────────────
async function loadData() {
    try {
        const res  = await fetch('database.json', { cache: 'no-cache' });
        const data = await res.json();
        const artist = document.body.dataset.artist || '';

        renderResidency(data.residency);
        renderShows(data.shows, artist, data);
        renderQuotes(data.quotes, artist);
        renderVideos(data.videos, artist);
        renderMedia(data.media);
        renderPosts(data.posts, artist);
        renderTimeline(data);
        setupLightbox();
        setupShowsInteractions();
    } catch (e) {
        console.warn('Could not load data:', e);
    }
    observeReveals();
    // Rendering shifts the layout, so land on #anchors again once content is in.
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

document.documentElement.classList.add('js');
document.addEventListener('DOMContentLoaded', () => { observeReveals(); loadData(); });
