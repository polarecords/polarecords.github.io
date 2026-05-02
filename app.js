// ─── Matrix Rain ─────────────────────────────────────────────────────────────
function initMatrixRain() {
    const canvas = document.createElement('canvas');
    canvas.id = 'matrix-rain';
    canvas.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;opacity:0.09;pointer-events:none;';
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');
    const CHARS = 'ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEF><{}[];:=+';
    const FS = 14;

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
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
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

    // ~20 fps — readable, not a battery killer
    setInterval(draw, 50);
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
            const entryDiv  = document.createElement('div');
            entryDiv.className = 'log-entry';

            const timeSpan  = document.createElement('span');
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
async function renderMediaGrid() {
    const container = document.getElementById('dynamic-media-grid');
    if (!container) return;

    try {
        const cached = sessionStorage.getItem('pola-db');
        const data   = cached ? JSON.parse(cached) : await fetchDB();

        container.innerHTML = '';

        data.media.forEach(item => {
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

    const bodyClass = document.body.className;
    if      (bodyClass === 'theme-john')      renderLogs('john');
    else if (bodyClass === 'theme-polaraf')   renderLogs('polaraf');
    else if (bodyClass === 'theme-media')     renderMediaGrid();
    else if (!bodyClass || bodyClass === '')  renderLogs('home');
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}
