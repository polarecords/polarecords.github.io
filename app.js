// Ensure HTTPS and canonical domain (polarecords.net)
(function() {
    if (typeof location === 'undefined') return;
    const h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1') return;
    if (location.protocol === 'http:' || h.startsWith('www.')) {
        location.replace('https://polarecords.net' + location.pathname + location.search + location.hash);
    }
})();

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
                ${q.url ? ` · <a href="${esc(q.url)}" target="_blank" rel="noopener noreferrer">Post</a>` : ''}
            </figcaption>
        </figure>
    `).join('');
    const section = el.closest('[data-hide-if-empty]');
    if (section) section.hidden = !quotes.length;
}

// ─── Videos: direct links for YouTube, inline player for local MP4 ─────────
function renderVideos(videos) {
    const el = document.getElementById('videos');
    if (!el || !videos) return;
    const limit = Number(el.dataset.limit) || videos.length;

    el.innerHTML = videos.slice(0, limit).map(v => {
        const d = parseDate(v.date);
        const thumb = v.poster || `https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg`;
        const isVertical = Boolean(v.poster && /live_clip|video_20250701/.test(v.poster));
        if (v.src) {
            return `
            <figure class="video" data-reveal>
                <button type="button" class="video-thumb ${isVertical ? 'is-vertical' : ''}" data-src="${esc(v.src)}" data-poster="${esc(v.poster || '')}" aria-label="Play: ${esc(v.title)}">
                    <img src="${esc(thumb)}" alt="${esc(v.title)}" loading="lazy">
                    <span class="play" aria-hidden="true"><i class="fas fa-play"></i></span>
                </button>
                <figcaption>
                    <span>${esc(v.title)}</span>
                    <span class="muted small">${d ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : ''}</span>
                </figcaption>
            </figure>`;
        }
        return `
        <figure class="video" data-reveal>
            <button type="button" class="video-thumb is-youtube" data-video-id="${esc(v.id)}" data-title="${esc(v.title)}" aria-label="Play: ${esc(v.title)}">
                <img src="${esc(thumb)}" alt="${esc(v.title)}" loading="lazy">
                <span class="play" aria-hidden="true"><i class="fas fa-play"></i></span>
            </button>
            <figcaption>
                <span>${esc(v.title)}</span>
                <span class="muted small">${d ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : ''} · <a href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener noreferrer">YouTube</a></span>
            </figcaption>
        </figure>`;
    }).join('');

    el.addEventListener('click', e => {
        const mp4Btn = e.target.closest('button.video-thumb[data-src]');
        if (mp4Btn) {
            const vid = document.createElement('video');
            vid.src = mp4Btn.dataset.src;
            if (mp4Btn.dataset.poster) vid.poster = mp4Btn.dataset.poster;
            vid.controls = true;
            vid.autoplay = true;
            vid.playsInline = true;
            mp4Btn.replaceWith(vid);
            return;
        }
        const ytBtn = e.target.closest('button.video-thumb[data-video-id]');
        if (ytBtn) {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(ytBtn.dataset.videoId)}?autoplay=1&playsinline=1`;
            iframe.title = ytBtn.dataset.title || 'YouTube video';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.allowFullscreen = true;
            iframe.className = 'video-thumb';
            iframe.style.border = '0';
            ytBtn.replaceWith(iframe);
        }
    });
}

// ─── Themed Audio Player Component ──────────────────────────────────────────
function formatTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

let activeAudio = null;

