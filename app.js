// ─── Countdown Timer ─────────────────────────────────────────────────────────
function initCountdown() {
    const el = document.getElementById('event-countdown');
    if (!el) return;
    const target = new Date('2026-05-05T20:00:00').getTime();

    function tick() {
        const diff = target - Date.now();
        if (diff <= 0) { el.textContent = '[ EVENT ACTIVE ]'; return; }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        el.textContent = `${String(d).padStart(2,'0')}D ${String(h).padStart(2,'0')}H ${String(m).padStart(2,'0')}M ${String(s).padStart(2,'0')}S`;
    }
    tick();
    setInterval(tick, 1000);
}

// ─── Cursor Spotlight ────────────────────────────────────────────────────────
document.addEventListener('mousemove', e => {
    document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
});

// ─── Log Stream Renderer ─────────────────────────────────────────────────────
function getPageKey() {
    const body = document.body;
    if (body.classList.contains('theme-john')) return 'john';
    if (body.classList.contains('theme-polaraf')) return 'polaraf';
    if (body.classList.contains('theme-polarband')) return 'polarband';
    return 'home';
}

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

function renderMediaGrid(media) {
    const grid = document.getElementById('dynamic-media-grid');
    if (!grid) return;

    // Skip index 0 (already shown as the featured flyer)
    const historical = media.slice(1);
    grid.innerHTML = historical.map(item => `
        <figure class="featured-poster" style="margin:0; cursor:pointer;">
            <img src="${item.src}" alt="${item.alt}">
            <figcaption class="poster-label">${item.label}</figcaption>
        </figure>
    `).join('');

    const modal = document.getElementById('lightbox-modal');
    const modalImg = document.getElementById('lightbox-img');
    if (modal && modalImg) {
        grid.querySelectorAll('img').forEach(img => {
            img.onclick = () => {
                modal.style.display = 'flex';
                modalImg.src = img.src;
            };
        });
    }
}

// ─── Marquee Builder ─────────────────────────────────────────────────────────
function getNextWeekday(targetDay) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let diff = targetDay - today.getDay();
    if (diff < 0) diff += 7;
    today.setDate(today.getDate() + diff);
    return today;
}

function fmtMarqueeDate(date) {
    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    return isToday ? `TONIGHT` : `${days[date.getDay()]} ${y}.${m}.${d}`;
}

function buildMarqueeEvents(events) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const segments = [];

    events.forEach(event => {
        if (event.type === 'show') {
            const eventDate = new Date(event.date + 'T00:00:00');
            if (eventDate >= today) {
                segments.push(`UPCOMING: ${event.title} @ ${event.venue} // ${fmtMarqueeDate(eventDate)} // ${event.time}`);
            }
        } else if (event.type === 'recurring' && event.recurrence === 'weekly') {
            const nextDate = getNextWeekday(event.day);
            const label = fmtMarqueeDate(nextDate);
            segments.push(`${event.note}: ${event.title} @ ${event.venue} // ${label} // ${event.time}–${event.endTime}`);
        }
    });

    return segments;
}

function updateMarquee(events) {
    const span = document.querySelector('#header-marquee span');
    if (!span || !events || !events.length) return;

    const segments = buildMarqueeEvents(events);
    if (!segments.length) return;

    const staticText = span.textContent.trim();
    const full = [staticText, ...segments].join(' ✦ ');
    span.textContent = full;

    // Scale scroll speed to content length so it doesn't rush or crawl
    const duration = Math.max(20, Math.round(full.length * 0.12));
    span.style.animationDuration = duration + 's';
}

async function loadData() {
    try {
        const res = await fetch('database.json');
        const data = await res.json();

        const pageKey = getPageKey();
        if (data.logs && data.logs[pageKey]) {
            renderLogs(data.logs[pageKey]);
        }

        if (data.media) {
            renderMediaGrid(data.media);
        }

        if (data.events) {
            updateMarquee(data.events);
        }
    } catch (e) {
        console.warn('Could not load data:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initCountdown();
    loadData();
});
