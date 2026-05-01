// CMS and Interactive Logic

// Helper function to simulate a typing effect
async function typeText(element, text, speed = 20) {
    element.textContent = "";
    for (let i = 0; i < text.length; i++) {
        element.textContent += text.charAt(i);
        await new Promise(r => setTimeout(r, speed));
    }
}

// Render logs based on page key
async function renderLogs(pageKey) {
    const container = document.getElementById('dynamic-log-stream');
    if (!container) return;

    try {
        const response = await fetch('database.json');
        if (!response.ok) throw new Error("Failed to load database");
        const data = await response.json();
        
        const logs = data.logs[pageKey];
        if (!logs) return;

        // Clear existing just in case
        container.innerHTML = "";

        for (const log of logs) {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'log-entry';
            
            const timeSpan = document.createElement('span');
            timeSpan.className = 'log-time';
            // Instantly show time
            timeSpan.textContent = log.date;
            
            const msgSpan = document.createElement('span');
            msgSpan.className = 'log-msg' + (log.highlight ? ' highlight' : '');
            
            entryDiv.appendChild(timeSpan);
            entryDiv.appendChild(msgSpan);
            container.appendChild(entryDiv);

            // Type out the message
            await typeText(msgSpan, log.message, 15);
        }

    } catch (error) {
        console.error("Signal Decryption Error:", error);
    }
}

// Render media grid
async function renderMediaGrid() {
    const container = document.getElementById('dynamic-media-grid');
    if (!container) return;

    try {
        const response = await fetch('database.json');
        if (!response.ok) throw new Error("Failed to load database");
        const data = await response.json();
        
        container.innerHTML = "";
        
        data.media.forEach(item => {
            const figure = document.createElement('figure');
            figure.className = 'art-fragment';
            
            const img = document.createElement('img');
            img.src = item.src;
            img.alt = item.alt;
            
            const caption = document.createElement('figcaption');
            caption.className = 'art-label';
            caption.textContent = item.label;
            
            figure.appendChild(img);
            figure.appendChild(caption);
            container.appendChild(figure);
            
            // Add click listener for lightbox if initialized
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

// Initialize based on body class
document.addEventListener('DOMContentLoaded', () => {
    const bodyClass = document.body.className;
    
    if (bodyClass === 'theme-john') renderLogs('john');
    else if (bodyClass === 'theme-polaraf') renderLogs('polaraf');
    // else if (bodyClass === 'theme-polarband') renderLogs('polarband'); // Band is coming soon
    else if (bodyClass === 'theme-media') renderMediaGrid();
    else if (!bodyClass || bodyClass === '') renderLogs('home'); // Index
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('SW registered: ', registration.scope);
        }).catch(err => {
            console.log('SW registration failed: ', err);
        });
    });
}
