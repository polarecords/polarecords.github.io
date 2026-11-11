const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function parseDate(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

// ─── Shows: dated today or later → #upcoming, the rest → #shows ────────────
function showRow(s) {
    const d = parseDate(s.date);
    return `
        <li class="show-row" data-reveal>
            <span class="show-date">${d ? `<b>${MONTHS[d.getMonth()]} ${d.getDate()}</b> ${d.getFullYear()}` : '<b>Earlier</b>'}</span>
            <span class="show-info">
                <span class="show-title">${esc(s.title)}</span>
                <span class="show-meta">${esc(s.venue)}${s.with ? ` · with ${esc(s.with)}` : ''}</span>
            </span>
        </li>`;
}

function renderShows(shows) {
    if (!shows) return;
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const upcoming = shows.filter(s => parseDate(s.date) >= today)
                          .sort((a, b) => parseDate(a.date) - parseDate(b.date));
    const past     = shows.filter(s => !upcoming.includes(s));

    const up = document.getElementById('upcoming');
    if (up) {
        up.innerHTML = upcoming.map(s => showRow(s)).join('');
        up.hidden = !upcoming.length;
        const section = up.closest('[data-hide-if-empty]');
        if (section) section.hidden = !upcoming.length;
    }
    const el = document.getElementById('shows');
    if (el) {
        const limit = Number(el.dataset.limit) || past.length;
        el.innerHTML = past.slice(0, limit).map(s => showRow(s)).join('');
    }
}

// ─── Quotes ──────────────────────────────────────────────────────────────────
function renderQuotes(quotes) {
    const el = document.getElementById('quotes');
    if (!el || !quotes) return;
    el.innerHTML = quotes.map(q => `
        <figure class="quote" data-reveal>
            <blockquote>${esc(q.text)}</blockquote>
            <figcaption>
                <b>${esc(q.by)}</b>${q.role ? `, ${esc(q.role)}` : ''}
                ${q.url ? ` · <a href="${esc(q.url)}" target="_blank" rel="noopener">Post</a>` : ''}
            </figcaption>
        </figure>
    `).join('');
    const section = el.closest('[data-hide-if-empty]');
    if (section) section.hidden = !quotes.length;
}

// ─── Videos: thumbnail cards that swap to an embed on tap ───────────────────
function renderVideos(videos) {
    const el = document.getElementById('videos');
    if (!el || !videos) return;
    const limit = Number(el.dataset.limit) || videos.length;

    el.innerHTML = videos.slice(0, limit).map(v => {
        const d = parseDate(v.date);
        const thumb = v.poster || `https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg`;
        const isVertical = Boolean(v.poster && /live_clip|video_20250701/.test(v.poster));
        return `
        <figure class="video" data-reveal>
            <button type="button" class="video-thumb ${isVertical ? 'is-vertical' : 'is-youtube'}" data-id="${esc(v.id || '')}" data-src="${esc(v.src || '')}" data-poster="${esc(v.poster || '')}" data-start="${esc(v.start || '')}" aria-label="Play: ${esc(v.title)}">
                <img src="${esc(thumb)}" alt="${esc(v.title)}" loading="lazy">
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
        if (btn.dataset.src) {
            const vid = document.createElement('video');
            vid.src = btn.dataset.src;
            if (btn.dataset.poster) vid.poster = btn.dataset.poster;
            vid.controls = true;
            vid.autoplay = true;
            vid.playsInline = true;
            btn.replaceWith(vid);
            return;
        }
        const startParam = btn.dataset.start ? `&start=${btn.dataset.start}` : '';
        const frame = document.createElement('iframe');
        frame.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.id}?autoplay=1&rel=0${startParam}`;
        frame.title = btn.getAttribute('aria-label').replace(/^Play: /, '');
        frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        frame.allowFullscreen = true;
        btn.replaceWith(frame);
    });
}

// ─── Live Audio Archives (Bandstand trimmed sets + previews + markers) ──────
function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

let activeAudio = null;
let activeCard = null;

function renderAudio(tracks) {
    const el = document.getElementById('audio-tracks');
    if (!el || !tracks) return;

    el.innerHTML = tracks.map(t => {
        const markersHtml = (t.markers || []).map(m => `
            <button type="button" class="marker-pill" data-time="${m.time}" aria-label="Jump to ${esc(m.label)} at ${formatTime(m.time)}">
                <span>${formatTime(m.time)}</span> ${esc(m.label)}
            </button>
        `).join('');

        return `
            <article class="audio-card" data-id="${esc(t.id)}" data-set="${esc(t.setSrc)}" data-preview="${esc(t.previewSrc)}" data-reveal>
                <div class="audio-card-head">
                    <div class="audio-title-group">
                        <h3>${esc(t.title)}</h3>
                        <span class="audio-meta">${esc(t.venue)} · ${t.date}</span>
                    </div>
                    <div class="audio-controls">
                        <button type="button" class="audio-btn btn-preview" data-mode="preview" aria-label="Play ${esc(t.title)} preview">
                            <i class="fas fa-play" aria-hidden="true"></i> Preview (${t.previewDuration}s)
                        </button>
                        <button type="button" class="audio-btn btn-set" data-mode="set" aria-label="Play ${esc(t.title)} full set">
                            <i class="fas fa-play" aria-hidden="true"></i> Full Set (${formatTime(t.duration)})
                        </button>
                    </div>
                </div>
                <audio class="audio-player-element" preload="none" controls hidden></audio>
                ${markersHtml ? `
                    <div class="audio-markers">
                        <span class="audio-markers-label">Cues:</span>
                        ${markersHtml}
                    </div>` : ''}
            </article>`;
    }).join('');

    el.addEventListener('click', e => {
        const btn = e.target.closest('.audio-btn');
        const marker = e.target.closest('.marker-pill');
        const card = e.target.closest('.audio-card');
        if (!card) return;

        const audio = card.querySelector('audio');
        if (!audio) return;

        if (btn) {
            const mode = btn.dataset.mode;
            const src = mode === 'preview' ? card.dataset.preview : card.dataset.set;

            if (activeAudio === audio && audio.src.endsWith(src)) {
                if (audio.paused) {
                    audio.play();
                    btn.classList.add('active');
                    btn.querySelector('i').className = 'fas fa-pause';
                    card.classList.add('playing');
                } else {
                    audio.pause();
                    btn.classList.remove('active');
                    btn.querySelector('i').className = 'fas fa-play';
                    card.classList.remove('playing');
                }
                return;
            }

            if (activeAudio && activeAudio !== audio) {
                activeAudio.pause();
                if (activeCard) {
                    activeCard.classList.remove('playing');
                    activeCard.querySelectorAll('.audio-btn').forEach(b => {
                        b.classList.remove('active');
                        b.querySelector('i').className = 'fas fa-play';
                    });
                }
            }

            audio.src = src;
            audio.hidden = false;
            audio.play();
            activeAudio = audio;
            activeCard = card;

            card.classList.add('playing');
            card.querySelectorAll('.audio-btn').forEach(b => {
                b.classList.remove('active');
                b.querySelector('i').className = 'fas fa-play';
            });
            btn.classList.add('active');
            btn.querySelector('i').className = 'fas fa-pause';

            audio.onended = () => {
                btn.classList.remove('active');
                btn.querySelector('i').className = 'fas fa-play';
                card.classList.remove('playing');
            };
            return;
        }

        if (marker) {
            const time = Number(marker.dataset.time);
            const setBtn = card.querySelector('.btn-set');

            if (!audio.src.endsWith(card.dataset.set)) {
                if (activeAudio && activeAudio !== audio) {
                    activeAudio.pause();
                    if (activeCard) {
                        activeCard.classList.remove('playing');
                        activeCard.querySelectorAll('.audio-btn').forEach(b => {
                            b.classList.remove('active');
                            b.querySelector('i').className = 'fas fa-play';
                        });
                    }
                }
                audio.src = card.dataset.set;
                audio.hidden = false;
                activeAudio = audio;
                activeCard = card;
                card.classList.add('playing');
                card.querySelectorAll('.audio-btn').forEach(b => {
                    b.classList.remove('active');
                    b.querySelector('i').className = 'fas fa-play';
                });
                if (setBtn) {
                    setBtn.classList.add('active');
                    setBtn.querySelector('i').className = 'fas fa-pause';
                }
            }

            audio.currentTime = time;
            if (audio.paused) audio.play();

            card.querySelectorAll('.marker-pill').forEach(m => m.classList.toggle('active', m === marker));
        }
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

function getMediaCategory(src) {
    if (!src) return 'stage';
    if (/photo_20250602/.test(src)) return 'landscape';
    if (/flyer|marquee|20260623/.test(src)) return 'flyer';
    return 'stage';
}

// ─── Media grid + lightbox ───────────────────────────────────────────────────
function renderMedia(media) {
    const grid = document.getElementById('media-grid');
    if (!grid || !media) return;
    const limit = Number(grid.dataset.limit) || media.length;

    grid.innerHTML = media.slice(0, limit).map((m, i) => {
        const cat = getMediaCategory(m.src);
        return `
        <figure class="media-item is-${cat}" data-type="${cat}" data-reveal>
            <button type="button" data-index="${i}" aria-label="Open: ${esc(m.caption)}">
                <img src="${esc(m.thumb || m.src)}" alt="${esc(m.alt)}" loading="lazy">
            </button>
            <figcaption>${esc(m.caption)}${m.credit ? ` <span class="muted">· photo ${m.creditUrl ? `<a href="${esc(m.creditUrl)}" target="_blank" rel="noopener">${esc(m.credit)}</a>` : esc(m.credit)}</span>` : ''}</figcaption>
        </figure>
    `;
    }).join('');

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
function igButton(url, label = 'Show post') {
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

// ─── Archive timeline ────────────────────────────────────────────────────────
// Everything with a date, grouped by year. Flyers/photos from a show's date are
// attached to that show instead of getting their own row.
const KIND = {
    show:  { label: 'Show',  icon: 'fa-microphone' },
    video: { label: 'Video', icon: 'fa-play' },
    audio: { label: 'Audio', icon: 'fa-headphones' },
    photo: { label: 'Photo', icon: 'fa-image' },
};

function timelineItems(data) {
    const media = data.media || [];
    const used = new Set();
    const usedClips = new Set();
    const items = [];

    (data.shows || []).forEach(s => {
        const pics = media.filter(m => m.date && m.date === s.date);
        pics.forEach(m => used.add(m));
        if (s.clip?.src) usedClips.add(s.clip.src);
        items.push({ kind: 'show', date: s.date, title: s.title,
            meta: `${s.venue}${s.with ? ` · with ${s.with}` : ''}`, note: s.note, pics,
            link: s.link, linkText: s.linkText, gallery: s.gallery, galleryText: s.galleryText, clip: s.clip });
    });
    (data.videos || []).forEach(v => {
        if (v.src && usedClips.has(v.src)) return;
        items.push({ kind: 'video', date: v.date, title: v.title,
            video: v.id, clip: v.src ? { src: v.src, poster: v.poster } : null });
    });
    (data.audio || []).forEach(a => {
        items.push({ kind: 'audio', date: a.date, title: a.title,
            meta: `${a.venue} · Bandstand Live Cut`, audioItem: a });
    });
    media.filter(m => m.date && !used.has(m)).forEach(m => items.push({ kind: 'photo', date: m.date, title: m.caption, pics: [m] }));
    return items;
}

function timelineEntry(it) {
    const d = parseDate(it.date);
    const k = KIND[it.kind] || { label: 'Item', icon: 'fa-circle' };
    const hasVideo = Boolean(it.kind === 'video' || it.video || it.clip);
    const hasPhoto = Boolean(it.kind === 'photo' || (it.pics && it.pics.length));
    const pics = (it.pics || []).map(m => {
        const cat = getMediaCategory(m.src);
        return `
        <button type="button" class="tl-pic is-${cat}" data-type="${cat}" data-src="${esc(m.src)}" data-caption="${esc(m.caption + (m.credit ? ` · photo ${m.credit}` : ''))}" aria-label="Open: ${esc(m.caption)}">
            <img src="${esc(m.thumb || m.src)}" alt="${esc(m.alt)}" loading="lazy">
        </button>`;
    }).join('');
    const video = it.video ? `
        <a class="tl-video" href="https://www.youtube.com/watch?v=${esc(it.video)}" target="_blank" rel="noopener" aria-label="Watch video: ${esc(it.title)}">
            <img src="https://i.ytimg.com/vi/${esc(it.video)}/hqdefault.jpg" alt="${esc(it.title)}" loading="lazy">
            <span class="play" aria-hidden="true"><i class="fas fa-play"></i></span>
        </a>` : '';
    const audio = it.audioItem ? `
        <div class="tl-audio" style="margin-top:12px;">
            <audio src="${esc(it.audioItem.setSrc)}" preload="none" controls class="audio-player-element"></audio>
            ${(it.audioItem.markers || []).length ? `
                <div class="audio-markers" style="margin-top:8px;">
                    <span class="audio-markers-label">Cues:</span>
                    ${it.audioItem.markers.map(m => `<button type="button" class="marker-pill" onclick="const a=this.closest('.tl-audio').querySelector('audio');a.currentTime=${m.time};a.play();"><span>${formatTime(m.time)}</span> ${esc(m.label)}</button>`).join('')}
                </div>` : ''}
        </div>` : '';
    return `
        <li class="tl-entry tl-${it.kind}" data-kind="${it.kind}" data-has-video="${hasVideo}" data-has-photo="${hasPhoto}" data-reveal>
            <span class="tl-dot" aria-hidden="true"><i class="fas ${k.icon}"></i></span>
            <div class="tl-when">${d ? `${MONTHS[d.getMonth()]} ${d.getDate()}` : 'Undated'}<span>${esc(k.label)}</span></div>
            <div class="tl-body">
                <h3>${esc(it.title)}</h3>
                ${it.meta ? `<p class="muted">${esc(it.meta)}</p>` : ''}
                ${it.note ? `<p class="tl-note">${esc(it.note)}</p>` : ''}
                ${it.link && /instagram\.com\/p\//.test(it.link) ? igButton(it.link) : it.link ? `<p><a href="${esc(it.link)}"${/^https?:/.test(it.link) ? ' target="_blank" rel="noopener"' : ''}>${esc(it.linkText || 'Open')}</a></p>` : ''}
                ${it.gallery ? `<p class="small"><a href="${esc(it.gallery)}" target="_blank" rel="noopener">${esc(it.galleryText || 'Photo gallery · ReBe Loves')}</a></p>` : ''}
                ${video}
                ${audio}
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
    const counts = {
        show: items.filter(it => it.kind === 'show').length,
        video: items.filter(it => it.kind === 'video' || it.video || it.clip).length,
        audio: items.filter(it => it.kind === 'audio').length,
        photo: items.filter(it => it.kind === 'photo' || (it.pics && it.pics.length)).length,
    };
    const bar = document.getElementById('timeline-filters');
    let active = 'all';
    function applyFilter() {
        el.querySelectorAll('.tl-entry').forEach(e => {
            const match = active === 'all'
                || e.dataset.kind === active
                || (active === 'video' && e.dataset.hasVideo === 'true')
                || (active === 'photo' && e.dataset.hasPhoto === 'true');
            e.hidden = !match;
        });
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
    setupLightbox();
    el.addEventListener('click', e => {
        const b = e.target.closest('.tl-pic');
        if (!b) return;
        const img = b.querySelector('img');
        openLightbox(b.dataset.src, img ? img.alt : '', b.dataset.caption || '');
    });

    draw();
}

// ─── Scroll reveal ───────────────────────────────────────────────────────────
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

        renderShows(data.shows);
        renderQuotes(data.quotes);
        renderVideos(data.videos);
        renderAudio(data.audio);
        renderMedia(data.media);
        renderTimeline(data);
        setupLightbox();
    } catch (e) {
        console.warn('Could not load data:', e);
    }
    observeReveals();
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

// ─── Easter egg trigger: key sequence 'polar', '~', or 5 taps on the logo ──
(function setupEasterEggTrigger() {
    let keyBuffer = '';
    window.addEventListener('keydown', e => {
        if (e.target && /input|textarea/i.test(e.target.tagName)) return;
        if (e.key === '`' || e.key === '~') {
            window.location.href = 'easteregg.html';
            return;
        }
        keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-5);
        if (keyBuffer === 'polar') {
            window.location.href = 'easteregg.html';
        }
    });

    let logoClicks = 0;
    let logoTimer = null;
    document.addEventListener('click', e => {
        const logo = e.target.closest('.site-header .logo');
        if (!logo) return;
        logoClicks++;
        clearTimeout(logoTimer);
        if (logoClicks >= 5) {
            e.preventDefault();
            window.location.href = 'easteregg.html';
        } else {
            logoTimer = setTimeout(() => { logoClicks = 0; }, 1500);
        }
    });
})();

document.documentElement.classList.add('js');
document.addEventListener('DOMContentLoaded', () => { observeReveals(); loadData(); });

if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}
