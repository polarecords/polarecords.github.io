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

function videoAudioBarHtml(tracks) {
    if (!tracks || tracks.length < 2) return '';
    return `
        <div class="video-audio-bar" role="group" aria-label="Video audio perspective">
            <span class="video-audio-label"><i class="fas fa-sliders" aria-hidden="true"></i> AUDIO</span>
            ${tracks.map((tr, i) => `
                <button type="button" class="video-audio-pill ${i === 0 ? 'active' : ''}" data-track-id="${esc(tr.id)}" data-audio-src="${esc(tr.src || '')}" data-audio-offset="${tr.offset || 0}" aria-pressed="${i === 0}">${esc(tr.label)}</button>
            `).join('')}
        </div>`;
}

function initSyncedVideoBox(box) {
    if (!box || box.dataset.initSyncVid) return;
    const bar = box.querySelector('.video-audio-bar');
    if (!bar) return;
    box.dataset.initSyncVid = 'true';

    let extAudio = null;
    let currentSrc = '';
    let currentOffset = 0;

    function ensureExtAudio() {
        if (!extAudio) {
            extAudio = document.createElement('audio');
            extAudio.preload = 'auto';
            extAudio.volume = 0.85;
            extAudio.setAttribute('controlsList', 'nodownload');
            extAudio.style.display = 'none';
            box.appendChild(extAudio);
        }
        return extAudio;
    }

    function bindVideoEvents(vid) {
        if (!vid || vid.dataset.boundSyncAudio) return;
        vid.dataset.boundSyncAudio = 'true';
        const syncToVid = (forceSeek = false) => {
            if (!currentSrc || !extAudio) return;
            const target = (vid.currentTime || 0) + currentOffset;
            if (forceSeek || Math.abs((extAudio.currentTime || 0) - target) > 0.12) {
                try { extAudio.currentTime = target; } catch (_) {}
            }
        };
        vid.addEventListener('play', () => {
            if (activeAudio && activeAudio !== extAudio) activeAudio.pause();
            if (currentSrc && extAudio) {
                vid.muted = true;
                syncToVid(true);
                extAudio.play().catch(() => {});
            }
        });
        vid.addEventListener('pause', () => { if (extAudio) extAudio.pause(); });
        vid.addEventListener('ended', () => { if (extAudio) extAudio.pause(); });
        vid.addEventListener('waiting', () => { if (extAudio) extAudio.pause(); });
        vid.addEventListener('playing', () => {
            if (currentSrc && extAudio) {
                vid.muted = true;
                syncToVid(true);
                extAudio.play().catch(() => {});
            }
        });
        vid.addEventListener('seeking', () => syncToVid(true));
        vid.addEventListener('ratechange', () => { if (extAudio) extAudio.playbackRate = vid.playbackRate; });
        vid.addEventListener('timeupdate', () => syncToVid(false));
    }

    const existingVid = box.querySelector('video');
    if (existingVid) bindVideoEvents(existingVid);

    bar.addEventListener('click', e => {
        const pill = e.target.closest('.video-audio-pill');
        if (!pill) return;

        // If the video is still a poster button, upgrade it to a live <video> inside this click gesture
        let vid = box.querySelector('video');
        if (!vid) {
            const mp4Btn = box.querySelector('button.video-thumb[data-src]');
            if (mp4Btn) {
                vid = document.createElement('video');
                vid.src = mp4Btn.dataset.src;
                if (mp4Btn.dataset.poster) vid.poster = mp4Btn.dataset.poster;
                vid.controls = true;
                vid.setAttribute('controlsList', 'nodownload');
                vid.disablePictureInPicture = true;
                vid.volume = 0.8;
                vid.playsInline = true;
                vid.className = 'video-thumb' + (mp4Btn.classList.contains('is-vertical') ? ' is-vertical' : '');
                mp4Btn.replaceWith(vid);
            }
        }
        if (!vid) return;
        bindVideoEvents(vid);

        bar.querySelectorAll('.video-audio-pill').forEach(b => {
            const on = b === pill;
            b.classList.toggle('active', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });

        currentSrc = pill.dataset.audioSrc || '';
        currentOffset = Number(pill.dataset.audioOffset || 0);

        if (!currentSrc) {
            if (extAudio) extAudio.pause();
            vid.muted = false;
            if (vid.paused) vid.play().catch(() => {});
            return;
        }

        const aud = ensureExtAudio();
        if (activeAudio && activeAudio !== aud) activeAudio.pause();
        vid.muted = true;
        const targetTime = (vid.currentTime || 0) + currentOffset;
        const startSynced = () => {
            try { aud.currentTime = targetTime; } catch (_) {}
            aud.playbackRate = vid.playbackRate || 1;
            if (vid.paused) vid.play().catch(() => {});
            aud.play().catch(() => {});
        };
        if (!aud.src || !aud.src.endsWith(currentSrc)) {
            aud.src = currentSrc;
            aud.addEventListener('loadedmetadata', startSynced, { once: true });
            aud.load();
            if (vid.paused) vid.play().catch(() => {});
        } else {
            startSynced();
        }
    });
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
                ${videoAudioBarHtml(v.audioTracks)}
                <figcaption>
                    <span>${esc(v.title)}</span>
                    <span class="muted small">${d ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : ''}${v.id ? ` · <a href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener noreferrer">YouTube</a>` : ''}</span>
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

    el.querySelectorAll('figure.video').forEach(initSyncedVideoBox);

    el.addEventListener('click', e => {
        const mp4Btn = e.target.closest('button.video-thumb[data-src]');
        if (mp4Btn) {
            const vid = document.createElement('video');
            vid.src = mp4Btn.dataset.src;
            if (mp4Btn.dataset.poster) vid.poster = mp4Btn.dataset.poster;
            vid.controls = true;
            vid.setAttribute('controlsList', 'nodownload');
            vid.disablePictureInPicture = true;
            vid.volume = 0.8;
            vid.autoplay = true;
            vid.playsInline = true;
            vid.className = 'video-thumb' + (mp4Btn.classList.contains('is-vertical') ? ' is-vertical' : '');
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
            iframe.style.width = '100%';
            iframe.style.height = 'auto';
            iframe.style.aspectRatio = '16 / 9';
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
let floatingPlayerEl = null;

function ensureFloatingPlayer() {
    if (floatingPlayerEl) return floatingPlayerEl;
    floatingPlayerEl = document.createElement('aside');
    floatingPlayerEl.id = 'floating-mini-player';
    floatingPlayerEl.className = 'floating-mini-player';
    floatingPlayerEl.setAttribute('aria-label', 'Active Audio Controls');
    floatingPlayerEl.innerHTML = `
        <div class="fmp-inner">
            <span class="fmp-disc" aria-hidden="true"><i class="fas fa-compact-disc"></i></span>
            <div class="fmp-info" title="Scroll to player deck">
                <span class="fmp-title">PolaRecords Live Audio</span>
                <span class="fmp-time">0:00 / 0:00</span>
            </div>
            <div class="fmp-actions">
                <button type="button" class="fmp-play-btn" aria-label="Play or Pause">
                    <i class="fas fa-play" aria-hidden="true"></i>
                </button>
                <button type="button" class="fmp-jump-btn" aria-label="Scroll to player deck" title="Scroll to player">
                    <i class="fas fa-chevron-up" aria-hidden="true"></i>
                </button>
            </div>
        </div>
        <div class="fmp-progress-bar"><div class="fmp-progress-fill"></div></div>
    `;
    document.body.appendChild(floatingPlayerEl);

    const playBtn = floatingPlayerEl.querySelector('.fmp-play-btn');
    const jumpBtn = floatingPlayerEl.querySelector('.fmp-jump-btn');
    const info = floatingPlayerEl.querySelector('.fmp-info');

    playBtn.addEventListener('click', () => {
        if (!activeAudio) return;
        if (activeAudio.paused) activeAudio.play(); else activeAudio.pause();
    });

    const scrollToActive = () => {
        if (!activeAudio) return;
        const card = activeAudio.closest('.audio-card');
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };
    jumpBtn.addEventListener('click', scrollToActive);
    info.addEventListener('click', scrollToActive);

    window.addEventListener('scroll', checkFloatingPlayerVisibility, { passive: true });
    return floatingPlayerEl;
}

function checkFloatingPlayerVisibility() {
    if (!floatingPlayerEl || !activeAudio) return;
    const isPlaying = !activeAudio.paused;
    const card = activeAudio.closest('.audio-card');
    if (!card) {
        floatingPlayerEl.classList.remove('is-visible');
        return;
    }
    const rect = card.getBoundingClientRect();
    const inViewport = (rect.bottom > 80 && rect.top < window.innerHeight - 80);

    if (activeAudio.currentTime > 0 && !inViewport) {
        floatingPlayerEl.classList.add('is-visible');
        floatingPlayerEl.classList.toggle('is-playing', isPlaying);
        const playIcon = floatingPlayerEl.querySelector('.fmp-play-btn i');
        if (playIcon) playIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    } else {
        floatingPlayerEl.classList.remove('is-visible');
    }
}

document.addEventListener('contextmenu', e => {
    if (e.target && e.target.closest('audio, video, .audio-card')) {
        e.preventDefault();
    }
});

function syncFloatingPlayer(audio, card) {
    const fmp = ensureFloatingPlayer();
    const titleEl = fmp.querySelector('.fmp-title');
    const timeEl = fmp.querySelector('.fmp-time');
    const fillEl = fmp.querySelector('.fmp-progress-fill');
    const playIcon = fmp.querySelector('.fmp-play-btn i');

    const cardTitle = card.querySelector('.audio-title-group h3');
    if (cardTitle && titleEl) titleEl.textContent = cardTitle.textContent;

    if ('mediaSession' in navigator && cardTitle) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: cardTitle.textContent.trim(),
            artist: 'John Polar',
            album: 'PolaRecords Live Audio Vault',
            artwork: [
                { src: 'assets/hat.png', sizes: '96x96', type: 'image/png' },
                { src: 'assets/hat.png', sizes: '128x128', type: 'image/png' },
                { src: 'assets/photo_rebe_20260628.jpg', sizes: '512x512', type: 'image/jpeg' }
            ]
        });
        navigator.mediaSession.playbackState = audio.paused ? 'paused' : 'playing';
        try {
            navigator.mediaSession.setActionHandler('play', () => audio.play());
            navigator.mediaSession.setActionHandler('pause', () => audio.pause());
            navigator.mediaSession.setActionHandler('seekbackward', () => { audio.currentTime = Math.max(0, audio.currentTime - 10); });
            navigator.mediaSession.setActionHandler('seekforward', () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10); });
        } catch (_) {}
    }

    const cur = audio.currentTime || 0;
    const dur = audio.duration || 1;
    if (timeEl) timeEl.textContent = `${formatTime(cur)} / ${formatTime(audio.duration)}`;
    if (fillEl) fillEl.style.width = `${Math.min(100, (cur / dur) * 100)}%`;
    if (playIcon) playIcon.className = audio.paused ? 'fas fa-play' : 'fas fa-pause';
    fmp.classList.toggle('is-playing', !audio.paused);

    checkFloatingPlayerVisibility();
}

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
    const perspBtns = card.querySelectorAll('.persp-pill[data-persp]');
    const perspDesc = card.querySelector('.audio-persp-desc');
    const syncVidToggle = card.querySelector('.persp-video-toggle');
    const syncVidWrap = card.querySelector('.audio-sync-video-wrap');
    const syncVid = card.querySelector('.audio-sync-video');
    const syncVidStandby = card.querySelector('.sync-video-standby');
    const syncVidJumpBtn = card.querySelector('.sync-video-jump-btn');
    const syncVidBadge = card.querySelector('.sync-video-audio-badge');
    const syncVidOffset = syncVidWrap ? Number(syncVidWrap.dataset.videoOffset || 0) : 0;
    const syncVidDur = syncVidWrap ? Number(syncVidWrap.dataset.videoDur || 0) : 0;
    const markers = card.querySelectorAll('.marker-pill');
    const linerNotes = card.querySelector('.audio-liner-notes');
    const linerText = linerNotes ? linerNotes.querySelector('.liner-notes-text') : null;

    let currentMode = 'set';
    let activePersp = perspBtns.length ? {
        id: perspBtns[0].dataset.persp,
        src: perspBtns[0].dataset.src,
        offset: Number(perspBtns[0].dataset.offset || 0),
        dur: Number(perspBtns[0].dataset.dur || 0)
    } : {
        id: 'default',
        src: card.dataset.set,
        offset: 0,
        dur: 0
    };

    audio.volume = 0.8;
    if (!audio.src) audio.src = activePersp.src;

    function seekAndMaybePlay(targetTime, shouldPlay) {
        const apply = () => {
            if (isFinite(audio.duration) && audio.duration > 0) {
                audio.currentTime = Math.max(0, Math.min(targetTime, audio.duration - 0.1));
            } else {
                audio.currentTime = Math.max(0, targetTime);
            }
            if (shouldPlay) audio.play().catch(() => {});
        };
        if (audio.readyState >= 1) {
            apply();
        } else {
            // Trigger play() synchronously inside user gesture on mobile browsers so autoplay isn't blocked
            audio.addEventListener('loadedmetadata', apply, { once: true });
            audio.load();
            if (shouldPlay) audio.play().catch(() => {});
        }
    }

    function setMode(mode) {
        currentMode = mode;
        modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        const wasPlaying = !audio.paused;
        const targetSrc = mode === 'preview' ? card.dataset.preview : activePersp.src;
        if (!audio.src.endsWith(targetSrc)) {
            audio.src = targetSrc;
            if (wasPlaying) audio.play().catch(() => {});
        }
        if (progress) progress.style.width = '0%';
        if (timeCurr) timeCurr.textContent = '0:00';
        if (timeDur) {
            if (mode === 'preview') timeDur.textContent = '0:45';
            else if (activePersp.dur) timeDur.textContent = formatTime(activePersp.dur);
        }
    }

    function switchPerspective(btn, explicitGlobalTime = null, forcePlay = null) {
        const newSrc = btn.dataset.src;
        const newOffset = Number(btn.dataset.offset || 0);
        const newDur = Number(btn.dataset.dur || 0);
        const wasPlaying = forcePlay !== null ? forcePlay : !audio.paused;

        const prevGlobal = explicitGlobalTime !== null
            ? explicitGlobalTime
            : (currentMode === 'preview' ? newOffset : (audio.currentTime || 0) + (activePersp.offset || 0));

        activePersp = { id: btn.dataset.persp, src: newSrc, offset: newOffset, dur: newDur };
        currentMode = 'set';
        modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === 'set'));
        perspBtns.forEach(b => {
            const on = b === btn;
            b.classList.toggle('active', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        if (perspDesc && btn.dataset.desc) perspDesc.textContent = btn.dataset.desc;
        if (syncVidBadge) syncVidBadge.textContent = `AUDIO: ${btn.textContent.trim().toUpperCase()}`;
        if (timeDur && newDur) timeDur.textContent = formatTime(newDur);

        let targetLocal = prevGlobal - newOffset;
        if (targetLocal < 0 || (newDur && targetLocal >= newDur - 0.5)) {
            targetLocal = 0;
        }

        if (activeAudio && activeAudio !== audio && wasPlaying) activeAudio.pause();
        if (!audio.src.endsWith(newSrc)) {
            audio.src = newSrc;
            seekAndMaybePlay(targetLocal, wasPlaying);
        } else {
            seekAndMaybePlay(targetLocal, wasPlaying);
        }
    }

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    perspBtns.forEach(btn => {
        btn.addEventListener('click', () => switchPerspective(btn));
    });

    function syncVideoToAudio(forceSeek = false) {
        if (!syncVid || !syncVidWrap || syncVidWrap.hidden) return;
        const gTime = currentMode === 'preview'
            ? (syncVidOffset + (audio.currentTime || 0))
            : ((audio.currentTime || 0) + (activePersp.offset || 0));
        const vidTime = gTime - syncVidOffset;
        const inRange = vidTime >= 0 && (!syncVidDur || vidTime <= syncVidDur);

        if (syncVidStandby) syncVidStandby.hidden = inRange;
        if (!inRange) {
            if (!syncVid.paused) syncVid.pause();
            return;
        }
        if (forceSeek || Math.abs((syncVid.currentTime || 0) - vidTime) > 0.14) {
            try { syncVid.currentTime = Math.max(0, vidTime); } catch (_) {}
        }
        if (!audio.paused && syncVid.paused) {
            syncVid.play().catch(() => {});
        } else if (audio.paused && !syncVid.paused) {
            syncVid.pause();
        }
    }

    if (syncVidToggle && syncVidWrap && syncVid) {
        syncVidToggle.addEventListener('click', () => {
            const show = syncVidWrap.hidden;
            syncVidWrap.hidden = !show;
            syncVidToggle.classList.toggle('active', show);
            syncVidToggle.setAttribute('aria-pressed', show ? 'true' : 'false');
            if (show) {
                if (!syncVid.src && syncVid.dataset.src) {
                    syncVid.src = syncVid.dataset.src;
                    syncVid.addEventListener('loadedmetadata', () => syncVideoToAudio(true), { once: true });
                    syncVid.load();
                } else {
                    syncVideoToAudio(true);
                }
            } else if (!syncVid.paused) {
                syncVid.pause();
            }
        });
    }

    if (syncVidJumpBtn && syncVidWrap) {
        syncVidJumpBtn.addEventListener('click', () => {
            if (activeAudio && activeAudio !== audio) activeAudio.pause();
            if (currentMode !== 'set') setMode('set');
            const localTarget = Math.max(0, syncVidOffset - (activePersp.offset || 0));
            if (syncVidStandby) syncVidStandby.hidden = true;
            if (syncVid && !syncVid.src && syncVid.dataset.src) {
                syncVid.src = syncVid.dataset.src;
                syncVid.load();
            }
            seekAndMaybePlay(localTarget, true);
            if (syncVid) {
                try { syncVid.currentTime = 0; } catch (_) {}
                syncVid.play().catch(() => {});
            }
        });
    }

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
        syncFloatingPlayer(audio, card);
        syncVideoToAudio(true);
    });

    audio.addEventListener('pause', () => {
        card.classList.remove('is-playing');
        if (playIcon) playIcon.className = 'fas fa-play';
        syncFloatingPlayer(audio, card);
        if (syncVid && !syncVid.paused) syncVid.pause();
    });

    audio.addEventListener('ended', () => {
        card.classList.remove('is-playing');
        if (playIcon) playIcon.className = 'fas fa-play';
        if (progress) progress.style.width = '0%';
        if (timeCurr) timeCurr.textContent = '0:00';
        markers.forEach(m => m.classList.remove('active'));
        syncFloatingPlayer(audio, card);
        if (syncVid && !syncVid.paused) syncVid.pause();
    });

    audio.addEventListener('seeked', () => syncVideoToAudio(true));

    audio.addEventListener('timeupdate', () => {
        const cur = audio.currentTime;
        const dur = audio.duration || 1;
        const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
        if (progress) progress.style.width = `${pct}%`;
        if (timeCurr) timeCurr.textContent = formatTime(cur);
        if (timeDur && audio.duration) timeDur.textContent = formatTime(audio.duration);

        if (activeAudio === audio && floatingPlayerEl && floatingPlayerEl.classList.contains('is-visible')) {
            const timeEl = floatingPlayerEl.querySelector('.fmp-time');
            const fillEl = floatingPlayerEl.querySelector('.fmp-progress-fill');
            if (timeEl) timeEl.textContent = `${formatTime(cur)} / ${formatTime(audio.duration || dur)}`;
            if (fillEl) fillEl.style.width = `${pct}%`;
        }

        const curGlobal = currentMode === 'preview' ? -1 : (cur + (activePersp.offset || 0));
        syncVideoToAudio(false);
        const sortedMarkers = Array.from(markers).sort((a, b) => Number(a.dataset.time) - Number(b.dataset.time));
        let activeIdx = -1;
        for (let i = 0; i < sortedMarkers.length; i++) {
            if (curGlobal >= Number(sortedMarkers[i].dataset.time)) {
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
        if (linerNotes && linerText) {
            const currentMarker = activeIdx >= 0 ? sortedMarkers[activeIdx] : null;
            if (currentMarker && currentMarker.dataset.note) {
                linerText.textContent = currentMarker.dataset.note;
                linerNotes.style.display = 'flex';
            } else {
                linerNotes.style.display = 'none';
            }
        }
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
        const tooltip = scrubber.querySelector('.themed-scrubber-tooltip');
        const updateScrub = (clientX, commit) => {
            const rect = scrubber.getBoundingClientRect();
            if (!rect.width) return;
            const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const dur = audio.duration || 1;
            if (progress) progress.style.width = `${pos * 100}%`;
            if (timeCurr) timeCurr.textContent = formatTime(pos * dur);
            if (tooltip) {
                tooltip.textContent = formatTime(pos * dur);
                tooltip.style.left = `${pos * 100}%`;
            }
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
            if (isDragging) {
                updateScrub(e.clientX, false);
            } else if (tooltip && audio.duration) {
                const rect = scrubber.getBoundingClientRect();
                if (rect.width) {
                    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    tooltip.textContent = formatTime(pos * audio.duration);
                    tooltip.style.left = `${pos * 100}%`;
                }
            }
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
            const globalTime = Number(m.dataset.time);
            if (activeAudio && activeAudio !== audio) activeAudio.pause();
            if (perspBtns.length && activePersp.offset > globalTime) {
                switchPerspective(perspBtns[0], globalTime, true);
            } else {
                if (currentMode !== 'set') setMode('set');
                const localTime = Math.max(0, globalTime - (activePersp.offset || 0));
                seekAndMaybePlay(localTime, true);
            }
            markers.forEach(pill => pill.classList.toggle('active', pill === m));
            if (linerNotes && linerText) {
                if (m.dataset.note) {
                    linerText.textContent = m.dataset.note;
                    linerNotes.style.display = 'flex';
                } else {
                    linerNotes.style.display = 'none';
                }
            }
        });
    });
}

