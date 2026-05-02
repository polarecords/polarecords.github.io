// CMS and Interactive Logic

// Render logs based on page key — instant render with CSS stagger
async function renderLogs(pageKey) {
    const container = document.getElementById('dynamic-log-stream');
    if (!container) return;

    try {
        const cached = sessionStorage.getItem('pola-db');
        const data = cached ? JSON.parse(cached) : await fetchDB();

        const logs = data.logs[pageKey];
        if (!logs) return;

        container.innerHTML = "";

        logs.forEach((log, i) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'log-entry';
            entryDiv.style.cssText = `animation-delay:${i * 80}ms`;

            const timeSpan = document.createElement('span');
            timeSpan.className = 'log-time';
            timeSpan.textContent = log.date;

            const msgSpan = document.createElement('span');
            msgSpan.className = 'log-msg' + (log.highlight ? ' highlight' : '');
            msgSpan.textContent = log.message;

            entryDiv.appendChild(timeSpan);
            entryDiv.appendChild(msgSpan);
            container.appendChild(entryDiv);
        });

    } catch (error) {
        console.error("Signal Decryption Error:", error);
    }
}

// Render media grid
async function renderMediaGrid() {
    const container = document.getElementById('dynamic-media-grid');
    if (!container) return;

    try {
        const cached = sessionStorage.getItem('pola-db');
        const data = cached ? JSON.parse(cached) : await fetchDB();

        container.innerHTML = "";

        data.media.forEach(item => {
            const figure = document.createElement('figure');
            figure.className = 'art-fragment';

            const img = document.createElement('img');
            img.src = item.src;
            img.alt = item.alt;
            img.loading = 'lazy';

            const caption = document.createElement('figcaption');
            caption.className = 'art-label';
            caption.textContent = item.label;

            figure.appendChild(img);
            figure.appendChild(caption);
            container.appendChild(figure);

            img.style.cursor = 'pointer';
            img.onclick = function() {
                const modal = document.getElementById('lightbox-modal');
                const modalImg = document.getElementById('lightbox-img');
                if (modal && modalImg) {
                    modal.style.display = "flex";
                    modalImg.src = this.src;
                }
            };
        });
    } catch (error) {
        console.error("Media Decryption Error:", error);
    }
}

async function fetchDB() {
    const response = await fetch('database.json');
    if (!response.ok) throw new Error("Failed to load database");
    const data = await response.json();
    try { sessionStorage.setItem('pola-db', JSON.stringify(data)); } catch (_) {}
    return data;
}

// Initialize based on body class
document.addEventListener('DOMContentLoaded', () => {
    const bodyClass = document.body.className;

    if (bodyClass === 'theme-john') renderLogs('john');
    else if (bodyClass === 'theme-polaraf') renderLogs('polaraf');
    else if (bodyClass === 'theme-media') renderMediaGrid();
    else if (!bodyClass || bodyClass === '') renderLogs('home');
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}
