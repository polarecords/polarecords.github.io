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
    } catch (e) {
        console.warn('Could not load data:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initCountdown();
    loadData();
});