function getTrackCategory(t) {
    if (!t) return 'vault';
    if (t.id && t.id.startsWith('bandstand_2026')) return 'bandstand';
    if (/duo|voodoo|negril/i.test(t.id || '') || /duo|jam/i.test(t.title || '')) return 'duo-road';
    return 'vault';
}

function getTrackTag(t) {
    if (!t) return 'LIVE CUT';
    if (/blues/i.test(t.title || '')) return 'BLUES JAM';
    if (/duo/i.test(t.title || '')) return 'DUO SET';
    if (/first gig/i.test(t.title || '')) return 'FIRST GIG';
    if (/genesis|sketch/i.test(t.title || '')) return 'VAULT CUT';
    return 'LIVE CUT';
}

function perspectivesBarHtml(t) {
    if (!t || (!t.perspectives || t.perspectives.length < 2) && !t.syncVideo) return '';
    const sv = t.syncVideo;
    return `
        <div class="audio-perspectives" role="group" aria-label="Audio perspective">
            <div class="audio-persp-row">
                <span class="audio-persp-label"><i class="fas fa-sliders" aria-hidden="true"></i> PERSPECTIVE</span>
                <div class="audio-persp-pills">
                    ${(t.perspectives || []).map((p, idx) => `
                        <button type="button" class="persp-pill ${idx === 0 ? 'active' : ''}" data-persp="${esc(p.id)}" data-src="${esc(p.src)}" data-offset="${p.offset || 0}" data-dur="${p.duration || t.duration}" data-desc="${esc(p.desc || '')}" aria-pressed="${idx === 0}">
                            <i class="fas ${esc(p.icon || 'fa-headphones')}" aria-hidden="true"></i> ${esc(p.label)}
                        </button>
                    `).join('')}
                    ${sv ? `
                        <button type="button" class="persp-pill persp-video-toggle" aria-pressed="false">
                            <i class="fas fa-video" aria-hidden="true"></i> Watch Stage Sync
                        </button>` : ''}
                </div>
            </div>
            <span class="audio-persp-desc">${esc((t.perspectives && t.perspectives[0]?.desc) || '')}</span>
            ${sv ? `
                <div class="audio-sync-video-wrap" hidden data-video-offset="${sv.offset || 0}" data-video-dur="${sv.duration || 0}">
                    <video class="audio-sync-video" data-src="${esc(sv.src)}" poster="${esc(sv.poster || '')}" muted playsinline preload="none" controlsList="nodownload" disablePictureInPicture></video>
                    <span class="sync-video-audio-badge">AUDIO: ${esc((t.perspectives && t.perspectives[0]?.label || 'LIVE').toUpperCase())}</span>
                    <div class="sync-video-standby">
                        <span class="sync-standby-text"><i class="fas fa-microphone-lines" aria-hidden="true"></i> Room Mic · Stage stream joins at ${formatTime(Math.round(sv.offset || 0))}</span>
                        <button type="button" class="sync-video-jump-btn"><i class="fas fa-forward" aria-hidden="true"></i> Jump to ${formatTime(Math.round(sv.offset || 0))} Video</button>
                    </div>
                </div>` : ''}
        </div>`;
}

