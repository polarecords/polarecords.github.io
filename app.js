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

// ─── Shows: dated today or later → #upcoming, the rest → #shows ────────────
function showRow(s, artist) {
    const d = parseDate(s.date);
    const tags = artist ? '' : (s.artists || []).map(a => `<span class="tag">${esc(ARTIST_NAMES[a] || a)}</span>`).join('');
    return `
        <li class="show-row" data-reveal>
            <span class="show-date">${d ? `<b>${MONTHS[d.getMonth()]} ${d.getDate()}</b> ${d.getFullYear()}` : '<b>Earlier</b>'}</span>
            <span class="show-info">
                <span class="show-title">${esc(s.title)}</span>
                <span class="show-meta">${esc(s.venue)}${s.with ? ` · with ${esc(s.with)}` : ''}</span>
            </span>
            <span class="show-tags">${tags}</span>
        </li>`;
}

function renderShows(shows, artist) {
    if (!shows) return;
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const list  = forArtist(shows, artist);
    const upcoming = list.filter(s => parseDate(s.date) >= today)
                         .sort((a, b) => parseDate(a.date) - parseDate(b.date));
    const past     = list.filter(s => !upcoming.includes(s));

    const up = document.getElementById('upcoming');
    if (up) {
        up.innerHTML = upcoming.map(s => showRow(s, artist)).join('');
        up.hidden = !upcoming.length;
        const section = up.closest('[data-hide-if-empty]');
        if (section) section.hidden = !upcoming.length;
    }
    const el = document.getElementById('shows');
    if (el) el.innerHTML = past.map(s => showRow(s, artist)).join('');
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

    const box = document.getElementById('lightbox');
    if (!box) return;
    const boxImg = box.querySelector('img');
    const boxCap = box.querySelector('figcaption');

    grid.addEventListener('click', e => {
        const btn = e.target.closest('button[data-index]');
        if (!btn) return;
        const m = media[btn.dataset.index];
        boxImg.src = m.src;
        boxImg.alt = m.alt;
        boxCap.textContent = m.caption + (m.credit ? ` · photo ${m.credit}` : '');
        box.hidden = false;
    });
    const close = () => { box.hidden = true; boxImg.src = ''; };
    box.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) close(); });
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

document.addEventListener('click', e => {
    const btn = e.target.closest('.ig-load');
    if (btn) loadInstagramEmbed(btn);
});

function renderPosts(posts, artist) {
    const el = document.getElementById('posts');
    if (!el || !posts) return;
    const list = forArtist(posts, artist);
    el.innerHTML = list.map(p => {
        const d = parseDate(p.date);
        return `
        <figure class="post" data-reveal>
            <figcaption>
                <span>${esc(p.about)}</span>
                <span class="muted small">${[p.by, d ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : ''].filter(Boolean).map(esc).join(' · ')}</span>
            </figcaption>
            ${igButton(p.url, 'Show post')}
            <a class="small" href="${esc(p.url)}" target="_blank" rel="noopener">Open on Instagram</a>
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
            link: s.link, linkText: s.linkText, clip: s.clip });
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
                ${it.link && /instagram\.com\/p\//.test(it.link) ? igButton(it.link) : it.link ? `<p><a href="${esc(it.link)}"${/^https?:/.test(it.link) ? ' target="_blank" rel="noopener"' : ''}>${esc(it.linkText || 'Open')}</a></p>` : ''}
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
        renderShows(data.shows, artist);
        renderQuotes(data.quotes, artist);
        renderVideos(data.videos, artist);
        renderMedia(data.media);
        renderPosts(data.posts, artist);
        renderTimeline(data);
    } catch (e) {
        console.warn('Could not load data:', e);
    }
    observeReveals();
    // Rendering shifts the layout, so land on #anchors again once content is in.
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

document.documentElement.classList.add('js');
document.addEventListener('DOMContentLoaded', () => { observeReveals(); loadData(); });
