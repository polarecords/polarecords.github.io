// ─── Cursor Spotlight ────────────────────────────────────────────────────────
document.addEventListener('mousemove', e => {
    document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
});

// ─── Page Key ────────────────────────────────────────────────────────────────
function getPageKey() {
    const body = document.body;
    if (body.classList.contains('theme-john'))     return 'john';
    if (body.classList.contains('theme-polaraf'))  return 'polaraf';
    if (body.classList.contains('theme-polarband')) return 'polarband';
    return 'home';
}

// ─── Log Stream ──────────────────────────────────────────────────────────────
function renderLogs(logs) {
    const container = document.getElementById('dynamic-log-stream');
    if (!container) return;
    container.innerHTML = logs.map((entry, i) => `
        <div class="log-entry" style="animation-delay:${i * 0.1}s">
            <div class="log-time">${entry.date}</div>
            <div class="log-msg${entry.highlight ? ' highlight' : ''}">${entry.message}</div>
        </div>
    `).join('');
}

// ─── Media Grid ──────────────────────────────────────────────────────────────
function renderMediaGrid(media) {
    const grid     = document.getElementById('dynamic-media-grid');
    const featured = document.getElementById('featured-media-item');
    const modal    = document.getElementById('lightbox-modal');
    const modalImg = document.getElementById('lightbox-img');

    if (modal) modal.onclick = () => { modal.style.display = 'none'; };

    if (featured && media[0]) {
        const item = media[0];
        featured.innerHTML = `
            <img src="${item.src}" alt="${item.alt}">
            <figcaption class="poster-label">${item.label}</figcaption>
        `;
        const img = featured.querySelector('img');
        if (img && modal && modalImg) {
            img.style.cursor = 'pointer';
            img.onclick = () => { modal.style.display = 'flex'; modalImg.src = img.src; };
        }
    }

    if (!grid) return;
    grid.innerHTML = media.slice(1).map(item => `
        <figure class="featured-poster" style="margin:0; cursor:pointer;">
            <img src="${item.src}" alt="${item.alt}">
            <figcaption class="poster-label">${item.label}</figcaption>
        </figure>
    `).join('');

    if (modal && modalImg) {
        grid.querySelectorAll('img').forEach(img => {
            img.style.cursor = 'pointer';
            img.onclick = () => { modal.style.display = 'flex'; modalImg.src = img.src; };
        });
    }
}

// ─── Countdown ───────────────────────────────────────────────────────────────
function initCountdownTo(date, timeStr) {
    const el = document.getElementById('event-countdown');
    if (!el) return;
    const [h, m] = timeStr.split(':').map(Number);
    const target = new Date(date);
    target.setHours(h, m, 0, 0);

    if (window._countdownTimer) clearInterval(window._countdownTimer);

    function tick() {
        const diff = target.getTime() - Date.now();
        if (diff <= 0) { el.textContent = '[ SIGNAL ACTIVE ]'; return; }
        const d   = Math.floor(diff / 86400000);
        const hrs = Math.floor((diff % 86400000) / 3600000);
        const min = Math.floor((diff % 3600000)  / 60000);
        const sec = Math.floor((diff % 60000)    / 1000);
        el.textContent = `${String(d).padStart(2,'0')}D ${String(hrs).padStart(2,'0')}H ${String(min).padStart(2,'0')}M ${String(sec).padStart(2,'0')}S`;
    }
    tick();
    window._countdownTimer = setInterval(tick, 1000);
}

// ─── Show Card ───────────────────────────────────────────────────────────────
function getNextWeekday(targetDay) {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let diff = targetDay - today.getDay();
    if (diff < 0) diff += 7;
    today.setDate(today.getDate() + diff);
    return today;
}