function audioCardHtml(t, isDeck = false) {
    const markersHtml = (t.markers || []).map(m => `
        <button type="button" class="marker-pill" data-time="${m.time}" ${m.note ? `data-note="${esc(m.note)}"` : ''} aria-label="Jump to ${esc(m.label)} at ${formatTime(m.time)}">
            <span class="marker-time">${formatTime(m.time)}</span>
            <span class="marker-label">${esc(m.label)}</span>
            <span class="marker-eq" aria-hidden="true"><i></i><i></i><i></i></span>
        </button>
    `).join('');

    const tag = getTrackTag(t);

    return `
        <article class="audio-card ${isDeck ? 'stage-deck' : ''}" data-id="${esc(t.id)}" data-set="${esc(t.setSrc)}" data-preview="${esc(t.previewSrc)}" data-reveal>
            <div class="audio-card-head">
                <div class="audio-title-group">
                    <div class="audio-title-row">
                        <span class="audio-live-badge"><span class="eq"><i></i><i></i><i></i><i></i></span> ${esc(tag)}</span>
                        ${isDeck ? '<span class="stage-deck-badge"><i class="fas fa-headphones" aria-hidden="true"></i> STAGE DECK</span>' : ''}
                        <h3>${esc(t.title)}</h3>
                    </div>
                    <span class="audio-meta">${esc(t.venue)} · ${t.date}</span>
                </div>
                <div class="audio-mode-toggle" role="group" aria-label="Playback mode">
                    <button type="button" class="active" data-mode="set">Full Set (${formatTime(t.duration)})</button>
                    <button type="button" data-mode="preview">Preview (${t.previewDuration}s)</button>
                </div>
            </div>

            <div class="themed-player">
                <button type="button" class="themed-play-btn" aria-label="Play / Pause ${esc(t.title)}">
                    <i class="fas fa-play" aria-hidden="true"></i>
                </button>
                <div class="themed-track-wrap">
                    <div class="themed-scrubber" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0" aria-label="Seek track">
                        <div class="themed-buffered" style="width: 0%;"></div>
                        <div class="themed-progress" style="width: 0%;"></div>
                        <div class="themed-scrubber-tooltip" aria-hidden="true">0:00</div>
                    </div>
                    <div class="themed-time-row">
                        <span class="themed-time-curr">0:00</span>
                        <span class="themed-time-dur">${formatTime(t.duration)}</span>
                    </div>
                </div>
                <span class="vinyl-disc" aria-hidden="true"><i class="fas fa-compact-disc"></i></span>
                <button type="button" class="themed-mute-btn" aria-label="Mute / Unmute">
                    <i class="fas fa-volume-high" aria-hidden="true"></i>
                </button>
            </div>

            ${perspectivesBarHtml(t)}

            ${markersHtml ? `
                <div class="audio-markers" role="group" aria-label="Track cues and markers">
                    <span class="audio-markers-label"><i class="fas fa-bookmark" aria-hidden="true"></i> CUES</span>
                    ${markersHtml}
                </div>
                <div class="audio-liner-notes" aria-live="polite" style="display:none;">
                    <i class="fas fa-feather-pointed" aria-hidden="true"></i>
                    <span class="liner-notes-text"></span>
                </div>` : ''}

            <audio class="audio-player-element" preload="none" controlsList="nodownload" style="display:none;"></audio>
        </article>`;
}