function initAudioCard(card) {
    if (card.dataset.initAudio) return;
    card.dataset.initAudio = 'true';

    const audio = card.querySelector('audio');
    const playBtn = card.querySelector('.themed-play-btn');
    const playIcon = playBtn ? playBtn.querySelector('i') : null;
    const scrubber = card.querySelector('.themed-scrubber');
    const progress = card.querySelector('.themed-progress');
    const buffered = card.querySelector('.themed-buffered');
    const timeCurr = card.querySelector('.themed-time-curr');
    const timeDur = card.querySelector('.themed-time-dur');
    const muteBtn = card.querySelector('.themed-mute-btn');
    const modeBtns = card.querySelectorAll('.audio-mode-toggle button');
    const markers = card.querySelectorAll('.marker-pill');

    let currentMode = 'set';
    if (!audio.src) audio.src = card.dataset.set;

    function setMode(mode) {
        currentMode = mode;
        modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        const wasPlaying = !audio.paused;
        const targetSrc = mode === 'preview' ? card.dataset.preview : card.dataset.set;
        if (!audio.src.endsWith(targetSrc)) {
            audio.src = targetSrc;
            if (wasPlaying) audio.play();
        }
        if (progress) progress.style.width = '0%';
        if (timeCurr) timeCurr.textContent = '0:00';
    }

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (audio.paused) {
                if (activeAudio && activeAudio !== audio) {
                    activeAudio.pause();
                }
                audio.play();
            } else {
                audio.pause();
            }
        });
    }

    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            audio.muted = !audio.muted;
            muteBtn.querySelector('i').className = audio.muted ? 'fas fa-volume-xmark' : 'fas fa-volume-high';
        });
    }

    audio.addEventListener('play', () => {
        activeAudio = audio;
        card.classList.add('is-playing');
        if (playIcon) playIcon.className = 'fas fa-pause';
    });

    audio.addEventListener('pause', () => {
        card.classList.remove('is-playing');
        if (playIcon) playIcon.className = 'fas fa-play';
    });

    audio.addEventListener('ended', () => {
        card.classList.remove('is-playing');
        if (playIcon) playIcon.className = 'fas fa-play';
        if (progress) progress.style.width = '0%';
        if (timeCurr) timeCurr.textContent = '0:00';
        markers.forEach(m => m.classList.remove('active'));
    });

    audio.addEventListener('timeupdate', () => {
        const cur = audio.currentTime;
        const dur = audio.duration || 1;
        const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
        if (progress) progress.style.width = `${pct}%`;
        if (timeCurr) timeCurr.textContent = formatTime(cur);
        if (timeDur && audio.duration) timeDur.textContent = formatTime(audio.duration);

        const sortedMarkers = Array.from(markers).sort((a, b) => Number(a.dataset.time) - Number(b.dataset.time));
        let activeIdx = -1;
        for (let i = 0; i < sortedMarkers.length; i++) {
            if (cur >= Number(sortedMarkers[i].dataset.time)) {
                activeIdx = i;
            } else {
                break;
            }
        }
        sortedMarkers.forEach((m, idx) => {
            const isActive = idx === activeIdx;
            if (m.classList.contains('active') !== isActive) {
                m.classList.toggle('active', isActive);
                if (isActive && typeof m.scrollIntoView === 'function') {
                    m.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }
        });
    });

    audio.addEventListener('progress', () => {
        if (audio.buffered.length > 0 && audio.duration) {
            const bufEnd = audio.buffered.end(audio.buffered.length - 1);
            const pct = Math.min(100, (bufEnd / audio.duration) * 100);
            if (buffered) buffered.style.width = `${pct}%`;
        }
    });

    if (scrubber) {
        let isDragging = false;
        const updateScrub = (clientX, commit) => {
            const rect = scrubber.getBoundingClientRect();
            if (!rect.width) return;
            const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const dur = audio.duration || 1;
            if (progress) progress.style.width = `${pos * 100}%`;
            if (timeCurr) timeCurr.textContent = formatTime(pos * dur);
            scrubber.setAttribute('aria-valuenow', Math.round(pos * 100));
            if (commit && audio.duration) {
                audio.currentTime = pos * audio.duration;
            }
        };

        scrubber.addEventListener('pointerdown', e => {
            isDragging = true;
            scrubber.classList.add('is-dragging');
            try { scrubber.setPointerCapture(e.pointerId); } catch (_) {}
            updateScrub(e.clientX, false);
        });

        scrubber.addEventListener('pointermove', e => {
            if (!isDragging) return;
            updateScrub(e.clientX, false);
        });

        const endDrag = e => {
            if (!isDragging) return;
            isDragging = false;
            scrubber.classList.remove('is-dragging');
            try { scrubber.releasePointerCapture(e.pointerId); } catch (_) {}
            updateScrub(e.clientX, true);
        };

        scrubber.addEventListener('pointerup', endDrag);
        scrubber.addEventListener('pointercancel', endDrag);

        scrubber.addEventListener('keydown', e => {
            if (!audio.duration) return;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                audio.currentTime = Math.max(0, audio.currentTime - 5);
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
            } else if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                if (audio.paused) audio.play(); else audio.pause();
            }
        });
    }

    markers.forEach(m => {
        m.addEventListener('click', () => {
            const time = Number(m.dataset.time);
            if (currentMode !== 'set') setMode('set');
            if (activeAudio && activeAudio !== audio) activeAudio.pause();
            audio.currentTime = time;
            audio.play();
            markers.forEach(pill => pill.classList.toggle('active', pill === m));
        });
    });
}

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
                        <div class="audio-title-row">
                            <span class="audio-live-badge"><span class="eq"><i></i><i></i><i></i><i></i></span> LIVE CUT</span>
                            <h3>${esc(t.title)}</h3>
                        </div>
                        <span class="audio-meta">${esc(t.venue)} · ${t.date}</span>
                    </div>
                    <div class="audio-mode-toggle">
                        <button type="button" class="active" data-mode="set">Full Set (${formatTime(t.duration)})</button>
                        <button type="button" data-mode="preview">Preview (${t.previewDuration}s)</button>
                    </div>
                </div>

                <div class="themed-player">
                    <button type="button" class="themed-play-btn" aria-label="Play / Pause ${esc(t.title)}">
                        <i class="fas fa-play" aria-hidden="true"></i>
                    </button>
                    <div class="themed-track-wrap">
                        <div class="themed-scrubber" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">
                            <div class="themed-buffered" style="width: 0%;"></div>
                            <div class="themed-progress" style="width: 0%;"></div>
                        </div>
                        <div class="themed-time-row">
                            <span class="themed-time-curr">0:00</span>
                            <span class="themed-time-dur">${formatTime(t.duration)}</span>
                        </div>
                    </div>
                    <button type="button" class="themed-mute-btn" aria-label="Mute / Unmute">
                        <i class="fas fa-volume-high" aria-hidden="true"></i>
                    </button>
                </div>

                ${markersHtml ? `
                    <div class="audio-markers">
                        <span class="audio-markers-label">Cues:</span>
                        ${markersHtml}
                    </div>` : ''}

                <audio class="audio-player-element" preload="none" style="display:none;"></audio>
            </article>`;
    }).join('');

    el.querySelectorAll('.audio-card').forEach(initAudioCard);
}

// ─── Shared Lightbox with Gallery Navigation & Touch Swipe ─────────────────
let activeGallery = [];
let activeGalleryIndex = 0;

function updateLightboxContent() {
    const box = document.getElementById('lightbox');
    if (!box || !activeGallery.length) return;
    const item = activeGallery[activeGalleryIndex];
    if (!item) return;

    const boxImg = box.querySelector('img');
    const boxCap = box.querySelector('figcaption');
    const counter = box.querySelector('.lightbox-counter');
    const prevBtn = box.querySelector('.lightbox-prev');
    const nextBtn = box.querySelector('.lightbox-next');

    if (boxImg) {
        boxImg.src = item.src;
        boxImg.alt = item.alt || '';
    }
    if (boxCap) {
        const creditHtml = item.credit ? ` <span class="muted">· photo ${item.creditUrl ? `<a href="${esc(item.creditUrl)}" target="_blank" rel="noopener noreferrer">${esc(item.credit)}</a>` : esc(item.credit)}</span>` : '';
        boxCap.innerHTML = `${esc(item.caption || '')}${creditHtml}`;
    }
    if (counter) {
        counter.textContent = activeGallery.length > 1 ? `${activeGalleryIndex + 1} / ${activeGallery.length}` : '';
        counter.hidden = activeGallery.length <= 1;
    }
    if (prevBtn) prevBtn.hidden = activeGallery.length <= 1;
    if (nextBtn) nextBtn.hidden = activeGallery.length <= 1;
}

function openLightboxGallery(items, index = 0) {
    const box = document.getElementById('lightbox');
    if (!box || !items || !items.length) return;
    activeGallery = items;
    activeGalleryIndex = Math.max(0, Math.min(items.length - 1, index));
    updateLightboxContent();
    const fig = box.querySelector('figure');
    if (fig) {
        fig.style.transition = '';
        fig.style.transform = '';
        fig.style.opacity = '';
    }
    box.hidden = false;
    document.body.style.overflow = 'hidden';
}

function openLightbox(src, alt = '', caption = '') {
    openLightboxGallery([{ src, alt, caption }], 0);
}

function setupLightbox() {
    const box = document.getElementById('lightbox');
    if (!box || box.dataset.ready) return;
    box.dataset.ready = 'true';

    const close = () => {
        box.hidden = true;
        document.body.style.overflow = '';
        box.style.backgroundColor = '';
        const fig = box.querySelector('figure');
        if (fig) {
            fig.style.transition = '';
            fig.style.transform = '';
            fig.style.opacity = '';
        }
        const img = box.querySelector('img');
        if (img) img.src = '';
        activeGallery = [];
    };

    const prev = () => {
        if (activeGallery.length <= 1) return;
        activeGalleryIndex = (activeGalleryIndex - 1 + activeGallery.length) % activeGallery.length;
        updateLightboxContent();
    };

    const next = () => {
        if (activeGallery.length <= 1) return;
        activeGalleryIndex = (activeGalleryIndex + 1) % activeGallery.length;
        updateLightboxContent();
    };

    box.addEventListener('click', e => {
        if (e.target.closest('.lightbox-close')) {
            close();
            return;
        }
        if (e.target.closest('.lightbox-prev')) {
            e.stopPropagation();
            prev();
            return;
        }
        if (e.target.closest('.lightbox-next')) {
            e.stopPropagation();
            next();
            return;
        }
        if (!e.target.closest('figure')) {
            close();
        }
    });

    document.addEventListener('keydown', e => {
        if (box.hidden) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft') prev();
        else if (e.key === 'ArrowRight') next();
    });

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let activeGesture = null;

    box.addEventListener('touchstart', e => {
        if (e.touches.length !== 1) return;
        const fig = box.querySelector('figure');
        if (fig) fig.style.transition = 'none';
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        activeGesture = null;
    }, { passive: true });

    box.addEventListener('touchmove', e => {
        if (!touchStartTime || e.touches.length !== 1) return;
        const fig = box.querySelector('figure');
        if (!fig) return;
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;

        if (!activeGesture) {
            if (dy > 12 && dy > Math.abs(dx) * 1.2) {
                activeGesture = 'pull-down';
            } else if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) {
                activeGesture = 'swipe-x';
            }
        }

        if (activeGesture === 'pull-down') {
            const dampenedDy = Math.max(0, dy);
            const scale = Math.max(0.82, 1 - (dampenedDy / 1100));
            fig.style.transform = `translate3d(0, ${dampenedDy}px, 0) scale(${scale})`;
            const alpha = Math.max(0.25, 0.94 - (dampenedDy / 500));
            box.style.backgroundColor = `rgba(12, 10, 8, ${alpha})`;
        } else if (activeGesture === 'swipe-x') {
            fig.style.transform = `translate3d(${dx}px, 0, 0)`;
            fig.style.opacity = Math.max(0.65, 1 - (Math.abs(dx) / 600));
        }
    }, { passive: true });

    box.addEventListener('touchend', e => {
        if (!touchStartTime || e.changedTouches.length !== 1) return;
        const fig = box.querySelector('figure');
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const dt = Date.now() - touchStartTime;
        touchStartTime = 0;
        box.style.backgroundColor = '';

        if (!fig) {
            activeGesture = null;
            return;
        }

        if (activeGesture === 'pull-down') {
            if (dy > 80 || (dy > 40 && dt < 280)) {
                fig.style.transition = 'transform .22s cubic-bezier(.2, .8, .2, 1), opacity .22s ease-out';
                fig.style.transform = 'translate3d(0, 100%, 0) scale(0.85)';
                fig.style.opacity = '0';
                setTimeout(() => {
                    close();
                    fig.style.transition = '';
                    fig.style.transform = '';
                    fig.style.opacity = '';
                }, 220);
            } else {
                fig.style.transition = 'transform .25s cubic-bezier(.2, .8, .2, 1), opacity .25s ease-out';
                fig.style.transform = 'translate3d(0, 0, 0) scale(1)';
                fig.style.opacity = '';
                setTimeout(() => { fig.style.transition = ''; }, 260);
            }
        } else if (activeGesture === 'swipe-x') {
            if (Math.abs(dx) > 50 || (Math.abs(dx) > 25 && dt < 280)) {
                const dir = dx < 0 ? -1 : 1;
                fig.style.transition = 'transform .18s cubic-bezier(.2, .8, .2, 1), opacity .18s ease-out';
                fig.style.transform = `translate3d(${dir * 100}px, 0, 0)`;
                fig.style.opacity = '0';
                setTimeout(() => {
                    if (dir === -1) next(); else prev();
                    fig.style.transition = 'none';
                    fig.style.transform = `translate3d(${-dir * 60}px, 0, 0)`;
                    requestAnimationFrame(() => {
                        fig.style.transition = 'transform .24s cubic-bezier(.2, .8, .2, 1), opacity .24s ease-out';
                        fig.style.transform = 'translate3d(0, 0, 0)';
                        fig.style.opacity = '1';
                        setTimeout(() => { fig.style.transition = ''; }, 250);
                    });
                }, 180);
            } else {
                fig.style.transition = 'transform .25s cubic-bezier(.2, .8, .2, 1), opacity .25s ease-out';
                fig.style.transform = 'translate3d(0, 0, 0)';
                fig.style.opacity = '1';
                setTimeout(() => { fig.style.transition = ''; }, 260);
            }
        } else {
            fig.style.transition = '';
            fig.style.transform = '';
            fig.style.opacity = '';
        }
        activeGesture = null;
    }, { passive: true });
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
    const visibleMedia = media.slice(0, limit);

    grid.innerHTML = visibleMedia.map((m, i) => {
        const cat = getMediaCategory(m.src);
        return `
        <figure class="media-item is-${cat}" data-type="${cat}" data-reveal>
            <button type="button" data-index="${i}" aria-label="Open: ${esc(m.caption)}">
                <img src="${esc(m.thumb || m.src)}" alt="${esc(m.alt)}" loading="lazy">
            </button>
            <figcaption>${esc(m.caption)}${m.credit ? ` <span class="muted">· photo ${m.creditUrl ? `<a href="${esc(m.creditUrl)}" target="_blank" rel="noopener noreferrer">${esc(m.credit)}</a>` : esc(m.credit)}</span>` : ''}</figcaption>
        </figure>
    `;
    }).join('');

    setupLightbox();
    grid.addEventListener('click', e => {
        const btn = e.target.closest('button[data-index]');
        if (!btn) return;
        const idx = Number(btn.dataset.index);
        const galleryItems = visibleMedia.map(m => ({
            src: m.src,
            alt: m.alt,
            caption: m.caption,
            credit: m.credit,
            creditUrl: m.creditUrl
        }));
        openLightboxGallery(galleryItems, idx);
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
        <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">View this post on Instagram</a></blockquote>`;
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
        <button type="button" class="tl-video is-youtube" data-video-id="${esc(it.video)}" data-title="${esc(it.title)}" aria-label="Play video: ${esc(it.title)}">
            <img src="https://i.ytimg.com/vi/${esc(it.video)}/hqdefault.jpg" alt="${esc(it.title)}" loading="lazy">
            <span class="play" aria-hidden="true"><i class="fas fa-play"></i></span>
        </button>` : '';
    const audio = it.audioItem ? `
        <div class="audio-card tl-audio" data-id="${esc(it.audioItem.id)}" data-set="${esc(it.audioItem.setSrc)}" data-preview="${esc(it.audioItem.previewSrc)}" style="margin-top:14px; padding:16px;">
            <div class="themed-player" style="padding:8px 12px;">
                <button type="button" class="themed-play-btn" style="width:36px;height:36px;font-size:13px;" aria-label="Play ${esc(it.audioItem.title)}">
                    <i class="fas fa-play" aria-hidden="true"></i>
                </button>
                <div class="themed-track-wrap">
                    <div class="themed-scrubber" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">
                        <div class="themed-buffered" style="width:0%;"></div>
                        <div class="themed-progress" style="width:0%;"></div>
                    </div>
                    <div class="themed-time-row">
                        <span class="themed-time-curr">0:00</span>
                        <span class="themed-time-dur">${formatTime(it.audioItem.duration)}</span>
                    </div>
                </div>
            </div>
            ${(it.audioItem.markers || []).length ? `
                <div class="audio-markers" style="margin-top:8px;">
                    <span class="audio-markers-label">Cues:</span>
                    ${it.audioItem.markers.map(m => `<button type="button" class="marker-pill" data-time="${m.time}"><span>${formatTime(m.time)}</span> ${esc(m.label)}</button>`).join('')}
                </div>` : ''}
            <audio class="audio-player-element" preload="none" style="display:none;"></audio>
        </div>` : '';
    return `
        <li class="tl-entry tl-${it.kind}" data-kind="${it.kind}" data-has-video="${hasVideo}" data-has-photo="${hasPhoto}" data-reveal>
            <span class="tl-dot" aria-hidden="true"><i class="fas ${k.icon}"></i></span>
            <div class="tl-when">${d ? `${MONTHS[d.getMonth()]} ${d.getDate()}` : 'Undated'}<span>${esc(k.label)}</span></div>
            <div class="tl-body">
                <h3>${esc(it.title)}</h3>
                ${it.meta ? `<p class="muted">${esc(it.meta)}</p>` : ''}
                ${it.note ? `<p class="tl-note">${esc(it.note)}</p>` : ''}
                ${it.link && /instagram\.com\/p\//.test(it.link) ? igButton(it.link) : it.link ? `<p><a href="${esc(it.link)}"${/^https?:/.test(it.link) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(it.linkText || 'Open')}</a></p>` : ''}
                ${it.gallery ? `<p class="small"><a href="${esc(it.gallery)}" target="_blank" rel="noopener noreferrer">${esc(it.galleryText || 'Photo gallery · ReBe Loves')}</a></p>` : ''}
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
        el.querySelectorAll('.audio-card').forEach(initAudioCard);
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

    // Pictures open in the shared lightbox, videos embed inline
    setupLightbox();
    el.addEventListener('click', e => {
        const yt = e.target.closest('button.tl-video[data-video-id]');
        if (yt) {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt.dataset.videoId)}?autoplay=1&playsinline=1`;
            iframe.title = yt.dataset.title || 'YouTube video';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.allowFullscreen = true;
            iframe.className = 'tl-video';
            iframe.style.aspectRatio = '16 / 9';
            iframe.style.border = '0';
            yt.replaceWith(iframe);
            return;
        }
        const b = e.target.closest('.tl-pic');
        if (!b) return;
        const allPics = Array.from(el.querySelectorAll('.tl-pic:not([hidden])'));
        const idx = allPics.indexOf(b);
        const galleryItems = allPics.map(pic => {
            const img = pic.querySelector('img');
            return {
                src: pic.dataset.src,
                alt: img ? img.alt : '',
                caption: pic.dataset.caption || ''
            };
        });
        openLightboxGallery(galleryItems, idx >= 0 ? idx : 0);
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
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
    if (location.hash) {
        try {
            const id = decodeURIComponent(location.hash.slice(1));
            if (id) {
                const target = document.getElementById(id);
                if (target) {
                    setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 60);
                }
            }
        } catch (_) {}
    }
}

// ─── Sticky header state on scroll ──────────────────────────────────────────
window.addEventListener('scroll', () => {
    const header = document.querySelector('.site-header');
    if (header) {
        header.classList.toggle('is-scrolled', window.scrollY > 20);
    }
}, { passive: true });

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