function fmtShowCardDate(date) {
    const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function renderShowCard(events) {
    const card = document.getElementById('dynamic-show-card');
    if (!card || !events || !events.length) return;

    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let nextEvent = null;
    let nextDate  = null;

    events.forEach(event => {
        if (event.type === 'show') {
            const d = new Date(event.date + 'T00:00:00');
            if (d >= today && (!nextDate || d < nextDate)) {
                nextEvent = event;
                nextDate  = new Date(d);
            }
        } else if (event.type === 'recurring' && event.recurrence === 'weekly') {
            const d = getNextWeekday(event.day);
            if (!nextDate || d < nextDate) {
                nextEvent = event;
                nextDate  = new Date(d);
            }
        }
    });

    if (!nextEvent || !nextDate) return;

    card.innerHTML = `
        <div class="show-card-header">
            <span class="show-status">// NEXT_SHOW //</span>
        </div>
        ${nextEvent.image ? `
        <figure class="featured-poster show-poster">
            <img src="${nextEvent.image}" alt="${nextEvent.title}">
        </figure>` : ''}
        <div class="show-card-details">
            <div class="show-title">${nextEvent.title}</div>
            <div class="show-venue"><i class="fas fa-location-dot"></i> ${nextEvent.venue} &mdash; ${nextEvent.city}</div>
            <div class="show-datetime"><i class="fas fa-calendar"></i> ${fmtShowCardDate(nextDate)} &mdash; Doors ${nextEvent.time}</div>
            ${nextEvent.lineup ? `<div class="show-lineup">${nextEvent.lineup}</div>` : ''}
            <div id="event-countdown" class="show-countdown"></div>
        </div>
    `;

    initCountdownTo(nextDate, nextEvent.time);
}

// ─── Marquee Builder ─────────────────────────────────────────────────────────
function fmtMarqueeDate(date) {
    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const isToday = date.toDateString() === new Date().toDateString();
    return isToday ? 'TONIGHT' : `${days[date.getDay()]} ${y}.${m}.${d}`;
}

function buildMarqueeEvents(events) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const segments = [];

    events.forEach(event => {
        if (event.type === 'show') {
            const d = new Date(event.date + 'T00:00:00');
            if (d >= today) {
                segments.push(`UPCOMING: ${event.title} @ ${event.venue} // ${fmtMarqueeDate(d)} // ${event.time}`);
            }
        } else if (event.type === 'recurring' && event.recurrence === 'weekly') {
            const d = getNextWeekday(event.day);
            segments.push(`${event.note}: ${event.title} @ ${event.venue} // ${fmtMarqueeDate(d)} // ${event.time}–${event.endTime}`);
        }
    });

    return segments;
}

function updateMarquee(events) {
    const span = document.querySelector('#header-marquee span');
    if (!span || !events || !events.length) return;

    const segments = buildMarqueeEvents(events);
    if (!segments.length) return;

    const full = [span.textContent.trim(), ...segments].join(' ✦ ');
    span.textContent = full;
    span.style.animationDuration = Math.max(20, Math.round(full.length * 0.12)) + 's';
}

// ─── PolarAF Signal Decoder ───────────────────────────────────────────────────
function toggleDecoder() {
    const status   = document.getElementById('decoder-status');
    const progress = document.getElementById('decoder-progress');
    if (!status || !progress) return;

    if (!window._decoderActive) {
        window._decoderActive = true;
        status.textContent = '[ DECODING SIGNAL... ]';
        status.style.color = 'var(--primary)';
        let ticks = 0;
        window._decoderInterval = setInterval(() => {
            ticks = (ticks % 20) + 1;
            progress.textContent = `[${'█'.repeat(ticks)}${'░'.repeat(20 - ticks)}] 00:${String(ticks).padStart(2, '0')}`;
        }, 500);
    } else {
        window._decoderActive = false;
        clearInterval(window._decoderInterval);
        status.textContent = '[ SIGNAL PAUSED ]';
        status.style.color = 'var(--highlight)';
    }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function loadData() {
    try {
        const res  = await fetch('database.json');
        const data = await res.json();

        const pageKey = getPageKey();
        if (data.logs?.[pageKey])  renderLogs(data.logs[pageKey]);
        if (data.media)            renderMediaGrid(data.media);
        if (data.events)           renderShowCard(data.events);
        if (data.events)           updateMarquee(data.events);
    } catch (e) {
        console.warn('Could not load data:', e);
    }
}

document.addEventListener('DOMContentLoaded', loadData);