function setlistRowHtml(t, idx, isActive = false) {
    const tag = getTrackTag(t);
    const cat = getTrackCategory(t);
    return `
        <li class="setlist-row ${isActive ? 'is-active' : ''}" data-id="${esc(t.id)}" data-cat="${cat}">
            <button type="button" class="setlist-play-btn" aria-label="Play ${esc(t.title)}">
                <span class="setlist-index">${idx + 1}</span>
                <span class="eq"><i></i><i></i><i></i><i></i></span>
            </button>
            <div class="setlist-meta-col">
                <div class="setlist-title-line">
                    <span class="setlist-title">${esc(t.title)}</span>
                    <span class="setlist-tag">${esc(tag)}</span>
                </div>
                <span class="setlist-sub">${esc(t.venue)} · ${t.date}</span>
            </div>
            <div class="setlist-right">
                <span class="setlist-dur">${formatTime(t.duration)}</span>
            </div>
        </li>
    `;
}

function renderAudio(tracks) {
    if (!tracks || !tracks.length) return;

    // 1. On john.html (#audio-tracks):
    const el = document.getElementById('audio-tracks');
    if (el) {
        let currentTrackIndex = 0;

        const counts = {
            all: tracks.length,
            bandstand: tracks.filter(t => getTrackCategory(t) === 'bandstand').length,
            'duo-road': tracks.filter(t => getTrackCategory(t) === 'duo-road').length,
            vault: tracks.filter(t => getTrackCategory(t) === 'vault').length,
        };

        el.innerHTML = `
            <div class="stage-deck-wrap">
                ${audioCardHtml(tracks[0], true)}
            </div>
            <div class="stage-setlist" data-reveal>
                <div class="setlist-header">
                    <div class="setlist-heading-group">
                        <h3>Stage Setlist &amp; Catalog</h3>
                        <span class="setlist-count-badge">${tracks.length} LIVE SETS</span>
                    </div>
                    <div class="setlist-filters" role="group" aria-label="Filter sets by category">
                        <button type="button" class="setlist-filter-btn active" data-filter="all">All (${counts.all})</button>
                        <button type="button" class="setlist-filter-btn" data-filter="bandstand">2026 Bandstand (${counts.bandstand})</button>
                        <button type="button" class="setlist-filter-btn" data-filter="duo-road">Duos &amp; Road (${counts['duo-road']})</button>
                        <button type="button" class="setlist-filter-btn" data-filter="vault">The Vault (${counts.vault})</button>
                    </div>
                </div>
                <ul class="setlist-tracks">
                    ${tracks.map((t, i) => setlistRowHtml(t, i, i === 0)).join('')}
                </ul>
            </div>
        `;

        const deckWrap = el.querySelector('.stage-deck-wrap');
        const setlistUl = el.querySelector('.setlist-tracks');
        const filterBtns = el.querySelectorAll('.setlist-filter-btn');

        const initDeck = () => {
            const card = deckWrap.querySelector('.audio-card');
            if (card) initAudioCard(card);
        };
        initDeck();

        const loadTrack = (idx, autoPlay = true) => {
            if (idx < 0 || idx >= tracks.length) return;
            currentTrackIndex = idx;
            const t = tracks[idx];

            if (activeAudio) {
                activeAudio.pause();
            }

            deckWrap.innerHTML = audioCardHtml(t, true);
            initDeck();

            setlistUl.querySelectorAll('.setlist-row').forEach((row, i) => {
                row.classList.toggle('is-active', i === idx);
            });

            if (autoPlay) {
                const card = deckWrap.querySelector('.audio-card');
                const audio = card ? card.querySelector('audio') : null;
                if (audio) {
                    audio.play().catch(() => {});
                }
            }

            if (window.innerWidth <= 768) {
                deckWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        };

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const cat = btn.dataset.filter;
                setlistUl.querySelectorAll('.setlist-row').forEach(row => {
                    const rowCat = row.dataset.cat;
                    const match = cat === 'all' || rowCat === cat;
                    row.classList.toggle('is-filtered-out', !match);
                });
            });
        });

        setlistUl.addEventListener('click', e => {
            const row = e.target.closest('.setlist-row');
            if (!row) return;
            const targetId = row.dataset.id;
            const idx = tracks.findIndex(t => t.id === targetId);
            if (idx === -1) return;

            if (idx === currentTrackIndex) {
                const card = deckWrap.querySelector('.audio-card');
                const audio = card ? card.querySelector('audio') : null;
                if (audio) {
                    if (audio.paused) audio.play(); else audio.pause();
                }
            } else {
                loadTrack(idx, true);
            }
        });
    }

    // 2. On index.html (#home-featured-track):
    const homeAudio = document.getElementById('home-featured-track');
    if (homeAudio) {
        let firstShort = tracks[0].title.split('(')[0].trim();
        if (firstShort.length > 22) firstShort = firstShort.slice(0, 20).trim() + '…';
        homeAudio.innerHTML = `
            ${audioCardHtml(tracks[0], true)}
            <div class="home-quick-setlist" data-reveal>
                <div class="home-quick-info">
                    <span class="audio-live-badge"><span class="eq"><i></i><i></i><i></i><i></i></span> VAULT</span>
                    <span>${tracks.length} stage sets recorded · Quick preview:</span>
                </div>
                <div class="home-quick-pills">
                    <button type="button" class="home-quick-pill active" data-id="${tracks[0].id}">${esc(firstShort)}</button>
                    ${tracks.slice(1, 4).map(t => {
                        let short = t.title.split('(')[0].trim();
                        if (short.length > 22) short = short.slice(0, 20).trim() + '…';
                        return `<button type="button" class="home-quick-pill" data-id="${t.id}">${esc(short)}</button>`;
                    }).join('')}
                    <a href="john.html#live-archives" style="display:inline-flex;align-items:center;padding:6px 12px;font:500 12px/1 var(--mono);color:var(--amber);text-decoration:none;white-space:nowrap;">All ${tracks.length} &rarr;</a>
                </div>
            </div>
        `;
        const card = homeAudio.querySelector('.audio-card');
        if (card) initAudioCard(card);

        const pills = homeAudio.querySelectorAll('.home-quick-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                const id = pill.dataset.id;
                const t = tracks.find(x => x.id === id);
                if (!t) return;
                pills.forEach(p => p.classList.toggle('active', p === pill));

                if (activeAudio) activeAudio.pause();
                const cardWrap = homeAudio.querySelector('.audio-card');
                const newCardHtml = audioCardHtml(t, true);
                cardWrap.outerHTML = newCardHtml;
                const newCard = homeAudio.querySelector('.audio-card');
                if (newCard) {
                    initAudioCard(newCard);
                    const aud = newCard.querySelector('audio');
                    if (aud) aud.play().catch(() => {});
                }
            });
        });
    }
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
    if (typeof showGestureHint === 'function') showGestureHint();
}

