// ─── Subtle matrix atmosphere (background, very low opacity) ─────────────────
function initMatrixRain() {
    const canvas = document.createElement('canvas');
    canvas.id = 'matrix-rain';
    canvas.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;opacity:0.035;pointer-events:none;';
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');
    const CHARS = 'ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';
    const FS = 16;

    let cols, drops;

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        cols  = Math.floor(canvas.width / FS);
        drops = new Array(cols).fill(1);
    }
    resize();
    window.addEventListener('resize', resize);

    const themeColors = {
        'theme-john':      '#81B5AC',
        'theme-polaraf':   '#FF3333',
        'theme-polarband': '#ffffff',
    };
    const rainColor = themeColors[document.body.className] || '#00FF41';

    function draw() {
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = rainColor;
        ctx.font = FS + 'px monospace';
        for (let i = 0; i < cols; i++) {
            const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
            ctx.fillText(ch, i * FS, drops[i] * FS);
            if (drops[i] * FS > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }

    // ~12 fps — subtle drift, not distracting
    setInterval(draw, 85);
}

// ─── Text scramble: decodes from random chars to real text ────────────────────
const SCRAMBLE_CHARS = 'ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ01234567';

function scrambleDecode(el, delay = 0) {
    const original = el.textContent.trim();
    if (!original) return;

    const FRAMES = 16;
    const INTERVAL = 35;
    let frame = 0;

    setTimeout(() => {
        const tick = setInterval(() => {
            const resolved = Math.floor((frame / FRAMES) * original.length);
            el.textContent = original.split('').map((ch, i) => {
                if (ch === ' ' || ch === '/' || ch === '>' || ch === '_' || ch === '[' || ch === ']') return ch;
                if (i < resolved) return ch;
                return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            }).join('');
            frame++;
            if (frame > FRAMES) {
                el.textContent = original;
                clearInterval(tick);
            }
        }, INTERVAL);
    }, delay);
}

function initScramble() {
    // Section titles decode in on load, staggered
    document.querySelectorAll('.section-title').forEach((el, i) => {
        scrambleDecode(el, i * 120);
    });
    // Hero title if present
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) scrambleDecode(heroTitle, 100);
}

// ─── Typing effect with cursor blink ─────────────────────────────────────────
async function typeText(element, text, speed = 15) {
    element.textContent = '';
    element.classList.add('typing');
    for (let i = 0; i < text.length; i++) {
        element.textContent += text.charAt(i);
        await new Promise(r => setTimeout(r, speed));
    }
    element.classList.remove('typing');
}

// ─── Render logs ─────────────────────────────────────────────────────────────
async function renderLogs(pageKey) {
    const container = document.getElementById('dynamic-log-stream');
    if (!container) return;

    try {
        const cached = sessionStorage.getItem('pola-db');
        const data   = cached ? JSON.parse(cached) : await fetchDB();
        const logs   = data.logs[pageKey];
        if (!logs) return;

        container.innerHTML = '';

        for (const log of logs) {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'log-entry';

            const timeSpan = document.createElement('span');
            timeSpan.className   = 'log-time';
            timeSpan.textContent = log.date;

            const msgSpan = document.createElement('span');
            msgSpan.className = 'log-msg' + (log.highlight ? ' highlight' : '');

            entryDiv.appendChild(timeSpan);
            entryDiv.appendChild(msgSpan);
            container.appendChild(entryDiv);

            await typeText(msgSpan, log.message, 15);
        }
    } catch (err) {
        console.error('Signal Decryption Error:', err);
    }
}

// ─── Render media grid ────────────────────────────────────────────────────────
async function fetchBeholdFeed() {
    const BEHOLD_URL = 'https://feeds.behold.so/riZpEiNKDSOVy8PPU6UM';
    try {
        const response = await fetch(BEHOLD_URL);
        if (!response.ok) return [];
        const data = await response.json();
        return data.map(post => ({
            src: post.mediaUrl || post.thumbnailUrl,
            alt: post.caption || 'Instagram Post',
            label: `IG_${post.timestamp.split('T')[0].replace(/-/g, '_')}.FRG`,
            date: post.timestamp
        }));
    } catch (err) {
        console.error('Behold Uplink Error:', err);
        return [];
    }
}

async function renderMediaGrid() {
    const container = document.getElementById('dynamic-media-grid');
    if (!container) return;

    try {
        const [dbData, beholdData] = await Promise.all([
            fetchDB(),
            fetchBeholdFeed()
        ]);

        container.innerHTML = '';

        // Combine and sort by date
        const dbMedia = dbData.media.map(item => ({
            ...item,
            sortDate: item.label.match(/\d{4}_\d{2}_\d{2}/) ? item.label.match(/\d{4}_\d{2}_\d{2}/)[0].replace(/_/g, '-') : '1970-01-01'
        }));

        const combinedMedia = [
            ...beholdData.map(item => ({ ...item, sortDate: item.date })),
            ...dbMedia
        ].sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));

        combinedMedia.forEach(item => {
            const figure = document.createElement('figure');
            figure.className = 'art-fragment';

            const img = document.createElement('img');
            img.src     = item.src;
            img.alt     = item.alt;
            img.loading = 'lazy';

            const caption = document.createElement('figcaption');
            caption.className   = 'art-label';
            caption.textContent = item.label;

            figure.appendChild(img);
            figure.appendChild(caption);
            container.appendChild(figure);

            img.style.cursor = 'pointer';
            img.onclick = function () {
                const modal    = document.getElementById('lightbox-modal');
                const modalImg = document.getElementById('lightbox-img');
                if (modal && modalImg) {
                    modal.style.display = 'flex';
                    modalImg.src = this.src;
                }
            };
        });
    } catch (err) {
        console.error('Media Decryption Error:', err);
    }
}

// ─── Fetch + cache DB ─────────────────────────────────────────────────────────
async function fetchDB() {
    const response = await fetch('database.json');
    if (!response.ok) throw new Error('Failed to load database');
    const data = await response.json();
    try { sessionStorage.setItem('pola-db', JSON.stringify(data)); } catch (_) {}
    return data;
}

// ─── Boot ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initMatrixRain();
    initScramble();

    const bodyClass = document.body.className;
    if      (bodyClass === 'theme-john')     renderLogs('john');
    else if (bodyClass === 'theme-polaraf')  renderLogs('polaraf');
    else if (bodyClass === 'theme-media')    renderMediaGrid();
    else if (!bodyClass || bodyClass === '') renderLogs('home');
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}