function openLightbox(src, alt = '', caption = '') {
    openLightboxGallery([{ src, alt, caption }], 0);
}

let showGestureHint = null;

function setupLightbox() {
    const box = document.getElementById('lightbox');
    if (!box || box.dataset.ready) return;
    box.dataset.ready = 'true';

    let hintTimer = null;
    showGestureHint = () => {
        if (!('ontouchstart' in window || navigator.maxTouchPoints > 0)) return;
        let hint = box.querySelector('.lightbox-gesture-hint');
        if (!hint) {
            hint = document.createElement('div');
            hint.className = 'lightbox-gesture-hint';
            hint.innerHTML = '<i class="fas fa-arrows-up-down-left-right" aria-hidden="true"></i> Swipe to browse · Pull down to close';
            box.appendChild(hint);
        }
        hint.classList.add('visible');
        clearTimeout(hintTimer);
        hintTimer = setTimeout(() => {
            hint.classList.remove('visible');
        }, 2500);
    };

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
    if (/woods|outdoor|portrait/i.test(src)) return 'portrait';
    if (/flyer|marquee|20260623|20260607/i.test(src)) return 'flyer';
    return 'stage';
}

// ─── Media grid + lightbox ───────────────────────────────────────────────────
function mediaFigureHtml(m, i) {
    const cat = getMediaCategory(m.src);
    const isLandscape = /negril|landscape/i.test(m.src);
    return `
    <figure class="media-item is-${cat}${isLandscape ? ' is-landscape' : ''}" data-type="${cat}" data-reveal>
        <button type="button" data-index="${i}" aria-label="Open: ${esc(m.caption)}">
            <img src="${esc(m.thumb || m.src)}" alt="${esc(m.alt)}" loading="lazy">
        </button>
        <figcaption>${esc(m.caption)}${m.credit ? ` <span class="muted">· photo ${m.creditUrl ? `<a href="${esc(m.creditUrl)}" target="_blank" rel="noopener noreferrer">${esc(m.credit)}</a>` : esc(m.credit)}</span>` : ''}</figcaption>
    </figure>`;
}

function renderMedia(media) {
    if (!media) return;
    setupLightbox();

    const homeGrid = document.getElementById('home-media-grid');
    if (homeGrid) {
        // "Stage Dispatches" on homepage strictly features live stage performance photography
        const stageMedia = media.filter(m => getMediaCategory(m.src) === 'stage');
        const homeMedia = stageMedia.slice(0, 4);
        homeGrid.innerHTML = homeMedia.map(mediaFigureHtml).join('');
        homeGrid.addEventListener('click', e => {
            const btn = e.target.closest('button[data-index]');
            if (!btn) return;
            const idx = Number(btn.dataset.index);
            const galleryItems = homeMedia.map(m => ({
                src: m.src,
                alt: m.alt,
                caption: m.caption,
                credit: m.credit,
                creditUrl: m.creditUrl
            }));
            openLightboxGallery(galleryItems, idx);
        });
    }

    const grid = document.getElementById('media-grid');
    if (!grid) return;
    const limit = Number(grid.dataset.limit) || media.length;
    const visibleMedia = media.slice(0, limit);

    grid.innerHTML = visibleMedia.map(mediaFigureHtml).join('');

    // Media Filter Bar (on media.html)
    const filterBar = document.querySelector('.media-filters');
    if (filterBar) {
        const counts = {
            all: visibleMedia.length,
            stage: visibleMedia.filter(m => getMediaCategory(m.src) === 'stage').length,
            portrait: visibleMedia.filter(m => getMediaCategory(m.src) === 'portrait').length,
            flyer: visibleMedia.filter(m => getMediaCategory(m.src) === 'flyer').length
        };
        filterBar.querySelectorAll('.media-filter').forEach(btn => {
            const type = btn.dataset.filter;
            const span = btn.querySelector('span');
            if (span && counts[type] !== undefined) span.textContent = counts[type];
            btn.addEventListener('click', () => {
                filterBar.querySelectorAll('.media-filter').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
                const items = grid.querySelectorAll('.media-item');
                items.forEach(it => {
                    const itType = it.dataset.type;
                    const match = type === 'all' || itType === type;
                    it.classList.toggle('is-filtered-out', !match);
                });
            });
        });
    }

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
    show:   { label: 'Show',         icon: 'fa-microphone' },
    video:  { label: 'Video',        icon: 'fa-play' },
    audio:  { label: 'Audio',        icon: 'fa-headphones' },
    photo:  { label: 'Photo',        icon: 'fa-image' },
    sketch: { label: 'Vault Sketch', icon: 'fa-tape' },
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
            link: s.link, linkText: s.linkText, gallery: s.gallery, galleryText: s.galleryText,
            video: s.video, clip: s.clip });
    });
    (data.videos || []).forEach(v => {
        if (v.src && usedClips.has(v.src)) return;
        items.push({ kind: 'video', date: v.date, title: v.title,
            video: v.id, poster: v.poster, clip: v.src ? { src: v.src, poster: v.poster } : null });
    });
    (data.audio || []).forEach(a => {
        items.push({ kind: 'audio', date: a.date, title: a.title,
            meta: `${a.venue} · Bandstand Live Cut`, audioItem: a });
    });
    media.filter(m => m.date && !used.has(m)).forEach(m => items.push({ kind: 'photo', date: m.date, title: m.caption, pics: [m] }));
    (data.vault_sketches || []).forEach(v => {
        items.push({
            kind: 'sketch',
            date: v.date,
            title: v.title,
            meta: `${v.era} · ${v.origin}`,
            note: v.note,
            status: v.status
        });
    });
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
    const thumb = it.poster || (it.video ? `https://i.ytimg.com/vi/${esc(it.video)}/hqdefault.jpg` : '');
    const video = it.video ? `
        <button type="button" class="tl-video is-youtube" data-video-id="${esc(it.video)}" data-title="${esc(it.title)}" aria-label="Play video: ${esc(it.title)}">
            <img src="${esc(thumb)}" alt="${esc(it.title)}" loading="lazy">
            <span class="play" aria-hidden="true"><i class="fas fa-play"></i></span>
        </button>` : '';
    const audio = it.audioItem ? `
        <div class="audio-card tl-audio" data-id="${esc(it.audioItem.id)}" data-set="${esc(it.audioItem.setSrc)}" data-preview="${esc(it.audioItem.previewSrc)}" style="margin-top:14px; padding:clamp(12px, 3vw, 16px);">
            <div class="themed-player" style="padding:10px 12px; gap:10px;">
                <button type="button" class="themed-play-btn" style="width:38px;height:38px;min-width:38px;font-size:13px;" aria-label="Play ${esc(it.audioItem.title)}">
                    <i class="fas fa-play" aria-hidden="true"></i>
                </button>
                <div class="themed-track-wrap">
                    <div class="themed-scrubber" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0" aria-label="Seek track">
                        <div class="themed-buffered" style="width:0%;"></div>
                        <div class="themed-progress" style="width:0%;"></div>
                        <div class="themed-scrubber-tooltip" aria-hidden="true">0:00</div>
                    </div>
                    <div class="themed-time-row">
                        <span class="themed-time-curr">0:00</span>
                        <span class="themed-time-dur">${formatTime(it.audioItem.duration)}</span>
                    </div>
                </div>
            </div>
            ${perspectivesBarHtml(it.audioItem)}
            ${(it.audioItem.markers || []).length ? `
                <div class="audio-markers" role="group" aria-label="Track cues and markers" style="margin-top:10px;">
                    <span class="audio-markers-label"><i class="fas fa-bookmark" aria-hidden="true"></i> CUES</span>
                    ${it.audioItem.markers.map(m => `
                        <button type="button" class="marker-pill" data-time="${m.time}" ${m.note ? `data-note="${esc(m.note)}"` : ''} aria-label="Jump to ${esc(m.label)} at ${formatTime(m.time)}">
                            <span class="marker-time">${formatTime(m.time)}</span>
                            <span class="marker-label">${esc(m.label)}</span>
                            <span class="marker-eq" aria-hidden="true"><i></i><i></i><i></i></span>
                        </button>
                    `).join('')}
                </div>
                <div class="audio-liner-notes" aria-live="polite" style="display:none;">
                    <i class="fas fa-feather-pointed" aria-hidden="true"></i>
                    <span class="liner-notes-text"></span>
                </div>` : ''}
            <audio class="audio-player-element" preload="none" controlsList="nodownload" style="display:none;"></audio>
        </div>` : '';
    const kindPill = `<span class="tl-kind-pill tl-kind-${it.kind}"><i class="fas ${k.icon}" aria-hidden="true"></i> ${esc(k.label)}</span>`;
    const isClipVertical = Boolean(it.clip && it.clip.poster && /live_clip|video_20250701/.test(it.clip.poster));
    return `
        <li class="tl-entry tl-${it.kind}" data-kind="${it.kind}" data-has-video="${hasVideo}" data-has-photo="${hasPhoto}" data-reveal>
            <span class="tl-dot" aria-hidden="true"><i class="fas ${k.icon}"></i></span>
            <div class="tl-when">
                <span class="tl-date-text">${d ? `${MONTHS[d.getMonth()]} ${d.getDate()}` : 'Undated'}</span>
                ${kindPill}
            </div>
            <div class="tl-body">
                <h3>${esc(it.title)}</h3>
                ${it.meta ? `<p class="muted">${esc(it.meta)}</p>` : ''}
                ${it.note ? `<p class="tl-note">${esc(it.note)}</p>` : ''}
                ${it.status ? `<div style="margin-top:6px;"><span class="vault-tape-badge"><i class="fas fa-tape" aria-hidden="true"></i> ${esc(it.status)}</span></div>` : ''}
                ${it.link && /instagram\.com\/p\//.test(it.link) ? igButton(it.link) : it.link ? `<p><a href="${esc(it.link)}"${/^https?:/.test(it.link) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(it.linkText || 'Open')}</a></p>` : ''}
                ${it.gallery ? `<p class="small"><a href="${esc(it.gallery)}" target="_blank" rel="noopener noreferrer">${esc(it.galleryText || 'Photo gallery · ReBe Loves')}</a></p>` : ''}
                ${video}
                ${audio}
                ${it.clip ? `<div class="tl-clip-box"><video class="tl-clip ${isClipVertical ? 'is-vertical' : 'is-landscape'}" src="${esc(it.clip.src)}" poster="${esc(it.clip.poster || '')}" controls controlsList="nodownload" disablePictureInPicture playsinline preload="none"></video>${videoAudioBarHtml(it.clip.audioTracks)}${it.clip.caption ? `<p class="caption">${esc(it.clip.caption)}</p>` : ''}</div>` : ''}
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
        el.innerHTML = years.map((g, idx) => {
            const isLatest = idx === 0;
            return `
            <section class="tl-year ${isLatest ? 'is-open' : 'is-collapsed'}" data-year="${esc(g.year)}">
                <div class="tl-year-header" role="button" tabindex="0" aria-expanded="${isLatest}" aria-label="Toggle ${esc(g.year)} timeline">
                    <h2 class="tl-year-label">${esc(g.year)}</h2>
                    <span class="tl-year-count">${g.items.length} ${g.items.length === 1 ? 'item' : 'items'}</span>
                    <span class="tl-year-toggle" aria-hidden="true"><i class="fas fa-chevron-down"></i></span>
                </div>
                <ol class="tl-list">${g.items.map(timelineEntry).join('')}</ol>
            </section>`;
        }).join('');

        el.querySelectorAll('.tl-year-header').forEach(hdr => {
            hdr.addEventListener('click', () => {
                const sec = hdr.closest('.tl-year');
                if (!sec) return;
                const wasCollapsed = sec.classList.contains('is-collapsed');
                sec.classList.toggle('is-collapsed', !wasCollapsed);
                sec.classList.toggle('is-open', wasCollapsed);
                hdr.setAttribute('aria-expanded', wasCollapsed ? 'true' : 'false');
            });
            hdr.addEventListener('keydown', e => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    hdr.click();
                }
            });
        });

        applyFilter();
        observeReveals();
        el.querySelectorAll('.audio-card').forEach(initAudioCard);
        el.querySelectorAll('.tl-clip-box').forEach(initSyncedVideoBox);
    }

    // Filters
    const counts = {
        show: items.filter(it => it.kind === 'show').length,
        video: items.filter(it => it.kind === 'video' || it.video || it.clip).length,
        audio: items.filter(it => it.kind === 'audio').length,
        photo: items.filter(it => it.kind === 'photo' || (it.pics && it.pics.length)).length,
        sketch: items.filter(it => it.kind === 'sketch').length,
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
        el.querySelectorAll('.tl-year').forEach(y => {
            const hasVisible = Boolean(y.querySelector('.tl-entry:not([hidden])'));
            y.hidden = !hasVisible;
            if (active !== 'all' && hasVisible) {
                y.classList.remove('is-collapsed');
                y.classList.add('is-open');
                const hdr = y.querySelector('.tl-year-header');
                if (hdr) hdr.setAttribute('aria-expanded', 'true');
            }
        });
    }
    if (bar) {
        bar.innerHTML = [['all', 'Everything', items.length], ...Object.entries(KIND).filter(([k]) => counts[k]).map(([k, v]) => [k, v.label + 's', counts[k]])]
            .map(([k, label, n]) => `<button type="button" data-kind="${k}" aria-pressed="${k === 'all'}">${esc(label)} <span class="tl-pill-count">${n}</span></button>`).join('')
            + `<button type="button" class="tl-toggle-all" aria-label="Expand or collapse all years"><i class="fas fa-angles-up-down" aria-hidden="true"></i> Toggle All</button>`
            + `<button type="button" class="tl-sort" aria-label="Change order"><span class="tl-sort-label">${newestFirst ? 'Newest' : 'Oldest'} first</span> <i class="fas fa-arrow-${newestFirst ? 'down' : 'up'}-long" aria-hidden="true"></i></button>`;
        bar.addEventListener('click', e => {
            const b = e.target.closest('button');
            if (!b) return;
            if (b.classList.contains('tl-toggle-all')) {
                const anyCollapsed = el.querySelector('.tl-year.is-collapsed:not([hidden])');
                el.querySelectorAll('.tl-year:not([hidden])').forEach(y => {
                    y.classList.toggle('is-collapsed', !anyCollapsed);
                    y.classList.toggle('is-open', Boolean(anyCollapsed));
                    const hdr = y.querySelector('.tl-year-header');
                    if (hdr) hdr.setAttribute('aria-expanded', anyCollapsed ? 'true' : 'false');
                });
                return;
            }
            if (b.classList.contains('tl-sort')) {
                newestFirst = !newestFirst;
                const sortLabel = b.querySelector('.tl-sort-label');
                const sortIcon = b.querySelector('i');
                if (sortLabel) sortLabel.textContent = `${newestFirst ? 'Newest' : 'Oldest'} first`;
                if (sortIcon) sortIcon.className = `fas fa-arrow-${newestFirst ? 'down' : 'up'}-long`;
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
            iframe.style.width = '100%';
            iframe.style.height = 'auto';
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

// ─── Easter egg trigger: key sequence 'polar', '~', or 5 taps on the hat ────
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

    let hatClicks = 0;
    let hatTimer = null;
    document.addEventListener('click', e => {
        const hatTarget = e.target.closest('.logo-hat, .logo img, .footer-logo img, .vault-pill, .node-pill');
        if (hatTarget) {
            e.preventDefault();
            e.stopPropagation();
            hatClicks++;

            // Visual feedback: playful tilt
            const img = hatTarget.querySelector('img') || hatTarget;
            const tilt = (hatClicks % 2 === 0 ? 1 : -1) * Math.min(22, 8 + hatClicks * 3);
            img.style.transform = `rotate(${tilt}deg) scale(1.15)`;
            setTimeout(() => { img.style.transform = ''; }, 220);

            clearTimeout(hatTimer);
            if (hatClicks >= 5 || hatTarget.classList.contains('node-pill')) {
                hatClicks = 0;
                window.location.href = 'easteregg.html';
            } else {
                hatTimer = setTimeout(() => { hatClicks = 0; }, 2200);
            }
        }
    }, true);
})();

document.documentElement.classList.add('js');
document.addEventListener('DOMContentLoaded', () => {
    observeReveals();
    document.querySelectorAll('figure.video').forEach(initSyncedVideoBox);
    loadData();
});

if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}
